export default function FilterBar({ filters, endroits, onChange, onReset, showSolde, onToggleSolde }) {
  return (
    <div id="filterbar">
      <span className="fl">Recherche</span>
      <input
        type="text" className="fi"
        placeholder="Nom, dossier, endroit…"
        value={filters.search}
        onChange={e => onChange('search', e.target.value)}
      />

      <span className="fl">Endroit</span>
      <select className="fs" value={filters.endroit} onChange={e => onChange('endroit', e.target.value)}>
        <option value="">Tous</option>
        {endroits.map(e => <option key={e}>{e}</option>)}
      </select>

      <span className="fl">Dépôt CAD</span>
      <select className="fs" value={filters.depot} onChange={e => onChange('depot', e.target.value)}>
        <option value="">Tous</option>
        <option>Déposé</option>
        <option>Non déposé</option>
        <option>En cours</option>
      </select>

      <span className="fl">Vue</span>
      <select className="fs" value={filters.vue} onChange={e => onChange('vue', e.target.value)}>
        <option value="actifs">Actifs</option>
        <option value="archives">Archives</option>
        <option value="tous">Tous</option>
      </select>

      <label className="chkw">
        <input
          type="checkbox"
          checked={filters.showAll}
          onChange={e => onChange('showAll', e.target.checked)}
        />
        Afficher archives
      </label>

      <button
        className={`solde-btn ${showSolde ? 'active' : ''}`}
        onClick={onToggleSolde}
      >
        {showSolde ? '☑' : '☐'} Solde restant
      </button>

      <button className="reset-btn" onClick={onReset}>↺ Réinitialiser</button>
    </div>
  )
}
