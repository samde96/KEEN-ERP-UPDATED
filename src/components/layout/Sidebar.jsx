import { NavLink } from 'react-router-dom';
import { getNavigationForRole } from '../../data/navigation';
import { useAuth } from '../../hooks/useAuth';
import { animateSidebar } from '../../animations/gsapAnimations';
import { useEffect, useRef } from 'react';
import { BrandLogo } from '../common/BrandLogo';

function SidebarContent() {
  const { user } = useAuth();
  const sections = getNavigationForRole(user?.roles || user?.role);

  return (
    <>
      <div className="sidebar-brand">
        <BrandLogo />
        <div>
          <strong>Keen</strong>
          <span>Inventory and POS</span>
        </div>
      </div>
      <nav className="sidebar-nav" aria-label="Primary navigation">
        {sections.map((section) => (
          <div className="sidebar-section" key={section.title}>
            <p>{section.title}</p>
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <i className={`bi ${item.icon}`} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </>
  );
}

export function Sidebar() {
  const sidebarRef = useRef(null);

  useEffect(() => {
    animateSidebar(sidebarRef.current);
  }, []);

  return (
    <aside className="app-sidebar d-none d-lg-flex" ref={sidebarRef}>
      <SidebarContent />
    </aside>
  );
}

export function MobileSidebar() {
  return (
    <div className="offcanvas offcanvas-start app-mobile-sidebar" tabIndex="-1" id="mobileSidebar" aria-labelledby="mobileSidebarLabel">
      <div className="offcanvas-header">
        <h2 className="offcanvas-title fs-5" id="mobileSidebarLabel">
          Navigation
        </h2>
        <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close" />
      </div>
      <div className="offcanvas-body">
        <SidebarContent />
      </div>
    </div>
  );
}
