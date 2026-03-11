# ERPNext Local Setup Guide

ERPNext version 15 has been installed and configured on this machine.

## Access

- **URL**: http://erp.localhost:8000
- **Username**: `Administrator`
- **Password**: `admin123`

## Start ERPNext

```bash
chmod +x start-erpnext.sh
./start-erpnext.sh
```

## Installation Details

| Component | Details |
|-----------|---------|
| ERPNext | v15 (Frappe Framework) |
| Database | MariaDB 10.11 |
| Cache | Redis 7.0 |
| Web Server | Gunicorn with gevent |
| Bench path | `/home/user/frappe-bench` |
| Site | `erp.localhost` |
| DB name | `erpnext` |
| DB root password | `admin` |

## Bench Commands

```bash
cd /home/user/frappe-bench
export BENCH_DEVELOPER=1

# Clear cache
bench --site erp.localhost clear-cache

# Run migrations
bench --site erp.localhost migrate

# Rebuild assets
bench build --app erpnext

# Console
bench --site erp.localhost console

# Backup
bench --site erp.localhost backup
```

## Services Management

```bash
# MariaDB
sudo service mariadb start
sudo service mariadb stop

# Redis
redis-server --daemonize yes
redis-cli shutdown

# Stop ERPNext
pkill -f "gunicorn.*frappe.app"
```

## Troubleshooting

- **Logs**: `/tmp/erpnext-logs/gunicorn.log`
- **Site config**: `/home/user/frappe-bench/sites/erp.localhost/site_config.json`
- **Common config**: `/home/user/frappe-bench/sites/common_site_config.json`
