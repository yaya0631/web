import React from 'react'
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
  selectedIds,
  onSelect,
  sortField,
  onSort,
  showSolde,
  columnVisibility,
  onContextMenu,
}) {
  const visibleCols = COLS.filter((col) => columnVisibility[col.key] !== false)

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
              {visibleCols.map((col) => (
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

              const isMultiSel = selectedIds?.has(d.id)
              const isSel = d.id === selId

              const cellContent = {
                _n: <td className="td-n">{index + 1}</td>,
                id: <td className="td-id">{d.id}</td>,
                nom: <td className="td-nom">{d.nom}</td>,
                endroit: <td>{d.endroit || '-'}</td>,
                date_finale: <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{d.date_finale || '-'}</td>,
                telephone: <td style={{ fontFamily: 'var(--mono)' }}>{d.telephone || '-'}</td>,
                montant: <td className="td-amt">{montantText}</td>,
                acte: <td><BoolCell value={d.acte} /></td>,
                regul: <td><BoolCell value={d.regul} /></td>,
                agricole: <td><BoolCell value={d.agricole} /></td>,
                depot_cad: <td><DepotChip value={d.depot_cad} /></td>,
                depot_domain: <td><DepotChip value={d.depot_domain} /></td>,
                date_archive: <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{d.date_archive || '-'}</td>,
                etat: <td><EtatChip etat={getDisplayState(d)} /></td>,
                observations: <td style={{ color: 'var(--t3)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.observations || '-'}</td>,
              }

              return (
                <tr
                  key={d.id}
                  className={`${isSel ? 'sel' : ''} ${isMultiSel ? 'multi-sel' : ''}`}
                  onClick={(e) => onSelect(d.id, false, e)}
                  onDoubleClick={() => onSelect(d.id, true)}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    onSelect(d.id, false)
                    onContextMenu?.(e, d)
                  }}
                >
                  {visibleCols.map((col) => (
                    <React.Fragment key={col.key}>
                      {cellContent[col.key]}
                    </React.Fragment>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

