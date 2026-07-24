import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"CUSTOMER" | "HOTEL_OWNER">("CUSTOMER");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await register(name, email, password, role);
      navigate("/");
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(message ?? "Registration failed");
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-20">
      <h1 className="mb-6 text-center text-2xl font-semibold text-neutral-100">Create account</h1>
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        {error && <p className="text-sm text-red-400">{error}</p>}
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          required
          className="w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-amber-400"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Email"
          required
          className="w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-amber-400"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Password (min 8 chars)"
          required
          minLength={8}
          className="w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-amber-400"
        />
        <div className="flex gap-2 text-sm">
          {(["CUSTOMER", "HOTEL_OWNER"] as const).map((r) => (
            <button
              type="button"
              key={r}
              onClick={() => setRole(r)}
              className={`flex-1 rounded-lg border px-3 py-2 ${role === r ? "border-amber-400 text-amber-400" : "border-white/10 text-neutral-400"}`}
            >
              {r === "CUSTOMER" ? "I'm a Guest" : "I'm a Hotel Owner"}
            </button>
          ))}
        </div>
        <button type="submit" className="w-full rounded-lg bg-amber-500 py-2 text-sm font-medium text-neutral-950 hover:bg-amber-400">
          Create account
        </button>
        <p className="text-center text-sm text-neutral-400">
          Have an account?{" "}
          <Link to="/login" className="text-amber-400">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
