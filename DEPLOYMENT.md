# Production Deployment Guide: All 3D Studio

This document details the step-by-step procedure for deploying the **All 3D Studio Work Management Platform** in a production-ready, secure, and performant environment.

---

## 1. System Architecture

The application is deployed on a single virtual machine (e.g., AWS EC2, DigitalOcean Droplet, Linode) running Ubuntu 22.04 LTS:
- **Nginx**: Reverse proxy, SSL termination (Let's Encrypt), static asset cache, gzip compression, and security headers.
- **PM2**: Runs the Node.js backend in cluster mode across multiple CPU cores with auto-restart, log rotation, and memory management.
- **Redis (Managed or Local)**: Caching, rate limiting, session store, and OTP storage.
- **MongoDB Atlas**: Managed MongoDB cluster with connection pooling and automated failovers.
- **AWS S3**: Cloud-based storage for high-resolution project files, previews, profile avatars, and deliverables.

---

## 2. Prerequisites & Installations

SSH into your target host server and execute the following commands:

```bash
# Update System packages
sudo apt update && sudo apt upgrade -y

# Install Node.js (v20.x)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Nginx
sudo apt install -y nginx

# Install Redis Server
sudo apt install -y redis-server
# Enable and start Redis service
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Install PM2 and log rotation helper globally
sudo npm install -g pm2
pm2 install pm2-logrotate
```

---

## 3. Environment Variables Configuration

Create a `.env` file in `/var/www/all3dstudio/backend/.env`.

```ini
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://allindia3dstudio.deepitlabs.in

# ─── MongoDB Atlas Connection
# Replace with your production connection string
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/3d-production?retryWrites=true&w=majority

# ─── JWT Secrets
JWT_SECRET=production_super_secret_jwt_key_2026_all3dstudio
JWT_REFRESH_SECRET=production_refresh_secret_jwt_key_2026_all3dstudio
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=12

# ─── Redis Connection
REDIS_URL=redis://127.0.0.1:6379

# ─── AWS S3 Storage Configuration
STORAGE_PROVIDER=s3
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=ap-south-1
AWS_BUCKET_NAME=your-production-private-s3-bucket
AWS_S3_ACL=private # S3 objects must be private; generated links use pre-signed URLs

# ─── System Constraints
MAX_FILE_SIZE=524288000 # 500 MB in bytes
MAX_PROFILE_SIZE=5242880 # 5 MB
MAX_PROJECT_SIZE=524288000 # 500 MB
MAX_DOCUMENT_SIZE=52428800 # 50 MB
RATE_LIMIT_WINDOW_MS=900000 # 15 minutes
RATE_LIMIT_MAX=2000
LOGIN_RATE_LIMIT_MAX=5

# ─── twilio / WhatsApp Alerts
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
WHATSAPP_ENABLED=true
DOWNLOAD_REMINDER_HOURS=2
```

---

## 4. PM2 Process Clustering

Deploying the backend on PM2 utilizes the cluster mode to achieve zero-downtime reloads and multi-core scaling.

1. Review the configuration at `backend/ecosystem.config.js`.
2. Start the cluster:
   ```bash
   # Navigate to backend directory
   cd /var/www/all3dstudio/backend
   
   # Start PM2 application in production environment
   pm2 start ecosystem.config.js --env production
   
   # Save the process list to revive on system reboot
   pm2 save
   
   # Generate startup script and run the command outputted by PM2
   pm2 startup
   ```

### Zero-Downtime Reload Command:
Whenever backend code is updated, reload the clusters gracefully without dropping requests:
```bash
pm2 reload 3d-production-backend
```

---

## 5. Nginx Configuration & Let's Encrypt SSL

1. Create Nginx site configuration file:
   ```bash
   sudo nano /etc/nginx/sites-available/allindia3dstudio
   ```
2. Copy the contents of `backend/nginx.conf` into this file.
3. Enable the site configuration:
   ```bash
   sudo ln -s /etc/nginx/sites-available/allindia3dstudio /etc/nginx/sites-enabled/
   # Remove default Nginx site configuration
   sudo rm /etc/nginx/sites-enabled/default
   ```
4. Test and restart Nginx:
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```
5. Install Let's Encrypt SSL via Certbot:
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d allindia3dstudio.deepitlabs.in -d www.allindia3dstudio.deepitlabs.in
   ```

---

## 6. Cloudflare Configuration

Ensure the following Cloudflare DNS settings are applied:
1. **DNS**: Point `A` records to your server IP address (enable Cloudflare Proxy - Orange Cloud).
2. **SSL/TLS Encryption**: Set mode to **Full (strict)**.
3. **Real IPs**: Nginx is configured to read client IPs using headers forwarded by Cloudflare (`CF-Connecting-IP`).
4. **Caching Rules**: Standard files will be cached at the Cloudflare edge, while Nginx handles browser caching headers for static React bundle assets.

---

## 7. Monitoring & Verification

Ensure all system services are reporting healthy states.

### Standard Health Endpoints:
- **Liveness Ping**: `GET https://allindia3dstudio.deepitlabs.in/api/health`
- **Readiness Check**: `GET https://allindia3dstudio.deepitlabs.in/api/ready`
- **System Metrics**: `GET https://allindia3dstudio.deepitlabs.in/api/metrics`

### Log Inspections:
To tail real-time output and debug runtime operations:
- **Application general logs**: `tail -f backend/logs/access-YYYY-MM-DD.log`
- **Runtime error logs**: `tail -f backend/logs/error-YYYY-MM-DD.log`
- **Security violation logs**: `tail -f backend/logs/security-YYYY-MM-DD.log`
- **PM2 process logs**: `pm2 logs`
