import { useState } from 'react';

export function ApprovalModal({ open, title, body, onCancel, onApprove }) {
  const [pin, setPin] = useState('');

  if (!open) return null;

  return (
    <div className="modal-backdrop-shell" role="presentation">
      <div className="modal d-block app-modal" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title fs-5">{title}</h2>
              <button type="button" className="btn-close" aria-label="Close" onClick={onCancel} />
            </div>
            <div className="modal-body">
              <p>{body}</p>
              <label className="form-label" htmlFor="manager-pin">
                Manager PIN
              </label>
              <input
                id="manager-pin"
                className="form-control"
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(event) => setPin(event.target.value)}
                placeholder="Enter approval PIN"
              />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" disabled={pin.length < 4} onClick={() => onApprove(pin)}>
                Approve
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
