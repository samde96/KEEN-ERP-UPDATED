export function StatCard({ icon, title, value, subtext, delta, tone = 'primary' }) {
  return (
    <article className={`stat-card stat-card-${tone}`} data-animate="fade-up">
      <div className="stat-icon" aria-hidden="true">
        <i className={`bi ${icon}`} />
      </div>
      <div className="stat-copy">
        <span>{title}</span>
        <strong>{value}</strong>
        <div className="stat-meta">
          {delta ? <em>{delta}</em> : null}
          {subtext ? <small>{subtext}</small> : null}
        </div>
      </div>
    </article>
  );
}
