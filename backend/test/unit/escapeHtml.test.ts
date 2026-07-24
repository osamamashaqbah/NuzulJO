import { escapeHtml } from "../../src/utils/escapeHtml";

describe("escapeHtml", () => {
  it("escapes HTML special characters", () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
  });

  it("leaves plain text untouched", () => {
    expect(escapeHtml("Grand Hotel Amman")).toBe("Grand Hotel Amman");
  });

  it("escapes ampersands and quotes", () => {
    expect(escapeHtml(`Bob & "Al"'s`)).toBe("Bob &amp; &quot;Al&quot;&#39;s");
  });
});
