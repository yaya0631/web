function ensureOverlayBindings(overlay) {
  if (!overlay || overlay.dataset.boundModal === '1') return
  overlay.dataset.boundModal = '1'
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      closeModal(overlay.id)
    }
  })
}

export function openModal(id) {
  closeModal('all')
  const overlay = document.getElementById(id)
  if (!overlay) return
  ensureOverlayBindings(overlay)
  overlay.classList.add('open')
}

export function closeModal(id) {
  if (id === 'all') {
    document.querySelectorAll('.overlay.open').forEach((overlay) => {
      overlay.classList.remove('open')
    })
    return
  }
  const overlay = document.getElementById(id)
  if (!overlay) return
  overlay.classList.remove('open')
}
