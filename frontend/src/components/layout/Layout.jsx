import { Outlet } from "react-router-dom";
import StudentHeader from "../layout/StudentHeader.jsx";
import Footer from "../layout/Footer.jsx";

export function Layout() {
  return (
    <>
      <StudentHeader />
      <main style={{ minHeight: "80vh", padding: "20px" }}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
export default Layout;
