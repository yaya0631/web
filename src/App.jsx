import './App.css'

function App() {
  const year = new Date().getFullYear()

  return (
    <main className="page">
      <section className="hero">
        <p className="tag">sphynx0631.mooo.com</p>
        <h1>Simple React site, ready for your domain.</h1>
        <p className="subtitle">
          This app is intentionally lightweight so it can be deployed quickly on
          Vercel and connected to FreeDNS in minutes.
        </p>
        <a className="cta" href="https://vercel.com" target="_blank" rel="noreferrer">
          Open Vercel Dashboard
        </a>
      </section>
      <footer className="footer">Copyright {year} sphynx0631</footer>
    </main>
  )
}

export default App
