import { describe, expect, it } from "vitest";
import { statusAfterSuccessfulCredentialTest } from "./credential-lifecycle";

describe("AI credential lifecycle", () => {
  it("moves a draft credential to tested", () => {
    expect(statusAfterSuccessfulCredentialTest("DRAFT", null)).toBe("TESTED");
  });

  it("allows a corrected invalid credential to be activated again", () => {
    expect(statusAfterSuccessfulCredentialTest("INVALID", null)).toBe("TESTED");
  });

  it("repairs a legacy active credential that has no activation timestamp", () => {
    expect(statusAfterSuccessfulCredentialTest("ACTIVE", null)).toBe("TESTED");
  });

  it("keeps a fully activated credential active after a health retest", () => {
    expect(statusAfterSuccessfulCredentialTest("ACTIVE", new Date())).toBe("ACTIVE");
  });
});
