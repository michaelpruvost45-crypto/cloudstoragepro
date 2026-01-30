import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import logo from "/logo.png";

export default function App() {
  const [session, setSession] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showThanks, setShowThanks] = useState(false);

  // Contact form
  const [contact, setContact] = useState({
    name: "",
    email: "",
    message: ""
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  /* =====================
     CONTACT (SUPABASE)
  ====================== */
  async function submitContact(e) {
    e.preventDefault();

    const { error } = await supabase.from("messages_contact").insert({
      name: contact.name,
      email: contact.email,
      message: contact.message
    });

    if (error) {
      alert("Erreur lors de l'envoi");
      return;
    }

    setContact({ name: "", email: "", message: "" });
    setShowThanks(true);
  }

  return (
    <>
      {/* HEADER */}
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
            <button className="btn-outline" onClick={() => setShowAuth(true)}>
              Connexion
            </button>
          ) : (
            <button
              className="btn-outline"
              onClick={() => supabase.auth.signOut()}
            >
              Déconnexion
            </button>
          )}
        </div>
      </header>

      {/* HERO */}
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
              <a href="#pricing" className="btn-primary">
                Voir les abonnements
              </a>
              {!session && (
                <button
                  className="btn-outline"
                  onClick={() => setShowAuth(true)}
                >
                  Connexion
                </button>
              )}
            </div>
          </div>

          <div className="hero-card">
            <h3>Cloud sécurisé</h3>
            <p>Synchronisation & sauvegarde</p>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="features" className="section-soft">
        <div className="container">
          <h2 className="section-title">Nos Services</h2>
          <div className="features-grid">
            <div className="card">☁️ Stockage évolutif</div>
            <div className="card">🔒 Sécurité avancée</div>
            <div className="card">⏱️ Accès 24/7</div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="section">
        <div className="container">
          <h2 className="section-title">Choisissez Votre Abonnement</h2>

          <div className="pricing-grid">
            <div className="price-card">
              <h3>Basique</h3>
              <p className="price">4,99€ / mois</p>
              <button className="btn-primary">S'inscrire</button>
            </div>

            <div className="price-card popular">
              <h3>Pro</h3>
              <p className="price">9,99€ / mois</p>
              <button className="btn-gold">Essayer</button>
            </div>

            <div className="price-card">
              <h3>Premium</h3>
              <p className="price">19,99€ / mois</p>
              <button className="btn-primary">S'inscrire</button>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="section-soft">
        <div className="container">
          <h2 className="section-title">Contactez-Nous</h2>

          <form className="contactForm" onSubmit={submitContact}>
            <input
              placeholder="Nom"
              required
              value={contact.name}
              onChange={(e) =>
                setContact({ ...contact, name: e.target.value })
              }
            />
            <input
              type="email"
              placeholder="Email"
              required
              value={contact.email}
              onChange={(e) =>
                setContact({ ...contact, email: e.target.value })
              }
            />
            <textarea
              placeholder="Message"
              rows="5"
              required
              value={contact.message}
              onChange={(e) =>
                setContact({ ...contact, message: e.target.value })
              }
            />
            <button type="submit" className="btn-primary">
              Envoyer
            </button>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        © {new Date().getFullYear()} CloudStoragePro — Tous droits réservés
      </footer>

      {/* AUTH MODAL */}
      {showAuth && (
        <div className="modal">
          <div className="modal-card">
            <button className="close" onClick={() => setShowAuth(false)}>
              ✕
            </button>
            <button
              className="btn-primary"
              onClick={() =>
                supabase.auth.signInWithOtp({
                  email: prompt("Votre email")
                })
              }
            >
              Connexion par email
            </button>
          </div>
        </div>
      )}

      {/* THANK YOU POPUP */}
      {showThanks && (
        <div className="modal">
          <div className="modal-card">
            <h3>Merci pour votre message 🙏</h3>
            <p>Nous vous répondrons rapidement.</p>
            <button className="btn-primary" onClick={() => setShowThanks(false)}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
}
