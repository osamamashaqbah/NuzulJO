import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Navbar } from "./components/Navbar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PageTransition } from "./components/PageTransition";
import { HomePage } from "./pages/HomePage";
import { HotelDetailPage } from "./pages/HotelDetailPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { MyBookingsPage } from "./pages/MyBookingsPage";
import { OwnerDashboardPage } from "./pages/OwnerDashboardPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";

function App() {
  const location = useLocation();

  return (
    <div className="min-h-svh bg-neutral-950 text-neutral-100">
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><HomePage /></PageTransition>} />
          <Route path="/hotels/:id" element={<PageTransition><HotelDetailPage /></PageTransition>} />
          <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
          <Route path="/register" element={<PageTransition><RegisterPage /></PageTransition>} />
          <Route
            path="/my-bookings"
            element={
              <PageTransition>
                <ProtectedRoute roles={["CUSTOMER"]}>
                  <MyBookingsPage />
                </ProtectedRoute>
              </PageTransition>
            }
          />
          <Route
            path="/owner"
            element={
              <PageTransition>
                <ProtectedRoute roles={["HOTEL_OWNER"]}>
                  <OwnerDashboardPage />
                </ProtectedRoute>
              </PageTransition>
            }
          />
          <Route
            path="/admin"
            element={
              <PageTransition>
                <ProtectedRoute roles={["ADMIN"]}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              </PageTransition>
            }
          />
        </Routes>
      </AnimatePresence>
    </div>
  )
}

export default App
