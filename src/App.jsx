import { useEffect, useState } from "react"
import { supabase } from "./supabaseClient"
import logo from "/logo.png"

export default function App() {

  const [user, setUser] = useState(null)
  const [showAuth, setShowAuth] = useState(false)
  const [isSignup, setIsSignup] = useState(false)
  const [loading, setLoading] = useState(false)

  const [email,setEmail] = useState("")
  const [password,setPassword] = useState("")
  const [firstName,setFirstName] = useState("")
  const [lastName,setLastName] = useState("")

  const [plan,setPlan] = useState(null)
  const [subsCount,setSubsCount] = useState(0)

  // --- LOAD SESSION ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    fetchGlobalCounter()
    loadPlanLocal()
  }, [])

  // --- GLOBAL COUNTER ---
  async function fetchGlobalCounter() {
    const { data } = await supabase
      .from("subscriptions_counter")
      .select("total")
      .eq("id",1)
      .single()

    if(data) setSubsCount(data.total)
  }

  async function incrementGlobalCounter(){
    const { data } = await supabase
      .from("subscriptions_counter")
      .select("total")
      .eq("id",1)
      .single()

    if(!data) return

    await supabase
      .from("subscriptions_counter")
      .update({ total: data.total + 1 })
      .eq("id",1)

    setSubsCount(data.total + 1)
  }

  // --- LOCAL PLAN ---
  function loadPlanLocal(){
    const p = localStorage.getItem("cloud_plan")
    if(p) setPlan(p)
  }

  function choosePlan(p){
    if(!plan){
      localStorage.setItem("cloud_plan",p)
      setPlan(p)
      incrementGlobalCounter()
      alert("Demande envoyée. Traitement sous 48h si place disponible.")
    }else{
      alert("Demande de changement envoyée. Traitement sous 48h.")
    }
  }

  // --- AUTH ---
  async function handleLogin(){
    setLoading(true)
    await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    setShowAuth(false)
  }

  async function handleSignup(){
    if(!firstName || !lastName){
      alert("Nom et prénom obligatoires")
      return
    }
    setLoading(true)
    await supabase.auth.signUp({
      email,
      password,
      options:{
        data:{
          first_name:firstName,
          last_name:lastName
        }
      }
    })
    setLoading(false)
    alert("Email de confirmation envoyé.")
    setShowAuth(false)
  }

  async function handleReset(){
    await supabase.auth.resetPasswordForEmail(email)
    alert("Email de réinitialisation envoyé.")
  }

  async function logout(){
    await supabase.auth.signOut()
  }

  // --- UI ---
  return (
    <>
      {/* NAV */}
      <div className="nav">
        <div className="navInner">
          <div className="brand">
            <img src={logo}/>
            CloudStoragePro
          </div>
          <div className="menu">
            <a>Accueil</a>
            <a>Fonctionnalités</a>
            <a>Tarifs</a>
            <a>Contact</a>
          </div>
          {!user &&
            <button className="btn btnPrimary" onClick={()=>setShowAuth(true)}>Connexion</button>
          }
          {user &&
            <button className="btn btnGhost" onClick={logout}>Déconnexion</button>
          }
        </div>
      </div>

      {/* HERO */}
      <div className="container hero">
        <div>
          <h1>Stockage Cloud Sécurisé<br/>Pour Vos Données</h1>
          <p>Stockez et sauvegardez vos fichiers en toute sécurité.</p>
          <div className="heroActions">
            <button className="btn btnPrimary">Voir les abonnements</button>
            {!user &&
              <button className="btn btnGhost" onClick={()=>setShowAuth(true)}>Connexion</button>
            }
          </div>
        </div>

        <div className="heroCard">
          <div className="heroLogoWrap">
            <img className="heroLogo" src={logo}/>
          </div>
          <b>Cloud sécurisé</b>
          <span>Synchronisation & sauvegarde</span>
          <div className="heroSubs">
            {subsCount} abonnements actifs
          </div>
        </div>
      </div>

      {/* SERVICES */}
      <div className="container">
        <h2 className="sectionTitle">Nos Services</h2>
        <div className="services">
          <div className="service"><div className="icon">☁️</div>Stockage évolutif</div>
          <div className="service"><div className="icon">🔒</div>Sécurité avancée</div>
          <div className="service"><div className="icon">⏱️</div>Accès 24/7</div>
        </div>
      </div>

      {/* PRICING */}
      <div className="container">
        <h2 className="sectionTitle">Choisissez votre abonnement</h2>

        <div className="pricing">

          <div className="plan">
            <div className="planTop">
              <div className="badge">Basique</div>
            </div>
            <div className="price">4.99€ <span className="per">/mois</span></div>
            <ul className="ul">
              <li>100 Go stockage</li>
              <li>Support standard</li>
            </ul>
            <button className="btn btnPrimary" onClick={()=>choosePlan("Basique")}>
              {plan ? "Changer mon abonnement" : "Choisir"}
            </button>
          </div>

          <div className="plan popular">
            <div className="planTop">
              <div className="badge">Pro</div>
            </div>
            <div className="price">9.99€ <span className="per">/mois</span></div>
            <ul className="ul">
              <li>1 To stockage</li>
              <li>Support prioritaire</li>
            </ul>
            <button className="btn btnPrimary" onClick={()=>choosePlan("Pro")}>
              {plan ? "Changer mon abonnement" : "Choisir"}
            </button>
          </div>

          <div className="plan">
            <div className="planTop">
              <div className="badge">Premium</div>
            </div>
            <div className="price">19.99€ <span className="per">/mois</span></div>
            <ul className="ul">
              <li>3 To stockage</li>
              <li>Support prioritaire</li>
            </ul>
            <button className="btn btnPrimary" onClick={()=>choosePlan("Premium")}>
              {plan ? "Changer mon abonnement" : "Choisir"}
            </button>
          </div>

        </div>
      </div>

      {/* CLIENT SPACE */}
      {user &&
      <div className="container">
        <div className="clientBox">
          <div>
            <h3 className="clientTitle">
              Bienvenue {user.user_metadata.first_name} {user.user_metadata.last_name} 👋
            </h3>
            <div className="clientEmail">{user.email}</div>

            <div className="clientCards">
              <div className="miniCard">
                <div className="miniLabel">Abonnement</div>
                <div className="miniValue">{plan ?? "Aucun choisi"}</div>
              </div>
              <div className="miniCard">
                <div className="miniLabel">Statut</div>
                <div className="miniValue">Connecté ✅</div>
              </div>
            </div>
          </div>

          <div className="clientRight">
            <button className="rightMain" onClick={()=>choosePlan(plan)}>
              Choisir / changer mon abonnement
            </button>
            <button className="rightLink">Mes fichiers (bientôt)</button>
          </div>
        </div>
      </div>
      }

      {/* FOOTER */}
      <div className="footer">
        © 2026 CloudStoragePro — Tous droits réservés
      </div>


      {/* AUTH MODAL */}
      {showAuth &&
        <div className="overlay">
          <div className="modal">
            <div className="modalHead">
              <div className="modalBrand">
                <img src={logo}/>
                CloudStoragePro
              </div>
              <button className="modalClose" onClick={()=>setShowAuth(false)}>✖</button>
            </div>

            {isSignup &&
            <>
              <div className="field">
                <div className="label">Prénom *</div>
                <input className="input" placeholder="Jean" onChange={e=>setFirstName(e.target.value)}/>
              </div>
              <div className="field">
                <div className="label">Nom *</div>
                <input className="input" placeholder="Dupont" onChange={e=>setLastName(e.target.value)}/>
              </div>
            </>
            }

            <div className="field">
              <div className="label">Email</div>
              <input className="input" placeholder="email@exemple.com" onChange={e=>setEmail(e.target.value)}/>
            </div>

            <div className="field">
              <div className="label">Mot de passe</div>
              <input className="input" type="password" onChange={e=>setPassword(e.target.value)}/>
            </div>

            <div className="modalActions">
              {!isSignup &&
                <button className="modalBtn modalBtnPrimary" disabled={loading} onClick={handleLogin}>
                  Se connecter
                </button>
              }
              {isSignup &&
                <button className="modalBtn modalBtnPrimary" disabled={loading} onClick={handleSignup}>
                  Créer un compte
                </button>
              }
            </div>

            <div className="smallRow">
              {!isSignup &&
                <button className="smallLink" onClick={()=>setIsSignup(true)}>Créer un compte</button>
              }
              {isSignup &&
                <button className="smallLink" onClick={()=>setIsSignup(false)}>Déjà un compte ?</button>
              }
              {!isSignup &&
                <button className="smallLink" onClick={handleReset}>Mot de passe oublié</button>
              }
            </div>

            <div className="notice">
              Confirmation email requise lors de l'inscription.
            </div>
          </div>
        </div>
      }
    </>
  )
}
