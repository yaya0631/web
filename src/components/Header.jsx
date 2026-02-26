export default function Header({
  connected,
  onNew,
  onEdit,
  onDelete,
  onRestore,
  onTrashView,
  onFichiers,
  onPaiement,
  onArchive,
  onDashboard,
  onRappels,
  onExport,
  onTheme,
  darkMode,
}) {
  return (
    <div id="header">
      <div className="logo-mark">
        <div className="logo-icon">GM</div>
        <div className="logo-text">Geo<span>Man</span></div>
      </div>

      <button className="hbtn hb-new" onClick={onNew}>Nouveau</button>
      <button className="hbtn hb-edit" onClick={onEdit}>Modifier</button>
      <button className="hbtn hb-del" onClick={onDelete}>Corbeille / Purge</button>
      <button className="hbtn hb-ghost" onClick={onRestore}>Restaurer</button>
      <div className="hsep" />
      <button className="hbtn hb-file" onClick={onFichiers}>Fichiers</button>
      <button className="hbtn hb-pay" onClick={onPaiement}>Paiements</button>
      <button className="hbtn hb-arch" onClick={onArchive}>Archiver</button>
      <div className="hsep" />
      <button className="hbtn hb-ghost" onClick={onDashboard}>Tableau de bord</button>
      <button className="hbtn hb-ghost" onClick={onRappels}>Rappels</button>
      <button className="hbtn hb-ghost" onClick={onTrashView}>Corbeille</button>
      <button className="hbtn hb-ghost" onClick={onExport}>Import/Export</button>

      <div className="h-right">
        <div id="sb-status">
          <div className={`sb-dot ${connected ? 'ok' : 'err'}`} />
          <span>{connected ? 'Connecte' : 'Erreur'}</span>
        </div>
        <div className="hsep" />
        <button className="hbtn hb-ghost" onClick={onTheme}>
          {darkMode ? 'Mode clair' : 'Mode sombre'}
        </button>
      </div>
    </div>
  )
}
