# 🚀 ArtSlave Linux 服务器部署指南

## 📋 服务器配置信息

- **云服务商**: 阿里云 ECS
- **配置**: 2核2G，3M固定带宽
- **存储**: 40G ESSD Entry云盘
- **操作系统**: 建议 Ubuntu 20.04 LTS 或 CentOS 8

## 🎯 部署概述

本指南将帮助您将 ArtSlave 项目部署到 Linux 服务器上，包括：
- 环境配置
- 依赖安装
- 项目部署
- 服务配置
- 域名和 SSL 配置

## 📦 预备工作

### 1. 服务器基础配置

```bash
# 更新系统包
sudo apt update && sudo apt upgrade -y  # Ubuntu/Debian
# 或
sudo yum update -y  # CentOS/RHEL

# 安装基础工具
sudo apt install -y curl wget git vim htop  # Ubuntu/Debian
# 或
sudo yum install -y curl wget git vim htop  # CentOS/RHEL
```

### 2. 创建部署用户

```bash
# 创建专用用户
sudo adduser artslave
sudo usermod -aG sudo artslave

# 切换到部署用户
su - artslave
```

## 🔧 环境安装

### 1. 安装 Node.js

```bash
# 使用 NodeSource 仓库安装 Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

### 2. 安装 PM2 (进程管理器)

```bash
# 全局安装 PM2
sudo npm install -g pm2

# 设置 PM2 开机自启
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u artslave --hp /home/artslave
```

### 3. 安装 Nginx (反向代理)

```bash
# 安装 Nginx
sudo apt install -y nginx

# 启动并设置开机自启
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 4. 安装 SQLite

```bash
# 安装 SQLite
sudo apt install -y sqlite3 libsqlite3-dev
```

## 📁 项目部署

### 1. 克隆项目

```bash
# 进入用户目录
cd /home/artslave

# 克隆项目 (假设您有 Git 仓库)
git clone <your-git-repository-url> artslave
cd artslave

# 或者上传项目文件
# 使用 scp 或 rsync 上传本地项目文件
```

### 2. 安装项目依赖

```bash
# 安装 Node.js 依赖
npm install

# 如果使用 yarn
# npm install -g yarn
# yarn install
```

### 3. 环境配置

```bash
# 创建生产环境配置文件
cp .env.example .env.production

# 编辑环境变量
vim .env.production
```

环境变量配置示例：
```env
NODE_ENV=production
DATABASE_URL="file:./data/production.db"
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-secret-key
N8N_HOST=localhost
N8N_PORT=5678
```

### 4. 数据库初始化

```bash
# 生成 Prisma 客户端
npx prisma generate

# 运行数据库迁移
npx prisma migrate deploy

# 初始化数据 (如果有初始化脚本)
node scripts/initData.js
```

### 5. 构建项目

```bash
# 构建生产版本
npm run build

# 验证构建结果
ls -la .next/
```

## 🔄 服务配置

### 1. 创建 PM2 配置文件

```bash
# 创建 PM2 配置文件
vim ecosystem.config.js
```

```javascript
module.exports = {
  apps: [
    {
      name: 'artslave',
      script: 'npm',
      args: 'start',
      cwd: '/home/artslave/artslave',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true
    }
  ]
}
```

### 2. 启动应用

```bash
# 创建日志目录
mkdir -p logs

# 使用 PM2 启动应用
pm2 start ecosystem.config.js

# 查看应用状态
pm2 status

# 查看日志
pm2 logs artslave

# 保存 PM2 配置
pm2 save
```

## 🌐 Nginx 配置

### 1. 创建 Nginx 配置文件

```bash
# 创建站点配置文件
sudo vim /etc/nginx/sites-available/artslave
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL 配置 (稍后配置)
    # ssl_certificate /path/to/certificate.crt;
    # ssl_certificate_key /path/to/private.key;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    # 主应用代理
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

    # n8n 代理 (如果需要)
    location /n8n/ {
        proxy_pass http://localhost:5678/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 静态文件缓存
    location /_next/static/ {
        alias /home/artslave/artslave/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 文件上传大小限制
    client_max_body_size 10M;
}
```

### 2. 启用站点配置

```bash
# 启用站点配置
sudo ln -s /etc/nginx/sites-available/artslave /etc/nginx/sites-enabled/

# 测试 Nginx 配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

## 🔒 SSL 证书配置

### 使用 Let's Encrypt (免费 SSL)

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取 SSL 证书
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 设置自动续期
sudo crontab -e
# 添加以下行：
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔧 n8n 部署 (可选)

### 1. 创建 n8n 启动脚本

```bash
# 创建 n8n 启动脚本
vim /home/artslave/start-n8n.sh
```

```bash
#!/bin/bash
cd /home/artslave/artslave/n8n
export N8N_PORT=5678
export N8N_HOST=0.0.0.0
export N8N_USER_FOLDER=/home/artslave/artslave/n8n
npx n8n start
```

```bash
# 设置执行权限
chmod +x /home/artslave/start-n8n.sh
```

### 2. 创建 n8n PM2 配置

```bash
# 添加到 ecosystem.config.js
vim ecosystem.config.js
```

```javascript
module.exports = {
  apps: [
    {
      name: 'artslave',
      script: 'npm',
      args: 'start',
      // ... 现有配置
    },
    {
      name: 'n8n',
      script: '/home/artslave/start-n8n.sh',
      cwd: '/home/artslave/artslave',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        N8N_PORT: 5678,
        N8N_HOST: '0.0.0.0'
      }
    }
  ]
}
```

## 🔥 防火墙配置

```bash
# 安装 UFW
sudo apt install -y ufw

# 配置防火墙规则
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# 启用防火墙
sudo ufw enable

# 查看状态
sudo ufw status
```

## 📊 监控和日志

### 1. 系统监控

```bash
# 查看系统资源
htop

# 查看磁盘使用
df -h

# 查看内存使用
free -h

# 查看 PM2 状态
pm2 monit
```

### 2. 日志管理

```bash
# 查看应用日志
pm2 logs artslave

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# 设置日志轮转
sudo vim /etc/logrotate.d/artslave
```

## 🚀 部署脚本

创建自动化部署脚本：

```bash
# 创建部署脚本
vim deploy.sh
```

```bash
#!/bin/bash
echo "🚀 开始部署 ArtSlave..."

# 拉取最新代码
git pull origin main

# 安装依赖
npm install

# 构建项目
npm run build

# 重启应用
pm2 restart artslave

echo "✅ 部署完成！"
```

```bash
# 设置执行权限
chmod +x deploy.sh
```

## 🔧 故障排除

### 常见问题解决

1. **端口占用**
```bash
# 查看端口占用
sudo netstat -tlnp | grep :3000
sudo lsof -i :3000
```

2. **权限问题**
```bash
# 修复文件权限
sudo chown -R artslave:artslave /home/artslave/artslave
chmod -R 755 /home/artslave/artslave
```

3. **内存不足**
```bash
# 创建交换文件
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

## 📋 部署检查清单

- [ ] 服务器基础环境配置完成
- [ ] Node.js 和 npm 安装成功
- [ ] 项目代码上传完成
- [ ] 依赖安装成功
- [ ] 数据库初始化完成
- [ ] 项目构建成功
- [ ] PM2 配置并启动应用
- [ ] Nginx 配置完成
- [ ] SSL 证书配置完成
- [ ] 防火墙配置完成
- [ ] 域名解析配置完成
- [ ] 应用访问测试通过

## 🎉 部署完成

部署完成后，您可以通过以下方式访问应用：

- **主应用**: https://yourdomain.com
- **n8n 工作流**: https://yourdomain.com/n8n (如果配置)

**恭喜！ArtSlave 已成功部署到 Linux 服务器！** 🎊

## 🔧 性能优化建议

### 1. 针对 2G 内存优化

```bash
# 在 ecosystem.config.js 中添加内存限制
module.exports = {
  apps: [
    {
      name: 'artslave',
      script: 'npm',
      args: 'start',
      max_memory_restart: '1G',  // 内存超过1G时重启
      node_args: '--max-old-space-size=1024',  // 限制 Node.js 内存使用
      // ... 其他配置
    }
  ]
}
```

### 2. 数据库优化

```bash
# 创建数据库备份脚本
vim backup-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
sqlite3 /home/artslave/artslave/data/production.db ".backup /home/artslave/backups/db_backup_$DATE.db"
# 保留最近7天的备份
find /home/artslave/backups -name "db_backup_*.db" -mtime +7 -delete
```

### 3. 缓存配置

```nginx
# 在 Nginx 配置中添加缓存
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header Vary Accept-Encoding;
    access_log off;
}
```

## 📱 移动端优化

```nginx
# 在 Nginx 配置中添加移动端优化
# 启用 gzip 压缩
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_proxied expired no-cache no-store private must-revalidate auth;
gzip_types
    text/plain
    text/css
    text/xml
    text/javascript
    application/javascript
    application/xml+rss
    application/json;
```

## 🔐 安全加固

### 1. SSH 安全配置

```bash
# 编辑 SSH 配置
sudo vim /etc/ssh/sshd_config

# 建议配置：
# Port 2222  # 更改默认端口
# PermitRootLogin no
# PasswordAuthentication no  # 仅允许密钥登录
# MaxAuthTries 3

# 重启 SSH 服务
sudo systemctl restart sshd
```

### 2. 应用安全

```bash
# 创建安全更新脚本
vim security-update.sh
```

```bash
#!/bin/bash
# 定期安全更新
sudo apt update
sudo apt upgrade -y
npm audit fix
pm2 restart all
```

## 📈 监控告警

### 1. 创建监控脚本

```bash
vim monitor.sh
```

```bash
#!/bin/bash
# 检查应用状态
if ! pm2 list | grep -q "artslave.*online"; then
    echo "ArtSlave 应用离线！" | mail -s "服务器告警" your-email@example.com
    pm2 restart artslave
fi

# 检查磁盘空间
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "磁盘使用率超过80%: ${DISK_USAGE}%" | mail -s "磁盘空间告警" your-email@example.com
fi
```

### 2. 设置定时任务

```bash
# 编辑 crontab
crontab -e

# 添加监控任务
*/5 * * * * /home/artslave/monitor.sh
0 2 * * * /home/artslave/backup-db.sh
0 3 * * 0 /home/artslave/security-update.sh
```

## 🚨 应急处理

### 1. 快速重启脚本

```bash
vim emergency-restart.sh
```

```bash
#!/bin/bash
echo "🚨 执行应急重启..."
pm2 stop all
pm2 start all
sudo systemctl restart nginx
echo "✅ 应急重启完成"
```

### 2. 回滚脚本

```bash
vim rollback.sh
```

```bash
#!/bin/bash
echo "🔄 开始回滚..."
git checkout HEAD~1
npm install
npm run build
pm2 restart artslave
echo "✅ 回滚完成"
```

## 📞 技术支持

如果在部署过程中遇到问题，可以：

1. **查看日志**: `pm2 logs artslave`
2. **检查服务状态**: `pm2 status`
3. **查看系统资源**: `htop`
4. **检查网络连接**: `netstat -tlnp`
5. **查看 Nginx 状态**: `sudo systemctl status nginx`

## 🎯 下一步计划

部署完成后，建议考虑：

- [ ] 配置 CDN 加速
- [ ] 设置数据库主从复制
- [ ] 配置负载均衡
- [ ] 添加监控面板 (如 Grafana)
- [ ] 配置自动化 CI/CD

**祝您部署顺利！** 🚀
