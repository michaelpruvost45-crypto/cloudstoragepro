import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import "./styles.css";

export default function App() {
  const [session, setSession] = useState(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <>
      <Header
        session={session}
        onLogin={() => setShowAuth(true)}
        onLogout={() => supabase.auth.signOut()}
      />

      <Hero onLogin={() => setShowAuth(true)} />

      {session ? <ClientArea session={session} /> : <Services />}

      <Pricing onLogin={() => setShowAuth(true)} />
      <Contact />
      <Footer />

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}

/* ================= HEADER ================= */
function Header({ session, onLogin, onLogout }) {
  return (
    <header className="topbar">
      <div className="container nav">
        <div className="logo">☁️ CloudStoragePro</div>
        <nav>
          <a href="#">Accueil</a>
          <a href="#services">Fonctionnalités</a>
          <a href="#pricing">Tarifs</a>
          <a href="#contact">Contact</a>
        </nav>
        {!session ? (
          <button className="btn white" onClick={onLogin}>Connexion</button>
        ) : (
          <button className="btn white" onClick={onLogout}>Déconnexion</button>
        )}
      </div>
    </header>
  );
}

/* ================= HERO ================= */
function Hero({ onLogin }) {
  return (
    <section className="hero">
      <div className="container hero-grid">
        <div>
          <h1>Stockage Cloud Sécurisé<br />Pour Vos Données</h1>
          <p>Stockez et sauvegardez vos fichiers en toute sécurité.</p>
          <div className="actions">
            <a href="#pricing" className="btn primary">Voir les abonnements</a>
            <button className="btn outline" onClick={onLogin}>Connexion</button>
          </div>
        </div>
        <div className="hero-cloud">☁️</div>
      </div>
    </section>
  );
}

/* ================= SERVICES ================= */
function Services() {
  return (
    <section id="services" className="section">
      <h2>Nos Services</h2>
      <div className="cards">
        <div className="card">☁️ Stockage évolutif</div>
        <div className="card">🔒 Sécurité avancée</div>
        <div className="card">⏱️ Accès 24/7</div>
      </div>
    </section>
  );
}

/* ================= PRICING ================= */
function Pricing({ onLogin }) {
  return (
    <section id="pricing" className="section soft">
      <h2>Choisissez Votre Abonnement</h2>
      <div className="pricing">
        <Price title="Basique" price="4,99€" />
        <Price title="Pro" price="9,99€" highlight />
        <Price title="Premium" price="19,99€" />
      </div>
      <p className="note">Connectez-vous pour souscrire</p>
      <button className="btn primary" onClick={onLogin}>Connexion</button>
    </section>
  );
}

function Price({ title, price, highlight }) {
  return (
    <div className={`price-card ${highlight ? "pro" : ""}`}>
      <h3>{title}</h3>
      <div className="price">{price}/mois</div>
      <button className="btn primary">S'inscrire</button>
    </div>
  );
}

/* ================= CLIENT ================= */
function ClientArea({ session }) {
  return (
    <section className="section soft">
      <h2>Espace client</h2>
      <p>Bienvenue {session.user.email}</p>
      <p>Statut : Connecté ✅</p>
      <p>Abonnement : Pro</p>
      <div className="info">
        ℹ️ Demande envoyée à l’équipe technique.
      </div>
    </section>
  );
}

/* ================= CONTACT ================= */
function Contact() {
  return (
    <section id="contact" className="section">
      <h2>Contactez-Nous</h2>
      <form className="contact">
        <input placeholder="Nom" />
        <input placeholder="Email" />
        <textarea placeholder="Message" />
        <button className="btn primary">Envoyer</button>
      </form>
    </section>
  );
}

/* ================= AUTH MODAL ================= */
function AuthModal({ onClose }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function login(e) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMsg(error.message);
    else onClose();
  }

  return (
    <div className="modal">
      <div className="modal-box">
        <button className="close" onClick={onClose}>✕</button>
        <h3>Connexion</h3>
        <form onSubmit={login}>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mot de passe" />
          <button className="btn primary">Se connecter</button>
        </form>
        {msg && <p className="error">{msg}</p>}
      </div>
    </div>
  );
}

/* ================= FOOTER ================= */
function Footer() {
  return <footer>© {new Date().getFullYear()} CloudStoragePro</footer>;
}
