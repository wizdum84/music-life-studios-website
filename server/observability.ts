type LogLevel = "info" | "warn" | "error";
type LogDetails = Record<string, unknown>;

function serializeError(error: unknown) {
  if (!(error instanceof Error)) return error;
  return {
    name: error.name,
    message: error.message,
    ...(process.env.NODE_ENV === "production" ? {} : { stack: error.stack }),
  };
}

export function operationalLog(level: LogLevel, event: string, details: LogDetails = {}) {
  const record = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...Object.fromEntries(
      Object.entries(details).map(([key, value]) => [key, value instanceof Error ? serializeError(value) : value]),
    ),
  };
  const output = process.env.NODE_ENV === "production"
    ? JSON.stringify(record)
    : `${record.timestamp} ${level.toUpperCase()} ${event}${Object.keys(details).length ? ` ${JSON.stringify(record)}` : ""}`;
  (level === "error" ? console.error : level === "warn" ? console.warn : console.log)(output);
}
