import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import router from './routes/Router.jsx';
import { AuthProvider } from './contexts/AuthContext';
import { CourseProvider } from './contexts/CoursesContext';
import { ToastProvider } from './contexts/ToastContext.jsx';
import './index.css';
import './global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <CourseProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </CourseProvider>
    </AuthProvider>
  </React.StrictMode>
);
