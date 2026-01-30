import "./styles.css";
import logo from "/logo.png";

function CloudHeroIllustration() {
  // Illustration type “CloudDrive” (SVG) — aucune image externe
  return (
    <svg
      className="heroSvg"
      viewBox="0 0 900 520"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Illustration cloud"
    >
      <defs>
        <linearGradient id="gSky" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2f74ff" stopOpacity="0.25" />
          <stop offset="1" stopColor="#bfe6ff" stopOpacity="0.18" />
        </linearGradient>

        <linearGradient id="gCloud" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e9f6ff" />
          <stop offset="1" stopColor="#bfe7ff" />
        </linearGradient>

        <linearGradient id="gCloudInner" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6bc4ff" />
          <stop offset="1" stopColor="#0f66c9" />
        </linearGradient>

        <linearGradient id="gServer" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2b7cff" />
          <stop offset="1" stopColor="#083b8a" />
        </linearGradient>

        <filter id="shadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="14" stdDeviation="14" floodColor="#003c83" floodOpacity="0.25" />
        </filter>

        <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="0.6" />
        </filter>
      </defs>

      {/* fond léger */}
      <rect x="0" y="0" width="900" height="520" fill="url(#gSky)" />

      {/* petits éléments flottants */}
      <g opacity="0.55" filter="url(#soft)">
        <rect x="70" y="70" rx="10" ry="10" width="90" height="70" fill="#d7f0ff" />
        <rect x="95" y="95" rx="8" ry="8" width="45" height="30" fill="#8fd0ff" />
        <rect x="220" y="110" rx="10" ry="10" width="110" height="80" fill="#d7f0ff" />
        <rect x="245" y="140" rx="8" ry="8" width="60" height="36" fill="#8fd0ff" />
        <rect x="640" y="90" rx="10" ry="10" width="120" height="86" fill="#d7f0ff" />
        <rect x="668" y="122" rx="8" ry="8" width="64" height="38" fill="#8fd0ff" />
        <circle cx="785" cy="220" r="28" fill="#d7f0ff" />
        <circle cx="785" cy="220" r="16" fill="#8fd0ff" />
      </g>

      {/* serveurs à gauche */}
      <g transform="translate(260,250)" filter="url(#shadow)">
        <g transform="translate(-120,60)">
          <rect x="0" y="0" rx="18" ry="18" width="210" height="150" fill="#bfe7ff" opacity="0.85" />
          <rect x="20" y="26" rx="12" ry="12" width="170" height="34" fill="url(#gServer)" />
          <rect x="20" y="76" rx="12" ry="12" width="170" height="34" fill="url(#gServer)" />
          <rect x="20" y="126" rx="12" ry="12" width="170" height="34" fill="url(#gServer)" />
          <circle cx="44" cy="43" r="6" fill="#ffd36a" />
          <circle cx="44" cy="93" r="6" fill="#7cffb5" />
          <circle cx="44" cy="143" r="6" fill="#ff7c7c" />
        </g>
      </g>

      {/* grand nuage */}
      <g transform="translate(420,160)" filter="url(#shadow)">
        <path
          d="M140 250
             C70 250, 30 205, 30 155
             C30 105, 65 70, 110 70
             C128 28, 170 0, 220 0
             C285 0, 338 48, 345 110
             C388 118, 420 155, 420 205
             C420 245, 392 270, 355 270
             L155 270
             C150 270, 145 265, 140 250Z"
          fill="url(#gCloud)"
        />

        {/* nuage intérieur */}
        <path
          d="M160 238
             C115 238, 92 210, 92 178
             C92 146, 113 122, 142 122
             C153 95, 180 78, 212 78
             C254 78, 289 109, 294 150
             C322 155, 344 180, 344 210
             C344 238, 324 256, 298 256
             L176 256
             C170 256, 165 251, 160 238Z"
          fill="url(#gCloudInner)"
          opacity="0.95"
        />

        {/* “disque” au centre */}
        <g transform="translate(205,140)">
          <rect x="0" y="26" width="130" height="72" rx="18" fill="#0b3d91" opacity="0.92" />
          <circle cx="65" cy="62" r="28" fill="#e9f6ff" opacity="0.95" />
          <circle cx="65" cy="62" r="10" fill="#0b3d91" />
          <rect x="18" y="112" width="94" height="16" rx="8" fill="#e9f6ff" opacity="0.85" />
          <circle cx="40" cy="120" r="4" fill="#0b3d91" opacity="0.9" />
          <circle cx="65" cy="120" r="4" fill="#0b3d91" opacity="0.9" />
          <circle cx="90" cy="120" r="4" fill="#0b3d91" opacity="0.9" />
        </g>
      </g>
    </svg>
  );
}

function ServiceIcon({ type }) {
  // petites icônes en SVG (cloud upload, shield, clock)
  if (type === "cloud") {
    return (
      <svg viewBox="0 0 64 64" className="svcIcon" aria-hidden="true">
        <defs>
          <linearGradient id="ig1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7bd3ff" />
            <stop offset="1" stopColor="#0f6fff" />
          </linearGradient>
        </defs>
        <path
          d="M25 48h24a11 11 0 0 0 0-22c-.7 0-1.4.1-2.1.2A16 16 0 0 0 16.4 21 10 10 0 0 0 25 48Z"
          fill="url(#ig1)"
          opacity="0.95"
        />
        <path
          d="M32 20l-9 10h6v12h6V30h6l-9-10Z"
          fill="#ffffff"
          opacity="0.95"
        />
      </svg>
    );
  }
  if (type === "lock") {
    return (
      <svg viewBox="0 0 64 64" className="svcIcon" aria-hidden="true">
        <defs>
          <linearGradient id="ig2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#9fe0ff" />
            <stop offset="1" stopColor="#0b3d91" />
          </linearGradient>
        </defs>
        <path
          d="M32 6c10 0 18 8 18 18v10h4v24H10V34h4V24c0-10 8-18 18-18Z"
          fill="url(#ig2)"
        />
        <path
          d="M22 34V24c0-5.5 4.5-10 10-10s10 4.5 10 10v10H22Z"
          fill="#ffffff"
          opacity="0.85"
        />
        <circle cx="32" cy="46" r="6" fill="#ffffff" />
        <rect x="30.7" y="46" width="2.6" height="8" rx="1.3" fill="#ffffff" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 64" className="svcIcon" aria-hidden="true">
      <defs>
        <linearGradient id="ig3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#bfe6ff" />
          <stop offset="1" stopColor="#0f6fff" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="22" fill="url(#ig3)" />
      <circle cx="32" cy="32" r="16" fill="#ffffff" opacity="0.95" />
      <path d="M32 18v14l10 6" stroke="#0b3d91" strokeWidth="4" strokeLinecap="round" />
      <circle cx="32" cy="32" r="3.5" fill="#0b3d91" />
    </svg>
  );
}

export default function App() {
  return (
    <>
      {/* ===== HEADER ===== */}
      <header className="topbar">
        <div className="container topbar-inner">
          <div className="brand">
            <img src={logo} alt="CloudStoragePro" className="brandLogo" />
            <span className="brandName">CloudStoragePro</span>
          </div>

          <nav className="nav">
            <a href="#home">Accueil</a>
            <a href="#features">Fonctionnalités</a>
            <a href="#pricing">Tarifs</a>
            <a href="#contact">Contact</a>
          </nav>

          <button className="btnTop">Connexion</button>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section className="hero" id="home">
        <div className="heroGlow" />
        <div className="heroCloudBottom" />

        <div className="container hero-grid">
          <div className="heroText">
            <h1>
              Stockage Cloud Sécurisé <br /> Pour Vos Données
            </h1>
            <p>
              Stockez et sauvegardez vos fichiers en toute sécurité sur notre
              plateforme de cloud.
            </p>

            <div className="hero-buttons">
              <button className="btnPrimary">Commencer Maintenant</button>
              <button className="btnGhost">En savoir plus</button>
            </div>
          </div>

          <div className="heroArt">
            <CloudHeroIllustration />
          </div>
        </div>
      </section>

      {/* ===== SERVICES ===== */}
      <section id="features" className="section services">
        <div className="container">
          <div className="sectionHeader">
            <span className="line" />
            <h2>Nos Services</h2>
            <span className="line" />
          </div>

          <div className="services-grid">
            <div className="service-card">
              <ServiceIcon type="cloud" />
              <h3>Stockage Évolutif</h3>
              <p>Espace extensible selon vos besoins</p>
            </div>

            <div className="service-card">
              <ServiceIcon type="lock" />
              <h3>Sécurité Avancée</h3>
              <p>Cryptage & protection de vos données</p>
            </div>

            <div className="service-card">
              <ServiceIcon type="time" />
              <h3>Accès 24/7</h3>
              <p>Accédez à vos fichiers à tout moment</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="section pricing">
        <div className="container">
          <div className="sectionHeader">
            <span className="line" />
            <h2>Choisissez Votre Abonnement</h2>
            <span className="line" />
          </div>

          <div className="pricing-grid">
            <div className="price-card">
              <h3>Basique</h3>
              <div className="price">
                <span className="euro">€</span>
                <span className="amount">4,99</span>
                <span className="per"> / mois</span>
              </div>

              <ul>
                <li>✓ 100 Go de stockage</li>
                <li>✓ Cryptage basique</li>
                <li>✓ Support standard</li>
              </ul>

              <button className="btnPrimary wide">S'INSCRIRE</button>
            </div>

            <div className="price-card pro">
              <div className="badge">Le Plus Populaire</div>

              <h3>Pro</h3>
              <div className="price">
                <span className="euro">€</span>
                <span className="amount">9,99</span>
                <span className="per"> / mois</span>
              </div>

              <ul>
                <li>✓ 1 To de stockage</li>
                <li>✓ Sauvegarde automatique</li>
                <li>✓ Sécurité renforcée</li>
              </ul>

              <button className="btnGold wide">ESSAYER</button>
            </div>

            <div className="price-card">
              <h3>Premium</h3>
              <div className="price">
                <span className="euro">€</span>
                <span className="amount">19,99</span>
                <span className="per"> / mois</span>
              </div>

              <ul>
                <li>✓ 5 To de stockage</li>
                <li>✓ Cryptage avancé</li>
                <li>✓ Support prioritaire</li>
              </ul>

              <button className="btnPrimary wide">S'INSCRIRE</button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CONTACT ===== */}
      <section id="contact" className="section contact">
        <div className="container">
          <div className="sectionHeader">
            <span className="line" />
            <h2>Contactez-Nous</h2>
            <span className="line" />
          </div>

          <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
            <input type="text" placeholder="Nom" required />
            <input type="email" placeholder="Email" required />
            <textarea placeholder="Message" rows="5" required />
            <button className="btnPrimary">Envoyer</button>
          </form>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="footer">© {new Date().getFullYear()} CloudStoragePro — Tous droits réservés</footer>
    </>
  );
}
