export default function FilterBar({
  filters,
  endroits,
  onChange,
  onReset,
  showSolde,
  onToggleSolde,
}) {
  return (
    <div id="filterbar">
      <span className="fl">Recherche</span>
      <input
        type="text"
        className="fi"
        placeholder="Numero, nom, endroit..."
        value={filters.search}
        onChange={(e) => onChange('search', e.target.value)}
      />

      <span className="fl">Endroit</span>
      <select className="fs" value={filters.endroit} onChange={(e) => onChange('endroit', e.target.value)}>
        <option value="">Tous</option>
        {endroits.map((value) => <option key={value}>{value}</option>)}
      </select>

      <span className="fl">Depot CAD</span>
      <select className="fs" value={filters.depot} onChange={(e) => onChange('depot', e.target.value)}>
        <option value="">Tous</option>
        <option>Depose</option>
        <option>Non depose</option>
        <option>Depose 2eme fois</option>
      </select>

      <span className="fl">Vue</span>
      <select className="fs" value={filters.vue} onChange={(e) => onChange('vue', e.target.value)}>
        <option value="actifs">Actifs</option>
        <option value="archives">Archives</option>
        <option value="corbeille">Corbeille</option>
        <option value="retard">Retards</option>
        <option value="impayes">Impayes</option>
      </select>

      <label className="chkw">
        <input
          type="checkbox"
          checked={filters.showAll}
          onChange={(e) => onChange('showAll', e.target.checked)}
        />
        Inclure archives
      </label>

      <button className={`solde-btn ${showSolde ? 'active' : ''}`} onClick={onToggleSolde}>
        {showSolde ? '[x]' : '[ ]'} Afficher solde restant
      </button>

      <button className="reset-btn" onClick={onReset}>Reinitialiser</button>
    </div>
  )
}
