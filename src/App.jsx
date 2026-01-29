import React, { useEffect, useMemo, useState } from "react";
import "./styles.css";
import { supabase } from "./supabaseClient";

const BRAND = "CloudStoragePro";

const PLANS = [
  {
    key: "Basique",
    title: "Basique",
    price: "4,99",
    storage: "100 Go",
    features: ["100 Go de stockage", "Cryptage basique", "Support standard"],
    cta: "CONNEXION",
  },
  {
    key: "Pro",
    title: "Pro",
    price: "9,99",
    storage: "1 To",
    features: ["1 To de stockage", "Sauvegarde automatique", "Sécurité renforcée"],
    cta: "CONNEXION",
    popular: true,
  },
  {
    key: "Premium",
    title: "Premium",
    price: "19,99",
    storage: "3 To",
    features: ["3 To de stockage", "Cryptage avancé", "Support prioritaire"],
    cta: "CONNEXION",
  },
];

function getDisplayName(user, profile) {
  const first = profile?.prenom || "";
  const last = profile?.nom || "";
  const full = `${first} ${last}`.trim();
  if (full) return full;
  return user?.email?.split("@")?.[0] || "Utilisateur";
}

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  // login modal
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // login | signup
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");

  // signup extra fields
  const [signupNom, setSignupNom] = useState("");
  const [signupPrenom, setSignupPrenom] = useState("");

  // forgot password
  const [resetSent, setResetSent] = useState(false);

  // messages
  const [toast, setToast] = useState(null);

  const isLoggedIn = !!user;

  const displayName = useMemo(() => getDisplayName(user, profile), [user, profile]);

  useEffect(() => {
    let ignore = false;

    async function init() {
      const { data } = await supabase.auth.getSession();
      if (ignore) return;
      setUser(data?.session?.user || null);
    }

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (!session?.user) setProfile(null);
    });

    return () => {
      ignore = true;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadProfile() {
      if (!user) return;

      const { data, error } = await supabase
        .from("profils")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (ignore) return;

      if (!error) setProfile(data || null);
    }

    loadProfile();

    return () => {
      ignore = true;
    };
  }, [user]);

  function showToast(type, text) {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  }

  function openAuth(mode = "login") {
    setAuthMode(mode);
    setAuthOpen(true);
    setResetSent(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    showToast("ok", "Déconnecté.");
  }

  async function handleLogin(e) {
    e.preventDefault();
    setResetSent(false);

    const { error } = await supabase.auth.signInWithPassword({
      email: authEmail.trim(),
      password: authPassword,
    });

    if (error) {
      showToast("err", error.message);
      return;
    }

    setAuthOpen(false);
    showToast("ok", "Connexion réussie ✅");
  }

  async function handleSignup(e) {
    e.preventDefault();
    setResetSent(false);

    // champs obligatoires
    if (!signupPrenom.trim() || !signupNom.trim()) {
      showToast("err", "Nom et prénom sont obligatoires.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: authEmail.trim(),
      password: authPassword,
      options: {
        data: {
          nom: signupNom.trim(),
          prenom: signupPrenom.trim(),
        },
      },
    });

    if (error) {
      showToast("err", error.message);
      return;
    }

    // crée/maj profil dans ta table profils si tu l’utilises
    if (data?.user?.id) {
      await supabase.from("profils").upsert(
        {
          id: data.user.id,
          email: authEmail.trim(),
          nom: signupNom.trim(),
          prenom: signupPrenom.trim(),
        },
        { onConflict: "id" }
      );
    }

    showToast("ok", "Compte créé ! Vérifie ton email pour confirmer ✅");
    setAuthOpen(false);
  }

  async function handleResetPassword() {
    setResetSent(false);
    const email = authEmail.trim();
    if (!email) {
      showToast("err", "Entre ton email d’abord.");
      return;
    }

    // URL de retour après reset (tu peux changer si tu veux)
    const redirectTo = window.location.origin;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      showToast("err", error.message);
      return;
    }

    setResetSent(true);
    showToast("ok", "Email de réinitialisation envoyé ✅");
  }

  function handlePlanClick(planKey) {
    if (!isLoggedIn) {
      // Si pas connecté → ouvrir login
      openAuth("login");
      return;
    }

    // Si connecté → tu peux garder ton comportement actuel (ex: ouvrir modal abonnement)
    // Ici on met juste un message pour ne rien casser
    showToast("ok", `Demande envoyée pour l’offre "${planKey}" (traitement sous 48h si disponible).`);
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type === "err" ? "toastErr" : "toastOk"}`}>
          {toast.text}
        </div>
      )}

      {/* Topbar */}
      <header className="topbar">
        <div className="topbarInner">
          <div className="brand">
            <img className="brandLogo" src="/logo.png" alt={BRAND} />
            <span className="brandName">{BRAND}</span>
          </div>

          <nav className="nav">
            <a href="#top">Accueil</a>
            <a href="#features">Fonctionnalités</a>
            <a href="#pricing">Tarifs</a>

            {/* ✅ ICI : Contact → page */}
            <a href="/contact.html">Contact</a>
          </nav>

          <div className="navRight">
            {isLoggedIn ? (
              <div className="userChip">
                <div className="userChipText">
                  <div className="userChipName">{displayName}</div>
                  <div className="userChipEmail">{user?.email}</div>
                </div>
                <button className="btn btnLight" onClick={handleLogout}>
                  Déconnexion
                </button>
              </div>
            ) : (
              <button className="btn btnLight" onClick={() => openAuth("login")}>
                Connexion
              </button>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section id="top" className="hero">
        <div className="container heroGrid">
          <div className="heroLeft">
            <h1>
              Stockage Cloud Sécurisé <br />
              Pour Vos Données
            </h1>
            <p>
              Stockez et sauvegardez vos fichiers en toute sécurité sur{" "}
              <strong>{BRAND}</strong>.
            </p>

            <div className="heroBtns">
              <a className="btn btnPrimary" href="#pricing">
                Voir les abonnements
              </a>
              <button className="btn btnOutline" onClick={() => openAuth("login")}>
                Connexion
              </button>
            </div>
          </div>

          <div className="heroRight">
            {/* Tu peux garder ton bloc “cloud sécurisé” ici */}
            <div className="heroCard">
              <div className="heroCardIconWrap">
                <img className="heroCardIcon" src="/logo.png" alt="Logo" />
              </div>
              <div className="heroCardTitle">Cloud sécurisé</div>
              <div className="heroCardSub">Synchronisation & sauvegarde</div>

              {/* Exemple compteur (à brancher sur Supabase si tu veux) */}
              <div className="heroCardMeta">Abonnements actifs : <strong>—</strong></div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="section sectionSoft">
        <div className="container">
          <h2 className="sectionTitle">Nos Services</h2>

          <div className="cards3">
            <div className="card">
              <div className="cardTitle">Stockage Évolutif</div>
              <div className="cardText">Espace extensible selon vos besoins</div>
            </div>
            <div className="card">
              <div className="cardTitle">Sécurité Avancée</div>
              <div className="cardText">Cryptage & protection de vos données</div>
            </div>
            <div className="card">
              <div className="cardTitle">Accès 24/7</div>
              <div className="cardText">Accédez à vos fichiers à tout moment</div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="section">
        <div className="container">
          <h2 className="sectionTitle">Choisissez Votre Abonnement</h2>

          <div className="pricingGrid">
            {PLANS.map((p) => (
              <div key={p.key} className={`priceCard ${p.popular ? "priceCardPopular" : ""}`}>
                {p.popular && <div className="badge">Le Plus Populaire</div>}
                <div className="priceTitle">{p.title}</div>
                <div className="priceValue">
                  <span className="euro">€</span>
                  <span className="amount">{p.price}</span>
                  <span className="per">/ mois</span>
                </div>

                <ul className="priceList">
                  {p.features.map((f) => (
                    <li key={f}>✓ {f}</li>
                  ))}
                </ul>

                <button
                  className={`btn ${p.popular ? "btnGold" : "btnPrimary"} btnFull`}
                  onClick={() => handlePlanClick(p.key)}
                >
                  {isLoggedIn ? "CHOISIR" : p.cta}
                </button>
              </div>
            ))}
          </div>

          <div className="note">
            Note : {isLoggedIn ? "Choisis ton offre." : "Connecte-toi pour choisir une offre."}
          </div>
        </div>
      </section>

      {/* ESPACE CLIENT (simple, sans dashboard en plus) */}
      {isLoggedIn && (
        <section className="section sectionSoft">
          <div className="container">
            <div className="clientCard">
              <div className="clientLeft">
                <h2 className="clientTitle">Espace client</h2>
                <div className="clientHello">
                  Bienvenue <strong>{displayName}</strong> 👋
                </div>
                <div className="clientEmail">{user?.email}</div>

                <div className="clientStats">
                  <div className="statBox">
                    <div className="statLabel">Abonnement</div>
                    <div className="statValue">{profile?.plan || "Aucun choisi"}</div>
                  </div>
                  <div className="statBox">
                    <div className="statLabel">Statut</div>
                    <div className="statValue">
                      Connecté ✅
                    </div>
                  </div>
                </div>
              </div>

              <div className="clientRight">
                <button className="btn btnPrimary">
                  Choisir / changer mon abonnement
                </button>
                <button className="btn btnGhost">
                  Mes fichiers (bientôt)
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="footer">
        <div className="container">© 2026 {BRAND} — Tous droits réservés</div>
      </footer>

      {/* AUTH MODAL */}
      {authOpen && (
        <div className="modalOverlay" onClick={() => setAuthOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modalTop">
              <div className="modalBrand">
                <img src="/logo.png" alt={BRAND} />
                <div>
                  <div className="modalBrandName">{BRAND}</div>
                  <div className="modalBrandSub">Espace client</div>
                </div>
              </div>
              <button className="modalClose" onClick={() => setAuthOpen(false)}>
                ×
              </button>
            </div>

            <div className="modalTitle">
              {authMode === "login" ? "Connexion" : "Créer un compte"}
            </div>

            <form onSubmit={authMode === "login" ? handleLogin : handleSignup}>
              {authMode === "signup" && (
                <>
                  <label className="label">
                    Prénom <span className="required">*</span>
                  </label>
                  <input
                    value={signupPrenom}
                    onChange={(e) => setSignupPrenom(e.target.value)}
                    placeholder="ex : Alex"
                    required
                  />

                  <label className="label">
                    Nom <span className="required">*</span>
                  </label>
                  <input
                    value={signupNom}
                    onChange={(e) => setSignupNom(e.target.value)}
                    placeholder="ex : Dupont"
                    required
                  />
                </>
              )}

              <label className="label">Email</label>
              <input
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                type="email"
                placeholder="ex : alex@exemple.com"
                required
              />

              <label className="label">Mot de passe</label>
              <input
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
                required
              />

              <button className="btn btnPrimary btnFull" type="submit">
                {authMode === "login" ? "Se connecter" : "Créer un compte"}
              </button>

              {authMode === "login" && (
                <>
                  <button
                    type="button"
                    className="linkBtn"
                    onClick={handleResetPassword}
                  >
                    Mot de passe oublié ?
                  </button>

                  {resetSent && (
                    <div className="smallOk">
                      Email de réinitialisation envoyé ✅
                    </div>
                  )}

                  <button
                    type="button"
                    className="linkBtn"
                    onClick={() => setAuthMode("signup")}
                  >
                    Créer un compte
                  </button>
                </>
              )}

              {authMode === "signup" && (
                <button
                  type="button"
                  className="linkBtn"
                  onClick={() => setAuthMode("login")}
                >
                  J’ai déjà un compte
                </button>
              )}
            </form>

            <div className="modalHint">
              Astuce : tu pourras activer la confirmation email dans Supabase.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
