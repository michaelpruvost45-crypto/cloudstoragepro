import { useState } from "react";
import "./styles.css";
import logo from "/logo.png";

export default function App() {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <>
      {/* ===== HEADER ===== */}
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

          <button className="btn-outline" onClick={() => setShowLogin(true)}>
            Connexion
          </button>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section className="hero" id="home">
        <div className="container hero-grid">
          <div>
            <h1>
              Stockage Cloud Sécurisé <br /> Pour Vos Données
            </h1>
            <p>Sauvegardez et accédez à vos fichiers partout, en toute sécurité.</p>

            <div className="hero-buttons">
              <a href="#pricing" className="btn-primary">
                Voir les abonnements
              </a>
              <button className="btn-outline" onClick={() => setShowLogin(true)}>
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

      {/* ===== FEATURES ===== */}
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

      {/* ===== PRICING ===== */}
      <section id="pricing" className="section">
        <div className="container">
          <h2 className="section-title">Nos Abonnements</h2>

          <div className="pricing-grid">
            <div className="price-card">
              <h3>Basic</h3>
              <p className="price">
                4.99€<span>/mois</span>
              </p>
              <p>100 Go de stockage</p>
              <button className="btn-primary" onClick={() => setShowLogin(true)}>
                Choisir
              </button>
            </div>

            <div className="price-card">
              <h3>Pro</h3>
              <p className="price">
                9.99€<span>/mois</span>
              </p>
              <p>1 To de stockage</p>
              <button className="btn-primary" onClick={() => setShowLogin(true)}>
                Choisir
              </button>
            </div>

            <div className="price-card">
              <h3>Premium</h3>
              <p className="price">
                19.99€<span>/mois</span>
              </p>
              <p>3 To de stockage</p>
              <button className="btn-primary" onClick={() => setShowLogin(true)}>
                Choisir
              </button>
            </div>
          </div>

          <p style={{ textAlign: "center", marginTop: 14, opacity: 0.7 }}>
            Note : Connecte-toi pour choisir une offre.
          </p>
        </div>
      </section>

      {/* ===== CONTACT ===== */}
      <section id="contact" className="contact-page">
        <h2 className="section-title">Contactez-Nous</h2>

        <form
          className="contactForm"
          action="https://formsubmit.co/contact@michaelcreation.fr"
          method="POST"
        >
          <input type="hidden" name="_captcha" value="false" />
          <input
            type="hidden"
            name="_next"
            value="https://cloudstoragepro.vercel.app/merci.html"
          />

          <input name="name" placeholder="Nom" required />
          <input name="email" type="email" placeholder="Email" required />
          <textarea name="message" placeholder="Message" rows="5" required />

          <button type="submit">Envoyer</button>
        </form>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="footer">
        © {new Date().getFullYear()} CloudStoragePro — Tous droits réservés
      </footer>

      {/* ===== LOGIN POPUP ===== */}
      {showLogin && (
        <div className="modalOverlay" onClick={() => setShowLogin(false)}>
          <div className="modalBox" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <div className="modalBrand">
                <img src={logo} alt="CloudStoragePro" />
                <div>
                  <strong>CloudStoragePro</strong>
                  <div className="modalSub">Espace client</div>
                </div>
              </div>
              <button className="modalClose" onClick={() => setShowLogin(false)}>
                ✕
              </button>
            </div>

            <h3 className="modalTitle">Connexion</h3>

            {/* Pour l’instant on met juste un formulaire visuel */}
            <input className="modalInput" placeholder="Email" type="email" />
            <input className="modalInput" placeholder="Mot de passe" type="password" />

            <button className="btn-primary modalBtn" onClick={() => alert("Login à brancher (Supabase) ensuite")}>
              Se connecter
            </button>

            <div className="modalLinks">
              <button type="button" className="linkBtn" onClick={() => alert("À brancher ensuite")}>
                Mot de passe oublié ?
              </button>
              <button type="button" className="linkBtn" onClick={() => alert("Inscription à brancher ensuite")}>
                Créer un compte
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
