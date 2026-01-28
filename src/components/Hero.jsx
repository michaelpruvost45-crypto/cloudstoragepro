export default function Hero({ onLogin }) {
  return (
    <section className="hero">
      <div className="hero-text">
        <h1>Stockage Cloud Sécurisé<br/>Pour Vos Données</h1>
        <p>Stockez et sauvegardez vos fichiers en toute sécurité sur CloudStoragePro.</p>

        <div className="hero-buttons">
          <button className="btn-primary">Voir les abonnements</button>
          <button className="btn-outline" onClick={onLogin}>Connexion</button>
        </div>
      </div>

      <div className="hero-card">
        <h3>Cloud sécurisé</h3>
        <p>Synchronisation & sauvegarde</p>
      </div>
    </section>
  )
}
