import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";

export default function App() {
  const [openAuth, setOpenAuth] = useState(false);
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session || null));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession || null);
    });

    return () => sub?.subscription?.unsubscribe?.();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
  }

  return (
    <div>
      <Header
        isLoggedIn={!!session}
        userEmail={session?.user?.email || ""}
        onOpenAuth={() => setOpenAuth(true)}
        onLogout={logout}
      />

      <Hero onOpenAuth={() => setOpenAuth(true)} />
      <Services />
      <Pricing onOpenAuth={() => setOpenAuth(true)} />
      <Contact />
      <Footer />

      {openAuth && (
        <AuthModal
          onClose={() => setOpenAuth(false)}
          onLoggedIn={() => setOpenAuth(false)}
        />
      )}
    </div>
  );
}

function Header({ isLoggedIn, userEmail, onOpenAuth, onLogout }) {
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
            <span className="userBox__email">{userEmail}</span>
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
          <p>
            Stockez et sauvegardez vos fichiers en toute sécurité sur notre
            plateforme CloudStoragePro.
          </p>

          <div className="hero__cta">
            <a className="btn btn--primary" href="#pricing">Voir les abonnements</a>
            <button className="btn btn--ghost" onClick={onOpenAuth}>Connexion</button>
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

function Services() {
  const items = [
    { title: "Stockage Évolutif", desc: "Espace extensible selon vos besoins", icon: "☁️" },
    { title: "Sécurité Avancée", desc: "Cryptage & protection de vos données", icon: "🛡️" },
    { title: "Accès 24/7", desc: "Accédez à vos fichiers à tout moment", icon: "⏱️" },
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

function Pricing({ onOpenAuth }) {
  const plans = useMemo(
    () => [
      {
        name: "Basique",
        price: "4,99",
        per: "/ mois",
        features: ["100 Go de stockage", "Cryptage basique", "Support standard"],
        cta: "S'INSCRIRE",
        highlight: false,
      },
      {
        name: "Pro",
        price: "9,99",
        per: "/ mois",
        features: ["1 To de stockage", "Sauvegarde automatique", "Sécurité renforcée"],
        cta: "ESSAYER",
        highlight: true,
        badge: "Le Plus Populaire",
      },
      {
        name: "Premium",
        price: "19,99",
        per: "/ mois",
        features: ["3 To de stockage", "Cryptage avancé", "Support prioritaire"],
        cta: "S'INSCRIRE",
        highlight: false,
      },
    ],
    []
  );

  return (
    <section id="pricing" className="section section--soft">
      <div className="container">
        <h2 className="section__title">Choisissez Votre Abonnement</h2>

        <div className="pricingGrid">
          {plans.map((p) => (
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
                onClick={onOpenAuth}
              >
                {p.cta}
              </button>
            </div>
          ))}
        </div>

        <div className="note">
          <strong>Note :</strong> Pour l’instant, le bouton ouvre la connexion. Le paiement (Stripe/PayPal) sera ajouté ensuite.
        </div>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="contact" className="section">
      <div className="container">
        <h2 className="section__title">Contactez-Nous</h2>

        <form className="contactForm" onSubmit={(e) => e.preventDefault()}>
          <input className="input" placeholder="Nom" />
          <input className="input" placeholder="Email" />
          <textarea className="textarea" placeholder="Message" rows={5} />
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
   AUTH MODAL (SUPABASE)
   ========================= */

function AuthModal({ onClose, onLoggedIn }) {
  return (
    <div className="modalOverlay" role="dialog" aria-modal="true">
      <div className="modalCard">
        <button className="modalClose" onClick={onClose} aria-label="Fermer">✕</button>
        <AuthForm onLoggedIn={onLoggedIn} />
      </div>
    </div>
  );
}

function AuthForm({ onLoggedIn }) {
  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      if (!email || !password) throw new Error("Ajoute un email et un mot de passe.");

      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMsg("✅ Compte créé. Tu peux maintenant te connecter.");
        setMode("login");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data?.session) onLoggedIn();
      }
    } catch (err) {
      setMsg("❌ " + (err?.message || "Erreur"));
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

      <h3 className="authTitle">{mode === "login" ? "Connexion" : "Créer un compte"}</h3>

      <form onSubmit={submit}>
        <label className="authLabel">
          Email
          <input
            className="authInput"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ex: michael@email.com"
          />
        </label>

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

        <button className="btn btn--primary btn--full" type="submit" disabled={loading}>
          {loading ? "Patiente..." : mode === "login" ? "Se connecter" : "Créer mon compte"}
        </button>
      </form>

      {msg && <div className="authMsg">{msg}</div>}

      <button
        className="authSwitch"
        onClick={() => {
          setMsg("");
          setMode(mode === "login" ? "signup" : "login");
        }}
        type="button"
      >
        {mode === "login" ? "Créer un compte" : "J’ai déjà un compte"}
      </button>

      <div className="authHint">
        Astuce : tu pourras activer la confirmation email dans Supabase plus tard.
      </div>
    </div>
  );
}
