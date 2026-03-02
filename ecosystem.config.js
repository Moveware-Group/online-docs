/**
 * PM2 Ecosystem Config
 *
 * Two app definitions:
 *   online-docs       — staging/dev instance at /srv/ai/repos/online-docs  (port 3000)
 *   online-docs-prod  — production instance   at /var/www/online-docs       (port 3001)
 *
 * Usage:
 *   pm2 start ecosystem.config.js                    # start both
 *   pm2 start ecosystem.config.js --only online-docs-prod
 *   pm2 reload ecosystem.config.js --only online-docs-prod   # zero-downtime reload
 *   pm2 stop  ecosystem.config.js
 */

'use strict';

const os = require('os');

// Use at most half the CPU cores per instance so the other half stay available
// for PostgreSQL and the companion app. Adjust up on a dedicated server.
const prodWorkers = Math.max(2, Math.floor(os.cpus().length / 2));

module.exports = {
  apps: [

    // ── Staging / Dev ─────────────────────────────────────────────────────────
    {
      name: 'online-docs',
      cwd: '/srv/ai/repos/online-docs',
      script: 'node_modules/.bin/next',
      args: 'start --port 3000',

      // Single process — staging doesn't need to scale
      exec_mode: 'fork',
      instances: 1,

      // Restart if the process exceeds 700 MB
      max_memory_restart: '700M',

      // Per-process Node heap ceiling (should be < max_memory_restart)
      node_args: '--max-old-space-size=512',

      // Restart on crash but back off exponentially to avoid CPU spin
      autorestart: true,
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: '10s',

      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // Logs
      out_file: '/srv/ai/repos/online-docs/logs/pm2-out-0.log',
      error_file: '/srv/ai/repos/online-docs/logs/pm2-error-0.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // PM2 log-rotate handles rotation — keep last 30 days / 100 MB
      max_size: '100M',
      retain: 30,
    },

    // ── Production ────────────────────────────────────────────────────────────
    {
      name: 'online-docs-prod',
      cwd: '/var/www/online-docs',
      script: 'node_modules/.bin/next',
      args: 'start --port 3001',

      // Cluster mode: PM2 forks `prodWorkers` processes that all share port 3001.
      // Incoming connections are distributed round-robin across the workers.
      // This gives true multi-core utilisation for a CPU-bound Next.js workload.
      // Note: Next.js App Router with React Server Components is stateless per
      // request, so cluster mode is safe and has no shared-state issues.
      exec_mode: 'cluster',
      instances: prodWorkers,

      // Restart a worker that exceeds 1 GB (each worker is independent)
      max_memory_restart: '1G',

      // Give each worker up to 768 MB of V8 heap
      node_args: '--max-old-space-size=768',

      autorestart: true,
      restart_delay: 2000,
      max_restarts: 10,
      min_uptime: '10s',

      // When you run `pm2 reload`, PM2 sends SIGINT and waits up to 8 s for
      // in-flight requests to finish before it kills a worker — zero downtime.
      kill_timeout: 8000,
      wait_ready: false,    // Next.js doesn't emit the 'ready' event via process.send

      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },

      // Logs
      out_file: '/var/www/online-docs/logs/pm2-out.log',
      error_file: '/var/www/online-docs/logs/pm2-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_size: '100M',
      retain: 30,
    },
  ],
};
