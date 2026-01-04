import { Outlet, useLocation } from "react-router-dom";
import StudentHeader from "../layout/StudentHeader.jsx";
import Footer from "../layout/Footer.jsx";
import ChatManager from "../chat/ChatManager.jsx";

export function Layout() {
  const location = useLocation();
  const hideHeaderFooter = ['/login', '/register', '/admin/login'].includes(location.pathname);

  if (hideHeaderFooter) {
    return (
      <main>
        <Outlet />
      </main>
    );
  }

  return (
    <>
      <StudentHeader />
      <main style={{ minHeight: "80vh", padding: "20px" }}>
        <Outlet />
      </main>
      <ChatManager />
      <Footer />
    </>
  );
}
export default Layout;
