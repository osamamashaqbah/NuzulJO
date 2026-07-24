import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { LoginPage } from "../../src/pages/LoginPage";
import { AuthProvider } from "../../src/context/AuthContext";
import { api } from "../../src/api/client";

vi.mock("../../src/api/client", async () => {
  const actual = await vi.importActual<typeof import("../../src/api/client")>("../../src/api/client");
  return { ...actual, api: { post: vi.fn(), get: vi.fn() } };
});

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.mocked(api.post).mockReset();
    vi.mocked(api.get).mockReset();
    // AuthProvider's initial /auth/refresh call, expected to fail for a logged-out user
    vi.mocked(api.post).mockImplementation((url: string) => {
      if (url === "/auth/refresh") return Promise.reject(new Error("no session"));
      return Promise.reject(new Error("unexpected call: " + url));
    });
  });

  it("shows an error message when login fails with invalid credentials", async () => {
    const user = userEvent.setup();
    renderLogin();

    vi.mocked(api.post).mockImplementation((url: string) => {
      if (url === "/auth/login") return Promise.reject({ response: { status: 401 } });
      return Promise.reject(new Error("unexpected call: " + url));
    });

    await user.type(screen.getByPlaceholderText("Email"), "wrong@nuzuljo.test");
    await user.type(screen.getByPlaceholderText("Password"), "wrongpass");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument());
  });
});
