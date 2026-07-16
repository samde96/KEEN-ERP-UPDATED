export function ConfirmModal({ open, title, body, confirmLabel = 'Confirm', cancelLabel = 'Cancel', tone = 'primary', onCancel, onConfirm, size = '' }) {
  if (!open) return null;

  return (
    <div className="modal-backdrop-shell" role="presentation">
      <div className="modal d-block app-modal" tabIndex="-1" role="dialog" aria-modal="true">
        <div className={`modal-dialog modal-dialog-centered ${size}`}>
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title fs-5">{title}</h2>
              <button type="button" className="btn-close" aria-label="Close" onClick={onCancel} />
            </div>
            <div className="modal-body">{typeof body === 'string' ? <p className="mb-0">{body}</p> : body}</div>
            {confirmLabel || cancelLabel ? (
              <div className="modal-footer">
                {cancelLabel ? (
                  <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>
                    {cancelLabel}
                  </button>
                ) : null}
                {confirmLabel ? (
                  <button type="button" className={`btn btn-${tone}`} onClick={onConfirm}>
                    {confirmLabel}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
