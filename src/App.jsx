import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";
import logo from "/logo.png";

export default function App() {
  const [openAuth, setOpenAuth] = useState(false);
  const [session, setSession] = useState(null);

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [openEditProfile, setOpenEditProfile] = useState(false);
  const [allowPlanChange, setAllowPlanChange] = useState(false);

  // contact popup
  const [contactOk, setContactOk] = useState(false);
  const [contactErr, setContactErr] = useState("");

  // admin
  const [adminRequests, setAdminRequests] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);

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

  useEffect(() => {
    // recharge demandes admin si admin
    if (profile?.is_admin) loadAdminRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.is_admin]);

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
          change_requested_at: null,
          request_status: null,
          request_note: null,
          request_handled_at: null,
          request_expires_at: null,
          is_admin: false,
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

  // ===== Plans
  async function handlePlanClick(planName) {
    if (!session?.user?.id) return;

    const hasActivePlan = !!profile?.plan;
    const hasPending = !!profile?.pending_plan;

    if (hasPending) return;
    if (hasActivePlan && !allowPlanChange) return;

    try {
      // Première souscription -> direct
      if (!hasActivePlan) {
        const { data, error } = await supabase
          .from("profiles")
          .update({
            plan: planName,
            pending_plan: null,
            request_status: null,
            request_note: null,
            request_handled_at: null,
            request_expires_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", session.user.id)
          .select("*")
          .single();

        if (error) throw error;
        setProfile(data);
        setAllowPlanChange(false);
        return;
      }

      // Changement -> demande pending (48h)
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from("profiles")
        .update({
          pending_plan: planName,
          change_requested_at: new Date().toISOString(),
          request_status: "pending",
          request_note: "Demande envoyée à l’équipe technique.",
          request_handled_at: null,
          request_expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.user.id)
        .select("*")
        .single();

      if (error) throw error;
      setProfile(data);
      setAllowPlanChange(false);
    } catch (e) {
      console.error(e);
      alert("❌ Impossible d’enregistrer (vérifie la table profiles + RLS).");
    }
  }

  async function saveProfileNames(first_name, last_name) {
    if (!session?.user?.id) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({
          first_name,
          last_name,
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.user.id)
        .select("*")
        .single();
      if (error) throw error;
      setProfile(data);

      const { error: metaErr } = await supabase.auth.updateUser({
        data: { first_name, last_name },
      });
      if (metaErr) console.warn("metadata warning:", metaErr.message);

      setOpenEditProfile(false);
    } catch (e) {
      console.error(e);
      alert("❌ Impossible de modifier le profil.");
    }
  }

  // ===== Admin
  async function loadAdminRequests() {
    setAdminLoading(true);
    try {
      // IMPORTANT: pour lire tous les profils, il faut passer par le dashboard Supabase (service role)
      // En front, on fait "admin view" simple: on ne peut lire que ce que les policies autorisent.
      // Solution: on affiche uniquement les demandes si ton RLS te l’autorise via is_admin check.
      // On met une policy plus bas (voir note) si besoin. Ici on tente.
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, plan, pending_plan, request_status, request_note, change_requested_at, request_expires_at, request_handled_at")
        .neq("pending_plan", null)
        .order("change_requested_at", { ascending: false });

      if (error) throw error;
      setAdminRequests(data || []);
    } catch (e) {
      console.error(e);
      setAdminRequests([]);
    } finally {
      setAdminLoading(false);
    }
  }

  async function adminSetDecision(userId, decision) {
    // decision: accepted|refused
    try {
      // lire le profil concerné
      const { data: row, error: rErr } = await supabase
        .from("publique.profils")
        .select("*")
        .eq("id", userId)
        .single();
      if (rErr) throw rErr;

      if (!row?.pending_plan) return;

      const patch =
        decision === "accepted"
          ? {
              plan: row.pending_plan,
              pending_plan: null,
              request_status: "accepted",
              request_note: "Votre demande a été acceptée ✅",
              request_handled_at: new Date().toISOString(),
            }
          : {
              pending_plan: null,
              request_status: "refused",
              request_note: "Votre demande a été refusée ❌",
              request_handled_at: new Date().toISOString(),
            };

      const { data, error } = await supabase
        .from("publique.profils")
        .update(patch)
        .eq("id", userId)
        .select("*")
        .single();

      if (error) throw error;

      // si c'est toi (admin) qui a aussi ce profil chargé
      if (session?.user?.id === userId) setProfile(data);

      await loadAdminRequests();
    } catch (e) {
      console.error(e);
      alert("❌ Action admin impossible (RLS).");
    }
  }

  // ===== Contact -> Supabase insert + popup
  async function submitContact({ name, email, message }) {
    setContactErr("");
    try {
      const { error } = await supabase.from("messages_contact").insert({
        name,
        email,
        message,
      });
      if (error) throw error;
      setContactOk(true);
    } catch (e) {
      console.error(e);
      setContactErr("Impossible d’envoyer. Vérifie Supabase + RLS (messages_contact).");
    }
  }

  // ===== computed
  const isLoggedIn = !!session;
  const userEmail = session?.user?.email || "";

  const firstName = profile?.first_name || session?.user?.user_metadata?.first_name || "";
  const lastName = profile?.last_name || session?.user?.user_metadata?.last_name || "";
  const fullName = `${firstName} ${lastName}`.trim();

  const currentPlan = profile?.plan || null;
  const pendingPlan = profile?.pending_plan || null;

  // expiration côté app (Option A)
  const expired =
    profile?.request_status === "pending" &&
    profile?.request_expires_at &&
    new Date(profile.request_expires_at).getTime() < Date.now();

  return (
    <div>
      <Header
        isLoggedIn={isLoggedIn}
        userEmail={userEmail}
        fullName={fullName}
        onOpenAuth={() => setOpenAuth(true)}
        onLogout={logout}
        isAdmin={!!profile?.is_admin}
        onGoAdmin={() => document.getElementById("admin")?.scrollIntoView({ behavior: "smooth" })}
      />

      <Hero onOpenAuth={() => setOpenAuth(true)} />

      {isLoggedIn ? (
        <ClientArea
          fullName={fullName}
          email={userEmail}
          currentPlan={currentPlan}
          pendingPlan={pendingPlan}
          loading={profileLoading}
          profile={profile}
          expired={expired}
          onEditProfile={() => setOpenEditProfile(true)}
          onChooseFirstPlan={() => {
            setAllowPlanChange(true);
            document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
          }}
          onRequestChange={() => {
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

      <Contact onSubmit={submitContact} error={contactErr} />

      {profile?.is_admin && (
        <AdminPanel
          loading={adminLoading}
          rows={adminRequests}
          onRefresh={loadAdminRequests}
          onAccept={(id) => adminSetDecision(id, "accepted")}
          onRefuse={(id) => adminSetDecision(id, "refused")}
        />
      )}

      <Footer />

      {openAuth && <AuthModal onClose={() => setOpenAuth(false)} onLoggedIn={() => setOpenAuth(false)} />}

      {openEditProfile && (
        <EditProfileModal
          onClose={() => setOpenEditProfile(false)}
          initialFirstName={firstName}
          initialLastName={lastName}
          onSave={saveProfileNames}
        />
      )}

      {contactOk && <ThanksPopup onClose={() => setContactOk(false)} />}
    </div>
  );
}

/* =========================
   UI BLOCKS
   ========================= */

function Header({ isLoggedIn, userEmail, fullName, onOpenAuth, onLogout, isAdmin, onGoAdmin }) {
  return (
    <header className="topbar">
      <div className="container topbar__inner">
        <a className="brand" href="#top">
          <img className="brand__logo" src={logo} alt="CloudStoragePro" />
          <span className="brand__name">CloudStoragePro</span>
        </a>

        <nav className="nav">
          <a href="#top">Accueil</a>
          <a href="#features">Fonctionnalités</a>
          <a href="#pricing">Tarifs</a>
          <a href="#contact">Contact</a>
          {isAdmin && (
            <a href="#admin" onClick={(e) => (e.preventDefault(), onGoAdmin())}>
              Admin
            </a>
          )}
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
        <div>
          <h1>
            Stockage Cloud Sécurisé <br />
            Pour Vos Données
          </h1>
          <p>Stockez et sauvegardez vos fichiers en toute sécurité sur notre plateforme de cloud.</p>

          <div className="hero__cta">
            <button className="btn btn--primary" onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}>
              Commencer Maintenant
            </button>
            <button className="btn btn--ghost" onClick={onOpenAuth}>
              Connexion
            </button>
          </div>
        </div>

        <div className="heroArt">
          <img src="/hero-cloud.svg" alt="cloud hero" />
        </div>
      </div>

      <div className="hero__clouds" />
    </section>
  );
}

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
            <button className="btn btn--light" onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}>
              Voir les offres
            </button>
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
  profile,
  expired,
  onEditProfile,
  onChooseFirstPlan,
  onRequestChange,
}) {
  const hasPlan = !!currentPlan;
  const hasPending = !!pendingPlan;

  // si expired -> on affiche message "refaire demande"
  const showExpired = !!expired;

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
                <div className="infoValue">{loading ? "Chargement..." : currentPlan || "Aucun choisi"}</div>
              </div>

              <div className="infoItem">
                <div className="infoLabel">Statut</div>
                <div className="infoValue">Connecté ✅</div>
              </div>
            </div>

            {hasPending && !showExpired && (
              <div className="pendingBox">
                ✅ Demande de changement envoyée : <strong>{pendingPlan}</strong>
                <span className="pendingSmall">Le changement sera effectué sous 48h si place disponible.</span>
                {profile?.request_note ? <span className="pendingSmall">ℹ️ {profile.request_note}</span> : null}
              </div>
            )}

            {showExpired && (
              <div className="pendingBox">
                ⏱️ Aucune réponse sous 48h.
                <span className="pendingSmall">Veuillez refaire votre demande (bouton “Changer mon abonnement”).</span>
              </div>
            )}

            {profile?.request_status === "accepted" && profile?.request_note && (
              <div className="pendingBox" style={{ background: "#e9ffef", borderColor: "#9ff0b0", color: "#1f6b33" }}>
                {profile.request_note}
              </div>
            )}

            {profile?.request_status === "refused" && profile?.request_note && (
              <div className="pendingBox" style={{ background: "#ffe9e9", borderColor: "#ffb0b0", color: "#7a1f1f" }}>
                {profile.request_note}
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
              <button className="btn btn--primary" onClick={onRequestChange} disabled={hasPending && !showExpired}>
                {hasPending && !showExpired ? "Changement en attente" : "Changer mon abonnement"}
              </button>
            )}

            <button className="btn btn--light" onClick={() => alert("📁 Mes fichiers : bientôt.")}>
              Mes fichiers (bientôt)
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Services() {
  const items = [
    { title: "Stockage Évolutif", desc: "Espace extensible selon vos besoins", icon: "☁️" },
    { title: "Sécurité Avancée", desc: "Cryptage & protection de vos données", icon: "🛡️" },
    { title: "Accès 24/7", desc: "Accédez à vos fichiers à tout moment", icon: "⏱️" },
  ];

  return (
    <section id="features" className="section">
      <div className="container">
        <h2 className="section__title hrTitle">Nos Services</h2>

        <div className="grid3">
          {items.map((it) => (
            <div className="serviceCard" key={it.title}>
              <div className="serviceIcon">{it.icon}</div>
              <div className="serviceTitle">{it.title}</div>
              <div className="serviceDesc">{it.desc}</div>
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
        highlight: false,
      },
      {
        name: "Pro",
        price: "9,99",
        per: "/ mois",
        features: ["1 To de stockage", "Sauvegarde automatique", "Sécurité renforcée"],
        highlight: true,
        badge: "Le Plus Populaire",
      },
      {
        name: "Premium",
        price: "19,99",
        per: "/ mois",
        features: ["5 To de stockage", "Cryptage avancé", "Support prioritaire"],
        highlight: false,
      },
    ],
    []
  );

  const hasPlan = !!currentPlan;
  const hasPending = !!pendingPlan;

  function getActionState(planName) {
  if (!isLoggedIn) {
    return { label: "SE CONNECTER", disabled: false, onClick: onOpenAuth };
  }

  if (hasPending) {
    return { label: "EN ATTENTE", disabled: true, onClick: null };
  }

  if (!hasPlan) {
    return { label: "CHOISIR", disabled: false, onClick: () => onPlanClick(planName) };
  }

  if (hasPlan && !allowPlanChange) {
    return { label: "DÉJÀ ACTIF", disabled: true, onClick: null };
  }

  if (hasPlan && allowPlanChange) {
    if (planName === currentPlan) {
      return { label: "ACTIF", disabled: true, onClick: null };
    }
    return { label: "CHANGER", disabled: false, onClick: () => onPlanClick(planName) };
  }

  return { label: "CHOISIR", disabled: false, onClick: () => onPlanClick(planName) };
}

  return (
    <section id="pricing" className="section section--soft">
      <div className="container">
        <h2 className="section__title hrTitle">Choisissez Votre Abonnement</h2>

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

function Contact({ onSubmit, error }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setSending(true);
    try {
      await onSubmit({ name: name.trim(), email: email.trim(), message: message.trim() });
      setName("");
      setEmail("");
      setMessage("");
    } finally {
      setSending(false);
    }
  }

  return (
    <section id="contact" className="section">
      <div className="container">
        <h2 className="section__title hrTitle">Contactez-Nous</h2>

        <div className="contactWrap">
          <form onSubmit={submit}>
            <input className="input" placeholder="Nom" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <textarea className="textarea" placeholder="Message" rows={6} value={message} onChange={(e) => setMessage(e.target.value)} />

            <button className="btn btn--primary btn--center" type="submit" disabled={sending}>
              {sending ? "Envoi..." : "Envoyer"}
            </button>

            {error ? <div className="authMsg" style={{ marginTop: 12 }}>{error}</div> : null}
          </form>
        </div>
      </div>
    </section>
  );
}

function AdminPanel({ loading, rows, onRefresh, onAccept, onRefuse }) {
  return (
    <section id="admin" className="section section--soft">
      <div className="container">
        <h2 className="section__title hrTitle">Panneau Admin</h2>

        <div className="adminBox">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <h3 className="adminTitle">Demandes de changement</h3>
            <button className="btn btn--light" onClick={onRefresh}>
              Rafraîchir
            </button>
          </div>

          {loading ? (
            <div className="authMsg">Chargement...</div>
          ) : rows.length === 0 ? (
            <div className="authMsg">Aucune demande en attente.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Plan actuel</th>
                    <th>Demande</th>
                    <th>Statut</th>
                    <th>Créée</th>
                    <th>Expire</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <strong>
                          {(r.first_name || "") + " " + (r.last_name || "")}
                        </strong>
                        <div style={{ color: "#6b7c93", fontWeight: 800, fontSize: 12 }}>{r.id}</div>
                      </td>
                      <td>{r.plan || "—"}</td>
                      <td><strong>{r.pending_plan}</strong></td>
                      <td>
                        <StatusBadge status={r.request_status || "pending"} />
                      </td>
                      <td>{r.change_requested_at ? new Date(r.change_requested_at).toLocaleString() : "—"}</td>
                      <td>{r.request_expires_at ? new Date(r.request_expires_at).toLocaleString() : "—"}</td>
                      <td style={{ minWidth: 220 }}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button className="btn btn--primary" onClick={() => onAccept(r.id)}>Accepter</button>
                          <button className="btn btn--light" onClick={() => onRefuse(r.id)}>Refuser</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="note" style={{ marginTop: 10 }}>
                Si l’admin ne voit rien ici, c’est un problème de RLS (on le règle en ajoutant une policy admin).
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function StatusBadge({ status }) {
  const s = (status || "").toLowerCase();
  if (s === "accepted") return <span className="badge badge--accepted">acceptée</span>;
  if (s === "refused") return <span className="badge badge--refused">refusée</span>;
  if (s === "expired") return <span className="badge badge--expired">expirée</span>;
  return <span className="badge badge--pending">en attente</span>;
}

function Footer() {
  return (
    <footer className="footer">
      © {new Date().getFullYear()} CloudStoragePro — Tous droits réservés
    </footer>
  );
}

/* =========================
   MODALS
   ========================= */

function ThanksPopup({ onClose }) {
  return (
    <div className="modalOverlay" role="dialog" aria-modal="true">
      <div className="modalCard">
        <button className="modalClose" onClick={onClose} aria-label="Fermer">
          ✕
        </button>
        <h3 className="authTitle">Merci pour votre message ✅</h3>
        <div className="authMsg">
          Nous l’avons bien reçu et nous vous répondrons dès que possible.
        </div>
        <button className="btn btn--primary btn--full" onClick={onClose} style={{ marginTop: 12 }}>
          Fermer
        </button>
      </div>
    </div>
  );
}

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
            <input className="authInput" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            {!firstOk && <div className="fieldError">Prénom obligatoire</div>}
          </label>

          <label className="authLabel">
            Nom <span className="req">*</span>
            <input className="authInput" value={lastName} onChange={(e) => setLastName(e.target.value)} />
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
          options: { data: { first_name: firstName.trim(), last_name: lastName.trim() } },
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
        options: { emailRedirectTo: redirectTo },
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
        <img src={logo} alt="logo" className="authLogo" />
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
              <input className="authInput" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              {!firstOk && <div className="fieldError">Prénom obligatoire</div>}
            </label>

            <label className="authLabel">
              Nom <span className="req">*</span>
              <input className="authInput" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              {!lastOk && <div className="fieldError">Nom obligatoire</div>}
            </label>
          </div>
        )}

        <label className="authLabel">
          Email
          <input className="authInput" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>

        {mode !== "forgot" && (
          <label className="authLabel">
            Mot de passe
            <input className="authInput" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
        )}

        <button className="btn btn--primary btn--full" type="submit" disabled={loading || signupDisabled}>
          {loading ? "Patiente..." : mode === "login" ? "Se connecter" : mode === "signup" ? "Créer mon compte" : "Envoyer l’email"}
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
