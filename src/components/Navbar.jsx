import { supabase } from '../lib/supabase'

export default function Navbar({ user, onLogin }) {
  async function logout() {
    await supabase.auth.signOut()
  }

  return (
    <nav className="nav">
      <div className="logo">CloudStorage<span>Pro</span></div>

      <div className="nav-links">
        <a>Accueil</a>
        <a>Fonctionnalités</a>
        <a>Tarifs</a>
        <a>Contact</a>

        {!user && <button onClick={onLogin}>Connexion</button>}
        {user && <button onClick={logout}>Déconnexion</button>}
      </div>
    </nav>
  )
}
