export class NckhGoogleAuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NckhGoogleAuthorizationError";
  }
}

// Existing NCKH controllers use 401 for these Google authorization failures.
// Other 401 responses still belong to the FormAuto session recovery flow.
const googleAuthorizationMessages = new Set([
  "Google account not linked.",
  "Google account not linked. Please link your Google account.",
  "Google account not linked or token expired. Please re-link your Google account."
]);

export async function readNckhGoogleAuthorizationError(path: string, response: Response) {
  if (response.status !== 401 || !path.startsWith("/api/v1/nckh/")) return null;
  try {
    const problem: unknown = await response.clone().json();
    if (!problem || typeof problem !== "object") return null;
    const { title, detail } = problem as { title?: unknown; detail?: unknown };
    if (title === "Unauthorized" && typeof detail === "string" && googleAuthorizationMessages.has(detail)) {
      return new NckhGoogleAuthorizationError(detail);
    }
  } catch {
    // Empty or malformed 401 responses must still trigger session recovery.
  }
  return null;
}
