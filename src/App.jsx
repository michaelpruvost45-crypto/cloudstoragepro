import { useState } from "react";
import "./styles.css";

export default function App() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    const form = e.target;
    const data = new FormData(form);

    try {
      const res = await fetch("https://formspree.io/f/XXXXX", {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        setSent(true);
        form.reset();
      } else {
        alert("Erreur lors de l'envoi du message.");
      }
    } catch (err) {
      alert("Erreur réseau.");
    }

    setLoading(false);
  }

  return (
    <div>
      {/* SECTION CONTACT */}

      <section id="contact" className="section">
        <div className="container">

          {!sent ? (
            <>
              <h2 className="section_title">Contactez-Nous</h2>

              <form className="contactForm" onSubmit={handleSubmit}>
                <input
                  name="name"
                  placeholder="Nom"
                  required
                />

                <input
                  name="email"
                  type="email"
                  placeholder="Email"
                  required
                />

                <textarea
                  name="message"
                  placeholder="Message"
                  rows="5"
                  required
                ></textarea>

                <button type="submit" disabled={loading}>
                  {loading ? "Envoi..." : "Envoyer"}
                </button>
              </form>
            </>
          ) : (
            <div className="thankyou">
              <h2>✅ Merci pour votre message</h2>
              <p>Nous vous répondrons dans les plus brefs délais.</p>

              <button onClick={() => setSent(false)}>
                Envoyer un autre message
              </button>
            </div>
          )}

        </div>
      </section>
    </div>
  );
}
