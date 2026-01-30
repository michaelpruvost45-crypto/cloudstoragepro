import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

/* ======================
   APP
====================== */
export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setProfile(null);
      setLoadingProfile(false);
      return;
    }

    loadProfile();
  }, [session]);

  async function loadProfile() {
    setLoadingProfile(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    setProfile(data);
    setLoadingProfile(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    setProfile(null);
  }

  return (
    <>
      <Header
        session={session}
        profile={profile}
        onLogin={() => setAuthOpen(true)}
        onLogout={logout}
      />

      <Hero />

      {!session && <GuestCTA onLogin={() => setAuthOpen(true)} />}

      {session && profile && (
        <>
          <ClientArea profile={profile} reload={loadProfile} />
          {profile.role === "admin" && <AdminPanel />}
        </>
      )}

      <Pricing />

      <Contact />

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}

      <Footer />
    </>
  );
}

/* ======================
   HEADER
====================== */
function Header({ session, profile, onLogin, onLogout }) {
  return (
    <header className="topbar">
      <div className="container">
        <strong>CloudStoragePro</strong>
        <nav>
          <a href="#pricing">Tarifs</a>
          <a href="#contact">Contact</a>
          {!session ? (
            <button onClick={onLogin}>Connexion</button>
          ) : (
            <button onClick={onLogout}>Déconnexion</button>
          )}
        </nav>
      </div>
    </header>
  );
}

/* ======================
   HERO
====================== */
function Hero() {
  return (
    <section className="hero">
      <h1>Stockage Cloud Sécurisé</h1>
      <p>Vos fichiers en toute sécurité</p>
    </section>
  );
}

/* ======================
   ESPACE CLIENT
====================== */
function ClientArea({ profile, reload }) {
  async function requestPlanChange(newPlan) {
    await supabase
      .from("profiles")
      .update({
        pending_plan: newPlan,
        request_status: "pending",
        request_note: "Demande envoyée à l’équipe technique.",
      })
      .eq("id", profile.id);

    reload();
  }

  return (
    <section className="client">
      <h2>Espace client</h2>
      <p><strong>Abonnement :</strong> {profile.plan || "Aucun"}</p>

      {profile.request_status === "pending" && (
        <div className="info">
          ℹ️ {profile.request_note}
        </div>
      )}

      <button onClick={() => requestPlanChange("Pro")}>
        Demander changement Pro
      </button>
    </section>
  );
}

/* ======================
   PANNEAU ADMIN
====================== */
function AdminPanel() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("request_status", "pending");

    setUsers(data || []);
  }

  async function accept(u) {
    await supabase.from("profiles").update({
      plan: u.pending_plan,
      pending_plan: null,
      request_status: "accepted",
      request_note: "Votre demande a été acceptée.",
    }).eq("id", u.id);

    load();
  }

  async function refuse(u) {
    await supabase.from("profiles").update({
      pending_plan: null,
      request_status: "refused",
      request_note: "Votre demande a été refusée.",
    }).eq("id", u.id);

    load();
  }

  return (
    <section className="admin">
      <h2>Panneau admin</h2>
      {users.map(u => (
        <div key={u.id} className="adminCard">
          <p>{u.email} → {u.pending_plan}</p>
          <button onClick={() => accept(u)}>Accepter</button>
          <button onClick={() => refuse(u)}>Refuser</button>
        </div>
      ))}
    </section>
  );
}

/* ======================
   TARIFS
====================== */
function Pricing() {
  return (
    <section id="pricing">
      <h2>Tarifs</h2>
      <p>Basique / Pro / Premium</p>
    </section>
  );
}

/* ======================
   CONTACT (SUPABASE)
====================== */
function Contact() {
  const [sent, setSent] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const f = e.target;

    await supabase.from("messages_contact").insert({
      name: f.name.value,
      email: f.email.value,
      message: f.message.value,
    });

    setSent(true);
    f.reset();
  }

  return (
    <section id="contact">
      <h2>Contactez-nous</h2>

      {sent && <div className="success">Message envoyé ✅</div>}

      <form onSubmit={submit}>
        <input name="name" placeholder="Nom" required />
        <input name="email" type="email" placeholder="Email" required />
        <textarea name="message" placeholder="Message" required />
        <button>Envoyer</button>
      </form>
    </section>
  );
}

/* ======================
   AUTH MODAL
====================== */
function AuthModal({ onClose }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function login(e) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email, password
    });
    if (error) setMsg(error.message);
    else onClose();
  }

  async function forgot() {
    await supabase.auth.resetPasswordForEmail(email);
    setMsg("Email envoyé");
  }

  return (
    <div className="modal">
      <form onSubmit={login}>
        <h3>Connexion</h3>
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mot de passe" />
        <button>Se connecter</button>
        <button type="button" onClick={forgot}>Mot de passe oublié</button>
        {msg && <p>{msg}</p>}
        <button type="button" onClick={onClose}>Fermer</button>
      </form>
    </div>
  );
}

/* ======================
   FOOTER
====================== */
function Footer() {
  return <footer>© CloudStoragePro</footer>;
}
