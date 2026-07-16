import { useMemo, useState } from 'react';
import { useAsyncData } from '../../hooks/useAsyncData';
import { catalogService } from '../../services/catalogService';

function toDateInputValue(date) {
  return date.toISOString().slice(0, 10);
}

export function ReportFilterPanel({ onApply }) {
  const { data: locations = [] } = useAsyncData(() => catalogService.locations(), [], []);
  const [applied, setApplied] = useState('');
  const defaultDates = useMemo(() => {
    const to = new Date();
    const from = new Date(to);
    from.setDate(to.getDate() - 6);

    return {
      from: toDateInputValue(from),
      to: toDateInputValue(to)
    };
  }, []);

  const handleApply = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const filters = {
      from: formData.get('from'),
      to: formData.get('to'),
      locationId: formData.get('locationId')
    };
    setApplied('Filters applied.');
    if (onApply) onApply(filters);
  };

  return (
    <form className="panel" data-animate="fade-up" onSubmit={handleApply}>
      <div className="panel-header">
        <div>
          <span className="panel-kicker">Filters</span>
          <h2>Report range</h2>
        </div>
        <i className="bi bi-funnel panel-icon" aria-hidden="true" />
      </div>
      <div className="report-filter-grid">
        <label>
          <span>Date from</span>
          <input className="form-control" type="date" name="from" defaultValue={defaultDates.from} />
        </label>
        <label>
          <span>Date to</span>
          <input className="form-control" type="date" name="to" defaultValue={defaultDates.to} />
        </label>
        <label>
          <span>Branch</span>
          <select className="form-select" name="locationId" defaultValue="all">
            <option value="all">All locations</option>
            {locations.map((location) => (
              <option key={location.id || location.name} value={location.id || location.name}>
                {location.name}
              </option>
            ))}
          </select>
        </label>
        <button className="btn btn-primary align-self-end" type="submit">
          <i className="bi bi-arrow-repeat" aria-hidden="true" /> Apply
        </button>
      </div>
      {applied ? <div className="alert alert-success mt-3 mb-0">{applied}</div> : null}
    </form>
  );
}
