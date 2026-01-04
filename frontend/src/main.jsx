import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import router from './routes/Router.jsx';
import { AuthProvider } from './contexts/AuthContext';
import { CourseProvider } from './contexts/CoursesContext';
import { DiscussionProvider } from './contexts/DiscussionContext.jsx';
import { ToastProvider } from './contexts/ToastContext.jsx';
import { NotificationProvider } from './contexts/NotificationContext.jsx';
import { ConfirmDialogProvider } from './contexts/ConfirmDialogContext.jsx';
import SocketManager from './components/common/SocketManager.jsx';
import './index.css';
import './global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <CourseProvider>
        <DiscussionProvider>
          <ToastProvider>
            <NotificationProvider>
              <ConfirmDialogProvider>
                <SocketManager />
                <RouterProvider router={router} />
              </ConfirmDialogProvider>
            </NotificationProvider>
          </ToastProvider>
        </DiscussionProvider>
      </CourseProvider>
    </AuthProvider>
  </React.StrictMode>
);
