import { getDisplayState, sumPayments } from '../lib/compat'
import { BoolCell, DepotChip, EtatChip, fmt } from '../lib/utils.jsx'

const COLS = [
  { key: '_n', label: 'No' },
  { key: 'id', label: 'No Dossier' },
  { key: 'nom', label: 'Nom et Prenom' },
  { key: 'endroit', label: 'Endroit' },
  { key: 'date_finale', label: 'Date finale' },
  { key: 'telephone', label: 'Telephone' },
  { key: 'montant', label: 'Montant' },
  { key: 'acte', label: 'Acte' },
  { key: 'regul', label: 'Regul' },
  { key: 'agricole', label: 'Agricole' },
  { key: 'depot_cad', label: 'Depot CAD' },
  { key: 'depot_domain', label: 'Depot Domain' },
  { key: 'date_archive', label: 'Date archive' },
  { key: 'etat', label: 'Etat' },
  { key: 'observations', label: 'Observations' },
]

export default function DossierTable({
  rows,
  selId,
  onSelect,
  sortField,
  onSort,
  showSolde,
}) {
  return (
    <div id="table-wrap">
      {rows.length === 0 ? (
        <div className="empty-state">
          <div className="ei">[ ]</div>
          <div className="et">Aucun dossier trouve</div>
          <div>Modifiez les filtres ou creez un nouveau dossier</div>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              {COLS.map((col) => (
                <th
                  key={col.key}
                  className={sortField === col.key ? 'sorted' : ''}
                  onClick={() => onSort(col.key)}
                  style={col.key === '_n' ? { width: 38 } : {}}
                >
                  {col.label} <span className="si">^v</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((d, index) => {
              const encaisse = sumPayments(d.paiements, d.encaisse)
              const montant = Number(d.montant || 0)
              const reste = Math.max(montant - encaisse, 0)
              const montantText = showSolde
                ? `${fmt(reste)} DA`
                : encaisse > 0
                  ? `${fmt(encaisse)} / ${fmt(montant)} DA`
                  : `${fmt(montant)} DA`

              return (
                <tr
                  key={d.id}
                  className={d.id === selId ? 'sel' : ''}
                  onClick={() => onSelect(d.id)}
                  onDoubleClick={() => onSelect(d.id, true)}
                >
                  <td className="td-n">{index + 1}</td>
                  <td className="td-id">{d.id}</td>
                  <td className="td-nom">{d.nom}</td>
                  <td>{d.endroit || '-'}</td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{d.date_finale || '-'}</td>
                  <td style={{ fontFamily: 'var(--mono)' }}>{d.telephone || '-'}</td>
                  <td className="td-amt">{montantText}</td>
                  <td><BoolCell value={d.acte} /></td>
                  <td><BoolCell value={d.regul} /></td>
                  <td><BoolCell value={d.agricole} /></td>
                  <td><DepotChip value={d.depot_cad} /></td>
                  <td><DepotChip value={d.depot_domain} /></td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{d.date_archive || '-'}</td>
                  <td><EtatChip etat={getDisplayState(d)} /></td>
                  <td style={{ color: 'var(--t3)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {d.observations || '-'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
