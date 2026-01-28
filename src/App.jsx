function Pricing({ onOpenAuth, isLoggedIn }) {
  const plans = useMemo(
    () => [
      {
        name: "Basique",
        price: "4,99",
        per: "/ mois",
        features: ["100 Go de stockage", "Cryptage basique", "Support standard"],
        cta: "CHOISIR",
        highlight: false,
      },
      {
        name: "Pro",
        price: "9,99",
        per: "/ mois",
        features: ["1 To de stockage", "Sauvegarde automatique", "Sécurité renforcée"],
        cta: "CHOISIR",
        highlight: true,
        badge: "Le Plus Populaire",
      },
      {
        name: "Premium",
        price: "19,99",
        per: "/ mois",
        features: ["3 To de stockage", "Cryptage avancé", "Support prioritaire"],
        cta: "CHOISIR",
        highlight: false,
      },
    ],
    []
  );

  function handleChoose(planName) {
    if (!isLoggedIn) {
      onOpenAuth();
      return;
    }
    alert(`✅ Tu es connecté. Offre sélectionnée : ${planName}\n(Paiement Stripe/PayPal à ajouter ensuite)`);
  }

  return (
    <section id="pricing" className="section section--soft">
      <div className="container">
        <h2 className="section__title">Choisissez Votre Abonnement</h2>

        <div className="pricingGrid">
          {plans.map((p) => (
            <div key={p.name} className={`priceCard ${p.highlight ? "priceCard--pro" : ""}`}>
              {p.badge && <div className="priceCard__badge">{p.badge}</div>}

              <div className="priceCard__name">{p.name}</div>

              <div className="priceCard__price">
                <span className="priceCard__currency">€</span>
                <span className="priceCard__amount">{p.price}</span>
                <span className="priceCard__per"> {p.per}</span>
              </div>

              <ul className="priceCard__list">
                {p.features.map((f) => (
                  <li key={f}>✓ {f}</li>
                ))}
              </ul>

              <button
                className={`btn ${p.highlight ? "btn--gold" : "btn--primary"} btn--full`}
                onClick={() => handleChoose(p.name)}
              >
                {p.cta}
              </button>
            </div>
          ))}
        </div>

        <div className="note">
          <strong>Note :</strong>{" "}
          {isLoggedIn
            ? "Tu es connecté : tu peux choisir une offre (paiement à ajouter ensuite)."
            : "Connecte-toi pour choisir une offre."}
        </div>
      </div>
    </section>
  );
}
