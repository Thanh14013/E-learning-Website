import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import router from './routes/Router.jsx';
import { AuthProvider } from './contexts/AuthContext';
import { CourseProvider } from './contexts/CoursesContext';
import './index.css';
import './global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <CourseProvider>
        <RouterProvider router={router} />
        <Toaster
          position="top-right"
          reverseOrder={false}
          gutter={8}
          toastOptions={{
            // Default options for all toasts
            duration: 4000,
            style: {
              borderRadius: '10px',
              background: '#333',
              color: '#fff',
              padding: '16px',
              fontSize: '14px',
              maxWidth: '500px',
            },
            // Success toast styling
            success: {
              duration: 3000,
              style: {
                background: '#10b981',
              },
              iconTheme: {
                primary: '#fff',
                secondary: '#10b981',
              },
            },
            // Error toast styling
            error: {
              duration: 5000,
              style: {
                background: '#ef4444',
              },
              iconTheme: {
                primary: '#fff',
                secondary: '#ef4444',
              },
            },
            // Loading toast styling
            loading: {
              style: {
                background: '#6366f1',
              },
            },
          }}
        />
      </CourseProvider>
    </AuthProvider>
  </React.StrictMode>
);
