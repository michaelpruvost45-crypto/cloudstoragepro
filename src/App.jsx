import { useEffect, useMemo, useState } from "react";
import "./styles.css";
import { supabase } from "./supabaseClient";

export default function App() {
  const [session, setSession] = useState(null);
  const [openAuth, setOpenAuth] = useState(false);

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // popup “message envoyé”
  const [toast, setToast] = useState(null);

  // autoriser le changement uniquement via bouton espace client
  const [allowPlanChange, setAllowPlanChange] = useState(false);

  // Admin panel
  const [adminRequests, setAdminRequests] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session || null));
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => setSession(s || null));
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
    // si admin -> charger les demandes
    if (profile?.role === "admin") loadAdminRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.role]);

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
        // expiration 48h (Option A : côté app)
        const expired = await maybeExpireClientRequest(existing);
        setProfile(expired);
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
          role: "user"
        })
        .select("*")
        .single();

      if (insErr) throw insErr;
      setProfile(created);
    } catch (e) {
  console.error(e);
  alert("❌ Impossible d’enregistrer : " + (e?.message || "") + "\n" + (e?.details || ""));
}
    } finally {
      setProfileLoading(false);
    }
  }

  async function maybeExpireClientRequest(p) {
    try {
      if (
        p?.request_status === "pending" &&
        p?.request_expires_at &&
        new Date(p.request_expires_at).getTime() < Date.now()
      ) {
        const { data, error } = await supabase
          .from("profiles")
          .update({
            request_status: "expired",
            request_note: "Aucune réponse sous 48h. Veuillez refaire votre demande.",
            request_handled_at: new Date().toISOString(),
            pending_plan: null
          })
          .eq("id", p.id)
          .select("*")
          .single();
        if (error) throw error;
        return data;
      }
    } catch (e) {
      console.warn("expire check warning:", e?.message);
    }
    return p;
  }

  async function logout() {
    await supabase.auth.signOut();
    setProfile(null);
    setAllowPlanChange(false);
  }

  const isLoggedIn = !!session;
  const userEmail = session?.user?.email || "";
  const firstName = profile?.first_name || session?.user?.user_metadata?.first_name || "";
  const lastName = profile?.last_name || session?.user?.user_metadata?.last_name || "";
  const fullName = `${firstName} ${lastName}`.trim();

  const isAdmin = profile?.role === "admin";
  const currentPlan = profile?.plan || null;

  // status géré via request_status
  const requestStatus = profile?.request_status || null;
  const pendingPlan = profile?.pending_plan || null;

  // ===== PLANS =====
  const plans = useMemo(
    () => [
      {
        name: "Basique",
        price: "4,99",
        per: "/ mois",
        features: ["100 Go de stockage", "Cryptage basique", "Support standard"],
        highlight: false,
        cta: "CHOISIR"
      },
      {
        name: "Pro",
        price: "9,99",
        per: "/ mois",
        features: ["1 To de stockage", "Sauvegarde automatique", "Sécurité renforcée"],
        highlight: true,
        badge: "Le Plus Populaire",
        cta: "CHOISIR"
      },
      {
        name: "Premium",
        price: "19,99",
        per: "/ mois",
        features: ["3 To de stockage", "Cryptage avancé", "Support prioritaire"],
        highlight: false,
        cta: "CHOISIR"
      }
    ],
    []
  );

  // ===== CHOISIR / DEMANDER =====
  async function handlePlanClick(planName) {
    if (!session?.user?.id) {
      setOpenAuth(true);
      return;
    }

    // si demande en cours -> bloqué
    if (requestStatus === "pending") return;

    const hasActivePlan = !!currentPlan;

    // si plan actif, interdit sauf si bouton “changer mon abonnement”
    if (hasActivePlan && !allowPlanChange) return;

    try {
      // 1) premier abonnement => activation directe
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

      // 2) changement => DEMANDE (48h)
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
          updated_at: new Date().toISOString()
        })
        .eq("id", session.user.id)
        .select("*")
        .single();

      if (error) throw error;
      setProfile(data);
      setAllowPlanChange(false);

      alert("✅ Demande envoyée à l’équipe technique.\nRéponse sous 48h si place disponible.");
    } catch (e) {
      console.error(e);
      alert("❌ Impossible d’enregistrer (vérifie la table profiles + RLS).");
    }
  }

  function pricingAction(planName) {
    if (!isLoggedIn) return { label: "CONNEXION", disabled: false, onClick: () => setOpenAuth(true) };

    if (requestStatus === "pending") return { label: "BLOQUÉ", disabled: true, onClick: null };

    if (currentPlan && !allowPlanChange) return { label: "INDISPONIBLE", disabled: true, onClick: null };

    if (currentPlan && allowPlanChange) {
      if (planName === currentPlan) return { label: "DÉJÀ ACTIF", disabled: true, onClick: null };
      return { label: "CHOISIR", disabled: false, onClick: () => handlePlanClick(planName) };
    }

    return { label: "CHOISIR", disabled: false, onClick: () => handlePlanClick(planName) };
  }

  // ===== CONTACT (SUPABASE) =====
  async function submitContact({ name, email, message }) {
    try {
      const { error } = await supabase.from("messages_contact").insert([{ name, email, message }]);
      if (error) throw error;

      setToast({
        title: "Merci pour votre message ✅",
        text: "Nous avons bien reçu votre demande. Nous vous répondrons rapidement."
      });
    } catch (e) {
      console.error(e);
      setToast({
        title: "Erreur ❌",
        text: "Impossible d’envoyer le message. Réessaie plus tard."
      });
    }
  }

  // ===== ADMIN =====
  async function loadAdminRequests() {
    if (!isAdmin) return;
    setAdminLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, plan, pending_plan, request_status, request_note, change_requested_at, request_expires_at, email:email")
        .eq("request_status", "pending")
        .order("change_requested_at", { ascending: false });

      // si ta table profiles n’a pas email, supprime "email:email" ci-dessus
      if (error) throw error;
      setAdminRequests(data || []);
    } catch (e) {
      console.error(e);
      // Si ta table profiles n’a pas la colonne email, on recharge sans.
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, plan, pending_plan, request_status, request_note, change_requested_at, request_expires_at")
          .eq("request_status", "pending")
          .order("change_requested_at", { ascending: false });
        if (error) throw error;
        setAdminRequests(data || []);
      } catch (e2) {
        console.error(e2);
      }
    } finally {
      setAdminLoading(false);
    }
  }

  async function adminAccept(userId) {
    try {
      // récupérer le profil ciblé (RLS admin autorise)
      const { data: p, error: readErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (readErr) throw readErr;

      if (!p.pending_plan) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          plan: p.pending_plan,
          pending_plan: null,
          request_status: "accepted",
          request_note: "Votre demande a été acceptée ✅",
          request_handled_at: new Date().toISOString()
        })
        .eq("id", userId);

      if (error) throw error;
      await loadAdminRequests();
      alert("✅ Demande acceptée.");
    } catch (e) {
      console.error(e);
      alert("❌ Impossible d’accepter (RLS / droits admin).");
    }
  }

  async function adminRefuse(userId) {
    const note = prompt("Motif (optionnel) :") || "Votre demande a été refusée ❌";
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          pending_plan: null,
          request_status: "refused",
          request_note: note,
          request_handled_at: new Date().toISOString()
        })
        .eq("id", userId);

      if (error) throw error;
      await loadAdminRequests();
      alert("✅ Demande refusée.");
    } catch (e) {
      console.error(e);
      alert("❌ Impossible de refuser (RLS / droits admin).");
    }
  }

  return (
    <>
      <Header
        isLoggedIn={isLoggedIn}
        userEmail={userEmail}
        fullName={fullName}
        onOpenAuth={() => setOpenAuth(true)}
        onLogout={logout}
      />

      <Hero onOpenAuth={() => setOpenAuth(true)} />

      {/* SERVICES */}
      <section id="features" className="section section--soft">
        <div className="container">
          <h2 className="section__title">Nos Services</h2>
          <div className="grid3">
            <Service icon="☁️" title="Stockage Évolutif" desc="Espace extensible selon vos besoins" />
            <Service icon="🛡️" title="Sécurité Avancée" desc="Cryptage & protection de vos données" />
            <Service icon="⏱️" title="Accès 24/7" desc="Accédez à vos fichiers à tout moment" />
          </div>
        </div>
      </section>

      {/* ESPACE CLIENT EN HAUT DES PLANS */}
      <section className="section clientWrap">
        <div className="container">
          {!isLoggedIn ? (
            <ClientTeaser onOpenAuth={() => setOpenAuth(true)} />
          ) : (
            <ClientArea
              loading={profileLoading}
              fullName={fullName}
              email={userEmail}
              plan={currentPlan}
              requestStatus={requestStatus}
              pendingPlan={pendingPlan}
              requestNote={profile?.request_note}
              requestExpiresAt={profile?.request_expires_at}
              onChangePlan={() => {
                setAllowPlanChange(true);
                document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
              }}
              onFiles={() => alert("📁 Mes fichiers : bientôt (connexion NAS à ajouter).")}
            />
          )}
        </div>
      </section>

      {/* ADMIN PANEL */}
      {isLoggedIn && isAdmin && (
        <section className="section section--soft">
          <div className="container">
            <div className="adminPanel">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <h2 className="adminTitle">Panneau Admin — Demandes d’abonnement</h2>
                <button className="btn btn--primary" onClick={loadAdminRequests} disabled={adminLoading}>
                  {adminLoading ? "Chargement..." : "Rafraîchir"}
                </button>
              </div>

              {adminRequests.length === 0 ? (
                <p style={{ margin: "10px 0 0", color: "#5a6f8f", fontWeight: 800 }}>
                  Aucune demande en attente.
                </p>
              ) : (
                adminRequests.map((r) => (
                  <div key={r.id} className="adminRow">
                    <div style={{ minWidth: 280 }}>
                      <b>{`${r.first_name || ""} ${r.last_name || ""}`.trim() || "Utilisateur"}</b>
                      <div style={{ color: "#5a6f8f", fontWeight: 800, fontSize: 13 }}>
                        Plan actuel : <span className="pill">{r.plan || "Aucun"}</span>{" "}
                        → Demande : <span className="pill">{r.pending_plan}</span>
                      </div>
                      <div style={{ color: "#5a6f8f", fontWeight: 800, fontSize: 12, marginTop: 4 }}>
                        Expire : {r.request_expires_at ? new Date(r.request_expires_at).toLocaleString() : "—"}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button className="btn btn--primary" onClick={() => adminAccept(r.id)}>
                        Accepter
                      </button>
                      <button className="btn btn--light" onClick={() => adminRefuse(r.id)}>
                        Refuser
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {/* PRICING */}
      <section id="pricing" className="section">
        <div className="container">
          <h2 className="section__title">Choisissez Votre Abonnement</h2>

          <div className="pricingGrid">
            {plans.map((p) => {
              const a = pricingAction(p.name);
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
                  >
                    {a.label}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="note">
            <b>Note :</b>{" "}
            {!isLoggedIn
              ? "Connecte-toi pour choisir une offre."
              : requestStatus === "pending"
              ? "Changement en attente (48h)."
              : currentPlan && !allowPlanChange
              ? "Pour changer de plan, utilise le bouton dans l’espace client."
              : "Tu peux choisir ou demander un changement."}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="section section--soft">
        <div className="container">
          <h2 className="section__title">Contactez-Nous</h2>
          <ContactForm onSubmit={submitContact} />
        </div>
      </section>

      <Footer />

      {openAuth && <AuthModal onClose={() => setOpenAuth(false)} onLoggedIn={() => setOpenAuth(false)} />}

      {toast && (
        <div className="toastOverlay" onClick={() => setToast(null)}>
          <div className="toast" onClick={(e) => e.stopPropagation()}>
            <h3 className="toastTitle">{toast.title}</h3>
            <p className="toastText">{toast.text}</p>
            <div className="toastActions">
              <button className="btn btn--primary" onClick={() => setToast(null)}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* =========================
   UI Components
========================= */

function Header({ isLoggedIn, userEmail, fullName, onOpenAuth, onLogout }) {
  return (
    <header className="topbar">
      <div className="container topbar__inner">
        <a className="brand" href="#top">
          <img className="brand__logo" src="/logo.png" alt="CloudStoragePro" />
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
        <div>
          <h1>
            Stockage Cloud Sécurisé <br /> Pour Vos Données
          </h1>
          <p>Stockez et sauvegardez vos fichiers en toute sécurité sur notre plateforme de cloud.</p>

          <div className="hero__cta">
            <a className="btn btn--primary" href="#pricing">
              Commencer Maintenant
            </a>
            <button className="btn btn--ghost" onClick={onOpenAuth}>
              Connexion
            </button>
          </div>
        </div>

        <div className="heroArt">
          <div className="heroArt__inner">
            <HeroSvg />
            <div className="heroArt__title">Cloud sécurisé</div>
            <div className="heroArt__sub">Synchronisation & sauvegarde</div>
          </div>
        </div>
      </div>
      <div className="hero__clouds" />
    </section>
  );
}

function HeroSvg() {
  // SVG inline pour éviter d’avoir des fichiers cloud.png etc.
  return (
    <svg viewBox="0 0 600 340" width="100%" height="auto" aria-hidden="true">
      <defs>
        <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#e9f6ff" />
          <stop offset="1" stopColor="#bfe6ff" />
        </linearGradient>
        <linearGradient id="g2" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#0b63da" />
          <stop offset="1" stopColor="#35c5ff" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="600" height="340" rx="24" fill="rgba(255,255,255,0.06)" />
      <g transform="translate(70,40)">
        <path
          d="M130 210c-48 0-88-33-88-74 0-34 26-63 63-72 10-43 53-74 103-74 55 0 102 38 109 86 40 4 71 35 71 72 0 40-37 72-83 72H130z"
          fill="url(#g1)"
          opacity="0.96"
        />
        <path
          d="M210 220c-70 0-128-48-128-108 0-50 38-93 92-106C188 41 247 0 316 0c77 0 142 53 151 121 55 6 98 49 98 102 0 57-51 103-115 103H210z"
          fill="url(#g2)"
          opacity="0.25"
        />
        {/* disque */}
        <circle cx="330" cy="132" r="70" fill="#0b63da" opacity="0.20" />
        <circle cx="330" cy="132" r="58" fill="#0b63da" opacity="0.28" />

        {/* petit “drive” */}
        <g transform="translate(292,108)">
          <rect x="0" y="0" width="78" height="50" rx="12" fill="#0b63da" opacity="0.65" />
          <rect x="10" y="12" width="58" height="6" rx="3" fill="#ffffff" opacity="0.9" />
          <rect x="10" y="26" width="48" height="6" rx="3" fill="#ffffff" opacity="0.85" />
          <circle cx="58" cy="38" r="5" fill="#ffffff" opacity="0.9" />
        </g>
      </g>
    </svg>
  );
}

function Service({ icon, title, desc }) {
  return (
    <div className="serviceCard">
      <div className="serviceIcon" aria-hidden="true">
        <span style={{ fontSize: 28 }}>{icon}</span>
      </div>
      <div className="serviceTitle">{title}</div>
      <div className="serviceDesc">{desc}</div>
    </div>
  );
}

function ClientTeaser({ onOpenAuth }) {
  return (
    <div className="clientCard">
      <div>
        <h2 className="clientTitle">Espace client</h2>
        <p className="clientText">
          Connecte-toi pour gérer ton abonnement et accéder (bientôt) à tes fichiers.
        </p>
      </div>
      <div className="clientActions">
        <button className="btn btn--primary" onClick={onOpenAuth}>
          Connexion
        </button>
        <a className="btn btn--light" href="#pricing">
          Voir les offres
        </a>
      </div>
    </div>
  );
}

function ClientArea({
  loading,
  fullName,
  email,
  plan,
  requestStatus,
  pendingPlan,
  requestNote,
  requestExpiresAt,
  onChangePlan,
  onFiles
}) {
  const planLabel = loading ? "Chargement..." : plan || "Aucun choisi";

  let notice = null;
  if (requestStatus === "pending") {
    notice = (
      <div className="notice notice--pending">
        ✅ Demande de changement envoyée : <b>{pendingPlan}</b>
        <small>
          Le changement sera effectué sous 48h si place disponible.
          {requestExpiresAt ? ` (Expire le ${new Date(requestExpiresAt).toLocaleString()})` : ""}
        </small>
      </div>
    );
  }
  if (requestStatus === "accepted") {
    notice = (
      <div className="notice notice--ok">
        ✅ Votre demande a été acceptée.
        <small>{requestNote || ""}</small>
      </div>
    );
  }
  if (requestStatus === "refused") {
    notice = (
      <div className="notice notice--bad">
        ❌ Votre demande a été refusée.
        <small>{requestNote || ""}</small>
      </div>
    );
  }
  if (requestStatus === "expired") {
    notice = (
      <div className="notice notice--bad">
        ⏳ Demande expirée.
        <small>{requestNote || "Veuillez refaire votre demande."}</small>
      </div>
    );
  }

  return (
    <div className="clientCard">
      <div>
        <h2 className="clientTitle">Espace client</h2>
        <p className="clientText">
          Bienvenue <b>{fullName || "Utilisateur"}</b> 👋 <br />
          <span className="clientSmall">{email}</span>
        </p>

        <div className="clientInfo">
          <div className="infoItem">
            <div className="infoLabel">Abonnement</div>
            <div className="infoValue">{planLabel}</div>
          </div>
          <div className="infoItem">
            <div className="infoLabel">Statut</div>
            <div className="infoValue">Connecté ✅</div>
          </div>
        </div>

        {notice}
      </div>

      <div className="clientActions">
        <button className="btn btn--light" onClick={onFiles}>
          Mes fichiers (bientôt)
        </button>

        <button className="btn btn--primary" onClick={onChangePlan} disabled={requestStatus === "pending"}>
          {requestStatus === "pending" ? "Changement en attente" : "Changer mon abonnement"}
        </button>
      </div>
    </div>
  );
}

/* =========================
   CONTACT FORM
========================= */

function ContactForm({ onSubmit }) {
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
    <form className="contactForm" onSubmit={submit}>
      <input className="input" placeholder="Nom" value={name} onChange={(e) => setName(e.target.value)} />
      <input
        className="input"
        placeholder="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <textarea
        className="textarea"
        placeholder="Message"
        rows={6}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button className="btn btn--primary btn--center" type="submit" disabled={sending}>
        {sending ? "Envoi..." : "Envoyer"}
      </button>
    </form>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        © {new Date().getFullYear()} CloudStoragePro — Tous droits réservés
      </div>
    </footer>
  );
}

/* =========================
   AUTH MODAL (login/signup/forgot)
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
        if (!firstName.trim()) throw new Error("Prénom obligatoire.");
        if (!lastName.trim()) throw new Error("Nom obligatoire.");

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { first_name: firstName.trim(), last_name: lastName.trim() } }
        });
        if (error) throw error;

        setMsg("✅ Compte créé. Un email de confirmation a été envoyé.");
        setMode("login");
        setPassword("");
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

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
      setMsg("✅ Email de confirmation renvoyé !");
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
              Prénom
              <input className="authInput" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </label>
            <label className="authLabel">
              Nom
              <input className="authInput" value={lastName} onChange={(e) => setLastName(e.target.value)} />
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
            <input
              className="authInput"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
        )}

        <button className="btn btn--primary btn--full" type="submit" disabled={loading}>
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
