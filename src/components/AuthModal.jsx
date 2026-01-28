import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthModal({ onClose }) {
  const [mode,setMode] = useState("login")
  const [email,setEmail]=useState("")
  const [password,setPassword]=useState("")
  const [first,setFirst]=useState("")
  const [last,setLast]=useState("")
  const [msg,setMsg]=useState("")

  async function signup(){
    if(!first || !last){
      setMsg("Nom et prénom obligatoires")
      return
    }

    const { data, error } = await supabase.auth.signUp({email,password})
    if(error) return setMsg(error.message)

    await supabase.from('profiles').insert({
      id:data.user.id,
      first_name:first,
      last_name:last,
      plan:"Aucun"
    })

    setMsg("Email de confirmation envoyé ✅")
  }

  async function login(){
    const {error} = await supabase.auth.signInWithPassword({email,password})
    if(error) setMsg(error.message)
    else location.reload()
  }

  async function reset(){
    await supabase.auth.resetPasswordForEmail(email)
    setMsg("Email de réinitialisation envoyé")
  }

  async function resend(){
    await supabase.auth.resend({ type:"signup", email })
    setMsg("Email de confirmation renvoyé")
  }

  return (
    <div className="modal-bg">
      <div className="modal">

        <h2>
          {mode==="login" && "Connexion"}
          {mode==="signup" && "Inscription"}
          {mode==="reset" && "Mot de passe oublié"}
        </h2>

        {mode==="signup" && (
          <>
            <input placeholder="Nom * (ex: Martin)" onChange={e=>setLast(e.target.value)}/>
            <input placeholder="Prénom * (ex: Lucas)" onChange={e=>setFirst(e.target.value)}/>
          </>
        )}

        <input placeholder="Email" onChange={e=>setEmail(e.target.value)}/>
        {mode!=="reset" && (
          <input type="password" placeholder="Mot de passe" onChange={e=>setPassword(e.target.value)}/>
        )}

        {mode==="login" && <button onClick={login}>Se connecter</button>}
        {mode==="signup" && <button onClick={signup}>Créer un compte</button>}
        {mode==="reset" && <button onClick={reset}>Envoyer</button>}

        <p className="msg">{msg}</p>

        {mode==="login" && (
          <>
            <p onClick={()=>setMode("reset")}>Mot de passe oublié ?</p>
            <p onClick={resend}>Renvoyer email confirmation</p>
            <p onClick={()=>setMode("signup")}>Créer un compte</p>
          </>
        )}

        <p onClick={onClose}>Fermer</p>
      </div>
    </div>
  )
}
