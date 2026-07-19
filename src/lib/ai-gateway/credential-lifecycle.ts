export function statusAfterSuccessfulCredentialTest(
    status: string,
    activatedAt: Date | null
): string {
    if (status === "DRAFT" || status === "INVALID") return "TESTED";
    if (status === "ACTIVE" && !activatedAt) return "TESTED";
    return status;
}
