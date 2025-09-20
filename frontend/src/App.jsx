import React, { useEffect, useState } from 'react'
import PriceTable from './components/PriceTable'

export default function App() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchPrices = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/prices')
      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPrices() }, [])

  return (
    <div className="container">
      <h1>Comparador de Precios — Dulces</h1>
      <div className="controls">
        <button onClick={fetchPrices} disabled={loading}>
          {loading ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>
      {error && <div className="error">Error: {error}</div>}
      <PriceTable items={data} />
    </div>
  )
}