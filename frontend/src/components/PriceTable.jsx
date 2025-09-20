import React from 'react'

export default function PriceTable({ items = [] }) {
  if (!items.length) return <div>No hay datos aún.</div>

  return (
    <div className="table-wrap">
      <table className="price-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Precio</th>
            <th>Origen</th>
            <th>Enlace</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i}>
              <td className="name-col">{it.name}</td>
              <td className="price-col">{it.price}</td>
              <td className="source-col">{it.source}</td>
              <td className="link-col">
                {it.url ? <a href={it.url} target="_blank" rel="noreferrer">Ver</a> : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}