import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-neutral-950/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 text-neutral-100">
        <Link to="/" className="text-lg font-semibold tracking-tight text-amber-400">
          NuzulJO
        </Link>
        <div className="flex items-center gap-4 text-sm">
          {user?.role === "CUSTOMER" && (
            <Link to="/my-bookings" className="hover:text-amber-400">
              My Bookings
            </Link>
          )}
          {user?.role === "HOTEL_OWNER" && (
            <Link to="/owner" className="hover:text-amber-400">
              Owner Dashboard
            </Link>
          )}
          {user?.role === "ADMIN" && (
            <Link to="/admin" className="hover:text-amber-400">
              Admin
            </Link>
          )}
          {user ? (
            <button
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="rounded-full border border-white/20 px-3 py-1 hover:border-amber-400 hover:text-amber-400"
            >
              Logout
            </button>
          ) : (
            <Link to="/login" className="rounded-full border border-white/20 px-3 py-1 hover:border-amber-400 hover:text-amber-400">
              Login
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
