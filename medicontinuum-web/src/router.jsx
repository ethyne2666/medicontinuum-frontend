import { createBrowserRouter } from 'react-router-dom';
import RootLayout from '@/layouts/RootLayout';
import PublicLayout from '@/layouts/PublicLayout';
import AppLayout from '@/layouts/AppLayout';
import NotFound from '@/pages/NotFound';

const page = (load) => ({
  lazy: async () => ({ Component: (await load()).default }),
});

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <NotFound />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { index: true, ...page(() => import('@/pages/Home')) },
          { path: 'login', ...page(() => import('@/pages/Login')) },
          { path: 'signup', ...page(() => import('@/pages/Signup')) },
        ],
      },
      {
        element: <AppLayout />,
        children: [
          { path: 'dashboard', ...page(() => import('@/pages/Dashboard')) },
          { path: 'summary', ...page(() => import('@/pages/Summary')) },
          { path: 'profile', ...page(() => import('@/pages/Profile')) },
          { path: 'family', ...page(() => import('@/pages/Family')) },
          { path: 'medicines', ...page(() => import('@/pages/Medicines')) },
          { path: 'prescriptions', ...page(() => import('@/pages/Prescriptions')) },
          { path: 'adherence', ...page(() => import('@/pages/Adherence')) },
          { path: 'inventory', ...page(() => import('@/pages/Inventory')) },
          { path: 'notifications', ...page(() => import('@/pages/Notifications')) },
          { path: 'organisations', ...page(() => import('@/pages/Organisations')) },
          { path: 'vendors', ...page(() => import('@/pages/Vendors')) },
        ],
      },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
