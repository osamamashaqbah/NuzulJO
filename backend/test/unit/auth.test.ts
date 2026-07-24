import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken } from "../../src/utils/jwt";

describe("password hashing", () => {
  it("verifies a correct password against its hash", async () => {
    const hash = await bcrypt.hash("password123", 4);
    await expect(bcrypt.compare("password123", hash)).resolves.toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await bcrypt.hash("password123", 4);
    await expect(bcrypt.compare("wrong-password", hash)).resolves.toBe(false);
  });
});

describe("access tokens", () => {
  it("round-trips userId and role through sign/verify", () => {
    const token = signAccessToken({ userId: "u1", role: "CUSTOMER" });
    const payload = verifyAccessToken(token);
    expect(payload.userId).toBe("u1");
    expect(payload.role).toBe("CUSTOMER");
  });

  it("throws on an expired token", () => {
    const expired = jwt.sign({ userId: "u1", role: "CUSTOMER" }, process.env.JWT_ACCESS_SECRET!, { expiresIn: -1 });
    expect(() => verifyAccessToken(expired)).toThrow();
  });

  it("throws on a token signed with the wrong secret", () => {
    const badToken = jwt.sign({ userId: "u1", role: "CUSTOMER" }, "wrong_secret");
    expect(() => verifyAccessToken(badToken)).toThrow();
  });
});

describe("refresh tokens", () => {
  it("round-trips the jti through sign/verify", () => {
    const token = signRefreshToken("some-jti");
    expect(verifyRefreshToken(token).jti).toBe("some-jti");
  });

  it("throws on a tampered refresh token", () => {
    const token = signRefreshToken("some-jti");
    expect(() => verifyRefreshToken(token + "tampered")).toThrow();
  });
});
