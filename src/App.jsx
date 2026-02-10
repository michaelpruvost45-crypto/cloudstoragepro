import "./styles.css";
import logo from "/logo.png";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";

/**
 * Tables utilisées (comme ton SQL):
 * - public.profiles: id(uuid PK), email, first_name, last_name, subscription, is_admin,
 *   request_status, request_note, request_handled_at, request_expires_at
 * - public.messages_contact: id, name, email, message, created_at
 */

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Auth modal
  const [openAuth, setOpenAuth] = useState(false);

  // Contact popup
  const [toast, setToast] = useState({ open: false, type: "success", text: "" });

  // Admin: onglet
  const [adminTab, setAdminTab] = useState("requests"); // requests | contacts

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session || null));
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, newSession) => {
      setSession(newSession || null);
    });
    return () => sub?.subscription?.unsubscribe?.();
  }, []);

  useEffect(() => {
    if (!session?.user?.id) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }
    (async () => {
      setProfileLoading(true);
      try {
        const user = session.user;

        // 1) Lire profil
        const { data: existing, error: e1 } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (e1) throw e1;

        // 2) Créer si absent (upsert)
        if (!existing) {
          const first_name = user.user_metadata?.first_name || "";
          const last_name = user.user_metadata?.last_name || "";
          const email = user.email || "";

          const { data: created, error: e2 } = await supabase
            .from("profiles")
            .upsert(
              {
                id: user.id,
                email,
                first_name,
                last_name,
                subscription: "Basique", // par défaut
                is_admin: false
              },
              { onConflict: "id" }
            )
            .select("*")
            .single();

          if (e2) throw e2;
          setProfile(created);
        } else {
          setProfile(existing);
        }
      } catch (err) {
        console.error(err);
        setProfile(null);
      } finally {
        setProfileLoading(false);
      }
    })();
  }, [session?.user?.id]);

  // Expiration auto 48h (sans cron)
  useEffect(() => {
    if (!profile?.id) return;
    if (profile.request_status !== "pending") return;
    if (!profile.request_expires_at) return;

    const expires = new Date(profile.request_expires_at).getTime();
    const now = Date.now();
    if (now <= expires) return;

    (async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .update({
            request_status: "expired",
            request_note: "Aucune réponse sous 48h. Veuillez refaire votre demande.",
            request_handled_at: new Date().toISOString()
          })
          .eq("id", profile.id)
          .select("*")
          .single();

        if (!error && data) setProfile(data);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [profile?.id, profile?.request_status, profile?.request_expires_at]);

  const isLoggedIn = !!session;
  const fullName = useMemo(() => {
    const fn = profile?.first_name || session?.user?.user_metadata?.first_name || "";
    const ln = profile?.last_name || session?.user?.user_metadata?.last_name || "";
    return `${fn} ${ln}`.trim() || "Utilisateur";
  }, [profile?.first_name, profile?.last_name, session?.user?.user_metadata]);

  const email = session?.user?.email || profile?.email || "";
  const isAdmin = !!profile?.is_admin;

  async function logout() {
    await supabase.auth.signOut();
    setProfile(null);
  }

  function openToast(type, text) {
    setToast({ open: true, type, text });
    window.clearTimeout(openToast._t);
    openToast._t = window.setTimeout(() => setToast({ open: false, type, text: "" }), 3500);
  }

  async function safeNotifyAdmin(kind, payload) {
    // OPTIONNEL: si tu crées une edge function "notify-admin", ça enverra un mail.
    // Sinon, aucune erreur bloquante.
    try {
      await supabase.functions.invoke("notify-admin", {
        body: { kind, payload }
      });
    } catch (e) {
      // ne bloque pas l'app
      console.warn("notify-admin non configurée (ok):", e?.message || e);
    }
  }

  // ----- Plans
  const plans = useMemo(
    () => [
      {
        name: "Basique",
        price: "4,99",
        features: ["100 Go de stockage", "Cryptage basique", "Support standard"],
        accent: "blue"
      },
      {
        name: "Pro",
        price: "9,99",
        features: ["1 To de stockage", "Sauvegarde automatique", "Sécurité renforcée"],
        accent: "gold",
        badge: "Le Plus Populaire"
      },
      {
        name: "Premium",
        price: "19,99",
        features: ["5 To de stockage", "Cryptage avancé", "Support prioritaire"],
        accent: "blue"
      }
    ],
    []
  );

  async function choosePlan(planName) {
    if (!isLoggedIn) {
      setOpenAuth(true);
      return;
    }
    if (!profile?.id) {
      openToast("error", "Profil introuvable (vérifie table profiles + RLS).");
      return;
    }

    // si demande déjà en cours => bloqué
    if (profile.request_status === "pending") {
      openToast("info", "Une demande est déjà en attente.");
      return;
    }

    try {
      const current = profile.subscription || "Basique";

      // Si c’est le même => rien
      if (current === planName) {
        openToast("info", "Tu as déjà cet abonnement.");
        return;
      }

      // Logique: on fait une demande (pending) qui expire sous 48h
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from("profiles")
        .update({
          request_status: "pending",
          request_note: planName, // plan demandé
          request_handled_at: null,
          request_expires_at: expiresAt
        })
        .eq("id", profile.id)
        .select("*")
        .single();

      if (error) throw error;
      setProfile(data);

      openToast("success", "✅ Demande envoyée à l’équipe technique (48h).");
      safeNotifyAdmin("subscription_request", {
        user_id: profile.id,
        email,
        from: current,
        to: planName,
        expires_at: expiresAt
      });
    } catch (err) {
      console.error(err);
      openToast("error", "❌ Impossible d’enregistrer (vérifie RLS profiles).");
    }
  }

  // ----- Contact (insert Supabase)
  async function submitContact({ name, email: fromEmail, message }) {
    try {
      const { error } = await supabase.from("messages_contact").insert({
        name,
        email: fromEmail,
        message
      });
      if (error) throw error;

      openToast("success", "✅ Merci ! Ton message a bien été envoyé.");
      safeNotifyAdmin("contact_message", { name, email: fromEmail, message });
    } catch (err) {
      console.error(err);
      openToast("error", "❌ Envoi impossible (vérifie RLS messages_contact).");
    }
  }

  return (
    <div className="page">
      <Topbar
        isLoggedIn={isLoggedIn}
        fullName={fullName}
        email={email}
        onLogin={() => setOpenAuth(true)}
        onLogout={logout}
      />

      <Hero onLogin={() => setOpenAuth(true)} />

      <Services />

      <Pricing plans={plans} profile={profile} isLoggedIn={isLoggedIn} onChoose={choosePlan} />

      <Contact onSubmit={submitContact} />

      {isLoggedIn && (
        <ClientArea
          loading={profileLoading}
          profile={profile}
          fullName={fullName}
          email={email}
        />
      )}

      {isLoggedIn && isAdmin && (
        <AdminWrap tab={adminTab} setTab={setAdminTab} openToast={openToast} />
      )}

      <Footer />

      {openAuth && <AuthModal onClose={() => setOpenAuth(false)} onLoggedIn={() => setOpenAuth(false)} />}

      {toast.open && <Toast type={toast.type} text={toast.text} onClose={() => setToast({ open: false })} />}
    </div>
  );
}

/* =========================
   UI - TOPBAR / HERO
   ========================= */

function Topbar({ isLoggedIn, fullName, email, onLogin, onLogout }) {
  return (
    <header className="topnav">
      <div className="wrap topnav__inner">
        <div className="brand">
          <img src={logo} alt="CloudStoragePro" className="brand__logo" />
          <span className="brand__text">CloudStoragePro</span>
        </div>

        <nav className="menu">
          <a href="#home">Accueil</a>
          <a href="#features">Fonctionnalités</a>
          <a href="#pricing">Tarifs</a>
          <a href="#contact">Contact</a>
        </nav>

        {!isLoggedIn ? (
          <button className="btn btn--light" onClick={onLogin}>
            Connexion
          </button>
        ) : (
          <div className="userChip">
            <div className="userChip__meta">
              <div className="userChip__name">{fullName}</div>
              <div className="userChip__email">{email}</div>
            </div>
            <button className="btn btn--light" onClick={onLogout}>
              Déconnexion
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

function Hero({ onLogin }) {
  return (
    <section id="home" className="heroX">
      <div className="wrap heroX__grid">
        <div className="heroX__left">
          <h1 className="heroX__title">
            Stockage Cloud Sécurisé <br /> Pour Vos Données
          </h1>
          <p className="heroX__subtitle">
            Stockez et sauvegardez vos fichiers en toute sécurité sur notre plateforme de cloud.
          </p>

          <div className="heroX__buttons">
            <a className="btn btn--primary" href="#pricing">
              Commencer Maintenant
            </a>
            <button className="btn btn--ghost" onClick={onLogin}>
              En savoir plus
            </button>
          </div>
        </div>

        <div className="heroX__right">
          <div className="heroX__art" aria-hidden="true">
            {/* visuel simple sans assets externes */}
            <div className="cloudBig" />
            <div className="cloudSmall cloudSmall--1" />
            <div className="cloudSmall cloudSmall--2" />
            <div className="serverStack">
              <div className="server" />
              <div className="server" />
              <div className="server" />
            </div>
            <div className="cloudIcon" />
          </div>
        </div>
      </div>
      <div className="heroX__clouds" />
    </section>
  );
}

/* =========================
   SERVICES
   ========================= */

function Services() {
  const items = [
    { title: "Stockage Évolutif", desc: "Espace extensible selon vos besoins", icon: "☁️" },
    { title: "Sécurité Avancée", desc: "Cryptage & protection de vos données", icon: "🛡️" },
    { title: "Accès 24/7", desc: "Accédez à vos fichiers à tout moment", icon: "⏱️" }
  ];

  return (
    <section id="features" className="sectionX">
      <div className="wrap">
        <h2 className="titleX">Nos Services</h2>
        <div className="cards3">
          {items.map((it) => (
            <div key={it.title} className="serviceCardX">
              <div className="serviceCardX__icon">{it.icon}</div>
              <div className="serviceCardX__title">{it.title}</div>
              <div className="serviceCardX__desc">{it.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================
   PRICING
   ========================= */

function Pricing({ plans, profile, isLoggedIn, onChoose }) {
  const subscription = profile?.subscription || "Basique";
  const status = profile?.request_status || null;
  const requested = profile?.request_note || null;

  const locked = status === "pending";

  return (
    <section id="pricing" className="sectionX sectionX--soft">
      <div className="wrap">
        <h2 className="titleX">Choisissez Votre Abonnement</h2>

        {locked && (
          <div className="infoBar">
            ℹ️ Demande en attente : <b>{requested}</b> — réponse sous 48h (si place disponible).
          </div>
        )}

        <div className="pricingGridX">
          {plans.map((p) => {
            const same = subscription === p.name;
            const disabled = locked || same;

            return (
              <div key={p.name} className={`priceX ${p.accent === "gold" ? "priceX--pro" : ""}`}>
                {p.badge && <div className="badgeX">{p.badge}</div>}

                <div className="priceX__name">{p.name}</div>
                <div className="priceX__value">
                  <span className="priceX__currency">€</span>
                  <span className="priceX__amount">{p.price}</span>
                  <span className="priceX__per"> / mois</span>
                </div>

                <ul className="priceX__list">
                  {p.features.map((f) => (
                    <li key={f}>✓ {f}</li>
                  ))}
                </ul>

                <button
                  className={`btn btn--full ${p.accent === "gold" ? "btn--gold" : "btn--primary"}`}
                  onClick={() => onChoose(p.name)}
                  disabled={disabled && isLoggedIn}
                  title={!isLoggedIn ? "Connecte-toi pour choisir" : disabled ? "Indisponible" : "Choisir"}
                >
                  {!isLoggedIn ? "CONNEXION" : same ? "DÉJÀ ACTIF" : "CHOISIR"}
                </button>
              </div>
            );
          })}
        </div>

        <div className="noteX">
          <b>Note :</b>{" "}
          {!isLoggedIn
            ? "Connecte-toi pour choisir une offre."
            : locked
            ? "Changement en attente (48h)."
            : "Tu peux demander un changement d’abonnement à tout moment."}
        </div>
      </div>
    </section>
  );
}

/* =========================
   CONTACT
   ========================= */

function Contact({ onSubmit }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setSending(true);
    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim(),
        message: message.trim()
      });
      setName("");
      setEmail("");
      setMessage("");
    } finally {
      setSending(false);
    }
  }

  return (
    <section id="contact" className="sectionX">
      <div className="wrap">
        <h2 className="titleX">Contactez-Nous</h2>

        <form className="contactX" onSubmit={submit}>
          <input className="inputX" placeholder="Nom" value={name} onChange={(e) => setName(e.target.value)} />
          <input
            className="inputX"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <textarea
            className="textareaX"
            placeholder="Message"
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button className="btn btn--primary btn--center" type="submit" disabled={sending}>
            {sending ? "Envoi..." : "Envoyer"}
          </button>
        </form>
      </div>
    </section>
  );
}

/* =========================
   ESPACE CLIENT
   ========================= */

function ClientArea({ loading, profile, fullName, email }) {
  const subscription = profile?.subscription || "Basique";
  const status = profile?.request_status || null;
  const requested = profile?.request_note || null;

  return (
    <section className="sectionX sectionX--soft">
      <div className="wrap">
        <div className="clientX">
          <div className="clientX__left">
            <h3 className="clientX__title">Espace client</h3>
            <div className="clientX__hello">
              Bienvenue <b>{fullName}</b> 👋
              <div className="clientX__mail">{email}</div>
            </div>

            <div className="clientX__chips">
              <div className="chipX">
                <div className="chipX__label">Abonnement</div>
                <div className="chipX__value">{loading ? "..." : subscription}</div>
              </div>
              <div className="chipX">
                <div className="chipX__label">Statut</div>
                <div className="chipX__value">Connecté ✅</div>
              </div>
            </div>

            {status === "pending" && (
              <div className="msgX msgX--info">
                ℹ️ Demande envoyée : <b>{requested}</b>
                <div className="msgX__small">Le changement sera effectué sous 48h si place disponible.</div>
              </div>
            )}

            {status === "accepted" && (
              <div className="msgX msgX--ok">
                ✅ Votre demande a été acceptée.
                <div className="msgX__small">Votre abonnement est à jour.</div>
              </div>
            )}

            {status === "refused" && (
              <div className="msgX msgX--bad">
                ❌ Votre demande a été refusée.
                <div className="msgX__small">{profile?.request_note || "Vous pouvez refaire une demande."}</div>
              </div>
            )}

            {status === "expired" && (
              <div className="msgX msgX--bad">
                ⌛ Demande expirée.
                <div className="msgX__small">{profile?.request_note}</div>
              </div>
            )}
          </div>

          <div className="clientX__right">
            <div className="clientX__actions">
              <button
                className="btn btn--light"
                onClick={() => alert("📁 Mes fichiers (bientôt)")}
              >
                Mes fichiers (bientôt)
              </button>
              <button
                className="btn btn--light"
                onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
              >
                Changer mon abonnement
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================
   ADMIN (premium)
   ========================= */

function AdminWrap({ tab, setTab, openToast }) {
  return (
    <section className="sectionX">
      <div className="wrap">
        <div className="adminX">
          <div className="adminX__head">
            <h2 className="adminX__title">Panneau Admin</h2>
            <div className="adminX__tabs">
              <button className={`pill ${tab === "requests" ? "pill--on" : ""}`} onClick={() => setTab("requests")}>
                Demandes abonnement
              </button>
              <button className={`pill ${tab === "contacts" ? "pill--on" : ""}`} onClick={() => setTab("contacts")}>
                Messages contact
              </button>
            </div>
          </div>

          {tab === "requests" ? <AdminRequests openToast={openToast} /> : <AdminContacts openToast={openToast} />}
        </div>
      </div>
    </section>
  );
}

function AdminRequests({ openToast }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .in("request_status", ["pending", "accepted", "refused", "expired"])
        .order("request_handled_at", { ascending: false })
        .order("request_expires_at", { ascending: false });

      if (error) throw error;
      setRows(data || []);
    } catch (e) {
      console.error(e);
      openToast("error", "RLS admin: ajoute la policy admin (voir note sous le code).");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  async function accept(u) {
    try {
      const requested = u.request_note;
      const { error } = await supabase
        .from("profiles")
        .update({
          subscription: requested,
          request_status: "accepted",
          request_handled_at: new Date().toISOString()
        })
        .eq("id", u.id);
      if (error) throw error;

      openToast("success", "✅ Demande acceptée");
      load();
    } catch (e) {
      console.error(e);
      openToast("error", "Impossible d'accepter (RLS admin).");
    }
  }

  async function refuse(u) {
    const note = prompt("Note (optionnel) : pourquoi refus ?");
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          request_status: "refused",
          request_note: note ? note : "Refusé par l’admin.",
          request_handled_at: new Date().toISOString()
        })
        .eq("id", u.id);
      if (error) throw error;

      openToast("success", "❌ Demande refusée");
      load();
    } catch (e) {
      console.error(e);
      openToast("error", "Impossible de refuser (RLS admin).");
    }
  }

  return (
    <div className="adminTableX">
      <div className="adminTableX__bar">
        <button className="btn btn--light" onClick={load} disabled={loading}>
          {loading ? "Chargement..." : "Rafraîchir"}
        </button>
      </div>

      <div className="tableX">
        <div className="tableX__row tableX__head">
          <div>Email</div>
          <div>Actuel</div>
          <div>Demande</div>
          <div>Statut</div>
          <div>Expire</div>
          <div>Actions</div>
        </div>

        {rows.map((u) => (
          <div key={u.id} className="tableX__row">
            <div className="mono">{u.email || "-"}</div>
            <div>{u.subscription || "-"}</div>
            <div><b>{u.request_status ? (u.request_status === "pending" ? u.request_note : u.request_note || "-") : "-"}</b></div>
            <div>
              <span className={`tag tag--${u.request_status || "none"}`}>{u.request_status || "-"}</span>
            </div>
            <div className="mono">{u.request_expires_at ? new Date(u.request_expires_at).toLocaleString() : "-"}</div>
            <div className="actionsX">
              {u.request_status === "pending" ? (
                <>
                  <button className="btn btn--primary btn--sm" onClick={() => accept(u)}>
                    Accepter
                  </button>
                  <button className="btn btn--ghost btn--sm" onClick={() => refuse(u)}>
                    Refuser
                  </button>
                </>
              ) : (
                <span className="muted">—</span>
              )}
            </div>
          </div>
        ))}

        {!loading && rows.length === 0 && <div className="emptyX">Aucune demande.</div>}
      </div>
    </div>
  );
}

function AdminContacts({ openToast }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("messages_contact")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRows(data || []);
    } catch (e) {
      console.error(e);
      openToast("error", "RLS contact: ajoute une policy SELECT admin (voir note sous le code).");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  return (
    <div className="adminTableX">
      <div className="adminTableX__bar">
        <button className="btn btn--light" onClick={load} disabled={loading}>
          {loading ? "Chargement..." : "Rafraîchir"}
        </button>
      </div>

      <div className="tableX">
        <div className="tableX__row tableX__head">
          <div>Date</div>
          <div>Nom</div>
          <div>Email</div>
          <div>Message</div>
        </div>

        {rows.map((m) => (
          <div key={m.id} className="tableX__row">
            <div className="mono">{m.created_at ? new Date(m.created_at).toLocaleString() : "-"}</div>
            <div>{m.name}</div>
            <div className="mono">{m.email}</div>
            <div className="msgCell">{m.message}</div>
          </div>
        ))}

        {!loading && rows.length === 0 && <div className="emptyX">Aucun message.</div>}
      </div>
    </div>
  );
}

/* =========================
   AUTH MODAL
   ========================= */

function AuthModal({ onClose, onLoggedIn }) {
  return (
    <div className="modalO" role="dialog" aria-modal="true">
      <div className="modalC">
        <button className="modalX" onClick={onClose} aria-label="Fermer">
          ✕
        </button>
        <AuthForm onLoggedIn={onLoggedIn} />
      </div>
    </div>
  );
}

function AuthForm({ onLoggedIn }) {
  const [mode, setMode] = useState("login"); // login | signup | forgot
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      if (!email) throw new Error("Ajoute un email.");

      if (mode === "forgot") {
        const redirectTo = window.location.origin;
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
        if (error) throw error;
        setMsg("✅ Email envoyé. Clique sur le lien pour changer ton mot de passe.");
        return;
      }

      if (!password) throw new Error("Ajoute un mot de passe.");

      if (mode === "signup") {
        if (!firstName.trim()) throw new Error("Prénom obligatoire.");
        if (!lastName.trim()) throw new Error("Nom obligatoire.");

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { first_name: firstName.trim(), last_name: lastName.trim() }
          }
        });
        if (error) throw error;

        setMsg("✅ Compte créé. Un email de confirmation a été envoyé.");
        setMode("login");
        setPassword("");
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (data?.session) onLoggedIn();
    } catch (err) {
      setMsg("❌ " + (err?.message || "Erreur"));
    } finally {
      setLoading(false);
    }
  }

  async function resendConfirmation() {
    setMsg("");
    setLoading(true);
    try {
      if (!email) throw new Error("Entre ton email d’abord.");
      const redirectTo = window.location.origin;

      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: redirectTo }
      });

      if (error) throw error;
      setMsg("✅ Email de confirmation renvoyé !");
    } catch (err) {
      setMsg("❌ " + (err?.message || "Impossible"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="authHeadX">
        <img src={logo} alt="logo" className="authLogoX" />
        <div>
          <div className="authBrandX">CloudStoragePro</div>
          <div className="authSubX">Espace client</div>
        </div>
      </div>

      <h3 className="authTitleX">
        {mode === "login" ? "Connexion" : mode === "signup" ? "Créer un compte" : "Mot de passe oublié"}
      </h3>

      <form onSubmit={submit}>
        {mode === "signup" && (
          <div className="authRowX">
            <label className="authLabelX">
              Prénom
              <input className="authInputX" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </label>
            <label className="authLabelX">
              Nom
              <input className="authInputX" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </label>
          </div>
        )}

        <label className="authLabelX">
          Email
          <input
            className="authInputX"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ex: contact@email.com"
          />
        </label>

        {mode !== "forgot" && (
          <label className="authLabelX">
            Mot de passe
            <input
              className="authInputX"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>
        )}

        <button className="btn btn--primary btn--full" type="submit" disabled={loading}>
          {loading
            ? "Patiente..."
            : mode === "login"
            ? "Se connecter"
            : mode === "signup"
            ? "Créer mon compte"
            : "Envoyer l’email"}
        </button>
      </form>

      {mode === "login" && (
        <>
          <button className="linkBtn" type="button" onClick={() => setMode("forgot")}>
            Mot de passe oublié ?
          </button>
          <button className="linkBtn" type="button" onClick={resendConfirmation} disabled={loading}>
            Renvoyer l’email de confirmation
          </button>
          <button className="linkBtn" type="button" onClick={() => setMode("signup")}>
            Créer un compte
          </button>
        </>
      )}

      {mode === "signup" && (
        <button className="linkBtn" type="button" onClick={() => setMode("login")}>
          J’ai déjà un compte
        </button>
      )}

      {mode === "forgot" && (
        <button className="linkBtn" type="button" onClick={() => setMode("login")}>
          Retour à la connexion
        </button>
      )}

      {msg && <div className="authMsgX">{msg}</div>}
    </div>
  );
}

/* =========================
   FOOTER / TOAST
   ========================= */

function Footer() {
  return (
    <footer className="footerX">
      © {new Date().getFullYear()} CloudStoragePro — Tous droits réservés
    </footer>
  );
}

function Toast({ type = "success", text, onClose }) {
  return (
    <div className={`toastX toastX--${type}`} onClick={onClose} role="status">
      <div className="toastX__dot" />
      <div className="toastX__text">{text}</div>
      <button className="toastX__x" aria-label="Fermer" onClick={onClose}>
        ✕
      </button>
    </div>
  );
}
