# 🔧 ArtSlave 服务器优化指南

## 📊 服务器配置分析

**您的服务器配置**:
- **CPU**: 2核心
- **内存**: 2GB RAM  
- **带宽**: 3M固定带宽
- **存储**: 40G ESSD Entry云盘
- **云服务商**: 阿里云 ECS

## ⚡ 针对性优化建议

### 1. 内存优化 (2GB RAM)

#### Node.js 内存限制
```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'artslave',
      script: 'npm',
      args: 'start',
      max_memory_restart: '1200M',  // 内存超过1.2G时重启
      node_args: '--max-old-space-size=1024',  // 限制堆内存为1GB
      instances: 1,  // 单实例运行，避免内存不足
      exec_mode: 'fork',
      // ... 其他配置
    }
  ]
}
```

#### 系统内存优化
```bash
# 创建1GB交换文件
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 永久启用交换文件
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 调整交换文件使用策略
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
echo 'vm.vfs_cache_pressure=50' | sudo tee -a /etc/sysctl.conf
```

### 2. CPU 优化 (2核心)

#### PM2 配置优化
```javascript
// 针对2核CPU的配置
module.exports = {
  apps: [
    {
      name: 'artslave',
      instances: 1,  // 单实例，为系统保留资源
      exec_mode: 'fork',  // 使用fork模式而非cluster
      max_restarts: 3,
      min_uptime: '10s',
      // CPU使用率监控
      max_cpu_usage: 80,
    }
  ]
}
```

#### 系统CPU优化
```bash
# 设置CPU调度策略
echo 'performance' | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor

# 禁用不必要的服务
sudo systemctl disable bluetooth
sudo systemctl disable cups
sudo systemctl disable avahi-daemon
```

### 3. 带宽优化 (3M带宽)

#### Nginx 压缩配置
```nginx
# /etc/nginx/nginx.conf
http {
    # 启用gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json
        image/svg+xml;

    # 启用Brotli压缩 (如果支持)
    # brotli on;
    # brotli_comp_level 6;
    
    # 缓存配置
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary Accept-Encoding;
        access_log off;
    }
}
```

#### 静态资源优化
```bash
# 创建静态资源优化脚本
cat > optimize-assets.sh << 'EOF'
#!/bin/bash
# 压缩图片 (需要安装 imagemagick)
find .next/static -name "*.png" -exec convert {} -quality 85 {} \;
find .next/static -name "*.jpg" -exec convert {} -quality 85 {} \;

# 压缩CSS和JS (Next.js已自动处理)
echo "静态资源优化完成"
EOF
chmod +x optimize-assets.sh
```

### 4. 存储优化 (40G ESSD)

#### 磁盘空间监控
```bash
# 创建磁盘监控脚本
cat > disk-monitor.sh << 'EOF'
#!/bin/bash
THRESHOLD=80
USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')

if [ $USAGE -gt $THRESHOLD ]; then
    echo "警告: 磁盘使用率 ${USAGE}% 超过阈值 ${THRESHOLD}%"
    
    # 清理日志文件
    find /var/log -name "*.log" -mtime +7 -delete
    
    # 清理PM2日志
    pm2 flush
    
    # 清理npm缓存
    npm cache clean --force
    
    echo "清理完成"
fi
EOF
chmod +x disk-monitor.sh
```

#### 日志轮转配置
```bash
# 创建日志轮转配置
sudo tee /etc/logrotate.d/artslave << 'EOF'
/home/*/artslave/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 artslave artslave
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
```

### 5. 数据库优化

#### SQLite 性能调优
```sql
-- 在应用启动时执行这些PRAGMA设置
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = 10000;
PRAGMA temp_store = memory;
PRAGMA mmap_size = 268435456; -- 256MB
```

#### 数据库维护脚本
```bash
# 创建数据库维护脚本
cat > db-maintenance.sh << 'EOF'
#!/bin/bash
DB_PATH="./data/production.db"

echo "开始数据库维护..."

# 数据库备份
DATE=$(date +%Y%m%d_%H%M%S)
sqlite3 $DB_PATH ".backup ./backups/maintenance_backup_$DATE.db"

# 数据库优化
sqlite3 $DB_PATH "VACUUM;"
sqlite3 $DB_PATH "REINDEX;"
sqlite3 $DB_PATH "ANALYZE;"

# 清理旧备份 (保留7天)
find ./backups -name "*.db" -mtime +7 -delete

echo "数据库维护完成"
EOF
chmod +x db-maintenance.sh
```

## 📊 性能监控

### 1. 系统监控脚本
```bash
# 创建性能监控脚本
cat > performance-monitor.sh << 'EOF'
#!/bin/bash
echo "=== ArtSlave 性能监控报告 ==="
echo "时间: $(date)"
echo

echo "=== CPU使用率 ==="
top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//'

echo "=== 内存使用情况 ==="
free -h

echo "=== 磁盘使用情况 ==="
df -h /

echo "=== 应用状态 ==="
pm2 list

echo "=== 网络连接 ==="
netstat -an | grep :3000

echo "=== 最近错误日志 ==="
tail -n 5 logs/err.log 2>/dev/null || echo "无错误日志"

echo "=========================="
EOF
chmod +x performance-monitor.sh
```

### 2. 自动化监控
```bash
# 添加到crontab
crontab -e

# 每5分钟检查应用状态
*/5 * * * * cd /home/$(whoami)/artslave && ./disk-monitor.sh

# 每小时生成性能报告
0 * * * * cd /home/$(whoami)/artslave && ./performance-monitor.sh >> performance.log

# 每天凌晨进行数据库维护
0 2 * * * cd /home/$(whoami)/artslave && ./db-maintenance.sh
```

## 🚀 性能调优建议

### 1. Next.js 优化配置

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用实验性功能
  experimental: {
    // 减少内存使用
    workerThreads: false,
    cpus: 1,
  },
  
  // 压缩配置
  compress: true,
  
  // 图片优化
  images: {
    formats: ['image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30天
  },
  
  // 输出配置
  output: 'standalone',
  
  // 减少构建时间
  swcMinify: true,
}

module.exports = nextConfig
```

### 2. 环境变量优化

```bash
# .env.production 优化配置
NODE_ENV=production
NODE_OPTIONS="--max-old-space-size=1024"

# 数据库连接池
DATABASE_POOL_MIN=1
DATABASE_POOL_MAX=3

# 缓存配置
CACHE_TTL=3600
STATIC_CACHE_TTL=86400
```

## 🔧 故障预防

### 1. 自动重启脚本
```bash
# 创建健康检查脚本
cat > health-check.sh << 'EOF'
#!/bin/bash
# 检查应用是否响应
if ! curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "应用无响应，正在重启..."
    pm2 restart artslave
    
    # 等待启动
    sleep 10
    
    # 再次检查
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        echo "应用重启成功"
    else
        echo "应用重启失败，需要人工干预"
    fi
fi
EOF
chmod +x health-check.sh
```

### 2. 资源限制监控
```bash
# 创建资源监控脚本
cat > resource-monitor.sh << 'EOF'
#!/bin/bash
# 内存使用率检查
MEM_USAGE=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100.0)}')
if [ $MEM_USAGE -gt 90 ]; then
    echo "内存使用率过高: ${MEM_USAGE}%"
    pm2 restart artslave
fi

# CPU使用率检查
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//' | cut -d'%' -f1)
if (( $(echo "$CPU_USAGE > 90" | bc -l) )); then
    echo "CPU使用率过高: ${CPU_USAGE}%"
fi
EOF
chmod +x resource-monitor.sh
```

## 📈 性能基准

### 预期性能指标 (2核2G配置)

- **并发用户**: 50-100 用户
- **响应时间**: < 2秒
- **内存使用**: < 1.5GB
- **CPU使用**: < 70%
- **磁盘I/O**: < 50MB/s

### 性能测试命令

```bash
# 简单压力测试
ab -n 100 -c 10 http://localhost:3000/

# 内存使用监控
watch -n 1 'free -h && pm2 list'

# 磁盘I/O监控
iostat -x 1
```

## 🎯 优化效果预期

通过以上优化，您的服务器应该能够：

- ✅ 稳定运行 50+ 并发用户
- ✅ 响应时间保持在 2秒以内
- ✅ 内存使用率控制在 75% 以下
- ✅ 磁盘空间得到有效管理
- ✅ 自动处理常见故障

**记住**: 定期监控和维护是保持最佳性能的关键！ 🚀
