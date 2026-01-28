import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";

export default function App() {
  const [openAuth, setOpenAuth] = useState(false);
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session || null));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession || null);
    });

    return () => sub?.subscription?.unsubscribe?.();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
  }

  const isLoggedIn = !!session;
  const userEmail = session?.user?.email || "";

  return (
    <div>
      <Header
        isLoggedIn={isLoggedIn}
        userEmail={userEmail}
        onOpenAuth={() => setOpenAuth(true)}
        onLogout={logout}
      />

      <Hero onOpenAuth={() => setOpenAuth(true)} />
      <Services />
      <Pricing isLoggedIn={isLoggedIn} onOpenAuth={() => setOpenAuth(true)} />
      <Contact />
      <Footer />

      {openAuth && (
        <AuthModal
          onClose={() => setOpenAuth(false)}
          onLoggedIn={() => setOpenAuth(false)}
        />
      )}
    </div>
  );
}

function Header({ isLoggedIn, userEmail, onOpenAuth, onLogout }) {
  return (
    <header className="topbar">
      <div className="container topbar__inner">
        <a className="brand" href="#top">
          <img className="brand__logo" src="/logo.png" alt="CloudStoragePro logo" />
          <span className="brand__name">CloudStoragePro</span>
        </a>

        <nav className="nav">
          <a href="#top">Accueil</a>
          <a href="#features">Fonctionnalités</a>
          <a href="#pricing">Tarifs</a>
          <a href="#contact">Contact</a>
        </nav>

        {!isLoggedIn ? (
          <button className="btn btn--light" onClick={onOpenAuth}>
            Connexion
          </button>
        ) : (
          <div className="userBox">
            <span className="userBox__email">{userEmail}</span>
            <button className="btn btn--light" onClick={onLogout}>
              Déconnexion
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

function Hero({ onOpenAuth }) {
  return (
    <section id="top" className="hero">
      <div className="container hero__inner">
        <div className="hero__left">
          <h1>
            Stockage Cloud Sécurisé <br />
            Pour Vos Données
          </h1>
          <p>
            Stockez et sauvegardez vos fichiers en toute sécurité sur notre plateforme
            CloudStoragePro.
          </p>

          <div className="hero__cta">
            <a className="btn btn--primary" href="#pricing">
              Voir les abonnements
            </a>
            <button className="btn btn--ghost" onClick={onOpenAuth}>
              Connexion
            </button>
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
              <div className="heroCard__sub">Synchronisation & sauvegarde</div>
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
    { title: "Accès 24/7", desc: "Accédez à vos fichiers à tout moment", icon: "⏱️" }
  ];

  return (
    <section id="features" className="section">
      <div className="container">
        <h2 className="section__title">Nos Services</h2>

        <div className="grid3">
          {items.map((it) => (
            <div key={it.title} className="serviceCard">
              <div className="serviceCard__icon">{it.icon}</div>
              <div className="serviceCard__title">{it.title}</div>
              <div className="serviceCard__desc">{it.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing({ onOpenAuth, isLoggedIn }) {
  const plans = useMemo(
    () => [
      {
        name: "Basique",
        price: "4,99",
        per: "/ mois",
        features: ["100 Go de stockage", "Cryptage basique", "Support standard"],
        highlight: false
      },
      {
        name: "Pro",
        price: "9,99",
        per: "/ mois",
        features: ["1 To de stockage", "Sauvegarde automatique", "Sécurité renforcée"],
        highlight: true,
        badge: "Le Plus Populaire"
      },
      {
        name: "Premium",
        price: "19,99",
        per: "/ mois",
        features: ["3 To de stockage", "Cryptage avancé", "Support prioritaire"],
        highlight: false
      }
    ],
    []
  );

  function handleChoose(planName) {
    if (!isLoggedIn) {
      onOpenAuth();
      return;
    }
    alert(`✅ Offre sélectionnée : ${planName}\n(Paiement à ajouter ensuite)`);
  }

  return (
    <section id="pricing" className="section section--soft">
      <div className="container">
        <h2 className="section__title">Choisissez Votre Abonnement</h2>

        <div className="pricingGrid">
          {plans.map((p) => (
            <div key={p.name} className={`priceCard ${p.highlight ? "priceCard--pro" : ""}`}>
              {p.badge && <div className="priceCard__badge">{p.badge}</div>}

              <div className="priceCard__name">{p.name}</div>

              <div className="priceCard__price">
                <span className="priceCard__currency">€</span>
                <span className="priceCard__amount">{p.price}</span>
                <span className="priceCard__per"> {p.per}</span>
              </div>

              <ul className="priceCard__list">
                {p.features.map((f) => (
                  <li key={f}>✓ {f}</li>
                ))}
              </ul>

              <button
                className={`btn ${p.highlight ? "btn--gold" : "btn--primary"} btn--full`}
                onClick={() => handleChoose(p.name)}
              >
                {isLoggedIn ? "CHOISIR" : "CONNEXION"}
              </button>
            </div>
          ))}
        </div>

        <div className="note">
          <strong>Note :</strong>{" "}
          {isLoggedIn ? "Tu es connecté ✅ (tu peux choisir un abonnement)" : "Connecte-toi pour choisir une offre."}
        </div>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="contact" className="section">
      <div className="container">
        <h2 className="section__title">Contactez-Nous</h2>

        <form className="contactForm" onSubmit={(e) => e.preventDefault()}>
          <input className="input" placeholder="Nom" />
          <input className="input" placeholder="Email" />
          <textarea className="textarea" placeholder="Message" rows={5} />
          <button className="btn btn--primary btn--center" type="submit">
            Envoyer
          </button>
        </form>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <span>© {new Date().getFullYear()} CloudStoragePro — Tous droits réservés</span>
      </div>
    </footer>
  );
}

/* =========================
   AUTH MODAL (SUPABASE)
   ========================= */

function AuthModal({ onClose, onLoggedIn }) {
  return (
    <div className="modalOverlay" role="dialog" aria-modal="true">
      <div className="modalCard">
        <button className="modalClose" onClick={onClose} aria-label="Fermer">
          ✕
        </button>
        <AuthForm onLoggedIn={onLoggedIn} />
      </div>
    </div>
  );
}

function AuthForm({ onLoggedIn }) {
  const [mode, setMode] = useState("login"); // login | signup | forgot
  const [firstName, setFirstName] = useState(""); // signup
  const [lastName, setLastName] = useState(""); // signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      if (!email) throw new Error("Ajoute un email.");

      // ✅ MOT DE PASSE OUBLIÉ
      if (mode === "forgot") {
        const redirectTo = window.location.origin;
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
        if (error) throw error;

        setMsg("✅ Email envoyé. Clique sur le lien dans ton mail pour changer ton mot de passe.");
        return;
      }

      if (!password) throw new Error("Ajoute un mot de passe.");

      // ✅ INSCRIPTION + PRENOM / NOM
      if (mode === "signup") {
        if (!firstName.trim()) throw new Error("Ajoute ton prénom.");
        if (!lastName.trim()) throw new Error("Ajoute ton nom.");

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName.trim(),
              last_name: lastName.trim()
            }
          }
        });

        if (error) throw error;

        setMsg("✅ Compte créé. Un email de confirmation a été envoyé. Vérifie ta boîte mail !");
        setMode("login");
        setPassword("");
        return;
      }

      // ✅ CONNEXION
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const user = data?.user;

      if (user && user.email_confirmed_at === null) {
        setMsg("⚠️ Ton email n’est pas confirmé. Vérifie ta boîte mail (ou renvoie l’email).");
        return;
      }

      if (data?.session) onLoggedIn();
    } catch (err) {
      setMsg("❌ " + (err?.message || "Erreur"));
    } finally {
      setLoading(false);
    }
  }

  async function resendConfirmation() {
    setMsg("");
    setLoading(true);

    try {
      if (!email) throw new Error("Entre ton email d’abord.");

      const redirectTo = window.location.origin;

      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: redirectTo }
      });

      if (error) throw error;

      setMsg("✅ Email de confirmation renvoyé ! Vérifie tes spams si besoin.");
    } catch (err) {
      setMsg("❌ " + (err?.message || "Impossible de renvoyer l’email"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="authHead">
        <img src="/logo.png" alt="logo" className="authLogo" />
        <div>
          <div className="authBrand">CloudStoragePro</div>
          <div className="authSub">Espace client</div>
        </div>
      </div>

      <h3 className="authTitle">
        {mode === "login" ? "Connexion" : mode === "signup" ? "Créer un compte" : "Mot de passe oublié"}
      </h3>

      <form onSubmit={submit}>
        {/* ✅ Champs prénom/nom seulement en signup */}
        {mode === "signup" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label className="authLabel">
              Prénom
              <input
                className="authInput"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="ex: Michael"
              />
            </label>

            <label className="authLabel">
              Nom
              <input
                className="authInput"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="ex: Pruvost"
              />
            </label>
          </div>
        )}

        <label className="authLabel">
          Email
          <input
            className="authInput"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ex: michael@email.com"
          />
        </label>

        {/* Mot de passe seulement si login/signup */}
        {mode !== "forgot" && (
          <label className="authLabel">
            Mot de passe
            <input
              className="authInput"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>
        )}

        <button className="btn btn--primary btn--full" type="submit" disabled={loading}>
          {loading
            ? "Patiente..."
            : mode === "login"
            ? "Se connecter"
            : mode === "signup"
            ? "Créer mon compte"
            : "Envoyer l’email"}
        </button>
      </form>

      {/* ✅ SOUS LA CONNEXION: mot de passe oublié PUIS renvoyer mail */}
      {mode === "login" && (
        <>
          <button
            className="authSwitch"
            type="button"
            onClick={() => {
              setMsg("");
              setMode("forgot");
            }}
          >
            Mot de passe oublié ?
          </button>

          <button
            className="authSwitch"
            type="button"
            onClick={resendConfirmation}
            disabled={loading}
          >
            Renvoyer l’email de confirmation
          </button>

          <button
            className="authSwitch"
            type="button"
            onClick={() => {
              setMsg("");
              setMode("signup");
            }}
          >
            Créer un compte
          </button>
        </>
      )}

      {mode === "signup" && (
        <button
          className="authSwitch"
          type="button"
          onClick={() => {
            setMsg("");
            setMode("login");
          }}
        >
          J’ai déjà un compte
        </button>
      )}

      {mode === "forgot" && (
        <button
          className="authSwitch"
          type="button"
          onClick={() => {
            setMsg("");
            setMode("login");
          }}
        >
          Retour à la connexion
        </button>
      )}

      {msg && <div className="authMsg">{msg}</div>}

      <div className="authHint">
        Important : Supabase → Authentication → URL Configuration : mets ton URL Vercel dans Site URL + Redirect URLs.
      </div>
    </div>
  );
}
