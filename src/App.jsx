import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import logo from "/logo.png";

export default function App() {
  const [user, setUser] = useState(null);
  const [messageStatus, setMessageStatus] = useState("");
  const [contact, setContact] = useState({
    name: "",
    email: "",
    message: ""
  });

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
  }, []);

  // Contact form state
const [contact, setContact] = useState({
  name: "",
  email: "",
  message: ""
});
const [messageStatus, setMessageStatus] = useState("");

// Handle input
function handleContactChange(e) {
  setContact({ ...contact, [e.target.name]: e.target.value });
}

// Send message
async function sendContact(e) {
  e.preventDefault();
  setMessageStatus("Envoi en cours...");

  const { error } = await supabase.from("messages_contact").insert([
    {
      name: contact.name,
      email: contact.email,
      message: contact.message
    }
  ]);

  if (error) {
    console.error("Supabase error:", error);
    setMessageStatus("❌ Erreur : " + error.message);
  } else {
    setMessageStatus("✅ Message envoyé !");
    setContact({ name: "", email: "", message: "" });
  }
}

  // Login simple
  async function signIn() {
    const email = prompt("Email :");
    const password = prompt("Mot de passe :");
    await supabase.auth.signInWithPassword({ email, password });
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <>
      {/* NAVBAR */}
      <header className="nav">
        <div className="logo">
          <img src={logo} alt="CloudStoragePro" />
          <span>CloudStoragePro</span>
        </div>

        <nav>
          <a href="#">Accueil</a>
          <a href="#">Fonctionnalités</a>
          <a href="#">Tarifs</a>
          <a href="#">Contact</a>
        </nav>

        <div>
          {user ? (
            <button className="btn-outline" onClick={signOut}>
              Déconnexion
            </button>
          ) : (
            <button className="btn-outline" onClick={signIn}>
              Connexion
            </button>
          )}
        </div>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="hero-left">
          <h1>Stockage Cloud Sécurisé<br />Pour Vos Données</h1>
          <p>
            Stockez et sauvegardez vos fichiers en toute sécurité sur CloudStoragePro.
          </p>

          <div className="hero-buttons">
            <button className="btn-primary">Voir les abonnements</button>
            {!user && <button className="btn-outline" onClick={signIn}>Connexion</button>}
          </div>
        </div>

        <div className="hero-right">
          <div className="cloud-card">
            <img src={logo} alt="logo" />
            <h3>Cloud sécurisé</h3>
            <p>Synchronisation & sauvegarde</p>
          </div>
        </div>
      </section>

      {/* ESPACE CLIENT */}
      {user && (
        <section className="client-space">
          <h2>Espace client</h2>
          <p>Bienvenue <strong>{user.email}</strong> 👋</p>

          <div className="client-box">
            <div>
              <p><strong>Abonnement</strong></p>
              <p>Aucun choisi</p>
            </div>

            <div>
              <p><strong>Statut</strong></p>
              <p className="status-ok">Connecté ✅</p>
            </div>
          </div>

          <div className="client-actions">
            <button className="btn-primary">Choisir / changer mon abonnement</button>
            <button className="btn-outline">Mes fichiers (bientôt)</button>
          </div>
        </section>
      )}

      {/* CONTACT */}
      <section className="contact-section">
        <h2>Contactez-nous</h2>

        <form className="contact-form" onSubmit={sendContact}>
          <input
            name="name"
            placeholder="Nom"
            value={contact.name}
            onChange={handleContactChange}
            required
          />
          <input
            name="email"
            placeholder="Email"
            value={contact.email}
            onChange={handleContactChange}
            required
          />
          <textarea
            name="message"
            placeholder="Message"
            value={contact.message}
            onChange={handleContactChange}
            required
          />
          <button type="submit">Envoyer</button>
        </form>

        {messageStatus && <p className="status-message">{messageStatus}</p>}
      </section>

      {/* FOOTER */}
      <footer>
        © {new Date().getFullYear()} CloudStoragePro — Tous droits réservés
      </footer>
    </>
  );
}
