import { useEffect, useState } from "react"
import { supabase } from "./supabaseClient"

export default function AdminRequests() {
  const [requests, setRequests] = useState([])

  useEffect(() => {
    loadRequests()
  }, [])

  async function loadRequests() {
    const { data, error } = await supabase
      .from("demandes_abonnement")
      .select("*")
      .order("créé_à", { ascending: false })

    if (!error) setRequests(data)
  }

  return (
    <div className="admin-box">
      <h2>📩 Demandes d’abonnement</h2>

      {requests.length === 0 && (
        <p>Aucune demande pour le moment.</p>
      )}

      {requests.map((r) => (
        <div key={r.identifiant} className="admin-row">
          <div>
            <b>{r.email}</b>
            <span> → {r.plan}</span>
          </div>
          <small>
            {new Date(r["créé_à"]).toLocaleString()}
          </small>
        </div>
      ))}
    </div>
  )
}
