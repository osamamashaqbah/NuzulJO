import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { HomePage } from "../../src/pages/HomePage";
import { api } from "../../src/api/client";

vi.mock("../../src/api/client", async () => {
  const actual = await vi.importActual<typeof import("../../src/api/client")>("../../src/api/client");
  return { ...actual, api: { get: vi.fn() } };
});

// The hero photo carousel is irrelevant to search behavior, so stub it out for this test.
vi.mock("../../src/components/Hero3D", () => ({ Hero3D: () => <div /> }));

describe("HomePage search", () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
    vi.mocked(api.get).mockResolvedValue({ data: [] });
  });

  it("calls GET /hotels with the typed query after the debounce delay", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(api.get).toHaveBeenCalledWith("/hotels", { params: {} }));
    vi.mocked(api.get).mockClear();

    await user.type(screen.getByPlaceholderText(/search by hotel or city/i), "Amman");

    await waitFor(
      () => expect(api.get).toHaveBeenCalledWith("/hotels", { params: { q: "Amman" } }),
      { timeout: 1000 },
    );
  });
});
