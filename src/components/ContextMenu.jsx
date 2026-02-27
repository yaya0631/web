import { useEffect, useRef } from 'react'

export default function ContextMenu({ x, y, visible, onClose, items }) {
    const ref = useRef(null)

    useEffect(() => {
        if (!visible) return
        const handler = () => onClose()
        window.addEventListener('click', handler)
        window.addEventListener('contextmenu', handler)
        window.addEventListener('scroll', handler, true)
        return () => {
            window.removeEventListener('click', handler)
            window.removeEventListener('contextmenu', handler)
            window.removeEventListener('scroll', handler, true)
        }
    }, [visible, onClose])

    // Adjust position to keep menu in viewport
    useEffect(() => {
        if (!visible || !ref.current) return
        const el = ref.current
        const rect = el.getBoundingClientRect()
        if (rect.right > window.innerWidth) {
            el.style.left = `${window.innerWidth - rect.width - 8}px`
        }
        if (rect.bottom > window.innerHeight) {
            el.style.top = `${window.innerHeight - rect.height - 8}px`
        }
    }, [visible, x, y])

    if (!visible) return null

    return (
        <div
            ref={ref}
            className="ctx-menu"
            style={{ left: x, top: y }}
            onClick={(e) => e.stopPropagation()}
        >
            {items.map((item, i) => {
                if (item.separator) {
                    return <div key={`sep-${i}`} className="ctx-sep" />
                }
                return (
                    <div
                        key={item.label}
                        className={`ctx-item ${item.danger ? 'ctx-danger' : ''}`}
                        onClick={() => {
                            item.onClick()
                            onClose()
                        }}
                    >
                        <span>{item.label}</span>
                        {item.shortcut && <span className="ctx-shortcut">{item.shortcut}</span>}
                    </div>
                )
            })}
        </div>
    )
}
