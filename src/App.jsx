import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";
import "./styles.css";

export default function App() {
  // ------- FORMULAIRE CONTACT -------
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactLoading, setContactLoading] = useState(false);
  const [contactStatus, setContactStatus] = useState({ type: "", text: "" });

  const isContactValid = useMemo(() => {
    const nameOk = contactName.trim().length >= 2;
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim());
    const msgOk = contactMessage.trim().length >= 5;
    return nameOk && emailOk && msgOk;
  }, [contactName, contactEmail, contactMessage]);

  async function handleContactSubmit(e) {
    e.preventDefault();
    setContactStatus({ type: "", text: "" });

    if (!isContactValid) {
      setContactStatus({
        type: "error",
        text: "Merci de remplir correctement le nom, l’email et le message.",
      });
      return;
    }

    try {
      setContactLoading(true);

      const payload = {
        name: contactName.trim(),
        email: contactEmail.trim(),
        message: contactMessage.trim(),
      };

      const { error } = await supabase.from("messages_contact").insert(payload);

      if (error) {
        // Souvent: RLS pas activé/policy manquante, ou table pas créée
        throw new Error(error.message);
      }

      setContactStatus({
        type: "success",
        text: "✅ Message envoyé ! Nous vous répondrons rapidement.",
      });

      setContactName("");
      setContactEmail("");
      setContactMessage("");
    } catch (err) {
      setContactStatus({
        type: "error",
        text:
          "❌ Impossible d’envoyer le message. Vérifie Supabase (table + RLS + policy). Détail: " +
          (err?.message || "Erreur inconnue"),
      });
    } finally {
      setContactLoading(false);
    }
  }

  // ------- PAGE (tu peux garder ton design actuel) -------
  // Ici je te mets une structure simple + la section Contact,
  // si tu as déjà toute ta landing page, tu peux juste copier la section <section id="contact">…</section>

  return (
    <div className="page">
      {/* ✅ Tu peux garder ton header / hero / tarifs etc. */}
      {/* --- SECTION CONTACT --- */}
      <section id="contact" className="contactSection">
        <h2 className="sectionTitle">Contactez-Nous</h2>

        <div className="contactCard">
          <form className="contactForm" onSubmit={handleContactSubmit}>
            <input
              className="input"
              type="text"
              placeholder="Nom"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              autoComplete="name"
            />

            <input
              className="input"
              type="email"
              placeholder="Email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              autoComplete="email"
            />

            <textarea
              className="textarea"
              placeholder="Message"
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              rows={5}
            />

            {contactStatus.text ? (
              <div
                className={
                  contactStatus.type === "success"
                    ? "alert success"
                    : "alert error"
                }
              >
                {contactStatus.text}
              </div>
            ) : null}

            <button
              className="btnPrimary"
              type="submit"
              disabled={contactLoading || !isContactValid}
            >
              {contactLoading ? "Envoi..." : "Envoyer"}
            </button>

            <div className="hint">
              Les messages sont enregistrés dans Supabase →{" "}
              <b>messages_contact</b>.
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
