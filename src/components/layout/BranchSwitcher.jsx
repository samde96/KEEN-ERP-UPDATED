import { useBranch } from '../../hooks/useBranch';

export function BranchSwitcher() {
  const { locations, currentLocationId, setCurrentLocationId } = useBranch();

  return (
    <label className="branch-switcher">
      <span className="visually-hidden">Current location</span>
      <i className="bi bi-geo-alt" aria-hidden="true" />
      <select className="form-select form-select-sm" value={currentLocationId} onChange={(event) => setCurrentLocationId(event.target.value)} disabled={locations.length <= 1}>
        {locations.length ? (
          locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))
        ) : (
          <option value="">No locations</option>
        )}
      </select>
    </label>
  );
}
