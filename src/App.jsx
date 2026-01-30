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
              Stockez et sauvegardez vos fichiers en toute sécurité sur notre
              plateforme cloud.
            </p>

            <div className="hero-buttons">
              <button className="btn-primary">Commencer Maintenant</button>
              <button className="btn-outline">En savoir plus</button>
            </div>
          </div>

          <div className="hero-illustration">
            <img src="/cloud.png" alt="cloud illustration" />
          </div>
        </div>
      </section>

      {/* ===== SERVICES ===== */}
      <section id="features" className="section">
        <h2 className="section-title">Nos Services</h2>

        <div className="services-grid">
          <div className="service-card">
            <img src="/icon-cloud.png" alt="" />
            <h3>Stockage Évolutif</h3>
            <p>Espace extensible selon vos besoins</p>
          </div>

          <div className="service-card">
            <img src="/icon-lock.png" alt="" />
            <h3>Sécurité Avancée</h3>
            <p>Cryptage & protection de vos données</p>
          </div>

          <div className="service-card">
            <img src="/icon-time.png" alt="" />
            <h3>Accès 24/7</h3>
            <p>Accédez à vos fichiers à tout moment</p>
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="section-soft">
        <h2 className="section-title">Choisissez Votre Abonnement</h2>

        <div className="pricing-grid">
          <div className="price-card">
            <h3>Basique</h3>
            <p className="price">€4,99 / mois</p>
            <ul>
              <li>✓ 100 Go de stockage</li>
              <li>✓ Cryptage basique</li>
              <li>✓ Support standard</li>
            </ul>
            <button className="btn-primary">S'inscrire</button>
          </div>

          <div className="price-card popular">
            <div className="badge">Le Plus Populaire</div>
            <h3>Pro</h3>
            <p className="price">€9,99 / mois</p>
            <ul>
              <li>✓ 1 To de stockage</li>
              <li>✓ Sauvegarde automatique</li>
              <li>✓ Sécurité renforcée</li>
            </ul>
            <button className="btn-gold">Essayer</button>
          </div>

          <div className="price-card">
            <h3>Premium</h3>
            <p className="price">€19,99 / mois</p>
            <ul>
              <li>✓ 5 To de stockage</li>
              <li>✓ Cryptage avancé</li>
              <li>✓ Support prioritaire</li>
            </ul>
            <button className="btn-primary">S'inscrire</button>
          </div>
        </div>
      </section>

      {/* ===== CONTACT ===== */}
      <section id="contact" className="section">
        <h2 className="section-title">Contactez-Nous</h2>

        <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
          <input type="text" placeholder="Nom" required />
          <input type="email" placeholder="Email" required />
          <textarea placeholder="Message" rows="5" required />
          <button className="btn-primary">Envoyer</button>
        </form>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="footer">
        © {new Date().getFullYear()} CloudStoragePro — Tous droits réservés
      </footer>
    </>
  );
}
