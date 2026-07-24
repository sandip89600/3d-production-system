module.exports = {
  apps: [
    {
      name: '3d-production-backend',
      script: 'src/index.js',
      // Cluster mode settings
      instances: 'max',       // Run in cluster mode to use all CPU cores
      exec_mode: 'cluster',   // Enable PM2 load balancer and clustering
      // Restart configurations
      watch: false,           // Do not watch files for change in production
      max_memory_restart: '500M', // Automatically restart instance if memory exceeds 500MB
      autorestart: true,      // Restart automatically if crash occurs
      restart_delay: 2000,    // Wait 2s before restarting crashed instance
      max_restarts: 10,       // Max restarts before marking as failed
      // Zero downtime settings
      listen_timeout: 8000,   // Delay before marking server as ready
      kill_timeout: 3000,     // Grace period before force killing process
      // Logging configuration
      merge_logs: true,       // Combine logs from all cluster nodes
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      // Environment definitions
      env_development: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
    },
  ],
};
