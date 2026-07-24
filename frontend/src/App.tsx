import { Routes, Route } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { HomePage } from "./pages/HomePage";
import { HotelDetailPage } from "./pages/HotelDetailPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { MyBookingsPage } from "./pages/MyBookingsPage";
import { OwnerDashboardPage } from "./pages/OwnerDashboardPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";

function App() {
  return (
    <div className="min-h-svh bg-neutral-950 text-neutral-100">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/hotels/:id" element={<HotelDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute roles={["CUSTOMER"]}>
              <MyBookingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner"
          element={
            <ProtectedRoute roles={["HOTEL_OWNER"]}>
              <OwnerDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  )
}

export default App
