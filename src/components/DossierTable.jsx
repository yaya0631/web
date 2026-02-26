import { fmt } from '../lib/utils.jsx'
import { EtatChip, DepotChip, BoolCell } from '../lib/utils.jsx'

const COLS = [
  { key: '_n',          label: 'N°' },
  { key: 'id',          label: 'No Dossier' },
  { key: 'nom',         label: 'Nom et Prénom' },
  { key: 'endroit',     label: 'Endroit' },
  { key: 'date_finale', label: 'Date Finale' },
  { key: 'telephone',   label: 'Téléphone' },
  { key: 'montant',     label: 'Montant' },
  { key: 'acte',        label: 'Acte' },
  { key: 'regul',       label: 'Regul' },
  { key: 'agricole',    label: 'Agricole' },
  { key: 'depot_cad',   label: 'Dépôt CAD' },
  { key: 'depot_domain',label: 'Dépôt Domaine' },
  { key: 'date_archive',label: 'Date Archive' },
  { key: 'etat',        label: 'État' },
  { key: 'observations',label: 'Observations' },
]

export default function DossierTable({ rows, selId, onSelect, sortField, sortAsc, onSort, showSolde }) {
  return (
    <div id="table-wrap">
      {rows.length === 0 ? (
        <div className="empty-state">
          <div className="ei">📂</div>
          <div className="et">Aucun dossier trouvé</div>
          <div>Modifiez les filtres ou créez un nouveau dossier</div>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              {COLS.map(col => (
                <th
                  key={col.key}
                  className={sortField === col.key ? 'sorted' : ''}
                  onClick={() => onSort(col.key)}
                  style={col.key === '_n' ? { width: 38 } : {}}
                >
                  {col.label} <span className="si">↕</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((d, i) => {
              const reste = (d.montant || 0) - (d.encaisse || 0)
              return (
                <tr
                  key={d.id}
                  className={d.id === selId ? 'sel' : ''}
                  onClick={() => onSelect(d.id)}
                  onDoubleClick={() => onSelect(d.id, true)}
                >
                  <td className="td-n">{i + 1}</td>
                  <td className="td-id">{d.id}</td>
                  <td className="td-nom">{d.nom}</td>
                  <td>{d.endroit || '—'}</td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{d.date_finale || '—'}</td>
                  <td style={{ fontFamily: 'var(--mono)' }}>{d.telephone || '—'}</td>
                  <td className="td-amt">
                    {showSolde
                      ? <span style={{ color: 'var(--yellow)' }}>{fmt(reste)}</span>
                      : fmt(d.montant || 0)
                    } D
                  </td>
                  <td><BoolCell value={d.acte} /></td>
                  <td><BoolCell value={d.regul} /></td>
                  <td><BoolCell value={d.agricole} /></td>
                  <td><DepotChip value={d.depot_cad} /></td>
                  <td><DepotChip value={d.depot_domain} /></td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{d.date_archive || '—'}</td>
                  <td><EtatChip etat={d.etat} /></td>
                  <td style={{ color: 'var(--t3)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {d.observations || '—'}
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
