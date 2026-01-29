import { useEffect, useState } from "react"
import { supabase } from "./supabaseClient"
import AdminRequests from "./AdminRequests"

const ADMIN_EMAIL = "admin@cloudstoragepro.fr"

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState("Aucun choisi")

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
  }, [])

  async function signIn(email, password) {
    await supabase.auth.signInWithPassword({ email, password })
  }

  async function signUp(email, password) {
    await supabase.auth.signUp({ email, password })
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function requestPlan(newPlan) {
    if (!user) return

    await supabase.from("demandes_abonnement").insert({
      user_id: user.id,
      email: user.email,
      plan: newPlan
    })

    alert("✅ Demande envoyée à l’équipe technique.\nTraitement sous 48h si disponible.")
  }

  if (loading) return <div>Chargement...</div>

  // ---------- SI PAS CONNECTÉ ----------
  if (!user) {
    return (
      <div className="login-page">
        <img src="/logo.png" className="logo" />

        <h1>CloudStoragePro</h1>

        <AuthForm onLogin={signIn} onRegister={signUp} />
      </div>
    )
  }

  const isAdmin = user.email === ADMIN_EMAIL

  // ---------- SI ADMIN ----------
  if (isAdmin) {
    return (
      <div className="container">
        <header>
          <img src="/logo.png" className="logo-small" />
          <button onClick={signOut}>Déconnexion</button>
        </header>

        <AdminRequests />
      </div>
    )
  }

  // ---------- SI UTILISATEUR ----------
  return (
    <div className="container">

      <header>
        <img src="/logo.png" className="logo-small" />
        <div className="user-info">
          {user.email}
          <button onClick={signOut}>Déconnexion</button>
        </div>
      </header>

      <section className="hero">
        <div className="hero-text">
          <h1>Stockage Cloud Sécurisé</h1>
          <p>Synchronisation & sauvegarde</p>
        </div>

        <div className="hero-card">
          <img src="/logo.png" className="hero-logo" />
          <p>CloudStoragePro</p>
          <small>Nombre d’abonnés actifs : </small>
          <b>— connecté —</b>
        </div>
      </section>

      <section className="client-box">
        <h2>Espace client</h2>

        <p><b>Bienvenue</b> {user.email}</p>

        <div className="status-row">
          <div className="status-card">
            <small>Abonnement</small>
            <b>{plan}</b>
          </div>
          <div className="status-card">
            <small>Statut</small>
            <b>Connecté ✅</b>
          </div>
        </div>

        <div className="buttons">
          <button onClick={() => requestPlan("Basique")}>Basique – 4.99€</button>
          <button onClick={() => requestPlan("Pro")}>Pro – 9.99€</button>
          <button onClick={() => requestPlan("Premium")}>Premium – 19.99€</button>
        </div>

        <p className="info">
          Après demande, ton changement est transmis à l’équipe technique.<br/>
          Activation sous 48h si place disponible.
        </p>
      </section>
    </div>
  )
}

// -------- FORMULAIRE LOGIN / REGISTER --------

function AuthForm({ onLogin, onRegister }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  return (
    <div className="auth-box">
      <input
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Mot de passe"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={() => onLogin(email, password)}>
        Connexion
      </button>

      <button onClick={() => onRegister(email, password)}>
        Créer un compte
      </button>
    </div>
  )
}
