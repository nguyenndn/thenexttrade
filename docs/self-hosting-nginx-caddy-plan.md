# Self-Hosting Nginx / Caddy Configuration Plan

When self-hosting TheNextTrade on a VPS without Vercel, use a reverse proxy (Nginx or Caddy) to handle SSL, compression, and caching for static assets. Next.js handles the application routing, but the reverse proxy should handle the immutable assets to reduce load on the Node.js server.

## 1. Caddy Configuration (Recommended)

Caddy is recommended for self-hosting due to its automatic HTTPS and simple configuration.

```caddyfile
# Caddyfile
thenexttrade.com {
    # Enable Gzip and Zstd compression
    encode zstd gzip

    # Proxy all traffic to Next.js node server
    reverse_proxy localhost:3000

    # Cache Next.js Immutable Static Assets (1 year)
    @nextStatic {
        path /_next/static/*
    }
    header @nextStatic Cache-Control "public, max-age=31536000, immutable"

    # Cache Public Images & Icons (30 days)
    @publicAssets {
        path /images/* /icons/* /uploads/*
    }
    header @publicAssets Cache-Control "public, max-age=2592000, stale-while-revalidate=86400"

    # Prevent API responses from being cached by proxy
    @apiRoutes {
        path /api/*
    }
    header @apiRoutes Cache-Control "no-store, max-age=0"
}
```

## 2. Nginx Configuration

If you prefer Nginx, ensure you have `gzip` enabled.

```nginx
server {
    listen 80;
    server_name thenexttrade.com;
    
    # Redirect HTTP to HTTPS (assuming SSL is configured via certbot)
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name thenexttrade.com;

    # SSL Certs
    ssl_certificate /etc/letsencrypt/live/thenexttrade.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/thenexttrade.com/privkey.pem;

    # Compression
    gzip on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Immutable Next.js static assets
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Public images and icons
    location ~* ^/(images|icons|uploads)/ {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=2592000, stale-while-revalidate=86400";
    }

    # Prevent API caching
    location /api/ {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "no-store, max-age=0";
    }

    # Default proxy
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```
