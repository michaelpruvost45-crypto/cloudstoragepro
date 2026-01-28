import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";

export default function App() {
  const [openAuth, setOpenAuth] = useState(false);
  const [session, setSession] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null); // juste pour l'afficher dans l'espace client

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
  const firstName = session?.user?.user_metadata?.first_name || "";
  const lastName = session?.user?.user_metadata?.last_name || "";
  const fullName = `${firstName} ${lastName}`.trim();

  return (
    <div>
      <Header
        isLoggedIn={isLoggedIn}
        userEmail={userEmail}
        fullName={fullName}
        onOpenAuth={() => setOpenAuth(true)}
        onLogout={logout}
      />

      <Hero onOpenAuth={() => setOpenAuth(true)} />

      {isLoggedIn ? (
        <ClientArea
          fullName={fullName}
          email={userEmail}
          selectedPlan={selectedPlan}
          onSelectPlan={() => {
            // juste scroll vers pricing
            document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
          }}
        />
      ) : (
        <TeaserClientArea onOpenAuth={() => setOpenAuth(true)} />
      )}

      <Services />

      <Pricing
        isLoggedIn={isLoggedIn}
        onOpenAuth={() => setOpenAuth(true)}
        onPlanChosen={(plan) => setSelectedPlan(plan)}
      />

      <Contact />
      <Footer />

      {openAuth && (
        <AuthModal
          onClose={() => setOpenAuth(false)}
          onLoggedIn={() => setOpenAuth(false)}
        />
      )}

      <style>{css}</style>
    </div>
  );
}

function Header({ isLoggedIn, userEmail, fullName, onOpenAuth, onLogout }) {
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
            <div className="userBox__who">
              <div className="userBox__name">{fullName || "Utilisateur"}</div>
              <div className="userBox__email">{userEmail}</div>
            </div>
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

/* =========================
   ESPACE CLIENT
   ========================= */

function TeaserClientArea({ onOpenAuth }) {
  return (
    <section className="section section--soft">
      <div className="container">
        <div className="clientCard">
          <div>
            <h2 className="clientTitle">Espace client</h2>
            <p className="clientText">
              Connecte-toi pour accéder à ton compte, gérer ton abonnement et bientôt
              accéder à tes fichiers.
            </p>
          </div>

          <div className="clientActions">
            <button className="btn btn--primary" onClick={onOpenAuth}>
              Se connecter
            </button>
            <a className="btn btn--light" href="#pricing">
              Voir les offres
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function ClientArea({ fullName, email, selectedPlan, onSelectPlan }) {
  return (
    <section className="section section--soft">
      <div className="container">
        <div className="clientCard">
          <div>
            <h2 className="clientTitle">Espace client</h2>
            <p className="clientText">
              Bienvenue <strong>{fullName || "Utilisateur"}</strong> 👋
              <br />
              <span className="clientSmall">{email}</span>
            </p>

            <div className="clientInfo">
              <div className="infoItem">
                <div className="infoLabel">Abonnement</div>
                <div className="infoValue">{selectedPlan || "Aucun choisi"}</div>
              </div>

              <div className="infoItem">
                <div className="infoLabel">Statut</div>
                <div className="infoValue">Connecté ✅</div>
              </div>
            </div>
          </div>

          <div className="clientActions">
            <button className="btn btn--primary" onClick={onSelectPlan}>
              Choisir / changer mon abonnement
            </button>
            <button
              className="btn btn--light"
              onClick={() => alert("📁 Zone fichiers : à ajouter plus tard (MinIO / Synology).")}
            >
              Mes fichiers (bientôt)
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================
   SERVICES / PRICING
   ========================= */

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

function Pricing({ onOpenAuth, isLoggedIn, onPlanChosen }) {
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
    onPlanChosen?.(planName);
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

/* =========================
   CONTACT / FOOTER
   ========================= */

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
   AUTH MODAL
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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const firstNameOk = firstName.trim().length > 0;
  const lastNameOk = lastName.trim().length > 0;

  async function submit(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      if (!email) throw new Error("Ajoute un email.");

      if (mode === "forgot") {
        const redirectTo = window.location.origin;
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
        if (error) throw error;

        setMsg("✅ Email envoyé. Clique sur le lien dans ton mail pour changer ton mot de passe.");
        return;
      }

      if (!password) throw new Error("Ajoute un mot de passe.");

      if (mode === "signup") {
        if (!firstNameOk) throw new Error("Prénom obligatoire.");
        if (!lastNameOk) throw new Error("Nom obligatoire.");

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

  const signupDisabled = mode === "signup" && (!firstNameOk || !lastNameOk);

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
        {mode === "signup" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label className="authLabel">
              Prénom <span className="req">*</span>
              <input
                className="authInput"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="ex: Michael"
              />
              {!firstNameOk && <div className="fieldError">Prénom obligatoire</div>}
            </label>

            <label className="authLabel">
              Nom <span className="req">*</span>
              <input
                className="authInput"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="ex: Pruvost"
              />
              {!lastNameOk && <div className="fieldError">Nom obligatoire</div>}
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

        <button
          className="btn btn--primary btn--full"
          type="submit"
          disabled={loading || signupDisabled}
          title={signupDisabled ? "Prénom et Nom obligatoires" : ""}
        >
          {loading
            ? "Patiente..."
            : mode === "login"
            ? "Se connecter"
            : mode === "signup"
            ? "Créer mon compte"
            : "Envoyer l’email"}
        </button>
      </form>

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

          <button className="authSwitch" type="button" onClick={resendConfirmation} disabled={loading}>
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

/* =========================
   CSS minimal (compatible)
   ========================= */

const css = `
:root{--blue:#0b63d1;--dark:#06214a;--soft:#f6f9ff}
*{box-sizing:border-box}
body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu}

.container{max-width:1100px;margin:0 auto;padding:0 16px}

.topbar{position:sticky;top:0;z-index:10;background:linear-gradient(90deg,#07204a,#0b63d1);color:#fff;border-bottom:1px solid rgba(255,255,255,.12)}
.topbar__inner{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 0}
.brand{display:flex;align-items:center;gap:10px;color:#fff;text-decoration:none}
.brand__logo{height:34px;width:auto}
.brand__name{font-weight:900;letter-spacing:.2px}
.nav{display:flex;gap:18px;align-items:center}
.nav a{color:rgba(255,255,255,.92);text-decoration:none;font-weight:700}
.nav a:hover{color:#fff}

.btn{border:0;border-radius:10px;padding:10px 14px;font-weight:900;cursor:pointer}
.btn--light{background:rgba(255,255,255,.95);color:#083a7b}
.btn--primary{background:var(--blue);color:#fff}
.btn--ghost{background:rgba(255,255,255,.12);color:#fff;border:1px solid rgba(255,255,255,.2)}
.btn--gold{background:#f4b000;color:#13223d}
.btn--full{width:100%}
.btn--center{display:block;margin:0 auto}

.userBox{display:flex;align-items:center;gap:12px}
.userBox__who{display:flex;flex-direction:column;line-height:1.1;align-items:flex-end}
.userBox__name{font-weight:1000}
.userBox__email{font-size:12px;opacity:.85}

.hero{background:linear-gradient(135deg,#0b3c84 0%,#0b63d1 55%,#2aa7ff 100%);color:#fff;overflow:hidden}
.hero__inner{display:grid;grid-template-columns:1.2fr .8fr;gap:20px;align-items:center;padding:56px 0}
.hero h1{font-size:42px;margin:0 0 12px}
.hero p{opacity:.92;max-width:520px;margin:0 0 18px}
.hero__cta{display:flex;gap:12px;flex-wrap:wrap}

.heroCard{position:relative;height:220px}
.heroCard__big{position:absolute;right:0;top:20px;width:320px;height:180px;border-radius:22px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.18);backdrop-filter:blur(10px);display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center}
.heroCard__icon{font-size:40px}
.heroCard__title{font-weight:1000;margin-top:10px}
.heroCard__sub{opacity:.9;font-size:13px}
.heroCard__bubble{position:absolute;left:24px;top:30px;width:66px;height:66px;border-radius:999px;background:rgba(255,255,255,.18)}
.heroCard__bubble--2{left:90px;top:120px;width:44px;height:44px;opacity:.8}
.heroCard__bubble--3{left:10px;top:150px;width:26px;height:26px;opacity:.6}
.hero__clouds{height:60px;background:radial-gradient(circle at 10% 10%,rgba(255,255,255,.35) 0 22px,transparent 23px),
radial-gradient(circle at 40% 40%,rgba(255,255,255,.28) 0 28px,transparent 29px),
radial-gradient(circle at 70% 30%,rgba(255,255,255,.22) 0 24px,transparent 25px);
opacity:.55}

.section{padding:56px 0;background:#fff}
.section--soft{background:var(--soft)}
.section__title{text-align:center;margin:0 0 22px;color:#10264d}

.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.serviceCard{background:#fff;border-radius:16px;padding:18px;border:1px solid #e8eefb;text-align:center;box-shadow:0 10px 30px rgba(16,38,77,.06)}
.serviceCard__icon{font-size:28px}
.serviceCard__title{font-weight:1000;margin-top:8px}
.serviceCard__desc{opacity:.75;margin-top:6px}

.pricingGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;align-items:stretch}
.priceCard{background:#fff;border-radius:18px;padding:18px;border:1px solid #e8eefb;box-shadow:0 10px 30px rgba(16,38,77,.06);position:relative}
.priceCard--pro{background:linear-gradient(180deg,#0b63d1 0%,#083a7b 100%);color:#fff;border:0}
.priceCard__badge{position:absolute;top:10px;left:10px;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.22);color:#fff;padding:6px 10px;border-radius:999px;font-weight:1000;font-size:12px}
.priceCard__name{font-weight:1000;font-size:22px;text-align:center;margin-top:8px}
.priceCard__price{text-align:center;margin:12px 0 10px}
.priceCard__amount{font-size:42px;font-weight:1000}
.priceCard__list{list-style:none;padding:0;margin:0 0 14px;display:grid;gap:8px}
.note{margin-top:14px;text-align:center;opacity:.75}

.contactForm{max-width:560px;margin:0 auto;background:#fff;border:1px solid #e8eefb;border-radius:18px;padding:18px;box-shadow:0 10px 30px rgba(16,38,77,.06);display:grid;gap:10px}
.input,.textarea{width:100%;border:1px solid #dfe7fb;border-radius:12px;padding:12px;font-size:14px;outline:none}
.footer{background:#081b3a;color:#fff}
.footer__inner{padding:18px 0;opacity:.9;text-align:center}

.clientCard{display:flex;align-items:center;justify-content:space-between;gap:18px;background:#fff;border:1px solid #e8eefb;border-radius:18px;padding:18px;box-shadow:0 10px 30px rgba(16,38,77,.06)}
.clientTitle{margin:0 0 6px;color:#10264d}
.clientText{margin:0;color:#203b6a;opacity:.9}
.clientSmall{font-size:12px;opacity:.75}
.clientActions{display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end}
.clientInfo{display:flex;gap:12px;flex-wrap:wrap;margin-top:12px}
.infoItem{background:#f4f8ff;border:1px solid #e8eefb;border-radius:14px;padding:10px 12px;min-width:160px}
.infoLabel{font-size:12px;opacity:.7;font-weight:900}
.infoValue{font-weight:1000;margin-top:4px}

.modalOverlay{position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:18px;z-index:50}
.modalCard{width:420px;max-width:100%;background:linear-gradient(180deg,#0b63d1 0%,#083a7b 100%);color:#fff;border-radius:18px;padding:16px;position:relative;box-shadow:0 20px 60px rgba(0,0,0,.35)}
.modalClose{position:absolute;right:12px;top:10px;border:0;background:rgba(255,255,255,.16);color:#fff;border-radius:10px;width:34px;height:34px;cursor:pointer}

.authHead{display:flex;gap:10px;align-items:center;margin-bottom:10px}
.authLogo{height:34px;width:auto;border-radius:8px;background:rgba(255,255,255,.1);padding:4px}
.authBrand{font-weight:1000}
.authSub{opacity:.85;font-size:12px}
.authTitle{margin:10px 0 10px}
.authLabel{display:block;font-weight:900;font-size:12px;opacity:.95;margin-top:10px}
.authInput{width:100%;margin-top:6px;border-radius:12px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.12);color:#fff;padding:12px;outline:none}
.authInput::placeholder{color:rgba(255,255,255,.75)}
.authSwitch{display:block;width:100%;margin-top:10px;background:transparent;border:0;color:rgba(255,255,255,.92);font-weight:1000;cursor:pointer;text-decoration:underline}
.authMsg{margin-top:10px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18);padding:10px;border-radius:12px}
.authHint{margin-top:10px;font-size:12px;opacity:.85}
.req{color:#ffd36a;font-weight:1000;margin-left:4px}
.fieldError{margin-top:6px;font-size:12px;color:#ffd36a;font-weight:900}

@media(max-width:900px){
  .nav{display:none}
  .hero__inner{grid-template-columns:1fr}
  .heroCard__big{width:100%}
  .grid3,.pricingGrid{grid-template-columns:1fr}
  .clientCard{flex-direction:column;align-items:flex-start}
  .clientActions{justify-content:flex-start}
}
`;
