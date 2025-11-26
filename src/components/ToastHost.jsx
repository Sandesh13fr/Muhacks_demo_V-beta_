import { createPortal } from 'react-dom'
import { useToast } from '../hooks/useToast.js'

export default function ToastHost() {
  const { toasts, dismiss } = useToast()

  if (!toasts.length) {
    return null
  }

  return createPortal(
    <div className="toast-stack">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.variant || 'default'}`}>
          <div className="toast__body">
            {toast.title && <p className="toast__title">{toast.title}</p>}
            {toast.description && <p className="toast__description">{toast.description}</p>}
          </div>
          <button className="toast__close" onClick={() => dismiss(toast.id)}>
            Close
          </button>
        </div>
      ))}
    </div>,
    document.body
  )
}
