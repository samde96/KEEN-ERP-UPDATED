export function PageHeader({ title, description, actions }) {
  return (
    <div className="page-header" data-animate="fade-up">
      <div>
        <p className="page-kicker">Keen Operations</p>
        <h1>{title}</h1>
        {description ? <p className="page-description">{description}</p> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </div>
  );
}
