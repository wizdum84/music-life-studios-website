import { describe, expect, it } from "vitest";
import { buildObjectKey } from "../server/services/object-storage";

describe("R2 object keys", () => {
  it("normalizes user-facing names into stable nested keys", () => {
    expect(buildObjectKey("beats", "42", "Premium WAV", "My Beat (Final).wav"))
      .toBe("beats/42/Premium-WAV/My-Beat-Final-.wav");
  });

  it("removes traversal segments", () => {
    expect(buildObjectKey("customer-uploads", "..", "7", "../../track.wav"))
      .toBe("customer-uploads/7/track.wav");
  });
});
