import { describe, it, expect } from "vitest";
import { isInternalError, toPublicErrorMessage } from "./public-error";

describe("public-error sanitizer", () => {
    it("masks Prisma invocation and column-length errors", () => {
        const prismaErr = new Error(
            "Invalid `prisma.mt5ImportJob.update()` invocation:\nThe provided value for the column is too long for the column's type. Column: (not available)"
        );
        expect(isInternalError(prismaErr)).toBe(true);
        expect(toPublicErrorMessage(prismaErr, "Failed to update sync job.")).toBe(
            "Failed to update sync job."
        );
    });

    it("masks Prisma P-code errors even with short messages", () => {
        const p2002 = Object.assign(new Error("Constraint failed"), {
            code: "P2002",
        });
        expect(isInternalError(p2002)).toBe(true);
        expect(toPublicErrorMessage(p2002, "Operation failed.")).toBe(
            "Operation failed."
        );
    });

    it("masks CLI command dumps and internal binary references", () => {
        const cliErr = new Error(
            "Command failed: java -jar mt5-native-runner.jar --password secret --apk bin/metatrader5.apk"
        );
        expect(isInternalError(cliErr)).toBe(true);
        expect(toPublicErrorMessage(cliErr, "Sync failed.")).toBe("Sync failed.");
    });

    it("preserves clean business and validation error messages", () => {
        const appErr = new Error("Invalid competition date range.");
        expect(isInternalError(appErr)).toBe(false);
        expect(toPublicErrorMessage(appErr, "Fallback")).toBe(
            "Invalid competition date range."
        );
    });
});
