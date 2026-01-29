import { useState } from "react"
import { supabase } from "./supabaseClient"
import "./styles.css"
import logo from "/logo.png"

export default function App() {

  // ---- FORMULAIRE CONTACT ----
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    message: ""
  })

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setSuccess("")

    const { error } = await supabase
      .from("messages_contact")
      .insert([{
        nom: formData.nom,
        email: formData.email,
        message: formData.message
      }])

    setLoading(false)

    if (error) {
      alert("Erreur : " + error.message)
    } else {
      setSuccess("✅ Message envoyé avec succès !")
      setFormData({ nom: "", email: "", message: "" })
    }
  }

  // ---- UI ----
  return (
    <>
      {/* HEADER */}
      <header className="topbar">
        <div className="logo">
          <img src={logo} alt="CloudStoragePro" />
          CloudStoragePro
        </div>
        <nav>
          <a href="#top">Accueil</a>
          <a href="#features">Fonctionnalités</a>
          <a href="#pricing">Tarifs</a>
          <a href="#contact">Contact</a>
        </nav>
        <button className="btn">Connexion</button>
      </header>

      {/* HERO */}
      <section id="top" className="hero">
        <div className="hero-text">
          <h1>Stockage Cloud Sécurisé<br />Pour Vos Données</h1>
          <p>Stockez et sauvegardez vos fichiers en toute sécurité.</p>
          <div className="hero-buttons">
            <button className="btn-primary">Voir les abonnements</button>
            <button className="btn-outline">Connexion</button>
          </div>
        </div>

        <div className="hero-card">
          <img src={logo} alt="logo" />
          <h3>Cloud sécurisé</h3>
          <p>Synchronisation & sauvegarde</p>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="section">
        <h2>Contactez-Nous</h2>

        <form className="contactForm" onSubmit={handleSubmit}>
          <input
            name="nom"
            placeholder="Nom"
            value={formData.nom}
            onChange={handleChange}
            required
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <textarea
            name="message"
            placeholder="Message"
            value={formData.message}
            onChange={handleChange}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Envoi..." : "Envoyer"}
          </button>

          {success && <p className="success">{success}</p>}
        </form>
      </section>

      <footer className="footer">
        © 2026 CloudStoragePro — Tous droits réservés
      </footer>
    </>
  )
}
