import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { AuthProvider } from "../../src/context/AuthContext";
import { api } from "../../src/api/client";

vi.mock("../../src/api/client", async () => {
  const actual = await vi.importActual<typeof import("../../src/api/client")>("../../src/api/client");
  return { ...actual, api: { post: vi.fn(), get: vi.fn() } };
});

function renderProtected(path: string, roles?: ("CUSTOMER" | "HOTEL_OWNER" | "ADMIN")[]) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/" element={<div>Home Page</div>} />
          <Route
            path={path}
            element={
              <ProtectedRoute roles={roles}>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.mocked(api.post).mockReset();
  });

  it("redirects an unauthenticated user to /login", async () => {
    vi.mocked(api.post).mockRejectedValue(new Error("no session"));
    renderProtected("/owner", ["HOTEL_OWNER"]);
    await waitFor(() => expect(screen.getByText("Login Page")).toBeInTheDocument());
  });

  it("redirects a CUSTOMER away from an ADMIN-only route to /", async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { accessToken: "t", user: { id: "u1", name: "C", email: "c@x.com", role: "CUSTOMER" } },
    });
    renderProtected("/admin", ["ADMIN"]);
    await waitFor(() => expect(screen.getByText("Home Page")).toBeInTheDocument());
  });

  it("renders the protected content for an authorized role", async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { accessToken: "t", user: { id: "u1", name: "O", email: "o@x.com", role: "HOTEL_OWNER" } },
    });
    renderProtected("/owner", ["HOTEL_OWNER"]);
    await waitFor(() => expect(screen.getByText("Protected Content")).toBeInTheDocument());
  });
});
