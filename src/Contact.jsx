import "./styles.css";

export default function Contact() {
  return (
    <div className="contactPage">
      <h2>Contactez-Nous</h2>

      <form
        className="contactForm"
        action="https://formsubmit.co/contact@michaelcreation.fr"
        method="POST"
      >
        <input type="hidden" name="_captcha" value="false" />

        <input name="name" placeholder="Nom" required />
        <input name="email" type="email" placeholder="Email" required />
        <textarea name="message" placeholder="Message" rows="5" required />

        <button type="submit">Envoyer</button>
      </form>
    </div>
  );
}
