import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function AdminPanel() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    setUsers(data || []);
  }

  async function accept(user) {
    await supabase
      .from("profiles")
      .update({
        subscription: user.request_note,
        request_status: "accepted",
        request_handled_at: new Date().toISOString()
      })
      .eq("id", user.id);

    load();
  }

  async function refuse(user) {
    await supabase
      .from("profiles")
      .update({
        request_status: "refused",
        request_handled_at: new Date().toISOString()
      })
      .eq("id", user.id);

    load();
  }

  return (
    <div style={{ padding: 40 }}>
      <h2>Panneau Admin</h2>

      {users.map(u => (
        <div key={u.id} style={{
          border:"1px solid #ddd",
          padding:20,
          marginBottom:10,
          borderRadius:10
        }}>
          <b>{u.email}</b>
          <br/>
          Abonnement : {u.subscription || "Aucun"}
          <br/>
          Demande : {u.request_status || "Aucune"}

          {u.request_status === "pending" && (
            <div style={{ marginTop:10 }}>
              <button onClick={()=>accept(u)}>✅ Accepter</button>
              <button onClick={()=>refuse(u)} style={{marginLeft:10}}>❌ Refuser</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
