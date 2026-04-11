function firstSentence(message: string): string {
  const trimmed = message.trim();
  const dot = trimmed.indexOf(".");
  if (dot === -1) return trimmed;
  return trimmed.slice(0, dot + 1).trim();
}

export function readErrorMessage(err: unknown): string {
  let raw: string;
  if (err instanceof Error) {
    const cause = (err as Error & { cause?: unknown }).cause;
    raw = cause instanceof Error ? cause.message : err.message;
  } else {
    raw = "Something went wrong";
  }
  return firstSentence(raw);
}
