import { supabase } from '../lib/supabase'
import { useEffect, useState } from 'react'

export default function Pricing() {
  const [plan, setPlan] = useState(null)

  useEffect(()=>{
    load()
  },[])

  async function load() {
    const { data: { user }} = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
    setPlan(data.plan)
  }

  async function choosePlan(p) {
    const { data: { user }} = await supabase.auth.getUser()

    await supabase.from('profiles').update({ plan: p }).eq('id', user.id)

    alert("Demande envoyée à l'équipe technique. Activation sous 48h si disponible.")
    load()
  }

  const card = (name, price) => (
    <div className="card">
      <h3>{name}</h3>
      <p>{price}€/mois</p>

      {plan === name ? (
        <button disabled>Abonnement actif</button>
      ) : plan && plan !== 'Aucun' ? (
        <button onClick={()=>choosePlan(name)}>Changer mon abonnement</button>
      ) : (
        <button onClick={()=>choosePlan(name)}>Choisir</button>
      )}
    </div>
  )

  return (
    <div className="pricing">
      {card("Basique",4.99)}
      {card("Pro",9.99)}
      {card("Premium",19.99)}
    </div>
  )
}
