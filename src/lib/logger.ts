// TODO: Use a proper logger library like Winston or Pino
export function createLogger(context: string) {
  const formatMessage = (level: string, message: string) => {
    return `[${new Date().toISOString()}] [${level}] [${context}] ${message}`;
  };
  
  return {
    debug: (message: string, data?: any) => {
      console.debug(formatMessage('DEBUG', message), data ? data : '');
    },
    info: (message: string, data?: any) => {
      console.info(formatMessage('INFO', message), data ? data : '');
    },
    warn: (message: string, data?: any) => {
      console.warn(formatMessage('WARN', message), data ? data : '');
    },
    error: (message: string, error?: any) => {
      console.error(formatMessage('ERROR', message), error ? error : '');
    }
  };
}
