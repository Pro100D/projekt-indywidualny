import { useRef, useState } from 'react';
import { formatPrice } from '../purchases/format.js';

function itemsText(n) {
  return n === 1 ? '1 rzecz' : `${n} rzeczy`;
}

function percent(value, total) {
  if (!total) return '0%';
  const p = (value / total) * 100;
  return p > 0 && p < 1 ? '<1%' : `${Math.round(p)}%`;
}

export default function CategoryChart({ rows, currency }) {
  const ref = useRef(null);
  const [hover, setHover] = useState(null);

  const total = rows.reduce((s, r) => s + r.sum, 0);
  const max = Math.max(...rows.map((r) => r.sum), 0);

  function describe(r) {
    return `${r.category}: ${formatPrice(r.sum, currency)}, ${itemsText(r.count)}, ${percent(r.sum, total)} wydatków`;
  }

  function show(r, e) {
    const box = ref.current.getBoundingClientRect();
    const target = e.currentTarget.getBoundingClientRect();
    const x = e.clientX ? e.clientX - box.left : target.left - box.left + target.width / 2;
    setHover({ row: r, x: Math.min(Math.max(x, 90), box.width - 90), y: target.top - box.top });
  }

  return (
    <div className="category-chart" ref={ref} onMouseLeave={() => setHover(null)}>
      <ul className="bars" aria-label={`Wydatki według kategorii w walucie ${currency}`}>
        {rows.map((r) => (
          <li
            key={r.category}
            className={`bar-row${hover?.row === r ? ' is-hover' : ''}`}
            tabIndex={0}
            aria-label={describe(r)}
            onMouseMove={(e) => show(r, e)}
            onFocus={(e) => show(r, e)}
            onBlur={() => setHover(null)}
          >
            <span className="bar-label">{r.category}</span>
            <span className="bar-track" aria-hidden="true">
              <span className="bar" style={{ width: `${max ? Math.max((r.sum / max) * 100, 0.5) : 0}%` }} />
            </span>
            <span className="bar-value">{formatPrice(r.sum, currency)}</span>
          </li>
        ))}
      </ul>

      {hover && (
        <div className="chart-tooltip" role="presentation" style={{ left: hover.x, top: hover.y }}>
          <strong>{hover.row.category}</strong>
          <span>{formatPrice(hover.row.sum, currency)}</span>
          <span>{itemsText(hover.row.count)} · {percent(hover.row.sum, total)} wydatków</span>
        </div>
      )}

      <details className="chart-table">
        <summary>Pokaż jako tabelę</summary>
        <table>
          <thead>
            <tr>
              <th scope="col">Kategoria</th>
              <th scope="col">Rzeczy</th>
              <th scope="col">Suma</th>
              <th scope="col">Udział</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.category}>
                <th scope="row">{r.category}</th>
                <td>{r.count}</td>
                <td>{formatPrice(r.sum, currency)}</td>
                <td>{percent(r.sum, total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Razem</th>
              <td>{rows.reduce((n, r) => n + r.count, 0)}</td>
              <td>{formatPrice(total, currency)}</td>
              <td>100%</td>
            </tr>
          </tfoot>
        </table>
      </details>
    </div>
  );
}
