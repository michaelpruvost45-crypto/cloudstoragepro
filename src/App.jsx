// src/App.jsx
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export default function App() {
  const plans = [
    { name: "Basique", price: "4,99€ / mois", features: ["100 Go de stockage", "Cryptage basique", "Support standard"] },
    { name: "Pro", price: "9,99€ / mois", features: ["1 To de stockage", "Sauvegarde automatique", "Sécurité renforcée"] },
    { name: "Premium", price: "19,99€ / mois", features: ["5 To de stockage", "Cryptage avancé", "Support prioritaire"] },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-900">
      {/* Header */}
      <header className="max-w-7xl mx-auto px-6 py-10 flex justify-between items-center">
        <img src="/logo.png" alt="CloudDrive Logo" className="h-12" />
        <nav className="space-x-6 text-sm">
          <a href="#services" className="hover:underline">Services</a>
          <a href="#tarifs" className="hover:underline">Tarifs</a>
          <a href="#contact" className="hover:underline">Contact</a>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6">
        <section className="py-20 grid md:grid-cols-2 gap-10 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h2 className="text-5xl font-extrabold leading-tight mb-6">
              Stockage Cloud Sécurisé Pour Vos Données
            </h2>
            <p className="text-lg mb-8">
              Stockez et sauvegardez vos fichiers en toute sécurité sur notre plateforme de cloud.
            </p>
            <Button size="lg" className="rounded-2xl">Commencer Maintenant</Button>
          </motion.div>
          <motion.img
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            src="https://images.unsplash.com/photo-1581091012184-1df568f58d42"
            alt="Stockage cloud"
            className="rounded-2xl shadow-xl"
          />
        </section>

        {/* Services Section */}
        <section id="services" className="py-20">
          <h3 className="text-4xl font-bold text-center mb-12">Nos Services</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              "Stockage Évolutif",
              "Sécurité Avancée",
              "Accès 24/7",
            ].map((item, i) => (
              <Card key={i} className="rounded-2xl shadow-md">
                <CardContent className="p-6 text-center text-lg">{item}</CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Pricing Section */}
        <section id="tarifs" className="py-20 bg-white rounded-3xl shadow-xl">
          <h3 className="text-4xl font-bold text-center mb-12">Choisissez Votre Abonnement</h3>
          <div className="grid md:grid-cols-3 gap-8 px-6">
            {plans.map((plan, i) => (
              <motion.div key={i} whileHover={{ scale: 1.03 }}>
                <Card className="rounded-3xl border-2">
                  <CardContent className="p-8">
                    <h4 className="text-2xl font-bold mb-2">{plan.name}</h4>
                    <p className="text-3xl font-extrabold mb-6">{plan.price}</p>
                    <ul className="space-y-3">
                      {plan.features.map((f, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <Check className="w-5 h-5" /> {f}
                        </li>
                      ))}
                    </ul>
                    <Button className="mt-8 w-full rounded-2xl">
                      {plan.name === "Pro" ? "Essayer" : "S'inscrire"}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-20">
          <h3 className="text-4xl font-bold text-center mb-12">Contactez-Nous</h3>
          <form className="max-w-xl mx-auto bg-white p-8 rounded-3xl shadow-lg space-y-4">
            <input placeholder="Nom" className="w-full p-3 rounded-xl border" />
            <input placeholder="Email" className="w-full p-3 rounded-xl border" />
            <textarea placeholder="Message" rows={4} className="w-full p-3 rounded-xl border" />
            <Button className="w-full rounded-2xl">Envoyer</Button>
          </form>
        </section>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-slate-500">
        © 2026 CloudDrive – Tous droits réservés
      </footer>
    </div>
  );
}

