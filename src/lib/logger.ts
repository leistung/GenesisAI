type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  method?: string;
  path?: string;
  status?: number;
  duration?: number;
  userId?: string;
  ip?: string;
  error?: string;
  [key: string]: unknown;
}

function formatLog(entry: LogEntry): string {
  const { timestamp, level, message, ...rest } = entry;
  const meta = Object.keys(rest).length > 0 ? ` ${JSON.stringify(rest)}` : "";
  return `[${timestamp}] ${level.toUpperCase()}: ${message}${meta}`;
}

function createLogEntry(level: LogLevel, message: string, meta?: Partial<LogEntry>): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };
}

export const logger = {
  debug(message: string, meta?: Partial<LogEntry>) {
    if (process.env.NODE_ENV === "development") {
      console.debug(formatLog(createLogEntry("debug", message, meta)));
    }
  },

  info(message: string, meta?: Partial<LogEntry>) {
    console.info(formatLog(createLogEntry("info", message, meta)));
  },

  warn(message: string, meta?: Partial<LogEntry>) {
    console.warn(formatLog(createLogEntry("warn", message, meta)));
  },

  error(message: string, meta?: Partial<LogEntry>) {
    console.error(formatLog(createLogEntry("error", message, meta)));
  },

  /** Log an API request */
  apiRequest(meta: {
    method: string;
    path: string;
    status: number;
    duration: number;
    userId?: string;
    ip?: string;
  }) {
    const level: LogLevel = meta.status >= 500 ? "error" : meta.status >= 400 ? "warn" : "info";
    this[level](`${meta.method} ${meta.path} ${meta.status}`, {
      ...meta,
    });
  },
};
