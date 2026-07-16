import { AppRoutes } from './routes/AppRoutes';
import { OfflineStatus } from './components/common/OfflineStatus';

export default function App() {
  return (
    <>
      <AppRoutes />
      <OfflineStatus />
    </>
  );
}
