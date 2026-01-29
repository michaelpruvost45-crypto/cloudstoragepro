import React, { useEffect, useMemo, useState } from "react"
import { supabase } from "./supabaseClient"

const BRAND = {
  name: "CloudStoragePro",
  plans: [
    { id: "basique", name: "Basique", cap: "100 Go", price: "4,99€", features: ["100 Go de stockage", "Cryptage basique", "Support standard"], popular: false },
    { id: "pro", name: "Pro", cap: "1 To", price: "9,99€", features: ["1 To de stockage", "Sauvegarde automatique", "Sécurité renforcée"], popular: true },
    { id: "premium", name: "Premium", cap: "3 To", price: "19,99€", features: ["3 To de stockage", "Cryptage avancé", "Support prioritaire"], popular: false }
  ]
}

function safeName(first, last) {
  const f = (first || "").trim()
  const l = (last || "").trim()
  return `${f} ${l}`.trim()
}

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState({ firstName: "", lastName: "" })
  const [plan, setPlan] = useState(null) // abonnement choisi (stocké en localStorage)
  const [modalOpen, setModalOpen] = useState(false)

  // Auth form
  const [mode, setMode] = useState("login") // login | signup
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState("")

  const userEmail = session?.user?.email || ""
  const fullName = useMemo(() => {
    const fromProfile = safeName(profile.firstName, profile.lastName)
    return fromProfile || "Client"
  }, [profile])

  // Load local plan per user
  useEffect(() => {
    const key = userEmail ? `csp_plan_${userEmail}` : null
    if (!key) return
    const saved = localStorage.getItem(key)
    setPlan(saved || null)
  }, [userEmail])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session || null))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  // Load profile names from localStorage (simple, sans DB)
  useEffect(() => {
    if (!userEmail) return
    const key = `csp_profile_${userEmail}`
    const saved = localStorage.getItem(key)
    if (saved) {
      try {
        const obj = JSON.parse(saved)
        setProfile({ firstName: obj.firstName || "", lastName: obj.lastName || "" })
      } catch {}
    }
  }, [userEmail])

  function saveProfileLocal(fn, ln) {
    if (!userEmail) return
    const key = `csp_profile_${userEmail}`
    localStorage.setItem(key, JSON.stringify({ firstName: fn, lastName: ln }))
    setProfile({ firstName: fn, lastName: ln })
  }

  function savePlanLocal(planId) {
    if (!userEmail) return
    const key = `csp_plan_${userEmail}`
    localStorage.setItem(key, planId)
    setPlan(planId)
  }

  function resetModalFields() {
    setMsg("")
    setFirstName("")
    setLastName("")
    setEmail("")
    setPassword("")
  }

  function openLogin() {
    setMode("login")
    resetModalFields()
    setModalOpen(true)
  }

  function openSignup() {
    setMode("signup")
    resetModalFields()
    setModalOpen(true)
  }

  async function handleLogin(e) {
    e.preventDefault()
    setBusy(true)
    setMsg("")
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      setModalOpen(false)
    } catch (err) {
      setMsg(err?.message || "Erreur de connexion.")
    } finally {
      setBusy(false)
    }
  }

  async function handleSignup(e) {
    e.preventDefault()
    setBusy(true)
    setMsg("")

    // ✅ Nom & prénom obligatoires
    const fn = firstName.trim()
    const ln = lastName.trim()
    if (!fn || !ln) {
      setBusy(false)
      setMsg("Veuillez renseigner le prénom et le nom (obligatoires).")
      return
    }

    try {
      // On enregistre le profil en local immédiatement
      // (et on le retrouve après connexion)
      // Ça évite une DB pour l'instant.
      // Supabase s'occupe de l'email confirmation.
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw error

      // sauve profil local par email (même avant confirmation)
      localStorage.setItem(`csp_profile_${email}`, JSON.stringify({ firstName: fn, lastName: ln }))

      setMsg("Compte créé ✅ Vérifiez votre email pour confirmer l’inscription.")
      // On reste dans la modal pour permettre "Renvoyer email"
    } catch (err) {
      setMsg(err?.message || "Erreur lors de l’inscription.")
    } finally {
      setBusy(false)
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setMsg("Entrez votre email d’abord.")
      return
    }
    setBusy(true)
    setMsg("")
    try {
      // IMPORTANT: configure l'URL de redirection dans Supabase Auth (voir plus bas)
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin
      })
      if (error) throw error
      setMsg("Email de réinitialisation envoyé ✅ (si l’adresse existe).")
    } catch (err) {
      setMsg(err?.message || "Impossible d’envoyer l’email.")
    } finally {
      setBusy(false)
    }
  }

  async function handleResendConfirmation() {
    if (!email.trim()) {
      setMsg("Entrez votre email d’abord.")
      return
    }
    setBusy(true)
    setMsg("")
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email
      })
      if (error) throw error
      setMsg("Email de confirmation renvoyé ✅ Vérifiez votre boîte mail.")
    } catch (err) {
      setMsg(err?.message || "Impossible de renvoyer l’email.")
    } finally {
      setBusy(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  function onChoosePlan(planId) {
    if (!session) {
      // si pas connecté => on ouvre connexion
      openLogin()
      return
    }

    // si plan déjà choisi : on demande changement
    if (plan && plan !== planId) {
      savePlanLocal(planId)
      alert("Demande envoyée à l’équipe technique ✅\nLe changement sera effectué sous 48h si place disponible.")
      return
    }

    // si aucun plan : choisir
    if (!plan) {
      savePlanLocal(planId)
      alert("Demande envoyée à l’équipe technique ✅\nActivation sous 48h si place disponible.")
    }
  }

  const currentPlanName = useMemo(() => {
    if (!plan) return "Aucun choisi"
    const p = BRAND.plans.find(x => x.id === plan)
    return p ? p.name : "Aucun choisi"
  }, [plan])

  return (
    <>
      {/* NAV */}
      <div className="nav">
        <div className="navInner">
          <div className="brand">
            <img src="/logo.png" alt="logo" />
            <span>{BRAND.name}</span>
          </div>

          <div className="menu">
            <a href="#accueil">Accueil</a>
            <a href="#fonctionnalites">Fonctionnalités</a>
            <a href="#tarifs">Tarifs</a>
            <a href="#contact">Contact</a>
          </div>

          <div className="navRight">
            {!session ? (
              <button className="btn btnPrimary" onClick={openLogin}>Connexion</button>
            ) : (
              <button className="btn btnGhost" onClick={handleLogout}>Déconnexion</button>
            )}
          </div>
        </div>
      </div>

      <div className="container" id="accueil">
        {/* HERO */}
        <div className="hero">
          <div>
            <h1>Stockage Cloud Sécurisé<br />Pour Vos Données</h1>
            <p>
              Stockez et sauvegardez vos fichiers en toute sécurité sur notre plateforme {BRAND.name}.
            </p>

            <div className="heroActions">
              <button className="btn btnPrimary" onClick={() => document.getElementById("tarifs")?.scrollIntoView({ behavior: "smooth" })}>
                Voir les abonnements
              </button>
              {!session ? (
                <button className="btn btnGhost" onClick={openLogin}>Connexion</button>
              ) : (
                <button className="btn btnGhost" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                  Espace client
                </button>
              )}
            </div>
          </div>

          <div className="heroCard" aria-hidden="true">
            <div>
              <b>Cloud sécurisé</b>
              <span>Synchronisation & sauvegarde</span>
            </div>
          </div>
        </div>

        {/* ✅ ESPACE CLIENT (UNIQUEMENT SI CONNECTÉ) */}
        {session && (
          <div className="clientBox" style={{ marginTop: 18 }}>
            <div className="clientLeft">
              <h2 className="clientTitle">Espace client</h2>
              <div className="clientHello">
                Bienvenue <strong>{fullName}</strong> <span>👋</span>
                <div className="clientEmail">{userEmail}</div>
              </div>

              <div className="clientCards">
                <div className="miniCard">
                  <div className="miniLabel">Abonnement</div>
                  <div className="miniValue">{currentPlanName}</div>
                </div>
                <div className="miniCard">
                  <div className="miniLabel">Statut</div>
                  <div className="miniValue">Connecté ✅</div>
                </div>
              </div>
            </div>

            <div className="clientRight">
              <button className="rightMain" onClick={() => document.getElementById("tarifs")?.scrollIntoView({ behavior: "smooth" })}>
                Choisir / changer mon abonnement
              </button>
              <button className="rightLink" disabled>
                Mes fichiers (bientôt)
              </button>
            </div>
          </div>
        )}

        {/* SERVICES */}
        <div id="fonctionnalites">
          <div className="sectionTitle">Nos Services</div>
          <div className="services">
            <div className="service">
              <div className="icon">☁️</div>
              <b>Stockage Évolutif</b>
              <p>Espace extensible selon vos besoins</p>
            </div>
            <div className="service">
              <div className="icon">🛡️</div>
              <b>Sécurité Avancée</b>
              <p>Cryptage & protection de vos données</p>
            </div>
            <div className="service">
              <div className="icon">⏱️</div>
              <b>Accès 24/7</b>
              <p>Accédez à vos fichiers à tout moment</p>
            </div>
          </div>
        </div>

        {/* PRICING */}
        <div id="tarifs">
          <div className="sectionTitle">Choisissez Votre Abonnement</div>
          <div className="pricing">
            {BRAND.plans.map((p) => (
              <div key={p.id} className={"plan" + (p.popular ? " popular" : "")}>
                <div className="planTop">
                  <span className="badge">{p.cap}</span>
                  {p.popular && <span className="badge">Le plus populaire</span>}
                </div>
                <h3>{p.name}</h3>
                <div className="price">{p.price} <span className="per">/ mois</span></div>
                <ul className="ul">
                  {p.features.map((f) => <li key={f}>✓ {f}</li>)}
                </ul>

                {/* ✅ logique : si connecté + plan déjà choisi => bouton change / sinon choisir */}
                <div style={{ marginTop: 14 }}>
                  <button
                    className="btn btnPrimary"
                    style={{ width: "100%" }}
                    onClick={() => onChoosePlan(p.id)}
                  >
                    {!session
                      ? "Connexion"
                      : !plan
                        ? "Choisir"
                        : plan === p.id
                          ? "Abonnement actuel"
                          : "Changer mon abonnement"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="smallNote">
            Si vous demandez un changement d’abonnement, la demande est envoyée à l’équipe technique et sera traitée sous 48h si place disponible.
          </div>
        </div>

        {/* CONTACT */}
        <div id="contact">
          <div className="sectionTitle">Contactez-Nous</div>
          <div style={{
            background: "white",
            border: "1px solid #e8eefc",
            borderRadius: 18,
            padding: 18,
            maxWidth: 720,
            margin: "0 auto",
            boxShadow: "0 10px 28px rgba(17,24,39,.06)"
          }}>
            <div style={{ display: "grid", gap: 10 }}>
              <input className="input" style={{ background: "#f7f9ff", color: "#0b1220", border: "1px solid #e8eefc" }} placeholder="Nom" />
              <input className="input" style={{ background: "#f7f9ff", color: "#0b1220", border: "1px solid #e8eefc" }} placeholder="Email" />
              <textarea className="input" rows="4" style={{ background: "#f7f9ff", color: "#0b1220", border: "1px solid #e8eefc" }} placeholder="Message" />
              <button className="btn btnPrimary" style={{ width: 220, margin: "0 auto" }}>Envoyer</button>
            </div>
          </div>
        </div>

        <div className="footer">© 2026 {BRAND.name} — Tous droits réservés</div>
      </div>

      {/* MODAL AUTH */}
      {modalOpen && (
        <div className="overlay" onMouseDown={() => setModalOpen(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modalHead">
              <div className="modalBrand">
                <img src="/logo.png" alt="logo" />
                <div>
                  <div style={{ fontWeight: 900 }}>{BRAND.name}</div>
                  <div style={{ fontSize: 12, opacity: .9 }}>Espace client</div>
                </div>
              </div>
              <button className="modalClose" onClick={() => setModalOpen(false)}>×</button>
            </div>

            <div className="modalBody">
              {mode === "login" ? (
                <form onSubmit={handleLogin}>
                  <div style={{ fontWeight: 900, marginBottom: 10 }}>Connexion</div>

                  <div className="field">
                    <div className="label">Email</div>
                    <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ex: client@exemple.com" />
                  </div>

                  <div className="field">
                    <div className="label">Mot de passe</div>
                    <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                  </div>

                  <div className="modalActions">
                    <button className="modalBtn modalBtnPrimary" disabled={busy} type="submit">
                      {busy ? "Connexion..." : "Se connecter"}
                    </button>
                    <button className="modalBtn modalBtnGhost" type="button" onClick={openSignup}>
                      Créer un compte
                    </button>
                  </div>

                  {/* ✅ Sous “mot de passe oublié” => renvoyer email */}
                  <div className="smallRow">
                    <button className="smallLink" type="button" onClick={handleForgotPassword}>
                      Mot de passe oublié
                    </button>
                    <button className="smallLink" type="button" onClick={handleResendConfirmation}>
                      Renvoyer l’email de confirmation
                    </button>
                  </div>

                  {msg && <div className="notice">{msg}</div>}
                </form>
              ) : (
                <form onSubmit={handleSignup}>
                  <div style={{ fontWeight: 900, marginBottom: 10 }}>Créer un compte</div>

                  <div className="row2">
                    <div className="field">
                      <div className="label">Prénom <span style={{ color: "#fff" }}>*</span></div>
                      <input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="ex: Alex" />
                    </div>
                    <div className="field">
                      <div className="label">Nom <span style={{ color: "#fff" }}>*</span></div>
                      <input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="ex: Martin" />
                    </div>
                  </div>

                  <div className="field">
                    <div className="label">Email</div>
                    <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ex: client@exemple.com" />
                  </div>

                  <div className="field">
                    <div className="label">Mot de passe</div>
                    <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                  </div>

                  <div className="modalActions">
                    <button className="modalBtn modalBtnPrimary" disabled={busy} type="submit">
                      {busy ? "Création..." : "Créer le compte"}
                    </button>
                    <button className="modalBtn modalBtnGhost" type="button" onClick={openLogin}>
                      Déjà un compte ? Se connecter
                    </button>
                  </div>

                  <div className="smallRow">
                    <button className="smallLink" type="button" onClick={handleResendConfirmation}>
                      Renvoyer l’email de confirmation
                    </button>
                  </div>

                  {msg && <div className="notice">{msg}</div>}
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
