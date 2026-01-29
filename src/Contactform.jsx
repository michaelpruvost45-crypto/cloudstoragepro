import { useState } from "react"
import { supabase } from "./supabaseClient"

export default function ContactForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setSent(false)

    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Merci de remplir tous les champs.")
      return
    }

    setLoading(true)

    const { error: insertError } = await supabase.from("messages_contact").insert({
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
    })

    setLoading(false)

    if (insertError) {
      setError("❌ Erreur lors de l’envoi. Réessaie dans quelques secondes.")
      return
    }

    setSent(true)
    setName("")
    setEmail("")
    setMessage("")
  }

  return (
    <section className="contact-section" id="contact">
      <h2>Contactez-Nous</h2>

      <form className="contact-card" onSubmit={handleSubmit}>
        <input
          placeholder="Nom"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <textarea
          placeholder="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
        />

        {error && <div className="form-error">{error}</div>}
        {sent && <div className="form-success">✅ Message envoyé !</div>}

        <button type="submit" disabled={loading}>
          {loading ? "Envoi..." : "Envoyer"}
        </button>
      </form>
    </section>
  )
}
