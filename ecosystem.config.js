/**
 * PM2 Ecosystem Config
 *
 * Two app definitions:
 *   online-docs       — staging instance  at /srv/ai/repos/online-docs  (port 3000)
 *   online-docs-prod  — production instance at /var/www/online-docs      (port 3001)
 *
 * Port is controlled by the PORT env var — Next.js reads it automatically.
 * The npm script runner is used so the prestart hook (storage:check) still fires.
 *
 * Usage:
 *   pm2 start ecosystem.config.js                          # start both
 *   pm2 start ecosystem.config.js --only online-docs-prod  # prod only
 *   pm2 reload ecosystem.config.js --only online-docs-prod # zero-downtime reload
 *   pm2 stop  ecosystem.config.js
 *   pm2 delete ecosystem.config.js
 */

'use strict';

const os = require('os');

// Half the CPU cores go to production workers; the rest serve PostgreSQL and
// the staging instance. Raise instances to os.cpus().length on a dedicated server.
const prodWorkers = Math.max(2, Math.floor(os.cpus().length / 2));

module.exports = {
  apps: [

    // ── Staging ───────────────────────────────────────────────────────────────
    {
      name: 'online-docs',
      cwd: '/srv/ai/repos/online-docs',

      // Use npm so the prestart hook (storage:check) runs before next start
      script: 'npm',
      args: 'start',

      exec_mode: 'fork',
      instances: 1,

      max_memory_restart: '700M',
      node_args: '--max-old-space-size=512',

      autorestart: true,
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: '10s',

      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      out_file: '/srv/ai/repos/online-docs/logs/pm2-out-0.log',
      error_file: '/srv/ai/repos/online-docs/logs/pm2-error-0.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },

    // ── Production ────────────────────────────────────────────────────────────
    {
      name: 'online-docs-prod',
      cwd: '/var/www/online-docs',

      script: 'npm',
      args: 'start',

      // Cluster mode: PM2 spawns prodWorkers processes all binding to port 3001
      // via Node's cluster module. Requests are distributed round-robin.
      // Next.js App Router is stateless per request so this is safe.
      exec_mode: 'cluster',
      instances: prodWorkers,

      max_memory_restart: '1G',
      node_args: '--max-old-space-size=768',

      autorestart: true,
      restart_delay: 2000,
      max_restarts: 10,
      min_uptime: '10s',

      // Give in-flight requests up to 8 s to finish before a worker is replaced
      // during a `pm2 reload` (zero-downtime deploy)
      kill_timeout: 8000,

      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },

      out_file: '/var/www/online-docs/logs/pm2-out.log',
      error_file: '/var/www/online-docs/logs/pm2-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};
