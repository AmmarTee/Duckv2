/**
 * A very small structured logger.  Logs JSON lines to stdout.
 */
function log(level, message, data = {}) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...data
  };
  console.log(JSON.stringify(entry));
}

export default {
  info(message, data) {
    log('info', message, data);
  },
  error(message, data) {
    log('error', message, data);
  },
  warn(message, data) {
    log('warn', message, data);
  }
};