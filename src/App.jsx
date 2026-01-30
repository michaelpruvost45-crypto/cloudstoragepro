import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="loading">Chargement…</div>;
  }

  return (
    <>
      <Header session={session} />
      <Hero />
      {session ? <ClientArea session={session} /> : <GuestInfo />}
      <Services />
      <Pricing />
      <Contact />
      <Footer />
    </>
  );
}

/* ================= HEADER ================= */

function Header({ session }) {
  async function logout() {
    await supabase.auth.signOut();
  }

  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <div className="logo">CloudStoragePro</div>

        <nav>
          <a href="#top">Accueil</a>
          <a href="#services">Fonctionnalités</a>
          <a href="#pricing">Tarifs</a>
          <a href="#contact">Contact</a>
        </nav>

        {session ? (
          <button className="btn light" onClick={logout}>
            Déconnexion
          </button>
        ) : (
          <a className="btn light" href="/login">
            Connexion
          </a>
        )}
      </div>
    </header>
  );
}

/* ================= HERO ================= */

function Hero() {
  return (
    <section className="hero" id="top">
      <div className="container hero-grid">
        <div>
          <h1>Stockage Cloud Sécurisé<br />Pour Vos Données</h1>
          <p>
            Stockez et sauvegardez vos fichiers en toute sécurité sur
            CloudStoragePro.
          </p>
          <div className="hero-actions">
            <a href="#pricing" className="btn primary">Voir les abonnements</a>
            <a href="/login" className="btn outline">Connexion</a>
          </div>
        </div>

        <div className="hero-card">
          <h3>Cloud sécurisé</h3>
          <p>Synchronisation & sauvegarde</p>
        </div>
      </div>
    </section>
  );
}

/* ================= CLIENT ================= */

function ClientArea({ session }) {
  return (
    <section className="section soft">
      <div className="container">
        <div className="client-card">
          <h2>Espace client</h2>
          <p>
            Bienvenue <strong>{session.user.email}</strong>
          </p>

          <div className="status-grid">
            <div className="status-box">
              <span>Abonnement</span>
              <strong>Aucun</strong>
            </div>
            <div className="status-box">
              <span>Statut</span>
              <strong>Connecté ✅</strong>
            </div>
          </div>

          <div className="client-actions">
            <button className="btn primary">Modifier mon profil</button>
            <button className="btn outline">Mes fichiers (bientôt)</button>
          </div>
        </div>
      </div>
    </section>
  );
}

function GuestInfo() {
  return (
    <section className="section soft">
      <div className="container center">
        <h2>Espace client</h2>
        <p>Connectez-vous pour accéder à votre espace personnel.</p>
        <a href="/login" className="btn primary">Se connecter</a>
      </div>
    </section>
  );
}

/* ================= SERVICES ================= */

function Services() {
  return (
    <section className="section" id="services">
      <div className="container">
        <h2 className="center">Nos Services</h2>
        <div className="grid3">
          <div className="card">☁️ Stockage évolutif</div>
          <div className="card">🔒 Sécurité avancée</div>
          <div className="card">⏱️ Accès 24/7</div>
        </div>
      </div>
    </section>
  );
}

/* ================= PRICING ================= */

function Pricing() {
  return (
    <section className="section soft" id="pricing">
      <div className="container">
        <h2 className="center">Choisissez votre abonnement</h2>

        <div className="pricing-grid">
          <div className="price-card">
            <h3>Basique</h3>
            <p className="price">4,99€ / mois</p>
            <button className="btn primary">S'inscrire</button>
          </div>

          <div className="price-card featured">
            <h3>Pro</h3>
            <p className="price">9,99€ / mois</p>
            <button className="btn gold">Essayer</button>
          </div>

          <div className="price-card">
            <h3>Premium</h3>
            <p className="price">19,99€ / mois</p>
            <button className="btn primary">S'inscrire</button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================= CONTACT ================= */

function Contact() {
  return (
    <section className="section" id="contact">
      <div className="container">
        <h2 className="center">Contactez-nous</h2>

        <form
          className="contact-form"
          action="https://formsubmit.co/contact@michaelcreation.fr"
          method="POST"
        >
          <input type="hidden" name="_captcha" value="false" />
          <input type="hidden" name="_template" value="table" />

          <input name="name" placeholder="Nom" required />
          <input name="email" type="email" placeholder="Email" required />
          <textarea name="message" placeholder="Message" required />
          <button className="btn primary">Envoyer</button>
        </form>
      </div>
    </section>
  );
}

/* ================= FOOTER ================= */

function Footer() {
  return (
    <footer className="footer">
      © {new Date().getFullYear()} CloudStoragePro — Tous droits réservés
    </footer>
  );
}
