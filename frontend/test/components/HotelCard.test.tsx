import { describe, it, expect } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HotelCard } from "../../src/components/HotelCard";
import type { Hotel } from "../../src/types";

const hotel: Hotel = {
  id: "h1",
  name: "Test Hotel",
  isActive: true,
  starRating: 4,
  images: [],
  amenities: [],
  city: { id: "c1", name: "Amman" },
};

describe("HotelCard 3D tilt", () => {
  it("updates the card's transform in response to mousemove, away from the neutral resting state", async () => {
    const { container } = render(
      <MemoryRouter>
        <HotelCard hotel={hotel} />
      </MemoryRouter>,
    );

    const card = container.querySelector(".group") as HTMLElement;
    expect(card).toBeTruthy();

    const restingTransform = card.style.transform;

    const rect = { left: 0, top: 0, width: 200, height: 150, right: 200, bottom: 150, x: 0, y: 0, toJSON: () => {} };
    card.getBoundingClientRect = () => rect as DOMRect;

    card.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: 190, clientY: 10 }));

    await waitFor(
      () => {
        expect(card.style.transform).not.toBe(restingTransform);
      },
      { timeout: 1000 },
    );
  });
});
