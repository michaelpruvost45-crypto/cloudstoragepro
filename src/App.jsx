import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import logo from "/logo.png";

export default function App() {
  const [session, setSession] = useState(null);
  const [openAuth, setOpenAuth] = useState(false);

  // popup merci contact
  const [thanksOpen, setThanksOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [contactError, setContactError] = useState("");

  const [contact, setContact] = useState({
    name: "",
    email: "",
    message: ""
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session || null));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession || null);
    });

    return () => sub?.subscription?.unsubscribe?.();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    setSession(null);
  }

  async function submitContact(e) {
    e.preventDefault();
    setContactError("");
    setSending(true);

    try {
      const { error } = await supabase.from("messages_contact").insert({
        name: contact.name,
        email: contact.email,
        message: contact.message
      });

      if (error) throw error;

      setContact({ name: "", email: "", message: "" });
      setThanksOpen(true);
    } catch (err) {
      setContactError(err?.message || "Erreur contact");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* ===== TOPBAR ===== */}
      <header className="topbar">
        <div className="container topbar-inner">
          <a className="brand" href="#home">
            <img src={logo} alt="CloudStoragePro" />
            <span>CloudStoragePro</span>
          </a>

          <nav className="nav">
            <a href="#home">Accueil</a>
            <a href="#features">Fonctionnalités</a>
            <a href="#pricing">Tarifs</a>
            <a href="#contact">Contact</a>
          </nav>

          {!session ? (
            <button className="btn btn-outline" onClick={() => setOpenAuth(true)}>
              Connexion
            </button>
          ) : (
            <button className="btn btn-outline" onClick={logout}>
              Déconnexion
            </button>
          )}
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section className="hero" id="home">
        <div className="hero-bg-bubbles" />
        <div className="container hero-grid">
          <div className="hero-left">
            <h1>
              Stockage Cloud Sécurisé <br /> Pour Vos Données
            </h1>
            <p>
              Stockez et sauvegardez vos fichiers en toute sécurité sur notre plateforme cloud.
            </p>

            <div className="hero-buttons">
              <a href="#pricing" className="btn btn-primary">
                Voir les abonnements
              </a>
              {!session && (
                <button className="btn btn-ghost" onClick={() => setOpenAuth(true)}>
                  Connexion
                </button>
              )}
            </div>
          </div>

          <div className="hero-right">
            <div className="hero-card">
              <div className="hero-card-inner">
                <img className="hero-card-logo" src={logo} alt="logo" />
                <h3>Cloud sécurisé</h3>
                <p>Synchronisation & sauvegarde</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="section section-soft">
        <div className="container">
          <h2 className="section-title">Nos Services</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-ico">☁️</div>
              <div className="feature-title">Stockage évolutif</div>
              <div className="feature-desc">Espace extensible selon vos besoins</div>
            </div>
            <div className="feature-card">
              <div className="feature-ico">🛡️</div>
              <div className="feature-title">Sécurité avancée</div>
              <div className="feature-desc">Cryptage & protection de vos données</div>
            </div>
            <div className="feature-card">
              <div className="feature-ico">⏱️</div>
              <div className="feature-title">Accès 24/7</div>
              <div className="feature-desc">Accédez à vos fichiers à tout moment</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="section">
        <div className="container">
          <h2 className="section-title">Choisissez Votre Abonnement</h2>

          <div className="pricing-grid">
            <div className="price-card">
              <h3>Basique</h3>
              <div className="price">
                <span className="price-big">4,99</span>
                <span className="price-suf">€ / mois</span>
              </div>
              <ul>
                <li>✓ 100 Go de stockage</li>
                <li>✓ Cryptage basique</li>
                <li>✓ Support standard</li>
              </ul>
              <button className="btn btn-primary">S’inscrire</button>
            </div>

            <div className="price-card price-popular">
              <div className="badge">Le Plus Populaire</div>
              <h3>Pro</h3>
              <div className="price">
                <span className="price-big">9,99</span>
                <span className="price-suf">€ / mois</span>
              </div>
              <ul>
                <li>✓ 1 To de stockage</li>
                <li>✓ Sauvegarde automatique</li>
                <li>✓ Sécurité renforcée</li>
              </ul>
              <button className="btn btn-gold">Essayer</button>
            </div>

            <div className="price-card">
              <h3>Premium</h3>
              <div className="price">
                <span className="price-big">19,99</span>
                <span className="price-suf">€ / mois</span>
              </div>
              <ul>
                <li>✓ 3 To de stockage</li>
                <li>✓ Cryptage avancé</li>
                <li>✓ Support prioritaire</li>
              </ul>
              <button className="btn btn-primary">S’inscrire</button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CONTACT ===== */}
      <section id="contact" className="section section-soft">
        <div className="container">
          <h2 className="section-title">Contactez-Nous</h2>

          <form className="contactForm" onSubmit={submitContact}>
            <input
              required
              placeholder="Nom"
              value={contact.name}
              onChange={(e) => setContact({ ...contact, name: e.target.value })}
            />
            <input
              required
              type="email"
              placeholder="Email"
              value={contact.email}
              onChange={(e) => setContact({ ...contact, email: e.target.value })}
            />
            <textarea
              required
              placeholder="Message"
              rows={5}
              value={contact.message}
              onChange={(e) => setContact({ ...contact, message: e.target.value })}
            />
            <button className="btn btn-primary" type="submit" disabled={sending}>
              {sending ? "Envoi..." : "Envoyer"}
            </button>

            {contactError && <div className="formError">❌ {contactError}</div>}
          </form>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="footer">
        © {new Date().getFullYear()} CloudStoragePro — Tous droits réservés
      </footer>

      {/* ===== AUTH MODAL (simple OTP email) ===== */}
      {openAuth && (
        <Modal onClose={() => setOpenAuth(false)} title="Connexion">
          <AuthOTP onDone={() => setOpenAuth(false)} />
        </Modal>
      )}

      {/* ===== THANKS POPUP ===== */}
      {thanksOpen && (
        <Modal onClose={() => setThanksOpen(false)} title="Merci 🙏">
          <p style={{ margin: "10px 0 18px" }}>
            Votre message a bien été envoyé. Nous vous répondrons rapidement.
          </p>
          <button className="btn btn-primary" onClick={() => setThanksOpen(false)}>
            Fermer
          </button>
        </Modal>
      )}
    </>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="modalOverlay" role="dialog" aria-modal="true">
      <div className="modalCard">
        <button className="modalClose" onClick={onClose} aria-label="Fermer">
          ✕
        </button>
        <h3 className="modalTitle">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function AuthOTP({ onDone }) {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendLink(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin }
      });
      if (error) throw error;
      setMsg("✅ Lien envoyé par email. Vérifie ta boîte mail.");
    } catch (err) {
      setMsg("❌ " + (err?.message || "Erreur"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={sendLink}>
      <label className="authLabel">
        Email
        <input
          className="authInput"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ex: alex@email.com"
        />
      </label>
      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? "Envoi..." : "Envoyer le lien"}
      </button>
      {msg && <div className="authMsg">{msg}</div>}
      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
        (Connexion par lien email Supabase)
      </div>
      <div style={{ marginTop: 14 }}>
        <button type="button" className="btn btn-outline" onClick={onDone}>
          Fermer
        </button>
      </div>
    </form>
  );
}
