import { useMemo, useState } from 'react';
import { useAsyncData } from '../../hooks/useAsyncData';
import { catalogService } from '../../services/catalogService';

export const REPORT_PERIOD_OPTIONS = [
  { value: 'weekly', label: 'Weekly', icon: 'bi-calendar-week' },
  { value: 'monthly', label: 'Monthly', icon: 'bi-calendar-month' },
  { value: 'quarterly', label: 'Quarterly', icon: 'bi-calendar3-range' },
  { value: 'yearly', label: 'Yearly', icon: 'bi-calendar3' },
  { value: 'custom', label: 'Custom', icon: 'bi-sliders' }
];

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function reportPeriodLabel(period) {
  return REPORT_PERIOD_OPTIONS.find((option) => option.value === period)?.label || 'Custom';
}

export function reportPeriodDates(period, referenceDate = new Date()) {
  const to = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  const from = new Date(to);

  if (period === 'monthly') {
    from.setDate(1);
  } else if (period === 'quarterly') {
    from.setMonth(Math.floor(to.getMonth() / 3) * 3, 1);
  } else if (period === 'yearly') {
    from.setMonth(0, 1);
  } else {
    from.setDate(to.getDate() - 6);
  }

  return {
    from: toDateInputValue(from),
    to: toDateInputValue(to)
  };
}

export function defaultReportFilters(period = 'weekly') {
  return {
    ...reportPeriodDates(period),
    period,
    periodLabel: reportPeriodLabel(period),
    locationId: 'all',
    locationName: 'All locations'
  };
}

export function ReportFilterPanel({ onApply }) {
  const { data: locations = [] } = useAsyncData(() => catalogService.locations(), [], []);
  const defaultFilters = useMemo(() => defaultReportFilters(), []);
  const [period, setPeriod] = useState(defaultFilters.period);
  const [from, setFrom] = useState(defaultFilters.from);
  const [to, setTo] = useState(defaultFilters.to);
  const [applied, setApplied] = useState('');

  const selectPeriod = (nextPeriod) => {
    setPeriod(nextPeriod);
    if (nextPeriod !== 'custom') {
      const dates = reportPeriodDates(nextPeriod);
      setFrom(dates.from);
      setTo(dates.to);
    }
  };

  const updateCustomDate = (setter) => (event) => {
    setPeriod('custom');
    setter(event.target.value);
  };

  const handleApply = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const selectedLocation = event.currentTarget.elements.locationId;
    const filters = {
      period,
      periodLabel: reportPeriodLabel(period),
      from,
      to,
      locationId: formData.get('locationId'),
      locationName: selectedLocation.options[selectedLocation.selectedIndex]?.text || 'All locations'
    };
    setApplied(`${filters.periodLabel} report applied.`);
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
      <div className="report-period-control" role="group" aria-label="Report period">
        {REPORT_PERIOD_OPTIONS.map((option) => (
          <button
            className={`btn ${period === option.value ? 'btn-primary' : 'btn-outline-primary'}`}
            type="button"
            key={option.value}
            onClick={() => selectPeriod(option.value)}
          >
            <i className={`bi ${option.icon}`} aria-hidden="true" /> {option.label}
          </button>
        ))}
      </div>
      <div className="report-filter-grid">
        <label>
          <span>Date from</span>
          <input className="form-control" type="date" name="from" value={from} onChange={updateCustomDate(setFrom)} />
        </label>
        <label>
          <span>Date to</span>
          <input className="form-control" type="date" name="to" value={to} onChange={updateCustomDate(setTo)} />
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
