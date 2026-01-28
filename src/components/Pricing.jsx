import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Pricing() {
  const [plan, setPlan] = useState("Aucun")

  useEffect(()=>{
    loadPlan()
  },[])

  async function loadPlan(){
    const { data:{user} } = await supabase.auth.getUser()
    if(!user) return
    const { data } = await supabase.from('profiles').select('plan').eq('id',user.id).single()
    if(data) setPlan(data.plan)
  }

  async function choosePlan(p){
    const { data:{user} } = await supabase.auth.getUser()
    if(!user){
      alert("Connecte-toi d'abord 🙂")
      return
    }

    await supabase.from('profiles').update({plan:p}).eq('id',user.id)
    alert("Demande envoyée. Activation sous 48h si disponible.")
    loadPlan()
  }

  const card = (name, price, space) => (
    <div className={`price-card ${plan===name ? 'active' : ''}`}>
      <h3>{name}</h3>
      <h2>{price}€ / mois</h2>
      <p>{space} de stockage</p>

      {plan === name ? (
        <button disabled>Abonnement actif</button>
      ) : plan !== "Aucun" ? (
        <button onClick={()=>choosePlan(name)}>Changer mon abonnement</button>
      ) : (
        <button onClick={()=>choosePlan(name)}>Choisir</button>
      )}
    </div>
  )

  return (
    <section className="pricing">
      {card("Basique",4.99,"100 Go")}
      {card("Pro",9.99,"1 To")}
      {card("Premium",19.99,"3 To")}
    </section>
  )
}
