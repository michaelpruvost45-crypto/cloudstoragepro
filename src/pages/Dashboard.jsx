import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Dashboard(){
  const [profile,setProfile]=useState(null)

  useEffect(()=>{
    load()
  },[])

  async function load(){
    const { data:{user} } = await supabase.auth.getUser()
    const { data } = await supabase.from('profiles').select('*').eq('id',user.id).single()
    setProfile(data)
  }

  return (
    <section className="dashboard">
      <div className="dash-card">
        <h2>Bienvenue {profile?.first_name} {profile?.last_name} 👋</h2>
        <p>Email : {profile?.email}</p>
        <p>Abonnement : {profile?.plan}</p>
        <p>Status : 🟢 Connecté</p>

        <div className="dash-buttons">
          <button>Modifier mon profil</button>
          <button>Changer mon abonnement</button>
          <button disabled>Mes fichiers (bientôt)</button>
        </div>
      </div>
    </section>
  )
}
