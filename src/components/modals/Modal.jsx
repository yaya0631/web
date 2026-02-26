export default function Modal({ id, title, subtitle, children, footer, size = '' }) {
  return (
    <div className="overlay open" id={id} onClick={e => e.target.classList.contains('overlay') && e.target.classList.remove('open')}>
      <div className={`modal ${size}`} onClick={e => e.stopPropagation()}>
        <div className="mh">
          <div>
            <div className="mh-title">{title}</div>
            {subtitle && <div className="mh-sub">{subtitle}</div>}
          </div>
          <button className="mh-close" onClick={() => document.getElementById(id)?.classList.remove('open')}>✕</button>
        </div>
        <div className="mb">{children}</div>
        {footer && <div className="mf">{footer}</div>}
      </div>
    </div>
  )
}

export function openModal(id)  { document.getElementById(id)?.classList.add('open') }
export function closeModal(id) { document.getElementById(id)?.classList.remove('open') }
