import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import "./styles.css";

export default function App() {
  const [session, setSession] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // login | signup | forgot
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage(error.message);
    else setAuthOpen(false);
  }

  async function handleSignup(e) {
    e.preventDefault();
    setMessage("");
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setMessage(error.message);
    else setMessage("✅ Vérifie ton email pour activer ton compte");
  }

  async function handleForgot(e) {
    e.preventDefault();
    setMessage("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) setMessage(error.message);
    else setMessage("📩 Email de réinitialisation envoyé");
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  return (
    <>
      {/* HEADER */}
      <header className="topbar">
        <div className="container topbar-inner">
          <div className="logo">☁️ CloudStoragePro</div>
          <nav>
            <a href="#home">Accueil</a>
            <a href="#services">Fonctionnalités</a>
            <a href="#pricing">Tarifs</a>
            <a href="#contact">Contact</a>
          </nav>

          {!session ? (
            <button className="btn-outline" onClick={() => setAuthOpen(true)}>
              Connexion
            </button>
          ) : (
            <button className="btn-outline" onClick={logout}>
              Déconnexion
            </button>
          )}
        </div>
      </header>

      {/* HERO */}
      <section className="hero" id="home">
        <div className="container hero-grid">
          <div>
            <h1>Stockage Cloud Sécurisé<br />Pour Vos Données</h1>
            <p>Stockez et sauvegardez vos fichiers en toute sécurité.</p>
            <div className="hero-buttons">
              <a href="#pricing" className="btn-primary">Voir les abonnements</a>
              {!session && (
                <button className="btn-outline" onClick={() => setAuthOpen(true)}>
                  Connexion
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="section-soft">
        <div className="container">
          <h2>Nos Services</h2>
          <div className="features-grid">
            <div className="card">🔒 Sécurité maximale</div>
            <div className="card">☁️ Stockage évolutif</div>
            <div className="card">⏱️ Accès 24/7</div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="section">
        <div className="container">
          <h2>Choisissez Votre Abonnement</h2>
          <div className="pricing-grid">
            <div className="price-card">
              <h3>Basique</h3>
              <p className="price">4.99€ / mois</p>
              <button className="btn-primary">S’inscrire</button>
            </div>
            <div className="price-card popular">
              <h3>Pro</h3>
              <p className="price">9.99€ / mois</p>
              <button className="btn-primary">Essayer</button>
            </div>
            <div className="price-card">
              <h3>Premium</h3>
              <p className="price">19.99€ / mois</p>
              <button className="btn-primary">S’inscrire</button>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="section-soft">
        <div className="container">
          <h2>Contactez-Nous</h2>
          <form className="contactForm">
            <input placeholder="Nom" />
            <input placeholder="Email" />
            <textarea placeholder="Message" rows="5" />
            <button className="btn-primary">Envoyer</button>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        © {new Date().getFullYear()} CloudStoragePro
      </footer>

      {/* AUTH MODAL */}
      {authOpen && (
        <div className="modalOverlay">
          <div className="modal">
            <button className="close" onClick={() => setAuthOpen(false)}>✖</button>

            <h3>
              {authMode === "login"
                ? "Connexion"
                : authMode === "signup"
                ? "Créer un compte"
                : "Mot de passe oublié"}
            </h3>

            <form
              onSubmit={
                authMode === "login"
                  ? handleLogin
                  : authMode === "signup"
                  ? handleSignup
                  : handleForgot
              }
            >
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              {authMode !== "forgot" && (
                <input
                  type="password"
                  placeholder="Mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              )}

              <button className="btn-primary">
                {authMode === "login"
                  ? "Se connecter"
                  : authMode === "signup"
                  ? "Créer le compte"
                  : "Envoyer"}
              </button>
            </form>

            <div className="authLinks">
              {authMode === "login" && (
                <>
                  <button onClick={() => setAuthMode("forgot")}>
                    Mot de passe oublié ?
                  </button>
                  <button onClick={() => setAuthMode("signup")}>
                    Créer un compte
                  </button>
                </>
              )}

              {(authMode === "signup" || authMode === "forgot") && (
                <button onClick={() => setAuthMode("login")}>
                  Retour à la connexion
                </button>
              )}
            </div>

            {message && <p className="msg">{message}</p>}
          </div>
        </div>
      )}
    </>
  );
}
