import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";

export default function App() {
  const [openAuth, setOpenAuth] = useState(false);
  const [session, setSession] = useState(null);

  // Profil Supabase
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // UI espace client
  const [openEditProfile, setOpenEditProfile] = useState(false);

  // Autoriser changement plan uniquement via bouton "Changer mon abonnement"
  const [allowPlanChange, setAllowPlanChange] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session || null));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession || null);
    });

    return () => sub?.subscription?.unsubscribe?.();
  }, []);

  useEffect(() => {
    if (!session?.user?.id) {
      setProfile(null);
      return;
    }
    loadOrCreateProfile(session.user);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  async function loadOrCreateProfile(user) {
    setProfileLoading(true);
    try {
      const { data: existing, error: readErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (readErr) throw readErr;

      if (existing) {
        setProfile(existing);
        return;
      }

      const first_name = user.user_metadata?.first_name || "";
      const last_name = user.user_metadata?.last_name || "";

      const { data: created, error: insErr } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          first_name,
          last_name,
          plan: null,
          pending_plan: null,
          change_requested_at: null
        })
        .select("*")
        .single();

      if (insErr) throw insErr;
      setProfile(created);
    } catch (e) {
      console.error(e);
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    setProfile(null);
    setAllowPlanChange(false);
  }

  // ✅ Enregistrer plan
  // - Si aucun plan actif => on active directement
  // - Si plan actif => on enregistre une DEMANDE (pending_plan) et on bloque la page tarifs
  async function handlePlanClick(planName) {
    if (!session?.user?.id) return;

    const hasActivePlan = !!profile?.plan;
    const hasPending = !!profile?.pending_plan;

    // Si déjà plan actif et pas en mode "changement autorisé"
    if (hasActivePlan && !allowPlanChange) return;

    // Si demande en attente, on bloque tout
    if (hasPending) return;

    try {
      // 1) Première souscription => plan direct
      if (!hasActivePlan) {
        const { data, error } = await supabase
          .from("profiles")
          .update({
            plan: planName,
            updated_at: new Date().toISOString()
          })
          .eq("id", session.user.id)
          .select("*")
          .single();

        if (error) throw error;
        setProfile(data);
        setAllowPlanChange(false);
        alert(`✅ Abonnement activé : ${planName}`);
        return;
      }

      // 2) Changement => demande en attente (48h)
      const { data, error } = await supabase
        .from("profiles")
        .update({
          pending_plan: planName,
          change_requested_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", session.user.id)
        .select("*")
        .single();

      if (error) throw error;
      setProfile(data);
      setAllowPlanChange(false);

      alert(
        "✅ Demande envoyée à l’équipe technique.\nLe changement sera effectué sous 48h si place disponible."
      );
    } catch (e) {
      console.error(e);
      alert("❌ Impossible d’enregistrer (vérifie la table profiles + policies).");
    }
  }

  // ✅ Modifier profil (table + metadata)
  async function saveProfileNames(first_name, last_name) {
    if (!session?.user?.id) return;

    try {
      // 1) Update table profiles
      const { data, error } = await supabase
        .from("profiles")
        .update({
          first_name,
          last_name,
          updated_at: new Date().toISOString()
        })
        .eq("id", session.user.id)
        .select("*")
        .single();

      if (error) throw error;
      setProfile(data);

      // 2) Update metadata (utile si tu veux garder ça côté auth)
      const { error: metaErr } = await supabase.auth.updateUser({
        data: { first_name, last_name }
      });

      if (metaErr) {
        // non bloquant
        console.warn("metadata update warning:", metaErr.message);
      }

      setOpenEditProfile(false);
      alert("✅ Profil mis à jour !");
    } catch (e) {
      console.error(e);
      alert("❌ Impossible de modifier le profil.");
    }
  }

  const isLoggedIn = !!session;
  const userEmail = session?.user?.email || "";

  const firstName = profile?.first_name || session?.user?.user_metadata?.first_name || "";
  const lastName = profile?.last_name || session?.user?.user_metadata?.last_name || "";
  const fullName = `${firstName} ${lastName}`.trim();

  const currentPlan = profile?.plan || null;
  const pendingPlan = profile?.pending_plan || null;

  return (
    <div>
      <Header
        isLoggedIn={isLoggedIn}
        userEmail={userEmail}
        fullName={fullName}
        onOpenAuth={() => setOpenAuth(true)}
        onLogout={logout}
      />

      <Hero onOpenAuth={() => setOpenAuth(true)} />

      {isLoggedIn ? (
        <ClientArea
          fullName={fullName}
          email={userEmail}
          currentPlan={currentPlan}
          pendingPlan={pendingPlan}
          loading={profileLoading}
          onEditProfile={() => setOpenEditProfile(true)}
          onChooseFirstPlan={() => {
            setAllowPlanChange(true); // autorise sélection si pas de plan aussi
            document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
          }}
          onRequestChange={() => {
            // Autorise le changement UNIQUEMENT via ce bouton
            setAllowPlanChange(true);
            document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
          }}
        />
      ) : (
        <TeaserClientArea onOpenAuth={() => setOpenAuth(true)} />
      )}

      <Services />

      <Pricing
        isLoggedIn={isLoggedIn}
        currentPlan={currentPlan}
        pendingPlan={pendingPlan}
        allowPlanChange={allowPlanChange}
        onOpenAuth={() => setOpenAuth(true)}
        onPlanClick={handlePlanClick}
      />

      <Contact />
      <Footer />

      {openAuth && (
        <AuthModal onClose={() => setOpenAuth(false)} onLoggedIn={() => setOpenAuth(false)} />
      )}

      {openEditProfile && (
        <EditProfileModal
          onClose={() => setOpenEditProfile(false)}
          initialFirstName={firstName}
          initialLastName={lastName}
          onSave={saveProfileNames}
        />
      )}

      <style>{css}</style>
    </div>
  );
}

/* =========================
   HEADER / HERO
   ========================= */

function Header({ isLoggedIn, userEmail, fullName, onOpenAuth, onLogout }) {
  return (
    <header className="topbar">
      <div className="container topbar__inner">
        <a className="brand" href="#top">
          <img className="brand__logo" src="/logo.png" alt="CloudStoragePro logo" />
          <span className="brand__name">CloudStoragePro</span>
        </a>

        <nav className="nav">
          <a href="#top">Accueil</a>
          <a href="#features">Fonctionnalités</a>
          <a href="#pricing">Tarifs</a>
          <a href="#contact">Contact</a>
        </nav>

        {!isLoggedIn ? (
          <button className="btn btn--light" onClick={onOpenAuth}>
            Connexion
          </button>
        ) : (
          <div className="userBox">
            <div className="userBox__who">
              <div className="userBox__name">{fullName || "Utilisateur"}</div>
              <div className="userBox__email">{userEmail}</div>
            </div>
            <button className="btn btn--light" onClick={onLogout}>
              Déconnexion
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

function Hero({ onOpenAuth }) {
  return (
    <section id="top" className="hero">
      <div className="container hero__inner">
        <div className="hero__left">
          <h1>
            Stockage Cloud Sécurisé <br />
            Pour Vos Données
          </h1>
          <p>Stockez et sauvegardez vos fichiers en toute sécurité sur CloudStoragePro.</p>

          <div className="hero__cta">
            <a className="btn btn--primary" href="#pricing">
              Voir les abonnements
            </a>
            <button className="btn btn--ghost" onClick={onOpenAuth}>
              Connexion
            </button>
          </div>
        </div>

        <div className="hero__right">
          <div className="heroCard">
            <div className="heroCard__bubble" />
            <div className="heroCard__bubble heroCard__bubble--2" />
            <div className="heroCard__bubble heroCard__bubble--3" />
            <div className="heroCard__big">
              <div className="heroCard__icon">☁️</div>
              <div className="heroCard__title">Cloud sécurisé</div>
              <div className="heroCard__sub">Synchronisation & sauvegarde</div>
            </div>
          </div>
        </div>
      </div>

      <div className="hero__clouds" />
    </section>
  );
}

/* =========================
   ESPACE CLIENT
   ========================= */

function TeaserClientArea({ onOpenAuth }) {
  return (
    <section className="section section--soft">
      <div className="container">
        <div className="clientCard">
          <div>
            <h2 className="clientTitle">Espace client</h2>
            <p className="clientText">
              Connecte-toi pour gérer ton abonnement et accéder (bientôt) à tes fichiers.
            </p>
          </div>

          <div className="clientActions">
            <button className="btn btn--primary" onClick={onOpenAuth}>
              Se connecter
            </button>
            <a className="btn btn--light" href="#pricing">
              Voir les offres
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function ClientArea({
  fullName,
  email,
  currentPlan,
  pendingPlan,
  loading,
  onEditProfile,
  onChooseFirstPlan,
  onRequestChange
}) {
  const hasPlan = !!currentPlan;
  const hasPending = !!pendingPlan;

  return (
    <section className="section section--soft">
      <div className="container">
        <div className="clientCard">
          <div>
            <h2 className="clientTitle">Espace client</h2>
            <p className="clientText">
              Bienvenue <strong>{fullName || "Utilisateur"}</strong> 👋
              <br />
              <span className="clientSmall">{email}</span>
            </p>

            <div className="clientInfo">
              <div className="infoItem">
                <div className="infoLabel">Abonnement</div>
                <div className="infoValue">
                  {loading ? "Chargement..." : currentPlan || "Aucun"}
                </div>
              </div>

              <div className="infoItem">
                <div className="infoLabel">Statut</div>
                <div className="infoValue">Connecté ✅</div>
              </div>
            </div>

            {hasPending && (
              <div className="pendingBox">
                ✅ Demande de changement envoyée : <strong>{pendingPlan}</strong>
                <br />
                <span className="pendingSmall">
                  Le changement sera effectué sous 48h si place disponible.
                </span>
              </div>
            )}
          </div>

          <div className="clientActions">
            <button className="btn btn--light" onClick={onEditProfile}>
              Modifier mon profil
            </button>

            {!hasPlan ? (
              <button className="btn btn--primary" onClick={onChooseFirstPlan}>
                Choisir mon abonnement
              </button>
            ) : (
              <button className="btn btn--primary" onClick={onRequestChange} disabled={hasPending}>
                {hasPending ? "Changement en attente" : "Changer mon abonnement"}
              </button>
            )}

            <button
              className="btn btn--light"
              onClick={() => alert("📁 Mes fichiers : on l’ajoutera quand tu connecteras MinIO/Synology.")}
            >
              Mes fichiers (bientôt)
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================
   MODAL MODIFIER PROFIL
   ========================= */

function EditProfileModal({ onClose, initialFirstName, initialLastName, onSave }) {
  const [firstName, setFirstName] = useState(initialFirstName || "");
  const [lastName, setLastName] = useState(initialLastName || "");
  const [saving, setSaving] = useState(false);

  const firstOk = firstName.trim().length > 0;
  const lastOk = lastName.trim().length > 0;

  async function submit(e) {
    e.preventDefault();
    if (!firstOk || !lastOk) return;

    setSaving(true);
    try {
      await onSave(firstName.trim(), lastName.trim());
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modalOverlay" role="dialog" aria-modal="true">
      <div className="modalCard">
        <button className="modalClose" onClick={onClose} aria-label="Fermer">
          ✕
        </button>

        <h3 className="authTitle">Modifier mon profil</h3>

        <form onSubmit={submit}>
          <label className="authLabel">
            Prénom <span className="req">*</span>
            <input
              className="authInput"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="ex: Alex"
            />
            {!firstOk && <div className="fieldError">Prénom obligatoire</div>}
          </label>

          <label className="authLabel">
            Nom <span className="req">*</span>
            <input
              className="authInput"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="ex: Dupont"
            />
            {!lastOk && <div className="fieldError">Nom obligatoire</div>}
          </label>

          <button className="btn btn--primary btn--full" type="submit" disabled={!firstOk || !lastOk || saving}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>

          <button className="btn btn--light btn--full" type="button" onClick={onClose} style={{ marginTop: 10 }}>
            Annuler
          </button>
        </form>
      </div>
    </div>
  );
}

/* =========================
   SERVICES / PRICING
   ========================= */

function Services() {
  const items = [
    { title: "Stockage Évolutif", desc: "Espace extensible selon vos besoins", icon: "☁️" },
    { title: "Sécurité Avancée", desc: "Cryptage & protection de vos données", icon: "🛡️" },
    { title: "Accès 24/7", desc: "Accédez à vos fichiers à tout moment", icon: "⏱️" }
  ];

  return (
    <section id="features" className="section">
      <div className="container">
        <h2 className="section__title">Nos Services</h2>
        <div className="grid3">
          {items.map((it) => (
            <div key={it.title} className="serviceCard">
              <div className="serviceCard__icon">{it.icon}</div>
              <div className="serviceCard__title">{it.title}</div>
              <div className="serviceCard__desc">{it.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing({ onOpenAuth, isLoggedIn, currentPlan, pendingPlan, allowPlanChange, onPlanClick }) {
  const plans = useMemo(
    () => [
      {
        name: "Basique",
        price: "4,99",
        per: "/ mois",
        features: ["100 Go de stockage", "Cryptage basique", "Support standard"],
        highlight: false
      },
      {
        name: "Pro",
        price: "9,99",
        per: "/ mois",
        features: ["1 To de stockage", "Sauvegarde automatique", "Sécurité renforcée"],
        highlight: true,
        badge: "Le Plus Populaire"
      },
      {
        name: "Premium",
        price: "19,99",
        per: "/ mois",
        features: ["3 To de stockage", "Cryptage avancé", "Support prioritaire"],
        highlight: false
      }
    ],
    []
  );

  const hasPlan = !!currentPlan;
  const hasPending = !!pendingPlan;

  function getActionState(planName) {
    if (!isLoggedIn) return { label: "CONNEXION", disabled: false, onClick: onOpenAuth };

    // Si une demande est en attente => tout bloqué
    if (hasPending) return { label: "BLOQUÉ", disabled: true, onClick: null };

    // Si plan actif et pas autorisé => pas de changement possible depuis ici
    if (hasPlan && !allowPlanChange) return { label: "INDISPONIBLE", disabled: true, onClick: null };

    // Si plan actif et autorisé => on peut demander un changement (mais pas vers le même)
    if (hasPlan && allowPlanChange) {
      if (planName === currentPlan) return { label: "DÉJÀ ACTIF", disabled: true, onClick: null };
      return { label: "DEMANDER CE CHANGEMENT", disabled: false, onClick: () => onPlanClick(planName) };
    }

    // Si pas de plan => choisir direct
    return { label: "CHOISIR", disabled: false, onClick: () => onPlanClick(planName) };
  }

  return (
    <section id="pricing" className="section section--soft">
      <div className="container">
        <h2 className="section__title">Choisissez Votre Abonnement</h2>

        {isLoggedIn && hasPlan && !allowPlanChange && !hasPending && (
          <div className="lockedMsg">
            🔒 Tu as déjà un abonnement actif. Pour demander un changement, clique sur{" "}
            <strong>“Changer mon abonnement”</strong> dans l’espace client.
          </div>
        )}

        {isLoggedIn && hasPending && (
          <div className="lockedMsg">
            ✅ Demande en cours : <strong>{pendingPlan}</strong> — changement sous 48h si place disponible.
          </div>
        )}

        <div className="pricingGrid">
          {plans.map((p) => {
            const a = getActionState(p.name);
            return (
              <div key={p.name} className={`priceCard ${p.highlight ? "priceCard--pro" : ""}`}>
                {p.badge && <div className="priceCard__badge">{p.badge}</div>}

                <div className="priceCard__name">{p.name}</div>

                <div className="priceCard__price">
                  <span className="priceCard__currency">€</span>
                  <span className="priceCard__amount">{p.price}</span>
                  <span className="priceCard__per"> {p.per}</span>
                </div>

                <ul className="priceCard__list">
                  {p.features.map((f) => (
                    <li key={f}>✓ {f}</li>
                  ))}
                </ul>

                <button
                  className={`btn ${p.highlight ? "btn--gold" : "btn--primary"} btn--full`}
                  onClick={a.onClick || undefined}
                  disabled={a.disabled}
                  style={a.disabled ? { opacity: 0.65, cursor: "not-allowed" } : undefined}
                >
                  {a.label}
                </button>
              </div>
            );
          })}
        </div>

        <div className="note">
          <strong>Note :</strong>{" "}
          {!isLoggedIn
            ? "Connecte-toi pour choisir une offre."
            : hasPending
            ? "Changement en attente (48h si place disponible)."
            : hasPlan
            ? "Gestion du changement uniquement via l’espace client."
            : "Tu peux choisir ton premier abonnement ici."}
        </div>
      </div>
    </section>
  );
}

/* =========================
   CONTACT / FOOTER
   ========================= */

function Contact() {
  return (
    <section id="contact" className="section">
      <div className="container">
        <h2 className="section__title">Contactez-Nous</h2>

        <form
          className="contactForm"
          action="https://formsubmit.co/contact@michaelcreation.fr"
          method="POST"
          target="_blank"
        >
          {/* Anti-spam */}
          <input type="hidden" name="_captcha" value="false" />
          <input type="hidden" name="_subject" value="Nouveau message - CloudStoragePro" />
          <input type="hidden" name="_template" value="table" />

          {/* Champs */}
          <input className="input" name="name" placeholder="Nom" required />
          <input className="input" type="email" name="email" placeholder="Email" required />
          <textarea className="textarea" name="message" placeholder="Message" rows={5} required />

          <button className="btn btn--primary btn--center" type="submit">
            Envoyer
          </button>
        </form>
      </div>
    </section>
  );
}







function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <span>© {new Date().getFullYear()} CloudStoragePro — Tous droits réservés</span>
      </div>
    </footer>
  );
}

/* =========================
   AUTH MODAL (login/signup/forgot)
   NOTE: tu gardes ton AuthForm existant,
         ici je laisse le modal "vide" car tu l’avais déjà.
   ========================= */

function AuthModal({ onClose, onLoggedIn }) {
  return (
    <div className="modalOverlay" role="dialog" aria-modal="true">
      <div className="modalCard">
        <button className="modalClose" onClick={onClose} aria-label="Fermer">
          ✕
        </button>

        <AuthForm onLoggedIn={onLoggedIn} />
      </div>
    </div>
  );
}

function AuthForm({ onLoggedIn }) {
  const [mode, setMode] = useState("login"); // login | signup | forgot
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const firstOk = firstName.trim().length > 0;
  const lastOk = lastName.trim().length > 0;
  const signupDisabled = mode === "signup" && (!firstOk || !lastOk);

  async function submit(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      if (!email) throw new Error("Ajoute un email.");

      if (mode === "forgot") {
        const redirectTo = window.location.origin;
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
        if (error) throw error;
        setMsg("✅ Email envoyé. Clique sur le lien dans ton mail pour changer ton mot de passe.");
        return;
      }

      if (!password) throw new Error("Ajoute un mot de passe.");

      if (mode === "signup") {
        if (!firstOk) throw new Error("Prénom obligatoire.");
        if (!lastOk) throw new Error("Nom obligatoire.");

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { first_name: firstName.trim(), last_name: lastName.trim() }
          }
        });
        if (error) throw error;

        setMsg("✅ Compte créé. Un email de confirmation a été envoyé. Vérifie ta boîte mail !");
        setMode("login");
        setPassword("");
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const user = data?.user;
      if (user && user.email_confirmed_at === null) {
        setMsg("⚠️ Ton email n’est pas confirmé. Vérifie ta boîte mail (ou renvoie l’email).");
        return;
      }

      if (data?.session) onLoggedIn();
    } catch (err) {
      setMsg("❌ " + (err?.message || "Erreur"));
    } finally {
      setLoading(false);
    }
  }

  async function resendConfirmation() {
    setMsg("");
    setLoading(true);
    try {
      if (!email) throw new Error("Entre ton email d’abord.");
      const redirectTo = window.location.origin;

      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: redirectTo }
      });

      if (error) throw error;
      setMsg("✅ Email de confirmation renvoyé ! Vérifie tes spams si besoin.");
    } catch (err) {
      setMsg("❌ " + (err?.message || "Impossible de renvoyer l’email"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="authHead">
        <img src="/logo.png" alt="logo" className="authLogo" />
        <div>
          <div className="authBrand">CloudStoragePro</div>
          <div className="authSub">Espace client</div>
        </div>
      </div>

      <h3 className="authTitle">
        {mode === "login" ? "Connexion" : mode === "signup" ? "Créer un compte" : "Mot de passe oublié"}
      </h3>

      <form onSubmit={submit}>
        {mode === "signup" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label className="authLabel">
              Prénom <span className="req">*</span>
              <input
                className="authInput"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="ex: Alex"
              />
              {!firstOk && <div className="fieldError">Prénom obligatoire</div>}
            </label>

            <label className="authLabel">
              Nom <span className="req">*</span>
              <input
                className="authInput"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="ex: Dupont"
              />
              {!lastOk && <div className="fieldError">Nom obligatoire</div>}
            </label>
          </div>
        )}

        <label className="authLabel">
          Email
          <input
            className="authInput"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ex: alex.dupont@email.com"
          />
        </label>

        {mode !== "forgot" && (
          <label className="authLabel">
            Mot de passe
            <input
              className="authInput"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>
        )}

        <button
          className="btn btn--primary btn--full"
          type="submit"
          disabled={loading || signupDisabled}
        >
          {loading
            ? "Patiente..."
            : mode === "login"
            ? "Se connecter"
            : mode === "signup"
            ? "Créer mon compte"
            : "Envoyer l’email"}
        </button>
      </form>

      {mode === "login" && (
        <>
          <button className="authSwitch" type="button" onClick={() => setMode("forgot")}>
            Mot de passe oublié ?
          </button>

          <button className="authSwitch" type="button" onClick={resendConfirmation} disabled={loading}>
            Renvoyer l’email de confirmation
          </button>

          <button className="authSwitch" type="button" onClick={() => setMode("signup")}>
            Créer un compte
          </button>
        </>
      )}

      {mode === "signup" && (
        <button className="authSwitch" type="button" onClick={() => setMode("login")}>
          J’ai déjà un compte
        </button>
      )}

      {mode === "forgot" && (
        <button className="authSwitch" type="button" onClick={() => setMode("login")}>
          Retour à la connexion
        </button>
      )}

      {msg && <div className="authMsg">{msg}</div>}
    </div>
  );
}

/* =========================
   CSS léger (pour les nouveaux blocs)
   ========================= */

const css = `
.req{color:#ffd36a;font-weight:1000;margin-left:4px}
.fieldError{margin-top:6px;font-size:12px;color:#ffd36a;font-weight:900}

.pendingBox{
  margin-top:12px;
  padding:12px;
  border-radius:14px;
  background:#fff6da;
  border:1px solid #ffe2a3;
  color:#5a3b00;
  font-weight:900;
}
.pendingSmall{font-size:12px;opacity:.85;font-weight:800}

.lockedMsg{
  background:#ffffff;
  border:1px solid #e8eefb;
  border-radius:14px;
  padding:12px;
  margin:0 0 14px;
  box-shadow:0 10px 30px rgba(16,38,77,.06);
  color:#203b6a;
  font-weight:900;
}

.activePlan{margin-top:10px;font-weight:900;opacity:.9}

/* Mini styles basiques si jamais ton CSS principal est ailleurs */
.container{max-width:1100px;margin:0 auto;padding:0 16px}
.section{padding:56px 0}
.section--soft{background:#f6f9ff}
.section__title{text-align:center;margin:0 0 22px;color:#10264d}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.pricingGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}

@media(max-width:900px){
  .grid3,.pricingGrid{grid-template-columns:1fr}
}
`;
