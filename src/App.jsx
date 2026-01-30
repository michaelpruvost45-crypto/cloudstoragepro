import { useEffect, useState } from "react";
import "./styles.css";
import { supabase } from "./supabaseClient";
import logo from "/logo.png";

/* =====================
   APP
===================== */

export default function App() {
  const [session, setSession] = useState(null);
  const [openAuth, setOpenAuth] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
  }

  return (
    <>
      <Header
        session={session}
        onLogin={() => setOpenAuth(true)}
        onLogout={logout}
      />

      <Hero onLogin={() => setOpenAuth(true)} />

      <Features />

      <Pricing session={session} onLogin={() => setOpenAuth(true)} />

      <Contact />

      <Footer />

      {openAuth && (
        <AuthModal onClose={() => setOpenAuth(false)} />
      )}
    </>
  );
}

/* =====================
   HEADER
===================== */

function Header({ session, onLogin, onLogout }) {
  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <div className="logo">
          <img src={logo} alt="CloudStoragePro" />
          <span>CloudStoragePro</span>
        </div>

        <nav>
          <a href="#home">Accueil</a>
          <a href="#features">Fonctionnalités</a>
          <a href="#pricing">Tarifs</a>
          <a href="#contact">Contact</a>
        </nav>

        {!session ? (
          <button className="btn-outline" onClick={onLogin}>
            Connexion
          </button>
        ) : (
          <button className="btn-outline" onClick={onLogout}>
            Déconnexion
          </button>
        )}
      </div>
    </header>
  );
}

/* =====================
   HERO
===================== */

function Hero({ onLogin }) {
  return (
    <section className="hero" id="home">
      <div className="container hero-grid">
        <div>
          <h1>
            Stockage Cloud Sécurisé <br /> Pour Vos Données
          </h1>
          <p>
            Sauvegardez et accédez à vos fichiers partout, en toute sécurité.
          </p>

          <div className="hero-buttons">
            <a href="#pricing" className="btn-primary">
              Voir les abonnements
            </a>
            <button className="btn-outline" onClick={onLogin}>
              Connexion
            </button>
          </div>
        </div>

        <div className="hero-card">
          <img src={logo} alt="logo" className="hero-logo" />
          <h3>Cloud sécurisé</h3>
          <p>Synchronisation & sauvegarde</p>
        </div>
      </div>
    </section>
  );
}

/* =====================
   FEATURES
===================== */

function Features() {
  return (
    <section id="features" className="section-soft">
      <div className="container">
        <h2 className="section-title">Pourquoi CloudStoragePro ?</h2>

        <div className="features-grid">
          <div className="card">🔒 Sécurité maximale</div>
          <div className="card">☁️ Stockage cloud privé</div>
          <div className="card">⚡ Accès rapide partout</div>
          <div className="card">💾 Sauvegarde automatique</div>
        </div>
      </div>
    </section>
  );
}

/* =====================
   PRICING
===================== */

function Pricing({ session, onLogin }) {
  return (
    <section id="pricing" className="section">
      <div className="container">
        <h2 className="section-title">Nos Abonnements</h2>

        <div className="pricing-grid">
          <PriceCard
            title="Basic"
            price="4.99€"
            desc="100 Go de stockage"
            session={session}
            onLogin={onLogin}
          />
          <PriceCard
            title="Pro"
            price="9.99€"
            desc="1 To de stockage"
            highlight
            session={session}
            onLogin={onLogin}
          />
          <PriceCard
            title="Premium"
            price="19.99€"
            desc="3 To de stockage"
            session={session}
            onLogin={onLogin}
          />
        </div>
      </div>
    </section>
  );
}

function PriceCard({ title, price, desc, highlight, session, onLogin }) {
  return (
    <div className={`price-card ${highlight ? "popular" : ""}`}>
      <h3>{title}</h3>
      <p className="price">{price}<span>/mois</span></p>
      <p>{desc}</p>

      {!session ? (
        <button className="btn-primary" onClick={onLogin}>
          Connexion requise
        </button>
      ) : (
        <button className="btn-primary">
          Choisir
        </button>
      )}
    </div>
  );
}

/* =====================
   CONTACT (FormSubmit)
===================== */

function Contact() {
  return (
    <section id="contact" className="section-soft">
      <div className="container">
        <h2 className="section-title">Nous contacter</h2>

        <form
          className="contactForm"
          action="https://formsubmit.co/contact@michaelcreation.fr"
          method="POST"
        >
          <input type="hidden" name="_captcha" value="false" />
          <input type="hidden" name="_subject" value="Nouveau message CloudStoragePro" />

          <input name="name" placeholder="Nom" required />
          <input name="email" type="email" placeholder="Email" required />
          <textarea name="message" placeholder="Message" rows="5" required />

          <button type="submit" className="btn-primary">
            Envoyer
          </button>
        </form>
      </div>
    </section>
  );
}

/* =====================
   FOOTER
===================== */

function Footer() {
  return (
    <footer className="footer">
      © {new Date().getFullYear()} CloudStoragePro — Tous droits réservés
    </footer>
  );
}

/* =====================
   AUTH MODAL
===================== */

function AuthModal({ onClose }) {
  return (
    <div className="modal">
      <div className="modal-card">
        <button className="modal-close" onClick={onClose}>×</button>

        <h3>Connexion</h3>

        <AuthForm onSuccess={onClose} />
      </div>
    </div>
  );
}

function AuthForm({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function login(e) {
    e.preventDefault();
    setMsg("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setMsg(error.message);
    } else {
      onSuccess();
    }
  }

  return (
    <form onSubmit={login}>
      <input
        type="email"
        placeholder="Email"
        required
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Mot de passe"
        required
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <button className="btn-primary" type="submit">
        Se connecter
      </button>
      {msg && <p className="error">{msg}</p>}
    </form>
  );
}
