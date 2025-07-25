# ⚡ ArtSlave 快速部署指南

## 🎯 适用环境
- **服务器**: 阿里云 ECS (2核2G，3M带宽，40G ESSD)
- **操作系统**: Ubuntu 20.04+ / CentOS 8+
- **部署时间**: 约 15-30 分钟

## 🚀 一键部署

### 方法一：自动部署脚本

```bash
# 1. 上传项目文件到服务器
scp -r ./artslave user@your-server-ip:/home/user/

# 2. 登录服务器
ssh user@your-server-ip

# 3. 运行自动部署脚本
cd artslave
chmod +x scripts/deploy-linux.sh
./scripts/deploy-linux.sh
```

### 方法二：手动快速部署

```bash
# 1. 更新系统
sudo apt update && sudo apt upgrade -y

# 2. 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. 安装 PM2 和 Nginx
sudo npm install -g pm2
sudo apt install -y nginx sqlite3

# 4. 部署项目
cd /home/$(whoami)/artslave
npm install
npm run build

# 5. 启动应用
pm2 start npm --name "artslave" -- start
pm2 startup
pm2 save

# 6. 配置 Nginx (替换 yourdomain.com)
sudo tee /etc/nginx/sites-available/artslave > /dev/null << 'EOF'
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/artslave /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
```

## 🔧 环境配置

### 1. 创建环境变量文件

```bash
# 创建 .env.production
cat > .env.production << EOF
NODE_ENV=production
DATABASE_URL="file:./data/production.db"
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=$(openssl rand -base64 32)
N8N_HOST=localhost
N8N_PORT=5678
EOF
```

### 2. 初始化数据库

```bash
# 创建数据目录
mkdir -p data logs backups

# 运行数据库迁移
npx prisma generate
npx prisma migrate deploy

# 初始化数据 (如果有)
node scripts/initData.js
```

## 🌐 域名和 SSL 配置

### 1. 域名解析
在域名管理面板添加 A 记录：
```
类型: A
主机记录: @
记录值: 你的服务器IP
TTL: 600
```

### 2. SSL 证书 (Let's Encrypt)

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取 SSL 证书
sudo certbot --nginx -d yourdomain.com

# 设置自动续期
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

## 📊 验证部署

### 1. 检查服务状态

```bash
# 检查应用状态
pm2 status

# 检查应用日志
pm2 logs artslave

# 检查 Nginx 状态
sudo systemctl status nginx

# 检查端口监听
sudo netstat -tlnp | grep :3000
sudo netstat -tlnp | grep :80
```

### 2. 访问测试

```bash
# 本地测试
curl http://localhost:3000

# 域名测试
curl http://yourdomain.com
```

## 🔥 常用管理命令

### 应用管理

```bash
# 重启应用
pm2 restart artslave

# 停止应用
pm2 stop artslave

# 查看日志
pm2 logs artslave --lines 100

# 监控应用
pm2 monit
```

### 系统管理

```bash
# 重启 Nginx
sudo systemctl restart nginx

# 查看系统资源
htop

# 查看磁盘使用
df -h

# 查看内存使用
free -h
```

### 数据库管理

```bash
# 备份数据库
sqlite3 data/production.db ".backup backups/backup_$(date +%Y%m%d).db"

# 查看数据库
sqlite3 data/production.db ".tables"

# 导出数据
sqlite3 data/production.db ".mode csv" ".output data.csv" "SELECT * FROM submissions;"
```

## 🚨 故障排除

### 1. 应用无法启动

```bash
# 检查 Node.js 版本
node --version  # 应该是 v18.x

# 检查依赖安装
npm list --depth=0

# 重新安装依赖
rm -rf node_modules package-lock.json
npm install
```

### 2. 端口被占用

```bash
# 查看端口占用
sudo lsof -i :3000

# 杀死占用进程
sudo kill -9 <PID>
```

### 3. 内存不足

```bash
# 创建交换文件
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 永久启用
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 4. Nginx 配置错误

```bash
# 测试配置
sudo nginx -t

# 查看错误日志
sudo tail -f /var/log/nginx/error.log

# 重新加载配置
sudo nginx -s reload
```

## 📋 部署检查清单

- [ ] 服务器基础环境 ✅
- [ ] Node.js 18.x 安装 ✅
- [ ] PM2 进程管理器 ✅
- [ ] Nginx 反向代理 ✅
- [ ] SQLite 数据库 ✅
- [ ] 项目依赖安装 ✅
- [ ] 环境变量配置 ✅
- [ ] 数据库初始化 ✅
- [ ] 应用构建成功 ✅
- [ ] PM2 启动应用 ✅
- [ ] Nginx 配置完成 ✅
- [ ] 域名解析配置 ✅
- [ ] SSL 证书配置 ✅
- [ ] 防火墙配置 ✅
- [ ] 应用访问测试 ✅

## 🎊 部署完成

部署成功后，您可以通过以下地址访问：

- **主应用**: https://yourdomain.com
- **服务器状态**: `pm2 status`
- **应用日志**: `pm2 logs artslave`

## 📞 技术支持

如遇问题，请检查：

1. **应用日志**: `pm2 logs artslave`
2. **Nginx 日志**: `sudo tail -f /var/log/nginx/error.log`
3. **系统资源**: `htop`
4. **网络连接**: `netstat -tlnp`

## 🔄 后续维护

### 定期任务

```bash
# 添加到 crontab
crontab -e

# 每天凌晨2点备份数据库
0 2 * * * cd /home/$(whoami)/artslave && ./backup.sh

# 每周日凌晨3点更新系统
0 3 * * 0 sudo apt update && sudo apt upgrade -y
```

### 更新部署

```bash
# 拉取最新代码
git pull origin main

# 安装新依赖
npm install

# 重新构建
npm run build

# 重启应用
pm2 restart artslave
```

**🎉 恭喜！ArtSlave 已成功部署到 Linux 服务器！**

---

**提示**: 首次部署建议使用自动部署脚本，可以避免手动配置错误。
