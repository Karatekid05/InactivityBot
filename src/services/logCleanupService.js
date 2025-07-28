export function startLogCleanupService(db) {
  // Clean up logs older than 30 days (configurable)
  const LOG_RETENTION_DAYS = 30;
  const LOG_RETENTION_SECONDS = LOG_RETENTION_DAYS * 24 * 60 * 60;
  
  // Run cleanup every 24 hours
  setInterval(() => {
    const cutoffTime = Math.floor(Date.now() / 1000) - LOG_RETENTION_SECONDS;
    
    try {
      const result = db.prepare('DELETE FROM removal_logs WHERE removed_at < ?').run(cutoffTime);
      console.log(`Cleaned up ${result.changes} old log entries (older than ${LOG_RETENTION_DAYS} days)`);
    } catch (error) {
      console.error('Error cleaning up logs:', error);
    }
  }, 24 * 60 * 60 * 1000); // 24 hours
  
  // Also run cleanup on startup
  const cutoffTime = Math.floor(Date.now() / 1000) - LOG_RETENTION_SECONDS;
  try {
    const result = db.prepare('DELETE FROM removal_logs WHERE removed_at < ?').run(cutoffTime);
    if (result.changes > 0) {
      console.log(`Cleaned up ${result.changes} old log entries on startup`);
    }
  } catch (error) {
    console.error('Error cleaning up logs on startup:', error);
  }
} 