import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthModal({ onClose }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [message, setMessage] = useState('')

  const signUp = async () => {
    if (!firstName || !lastName) {
      setMessage("Nom et prénom obligatoires")
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) return setMessage(error.message)

    await supabase.from('profiles').insert({
      id: data.user.id,
      first_name: firstName,
      last_name: lastName,
      plan: 'Aucun'
    })

    setMessage("Email de confirmation envoyé ✅")
  }

  const login = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setMessage(error.message)
    else window.location.reload()
  }

  const resetPassword = async () => {
    await supabase.auth.resetPasswordForEmail(email)
    setMessage("Email de réinitialisation envoyé")
  }

  const resendConfirmation = async () => {
    await supabase.auth.resend({
      type: 'signup',
      email
    })
    setMessage("Email renvoyé")
  }

  return (
    <div className="modal">
      <div className="box">
        <h2>{mode === 'login' ? 'Connexion' : mode === 'signup' ? 'Inscription' : 'Mot de passe oublié'}</h2>

        {mode === 'signup' && (
          <>
            <input placeholder="Nom * (ex: Dupont)" onChange={e=>setLastName(e.target.value)} />
            <input placeholder="Prénom * (ex: Jean)" onChange={e=>setFirstName(e.target.value)} />
          </>
        )}

        <input placeholder="Email" onChange={e=>setEmail(e.target.value)} />
        {mode !== 'reset' && (
          <input type="password" placeholder="Mot de passe" onChange={e=>setPassword(e.target.value)} />
        )}

        {mode === 'login' && <button onClick={login}>Se connecter</button>}
        {mode === 'signup' && <button onClick={signUp}>Créer un compte</button>}
        {mode === 'reset' && <button onClick={resetPassword}>Envoyer</button>}

        <p style={{color:'red'}}>{message}</p>

        {mode === 'login' && (
          <>
            <p onClick={()=>setMode('reset')}>Mot de passe oublié ?</p>
            <p onClick={resendConfirmation}>Renvoyer email de confirmation</p>
            <p onClick={()=>setMode('signup')}>Créer un compte</p>
          </>
        )}

        <p onClick={onClose}>Fermer</p>
      </div>
    </div>
  )
}
