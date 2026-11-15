import { describe, expect, it } from "vitest";
import { insertContractSignatureSchema, insertUserSchema } from "../shared/schema";

describe("security-sensitive input schemas", () => {
  it("requires a stronger account password", () => {
    const result = insertUserSchema.safeParse({
      username: "test-user",
      email: "test@example.com",
      password: "short",
      role: "customer",
    });
    expect(result.success).toBe(false);
  });

  it("validates the contract signature payload shape", () => {
    const result = insertContractSignatureSchema.safeParse({
      contractId: 1,
      customerName: "Test Customer",
      customerEmail: "test@example.com",
      signatureData: "typed-signature",
      agreedToTerms: false,
    });
    expect(result.success).toBe(true);
    expect(result.data?.agreedToTerms).toBe(false);
  });

  it("accepts a short typed contract signature", () => {
    const result = insertContractSignatureSchema.safeParse({
      contractId: 1,
      customerName: "Artist QA",
      customerEmail: "artist@example.com",
      signatureData: "Artist QA",
      agreedToTerms: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a blank contract signature", () => {
    const result = insertContractSignatureSchema.safeParse({
      contractId: 1,
      customerName: "Artist QA",
      customerEmail: "artist@example.com",
      signatureData: "   ",
      agreedToTerms: true,
    });
    expect(result.success).toBe(false);
  });
});
