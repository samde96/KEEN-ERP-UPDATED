import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { Sidebar, MobileSidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { animatePageEnter } from '../../animations/gsapAnimations';

export function AppLayout() {
  const location = useLocation();
  const contentRef = useRef(null);

  useEffect(() => {
    animatePageEnter(contentRef.current);
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <Sidebar />
      <MobileSidebar />
      <div className="app-main">
        <Topbar />
        <main className="app-content" ref={contentRef}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
