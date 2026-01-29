import "./styles.css";
import logo from "/logo.png";

export default function App() {
  return (
    <>
      {/* ===== HEADER ===== */}
      <header className="topbar">
        <div className="container topbar-inner">
          <div className="logo">
            <img src={logo} alt="CloudDrive" />
            <span>CloudDrive</span>
          </div>

          <nav>
            <a href="#home">Accueil</a>
            <a href="#features">Fonctionnalités</a>
            <a href="#pricing">Tarifs</a>
            <a href="/contact">Contact</a>
          </nav>

          <button className="btn-outline">Connexion</button>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section className="hero" id="home">
        <div className="container hero-grid">
          <div className="hero-text">
            <h1>
              Stockage Cloud Sécurisé <br /> Pour Vos Données
            </h1>
            <p>
              Stockez et sauvegardez vos fichiers en toute sécurité sur notre
              plateforme cloud.
            </p>

            <div className="hero-buttons">
              <button className="btn-primary">Commencer maintenant</button>
              <button className="btn-outline-light">En savoir plus</button>
            </div>
          </div>

          <div className="hero-image">
            <img src="/hero-cloud.png" alt="Cloud illustration" />
          </div>
        </div>
      </section>

      {/* ===== SERVICES ===== */}
      <section id="features" className="services">
        <div className="container">
          <h2>Nos Services</h2>

          <div className="services-grid">
            <div className="service-card">
              <img src="/icon-storage.png" alt="" />
              <h3>Stockage Évolutif</h3>
              <p>Espace extensible selon vos besoins</p>
            </div>

            <div className="service-card">
              <img src="/icon-security.png" alt="" />
              <h3>Sécurité Avancée</h3>
              <p>Cryptage & protection de vos données</p>
            </div>

            <div className="service-card">
              <img src="/icon-access.png" alt="" />
              <h3>Accès 24/7</h3>
              <p>Accédez à vos fichiers à tout moment</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="pricing">
        <div className="container">
          <h2>Choisissez Votre Abonnement</h2>

          <div className="pricing-grid">
            <div className="price-card">
              <h3>Basique</h3>
              <p className="price">4,99€ <span>/mois</span></p>
              <ul>
                <li>✔ 100 Go de stockage</li>
                <li>✔ Cryptage basique</li>
                <li>✔ Support standard</li>
              </ul>
              <button className="btn-primary">S'inscrire</button>
            </div>

            <div className="price-card popular">
              <div className="badge">Le plus populaire</div>
              <h3>Pro</h3>
              <p className="price">9,99€ <span>/mois</span></p>
              <ul>
                <li>✔ 1 To de stockage</li>
                <li>✔ Sauvegarde automatique</li>
                <li>✔ Sécurité renforcée</li>
              </ul>
              <button className="btn-gold">Essayer</button>
            </div>

            <div className="price-card">
              <h3>Premium</h3>
              <p className="price">19,99€ <span>/mois</span></p>
              <ul>
                <li>✔ 5 To de stockage</li>
                <li>✔ Cryptage avancé</li>
                <li>✔ Support prioritaire</li>
              </ul>
              <button className="btn-primary">S'inscrire</button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="footer">
        © {new Date().getFullYear()} CloudDrive — Tous droits réservés
      </footer>
    </>
  );
}
