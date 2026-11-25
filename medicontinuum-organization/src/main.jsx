import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';
import { AuthProvider } from '@/auth/AuthContext';
import { startHub } from '@/lib/hub';
import './index.css';

startHub(); // open the sync channel to the patient site as early as possible

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>
);
