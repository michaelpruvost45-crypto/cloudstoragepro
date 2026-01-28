import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Pricing from './components/Pricing'
import Dashboard from './pages/Dashboard'
import AuthModal from './components/AuthModal'

export default function App() {
  const [user, setUser] = useState(null)
  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))

    supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
  }, [])

  return (
    <>
      <Navbar user={user} onLogin={()=>setShowAuth(true)} />

      {!user && (
        <>
          <Hero onLogin={()=>setShowAuth(true)} />
          <Pricing />
        </>
      )}

      {user && <Dashboard />}

      {showAuth && <AuthModal onClose={()=>setShowAuth(false)} />}
    </>
  )
}
