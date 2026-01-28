import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import logo from '/public/logo.png'

export default function App() {

  const [user,setUser] = useState(null)
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [subscription,setSubscription] = useState(null)
  const [requests,setRequests] = useState([])

  // Vérifie connexion
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      if(data.session?.user) loadSubscription(data.session.user.id)
    })

    supabase.auth.onAuthStateChange((_event, session)=>{
      setUser(session?.user ?? null)
      if(session?.user) loadSubscription(session.user.id)
    })
  }, [])

  async function loadSubscription(uid){
    const { data } = await supabase
      .from('subscription_requests')
      .select()
      .eq('user_id',uid)
      .order('created_at',{ascending:false})
      .limit(1)

    if(data.length>0) setSubscription(data[0].plan)
  }

  async function signIn(){
    await supabase.auth.signInWithPassword({ email,password })
  }

  async function signUp(){
    await supabase.auth.signUp({
      email,
      password,
      options:{ emailRedirectTo: window.location.origin }
    })
  }

  async function signOut(){
    await supabase.auth.signOut()
  }

  async function requestPlan(plan){
    await supabase.from('subscription_requests').insert({
      user_id:user.id,
      email:user.email,
      plan
    })
    setSubscription(plan)
    alert("Demande envoyée à l’équipe technique. Traitement sous 48h.")
  }

  // Admin : charge toutes demandes
  async function loadAllRequests(){
    const { data } = await supabase
      .from('subscription_requests')
      .select()
      .order('created_at',{ascending:false})
    setRequests(data)
  }

  useEffect(()=>{
    if(user?.email === "admin@cloudstoragepro.fr"){
      loadAllRequests()
    }
  },[user])

  return (
    <>
    <header>
      <img src={logo}/>
      <nav>
        <a>Accueil</a>
        <a>Fonctionnalités</a>
        <a>Tarifs</a>
        <a>Contact</a>
      </nav>
      {user ?
        <button className="btn" onClick={signOut}>Déconnexion</button>
        :
        <></>
      }
    </header>

    <section className="hero">
      <div className="hero-text">
        <h1>Stockage Cloud Sécurisé</h1>
        <p>Stockez et sauvegardez vos fichiers en toute sécurité.</p>
        {!user &&
          <>
            <input placeholder="Email" onChange={e=>setEmail(e.target.value)} />
            <input type="password" placeholder="Mot de passe" onChange={e=>setPassword(e.target.value)} />
            <br/>
            <button className="btn" onClick={signIn}>Connexion</button>
            <button className="btn" onClick={signUp}>Créer un compte</button>
          </>
        }
      </div>

      <div className="cloud-card">
        <img src={logo}/>
        <h3>Cloud sécurisé</h3>
        <p>Synchronisation & sauvegarde</p>
      </div>
    </section>

    {user &&
      <section className="section">
        <div className="client-box">
          <h2>Espace client</h2>
          <p>Bienvenue {user.email}</p>

          <div className="status">Connecté ✔</div>

          <p>Abonnement : {subscription ?? "Aucun choisi"}</p>

          {!subscription &&
            <>
              <div className="offer">
                <b>Basique - 4.99€/mois</b>
                <button onClick={()=>requestPlan("Basique")}>Choisir</button>
              </div>
              <div className="offer">
                <b>Pro - 9.99€/mois</b>
                <button onClick={()=>requestPlan("Pro")}>Choisir</button>
              </div>
              <div className="offer">
                <b>Premium - 19.99€/mois</b>
                <button onClick={()=>requestPlan("Premium")}>Choisir</button>
              </div>
            </>
          }

          {subscription &&
            <div className="offer">
              Offre actuelle : <b>{subscription}</b><br/>
              <button onClick={()=>setSubscription(null)}>Changer mon abonnement</button>
            </div>
          }

          {user.email === "admin@cloudstoragepro.fr" &&
            <div className="admin">
              <h3>Panneau Admin</h3>
              {requests.map(r=>(
                <p key={r.id}>{r.email} → {r.plan}</p>
              ))}
            </div>
          }

        </div>
      </section>
    }
    </>
  )
}
