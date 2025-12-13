import { RouterProvider } from "react-router-dom";
import router from "./routes/Router";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { DiscussionProvider } from "./contexts/DiscussionContext.jsx";

export function App() {
  return (
    <AuthProvider>
      <DiscussionProvider>
        <RouterProvider router={router} />
      </DiscussionProvider>
    </AuthProvider>
  );
}

export default App;