{/* CONTACT FORM (FormSubmit) */}
<section id="contact" className="section-soft">
  <div className="container">
    <h2 className="section-title">Contactez-nous</h2>

    <form
      className="contactForm"
      action="https://formsubmit.co/contact@cloudstoragepro.fr"
      method="POST"
    >
      {/* Désactive le captcha FormSubmit */}
      <input type="hidden" name="_captcha" value="false" />

      {/* Redirection après envoi */}
      <input
        type="hidden"
        name="_next"
        value="https://TON-SITE.vercel.app/merci.html"
      />

      <input
        type="text"
        name="name"
        placeholder="Votre nom"
        required
      />

      <input
        type="email"
        name="email"
        placeholder="Votre email"
        required
      />

      <textarea
        name="message"
        placeholder="Votre message"
        required
      ></textarea>

      <button type="submit">
        Envoyer
      </button>
    </form>
  </div>
</section>
