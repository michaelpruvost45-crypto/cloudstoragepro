import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import "./styles.css";

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  // Contact form state
  const [contact, setContact] = useState({
    name: "",
    email: "",
    message: ""
  });
  const [contactStatus, setContactStatus] = useState("");

  useEffect(() => {
    getUser();
    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
    });
  }, []);

  async function getUser() {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      setUser(data.user);
      await loadProfile(data.user.id);
    }
    setLoading(false);
  }

  async function loadProfile(userId) {
    const { data } = await supabase
      .from("profils")
      .select("*")
      .eq("id", userId)
      .single();

    setProfile(data);

    const { data: sub } = await supabase
      .from("demandes_abonnement")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    setSubscription(sub);
  }

  // ---------- AUTH ----------
  async function signIn(email, password) {
    await supabase.auth.signInWithPassword({ email, password });
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
    setSubscription(null);
  }

  // ---------- SUBSCRIPTION ----------
  async function requestSubscription(plan) {
    if (!user) return alert("Connecte-toi d'abord");

    await supabase.from("demandes_abonnement").insert({
      user_id: user.id,
      email: user.email,
      plan
    });

    alert("✅ Demande envoyée à l'équipe technique.");
    await loadProfile(user.id);
  }

  // ---------- CONTACT FORM ----------
  function handleContactChange(e) {
    setContact({ ...contact, [e.target.name]: e.target.value });
  }

  async function sendContact(e) {
    e.preventDefault();
    setContactStatus("Envoi...");

    const { error } = await supabase.from("messages_contact").insert({
      name: contact.name,
      email: contact.email,
      message: contact.message
    });

    if (error) {
      console.error(error);
      setContactStatus("❌ Erreur : " + error.message);
    } else {
      setContactStatus("✅ Message envoyé !");
      setContact({ name: "", email: "", message: "" });
    }
  }

  if (loading) return <p>Chargement...</p>;

  return (
    <>
      {/* TOP BAR */}
      <header className="topbar">
        <div className="container topbar-inner">
          <div className="logo">
            <img src="/logo.png" alt="logo" />
            <span>CloudStoragePro</span>
          </div>

          <nav>
            <a href="#home">Accueil</a>
            <a href="#features">Fonctionnalités</a>
            <a href="#pricing">Tarifs</a>
            <a href="#contact">Contact</a>
          </nav>

          {user ? (
            <div className="userbox">
              <div>
                <strong>{profile?.prenom} {profile?.nom}</strong>
                <div className="email">{user.email}</div>
              </div>
              <button onClick={signOut}>Déconnexion</button>
            </div>
          ) : (
            <button
              onClick={() => signIn("test@email.com", "password")}
              className="btn-outline"
            >
              Connexion
            </button>
          )}
        </div>
      </header>

      {/* HERO */}
      <section className="hero" id="home">
        <div className="container hero-grid">
          <div>
            <h1>Stockage Cloud Sécurisé<br />Pour Vos Données</h1>
            <p>
              Stockez et sauvegardez vos fichiers en toute sécurité sur CloudStoragePro.
            </p>
            <div className="hero-buttons">
              <a href="#pricing" className="btn-primary">Voir les abonnements</a>
              {!user && <button className="btn-outline">Connexion</button>}
            </div>
          </div>

          <div className="hero-card">
            <img src="/logo.png" alt="logo" className="hero-logo"/>
            <h3>Cloud sécurisé</h3>
            <p>Synchronisation & sauvegarde</p>
          </div>
        </div>
      </section>

      {/* ESPACE CLIENT */}
      {user && (
        <section className="section-soft">
          <div className="container client-box">
            <h2>Espace client</h2>
            <p>Bienvenue <strong>{profile?.prenom} {profile?.nom}</strong> 👋</p>
            <p>{user.email}</p>

            <div className="client-cards">
              <div className="card">
                <h4>Abonnement</h4>
                <p>{subscription?.plan || "Aucun choisi"}</p>
              </div>
              <div className="card">
                <h4>Statut</h4>
                <p>Connecté ✅</p>
              </div>
            </div>

            <div className="client-actions">
              <button className="btn-outline">Modifier mon profil</button>
              <button className="btn-primary">Changer mon abonnement</button>
              <button className="btn-outline">Mes fichiers (bientôt)</button>
            </div>
          </div>
        </section>
      )}

      {/* PRICING */}
      <section id="pricing" className="section">
        <div className="container pricing-grid">
          {["Basique","Standard","Premium"].map((plan,i)=>(
            <div className="price-card" key={i}>
              <h3>{plan}</h3>
              <p className="price">
                {plan==="Basique" && "4,99€"}
                {plan==="Standard" && "9,99€"}
                {plan==="Premium" && "19,99€"}
                <span>/mois</span>
              </p>

              {user ? (
                <button onClick={()=>requestSubscription(plan)} className="btn-primary">
                  Choisir cette offre
                </button>
              ) : (
                <button className="btn-outline">Connexion</button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="section-soft">
        <div className="container">
          <h2 className="section-title">Contactez-Nous</h2>

          <form className="contactForm" onSubmit={sendContact}>
            <input
              type="text"
              name="name"
              placeholder="Nom"
              value={contact.name}
              onChange={handleContactChange}
              required
            />
            <input
              type="email"
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
            {contactStatus && <p className="contact-status">{contactStatus}</p>}
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        © 2026 CloudStoragePro — Tous droits réservés
      </footer>
    </>
  );
}
