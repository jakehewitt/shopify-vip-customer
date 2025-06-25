
/**
 * Creates a logger with consistent formatting
 * TODO: Implement a more robust logging solution like Winston or Pino
 * 
 * @param context Context identifier for the logs
 * @returns Logger object with methods for different log levels
 */
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
