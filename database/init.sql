-- Roles being monitored
CREATE TABLE IF NOT EXISTS monitored_roles (
  role_id TEXT PRIMARY KEY,
  inactivity_timeout INTEGER NOT NULL -- seconds
);

-- Last activity per user per role
CREATE TABLE IF NOT EXISTS user_activity (
  user_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  last_activity INTEGER NOT NULL, -- unix timestamp
  PRIMARY KEY (user_id, role_id)
);

-- Logs of role removals
CREATE TABLE IF NOT EXISTS removal_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  removed_at INTEGER NOT NULL -- unix timestamp
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_removal_logs_removed_at ON removal_logs(removed_at DESC);
CREATE INDEX IF NOT EXISTS idx_removal_logs_user_id ON removal_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_removal_logs_role_id ON removal_logs(role_id); 