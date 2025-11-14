#!/bin/bash

# Deployment script for frappe_developer_tools
# This script clears cache, runs migrations, and restarts the bench

SITE_NAME="v16.com"
BENCH_DIR="/home/finsteinerp/frappe/v16"

echo "========================================="
echo "Deploying frappe_developer_tools"
echo "========================================="
echo ""

# Step 1: Clear cache
echo "Step 1: Clearing cache for $SITE_NAME..."
cd "$BENCH_DIR"
bench --site $SITE_NAME clear-cache
if [ $? -eq 0 ]; then
    echo "✅ Cache cleared successfully"
else
    echo "❌ Cache clear failed"
    exit 1
fi
echo ""

# Step 2: Run migrations
echo "Step 2: Running migrations for $SITE_NAME..."
cd "$BENCH_DIR"
bench --site $SITE_NAME migrate
if [ $? -eq 0 ]; then
    echo "✅ Migrations completed successfully"
else
    echo "❌ Migrations failed"
    exit 1
fi
echo ""

# Step 3: Restart Frappe
echo "Step 3: Restarting Frappe services..."
cd "$BENCH_DIR"
bench restart
if [ $? -eq 0 ]; then
    echo "✅ Frappe restarted successfully"
else
    echo "❌ Frappe restart failed"
    exit 1
fi
echo ""

echo "========================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "========================================="
echo ""
echo "Your AI Chat page should now be accessible at:"
echo "http://v16.com/app/ai-chat"
echo ""
