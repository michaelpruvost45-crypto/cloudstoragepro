<form className="contact-form" onSubmit={sendContact}>
  <input
    name="name"
    placeholder="Nom"
    value={contact.name}
    onChange={handleContactChange}
    required
  />
  <input
    name="email"
    placeholder="Email"
    value={contact.email}
    onChange={handleContactChange}
    required
  />
  <textarea
    name="message"
    placeholder="Message"
    value={contact.message}
    onChange={handleContactChange}
    required
  />
  <button type="submit">Envoyer</button>
</form>

{messageStatus && <p className="status-message">{messageStatus}</p>}
