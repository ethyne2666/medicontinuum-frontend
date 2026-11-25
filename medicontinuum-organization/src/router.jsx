import { createBrowserRouter } from 'react-router-dom';
import RootLayout from '@/layouts/RootLayout';
import PortalLayout from '@/layouts/PortalLayout';
import NotFound from '@/pages/NotFound';

const page = (load) => ({ lazy: async () => ({ Component: (await load()).default }) });

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <NotFound />,
    children: [
      { index: true, ...page(() => import('@/pages/Home')) },
      { path: 'register', ...page(() => import('@/pages/Register')) },
      { path: 'register/done', ...page(() => import('@/pages/Registered')) },
      { path: 'signup', ...page(() => import('@/pages/Signup')) },
      { path: 'login', ...page(() => import('@/pages/Login')) },
      {
        path: 'portal',
        element: <PortalLayout />,
        children: [
          { index: true, ...page(() => import('@/pages/Dashboard')) },
          { path: 'shares', ...page(() => import('@/pages/Shares')) },
          { path: 'network', ...page(() => import('@/pages/Network')) },
          { path: 'profile', ...page(() => import('@/pages/Profile')) },
        ],
      },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
