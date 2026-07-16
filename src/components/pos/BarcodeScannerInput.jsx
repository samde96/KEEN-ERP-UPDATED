export function BarcodeScannerInput({ value, onChange, onSubmit, placeholder = 'Scan or type barcode' }) {
  return (
    <form className="barcode-input" onSubmit={onSubmit}>
      <div className="input-group input-group-lg">
        <span className="input-group-text">
          <i className="bi bi-upc-scan" aria-hidden="true" />
        </span>
        <input className="form-control" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} autoComplete="off" />
        <button className="btn btn-primary" type="submit">
          Add
        </button>
      </div>
    </form>
  );
}
