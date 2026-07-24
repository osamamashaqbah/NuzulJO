import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AnimatedGradientBg } from "../components/AnimatedGradientBg";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/");
    } catch {
      setError("Invalid email or password");
    }
  }

  return (
    <div className="relative mx-auto max-w-sm overflow-hidden px-4 py-20">
      <AnimatedGradientBg />
      <h1 className="mb-6 text-center text-2xl font-semibold text-neutral-100">Log in</h1>
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        {error && <p className="text-sm text-red-400">{error}</p>}
        <label className="block text-sm">
          <span className="sr-only">Email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
            required
            className="w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-amber-400"
          />
        </label>
        <label className="block text-sm">
          <span className="sr-only">Password</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            required
            className="w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-amber-400"
          />
        </label>
        <button type="submit" className="w-full rounded-lg bg-amber-500 py-2 text-sm font-medium text-neutral-950 hover:bg-amber-400">
          Log in
        </button>
        <p className="text-center text-sm text-neutral-400">
          No account?{" "}
          <Link to="/register" className="text-amber-400">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}
