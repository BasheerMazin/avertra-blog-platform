import { describe, it, expect } from "vitest";
import { mapErrorToHttp, mapErrorToTRPC } from "@/server/utils/errors";
import { HttpStatusCodes } from "@/constants/http";

describe("mapErrorToHttp", () => {
  it("maps validation-related messages to 400", () => {
    const cases = [
      "Invalid email",
      "Email is required",
      "Required field",
      "No fields to update",
    ];
    for (const msg of cases) {
      const { status } = mapErrorToHttp(new Error(msg));
      expect(status).toBe(HttpStatusCodes.BAD_REQUEST);
    }
  });

  it("maps authentication/authorization to 401/403", () => {
    expect(mapErrorToHttp(new Error("Authentication required")).status).toBe(
      HttpStatusCodes.UNAUTHORIZED
    );
    expect(mapErrorToHttp(new Error("unauthenticated")).status).toBe(
      HttpStatusCodes.UNAUTHORIZED
    );
    expect(mapErrorToHttp(new Error("invalid credentials")).status).toBe(
      HttpStatusCodes.UNAUTHORIZED
    );

    expect(mapErrorToHttp(new Error("Not authorized")).status).toBe(
      HttpStatusCodes.FORBIDDEN
    );
    expect(mapErrorToHttp(new Error("forbidden")).status).toBe(
      HttpStatusCodes.FORBIDDEN
    );
  });

  it("maps not found to 404", () => {
    const { status } = mapErrorToHttp(new Error("Resource not found"));
    expect(status).toBe(HttpStatusCodes.NOT_FOUND);
  });

  it("defaults to 500 for unknown errors", () => {
    const { status } = mapErrorToHttp(new Error("Unexpected boom"));
    expect(status).toBe(HttpStatusCodes.INTERNAL);
  });
});

describe("mapErrorToTRPC", () => {
  it("maps validation-related messages to BAD_REQUEST", () => {
    const cases = [
      "Invalid email",
      "Email is required",
      "Required field",
      "No fields to update",
    ];
    for (const msg of cases) {
      const trpcErr = mapErrorToTRPC(new Error(msg));
      expect(trpcErr.code).toBe("BAD_REQUEST");
    }
  });

  it("maps authentication to UNAUTHORIZED and authorization to FORBIDDEN", () => {
    expect(mapErrorToTRPC(new Error("Authentication required")).code).toBe(
      "UNAUTHORIZED"
    );
    expect(mapErrorToTRPC(new Error("unauthenticated")).code).toBe(
      "UNAUTHORIZED"
    );
    expect(mapErrorToTRPC(new Error("invalid credentials")).code).toBe(
      "UNAUTHORIZED"
    );
    expect(mapErrorToTRPC(new Error("Not authorized")).code).toBe("FORBIDDEN");
    expect(mapErrorToTRPC(new Error("forbidden")).code).toBe("FORBIDDEN");
  });

  it("maps not found to NOT_FOUND", () => {
    expect(mapErrorToTRPC(new Error("Resource not found")).code).toBe(
      "NOT_FOUND"
    );
  });

  it("defaults to INTERNAL when unknown", () => {
    const trpcErr = mapErrorToTRPC("string error" as unknown);
    expect(trpcErr.code).toBe("INTERNAL_SERVER_ERROR");
  });
});
