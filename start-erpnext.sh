#!/bin/bash
# ERPNext Startup Script
# Run this script to start ERPNext on localhost:8000

set -e

BENCH_DIR="/home/user/frappe-bench"
SITE="erp.localhost"
LOG_DIR="/tmp/erpnext-logs"

mkdir -p "$LOG_DIR"

echo "Starting ERPNext services..."

# 1. Start MariaDB
echo "[1/3] Starting MariaDB..."
if ! mysqladmin ping -u root -padmin --silent 2>/dev/null; then
    sudo service mariadb start 2>&1
    sleep 3
fi
echo "    MariaDB is running"

# 2. Start Redis
echo "[2/3] Starting Redis..."
if ! redis-cli ping > /dev/null 2>&1; then
    sudo redis-server --daemonize yes
    sleep 2
fi
echo "    Redis is running"

# 3. Start ERPNext web server
echo "[3/3] Starting ERPNext (Gunicorn)..."
pkill -f "gunicorn.*frappe.app" 2>/dev/null || true
sleep 2

cd "$BENCH_DIR/sites"
BENCH_DEVELOPER=1 "$BENCH_DIR/env/bin/gunicorn" \
    --bind 0.0.0.0:8000 \
    --workers 2 \
    --worker-class gevent \
    --timeout 120 \
    frappe.app:application \
    --preload \
    > "$LOG_DIR/gunicorn.log" 2>&1 &

GUNICORN_PID=$!
echo "    Gunicorn started (PID: $GUNICORN_PID)"

# Wait for server to be ready
echo ""
echo "Waiting for ERPNext to be ready..."
for i in $(seq 1 30); do
    if curl -s -o /dev/null -w "%{http_code}" http://$SITE:8000 2>/dev/null | grep -q "200"; then
        echo ""
        echo "======================================"
        echo " ERPNext is running!"
        echo "======================================"
        echo " URL:      http://$SITE:8000"
        echo " Username: Administrator"
        echo " Password: admin123"
        echo "======================================"
        echo " Logs:     $LOG_DIR/gunicorn.log"
        echo "======================================"
        break
    fi
    printf "."
    sleep 2
done
