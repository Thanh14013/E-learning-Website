import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { DiscussionProvider } from "./contexts/DiscussionContext";
import { ConfirmDialogProvider } from "./contexts/ConfirmDialogContext";
import { ChatProvider } from "./contexts/ChatContext";
import ChatManager from "./components/chat/ChatManager";
import router from "./routes/Router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ConfirmDialogProvider>
          <DiscussionProvider>
            <ChatProvider>
              <RouterProvider router={router} />
              <ToastContainer
                position="top-right"
                autoClose={2000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
              />
            </ChatProvider>
          </DiscussionProvider>
        </ConfirmDialogProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;