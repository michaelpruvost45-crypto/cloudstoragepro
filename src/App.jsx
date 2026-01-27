export default function App() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg,#020617,#020617)",
      color: "white",
      fontFamily: "Arial",
      textAlign: "center",
      padding: "40px"
    }}>

      <img src="/logo.png" width="130" style={{marginBottom:20}} />

      <h1>CloudStoragePro</h1>
      <p>Stockage cloud sécurisé — rapide — professionnel</p>

      <div style={{
        display: "flex",
        justifyContent: "center",
        gap: "20px",
        marginTop: "40px",
        flexWrap: "wrap"
      }}>

        <Card title="Starter" price="4,99€/mois" space="100 Go" />
        <Card title="Pro" price="9,99€/mois" space="1 To" />
        <Card title="Ultra" price="19,99€/mois" space="5 To" />

      </div>

    </div>
  )
}

function Card({title, price, space}) {
  return (
    <div style={{
      background:"#020617",
      border:"1px solid #1e293b",
      borderRadius:"12px",
      padding:"25px",
      width:"230px"
    }}>
      <h2>{title}</h2>
      <h3>{price}</h3>
      <p>{space}</p>
      <button style={{
        marginTop:"10px",
        padding:"10px 20px",
        border:"none",
        borderRadius:"8px",
        background:"#2563eb",
        color:"white",
        cursor:"pointer"
      }}>S'abonner</button>
    </div>
  )
}
