import "./styles.css";
import logo from "/logo.png";

export default function App() {
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

          <button className="btn-outline">Connexion</button>
        </div>
      </header>

      {/* ===== HERO ===== */}
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
              <button className="btn-outline">Connexion</button>
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
              <p className="price">4.99€<span>/mois</span></p>
              <p>100 Go de stockage</p>
              <button className="btn-primary">Choisir</button>
            </div>

            <div className="price-card popular">
              <h3>Pro</h3>
              <p className="price">9.99€<span>/mois</span></p>
              <p>1 To de stockage</p>
              <button className="btn-primary">Choisir</button>
            </div>

            <div className="price-card">
              <h3>Premium</h3>
              <p className="price">19.99€<span>/mois</span></p>
              <p>3 To de stockage</p>
              <button className="btn-primary">Choisir</button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CONTACT (FormSubmit) ===== */}
      <section id="contact" className="section-soft">
        <div className="container">
          <h2 className="section-title">Contactez-nous</h2>

          <form
            className="contactForm"
            action="https://formsubmit.co/contact@michaelcreation.fr"
            method="POST"
          >
            {/* Désactive captcha */}
            <input type="hidden" name="_captcha" value="false" />

            {/* Redirection après envoi */}
            <input
              type="hidden"
              name="_next"
              value="https://TON-SITE.vercel.app/merci.html"
            />

            <input
              type="text"
              name="name"
              placeholder="Votre nom"
              required
            />

            <input
              type="email"
              name="email"
              placeholder="Votre email"
              required
            />

            <textarea
              name="message"
              placeholder="Votre message"
              required
            ></textarea>

            <button type="submit">Envoyer</button>
          </form>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="footer">
        © {new Date().getFullYear()} CloudStoragePro — Tous droits réservés
      </footer>
    </>
  );
}
