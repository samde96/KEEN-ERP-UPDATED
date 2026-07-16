export function SearchFilterBar({ value, onChange, placeholder = 'Search records', actions, filters }) {
  return (
    <div className="search-filter-bar" data-animate="fade-up">
      <div className="input-group">
        <span className="input-group-text">
          <i className="bi bi-search" aria-hidden="true" />
        </span>
        <input className="form-control" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      </div>
      {filters ? <div className="filter-controls">{filters}</div> : null}
      {actions ? <div className="filter-actions">{actions}</div> : null}
    </div>
  );
}
