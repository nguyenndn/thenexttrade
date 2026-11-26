/**
 * Detects client-side errors caused by a new deployment invalidating
 * old JS/CSS chunk hashes or Server Action reference IDs while a user
 * kept an older browser tab open.
 */
export function isStaleDeploymentError(
    error: { name?: string; message?: string; digest?: string } | null | undefined
): boolean {
    if (!error) return false;
    const msg = `${error.name || ""} ${error.message || ""}`;
    return (
        error.name === "ChunkLoadError" ||
        error.name === "UnrecognizedActionError" ||
        /Loading chunk [\w-]+ failed/i.test(msg) ||
        /Loading CSS chunk [\w-]+ failed/i.test(msg) ||
        /CSS_CHUNK_LOAD_FAILED/i.test(msg) ||
        /Unable to preload CSS/i.test(msg) ||
        /Failed to fetch dynamically imported module/i.test(msg) ||
        /Importing a module script failed/i.test(msg) ||
        /error loading dynamically imported module/i.test(msg) ||
        /Failed to find Server Action/i.test(msg) ||
        /Server Action .* was not found on the server/i.test(msg) ||
        /Expected RSC navigation response to have a body/i.test(msg)
    );
}
