// TODO: Use a proper logger library like Winston or Pino
export function createLogger(context: string) {
  const formatMessage = (level: string, message: string) => {
    return `[${new Date().toISOString()}] [${level}] [${context}] ${message}`;
  };

  return {
    debug: (message: string, data?: unknown) => {
      console.debug(formatMessage('DEBUG', message), data ? data : '');
    },
    info: (message: string, data?: unknown) => {
      console.info(formatMessage('INFO', message), data ? data : '');
    },
    warn: (message: string, data?: unknown) => {
      console.warn(formatMessage('WARN', message), data ? data : '');
    },
    error: (message: string, error?: unknown) => {
      console.error(formatMessage('ERROR', message), error ? error : '');
    },
  };
}
