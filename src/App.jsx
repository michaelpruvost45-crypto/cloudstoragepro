export default function App() {
  return (
    <>
      <Header />
      <Hero />
      <Services />
      <Pricing />
      <Contact />
      <Footer />
    </>
  );
}

function Header() {
  return (
    <header className="topbar">
      <div className="container topbar__inner">
        <div className="brand">
          <img src="/logo.png" className="brand__logo" alt="logo" />
          <span className="brand__name">CloudStoragePro</span>
        </div>

        <nav className="nav">
          <a href="#top">Accueil</a>
          <a href="#services">Fonctionnalités</a>
          <a href="#pricing">Tarifs</a>
          <a href="#contact">Contact</a>
        </nav>

        <a className="btn btn--light" href="#contact">Connexion</a>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section id="top" className="hero">
      <div className="container hero__inner">
        <div className="hero__left">
          <h1>
            Stockage Cloud Sécurisé <br />
            Pour Vos Données
          </h1>
          <p>
            Stockez et sauvegardez vos fichiers en toute sécurité
            sur notre plateforme CloudStoragePro.
          </p>

          <div className="hero__cta">
            <a href="#pricing" className="btn btn--primary">Commencer Maintenant</a>
            <a href="#services" className="btn btn--ghost">En savoir plus</a>
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
              <div className="heroCard__sub">Sauvegarde & synchronisation</div>
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
    <section id="services" className="section">
      <h2 className="section__title">Nos Services</h2>
      <div className="container grid3">
        {items.map((it) => (
          <div className="serviceCard" key={it.title}>
            <div className="serviceCard__icon">{it.icon}</div>
            <div className="serviceCard__title">{it.title}</div>
            <div className="serviceCard__desc">{it.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Pricing() {
  const plans = [
    {
      name: "Basique",
      price: "4,99",
      storage: "100 Go",
      features: ["Stockage 100 Go", "Cryptage basique", "Support standard"],
      cta: "S'INSCRIRE",
    },
    {
      name: "Pro",
      price: "9,99",
      storage: "1 To",
      features: ["Stockage 1 To", "Sauvegarde automatique", "Sécurité renforcée"],
      cta: "ESSAYER",
      highlight: true,
      badge: "Le Plus Populaire",
    },
    {
      name: "Premium",
      price: "19,99",
      storage: "3 To",
      features: ["Stockage 3 To", "Cryptage avancé", "Support prioritaire"],
      cta: "S'INSCRIRE",
    },
  ];

  return (
    <section id="pricing" className="section section--soft">
      <h2 className="section__title">Choisissez Votre Abonnement</h2>
      <div className="container pricingGrid">
        {plans.map((p) => (
          <div key={p.name} className={`priceCard ${p.highlight ? "priceCard--pro" : ""}`}>
            {p.badge && <div className="priceCard__badge">{p.badge}</div>}
            <div className="priceCard__name">{p.name}</div>
            <div className="priceCard__price">
              <span className="priceCard__currency">€</span>
              <span className="priceCard__amount">{p.price}</span>
              <span className="priceCard__per"> /mois</span>
            </div>
            <ul className="priceCard__list">
              {p.features.map((f) => <li key={f}>✓ {f}</li>)}
            </ul>
            <a href="#contact" className={`btn ${p.highlight ? "btn--gold" : "btn--primary"} btn--full`}>
              {p.cta}
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="contact" className="section">
      <h2 className="section__title">Contactez-nous</h2>
      <form className="contactForm">
        <input className="input" placeholder="Nom" />
        <input className="input" placeholder="Email" />
        <textarea className="textarea" placeholder="Message" />
        <button className="btn btn--primary btn--center">Envoyer</button>
      </form>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      © {new Date().getFullYear()} CloudStoragePro — Tous droits réservés
    </footer>
  );
}
