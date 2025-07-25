#!/bin/bash

# 🚀 ArtSlave Linux 自动部署脚本
# 适用于 Ubuntu 20.04+ / CentOS 8+
# 服务器配置: 2核2G，3M带宽，40G ESSD

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否为 root 用户
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_error "请不要使用 root 用户运行此脚本"
        exit 1
    fi
}

# 检测操作系统
detect_os() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS=$NAME
        VER=$VERSION_ID
    else
        log_error "无法检测操作系统"
        exit 1
    fi
    log_info "检测到操作系统: $OS $VER"
}

# 更新系统
update_system() {
    log_info "更新系统包..."
    if [[ $OS == *"Ubuntu"* ]] || [[ $OS == *"Debian"* ]]; then
        sudo apt update && sudo apt upgrade -y
        sudo apt install -y curl wget git vim htop unzip
    elif [[ $OS == *"CentOS"* ]] || [[ $OS == *"Red Hat"* ]]; then
        sudo yum update -y
        sudo yum install -y curl wget git vim htop unzip
    fi
    log_success "系统更新完成"
}

# 安装 Node.js
install_nodejs() {
    log_info "安装 Node.js 18.x..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        log_warning "Node.js 已安装: $NODE_VERSION"
        return
    fi
    
    if [[ $OS == *"Ubuntu"* ]] || [[ $OS == *"Debian"* ]]; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [[ $OS == *"CentOS"* ]] || [[ $OS == *"Red Hat"* ]]; then
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo yum install -y nodejs
    fi
    
    log_success "Node.js 安装完成: $(node --version)"
}

# 安装 PM2
install_pm2() {
    log_info "安装 PM2..."
    
    if command -v pm2 &> /dev/null; then
        log_warning "PM2 已安装"
        return
    fi
    
    sudo npm install -g pm2
    
    # 设置 PM2 开机自启
    pm2 startup
    log_success "PM2 安装完成"
}

# 安装 Nginx
install_nginx() {
    log_info "安装 Nginx..."
    
    if command -v nginx &> /dev/null; then
        log_warning "Nginx 已安装"
        return
    fi
    
    if [[ $OS == *"Ubuntu"* ]] || [[ $OS == *"Debian"* ]]; then
        sudo apt install -y nginx
    elif [[ $OS == *"CentOS"* ]] || [[ $OS == *"Red Hat"* ]]; then
        sudo yum install -y nginx
    fi
    
    sudo systemctl start nginx
    sudo systemctl enable nginx
    log_success "Nginx 安装完成"
}

# 安装 SQLite
install_sqlite() {
    log_info "安装 SQLite..."
    
    if [[ $OS == *"Ubuntu"* ]] || [[ $OS == *"Debian"* ]]; then
        sudo apt install -y sqlite3 libsqlite3-dev
    elif [[ $OS == *"CentOS"* ]] || [[ $OS == *"Red Hat"* ]]; then
        sudo yum install -y sqlite sqlite-devel
    fi
    
    log_success "SQLite 安装完成"
}

# 部署项目
deploy_project() {
    log_info "部署 ArtSlave 项目..."
    
    PROJECT_DIR="/home/$(whoami)/artslave"
    
    # 如果项目目录不存在，提示用户上传项目文件
    if [[ ! -d "$PROJECT_DIR" ]]; then
        log_warning "项目目录不存在: $PROJECT_DIR"
        log_info "请将项目文件上传到服务器，或使用 git clone 克隆项目"
        read -p "项目文件已准备好？(y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_error "请先准备项目文件"
            exit 1
        fi
    fi
    
    cd "$PROJECT_DIR"
    
    # 安装依赖
    log_info "安装项目依赖..."
    npm install
    
    # 创建环境配置文件
    if [[ ! -f ".env.production" ]]; then
        log_info "创建生产环境配置文件..."
        cat > .env.production << EOF
NODE_ENV=production
DATABASE_URL="file:./data/production.db"
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=$(openssl rand -base64 32)
N8N_HOST=localhost
N8N_PORT=5678
EOF
        log_warning "请编辑 .env.production 文件，设置正确的域名和配置"
    fi
    
    # 创建数据目录
    mkdir -p data logs backups
    
    # 数据库初始化
    log_info "初始化数据库..."
    npx prisma generate
    npx prisma migrate deploy
    
    # 构建项目
    log_info "构建项目..."
    npm run build
    
    log_success "项目部署完成"
}

# 创建 PM2 配置
create_pm2_config() {
    log_info "创建 PM2 配置..."
    
    PROJECT_DIR="/home/$(whoami)/artslave"
    
    cat > "$PROJECT_DIR/ecosystem.config.js" << EOF
module.exports = {
  apps: [
    {
      name: 'artslave',
      script: 'npm',
      args: 'start',
      cwd: '$PROJECT_DIR',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',
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
EOF
    
    log_success "PM2 配置创建完成"
}

# 启动应用
start_application() {
    log_info "启动应用..."
    
    PROJECT_DIR="/home/$(whoami)/artslave"
    cd "$PROJECT_DIR"
    
    # 启动应用
    pm2 start ecosystem.config.js
    pm2 save
    
    log_success "应用启动完成"
}

# 配置 Nginx
configure_nginx() {
    log_info "配置 Nginx..."
    
    read -p "请输入您的域名 (例: example.com): " DOMAIN
    
    if [[ -z "$DOMAIN" ]]; then
        log_error "域名不能为空"
        exit 1
    fi
    
    # 创建 Nginx 配置文件
    sudo tee /etc/nginx/sites-available/artslave > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # 静态文件缓存
    location /_next/static/ {
        alias /home/$(whoami)/artslave/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 文件上传大小限制
    client_max_body_size 10M;
}
EOF
    
    # 启用站点配置
    sudo ln -sf /etc/nginx/sites-available/artslave /etc/nginx/sites-enabled/
    
    # 测试 Nginx 配置
    sudo nginx -t
    
    # 重启 Nginx
    sudo systemctl restart nginx
    
    log_success "Nginx 配置完成"
}

# 配置防火墙
configure_firewall() {
    log_info "配置防火墙..."
    
    if command -v ufw &> /dev/null; then
        sudo ufw --force reset
        sudo ufw default deny incoming
        sudo ufw default allow outgoing
        sudo ufw allow ssh
        sudo ufw allow 'Nginx Full'
        sudo ufw --force enable
        log_success "UFW 防火墙配置完成"
    else
        log_warning "UFW 未安装，跳过防火墙配置"
    fi
}

# 创建管理脚本
create_management_scripts() {
    log_info "创建管理脚本..."
    
    PROJECT_DIR="/home/$(whoami)/artslave"
    
    # 创建部署脚本
    cat > "$PROJECT_DIR/deploy.sh" << 'EOF'
#!/bin/bash
echo "🚀 开始部署 ArtSlave..."
git pull origin main
npm install
npm run build
pm2 restart artslave
echo "✅ 部署完成！"
EOF
    
    # 创建备份脚本
    cat > "$PROJECT_DIR/backup.sh" << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
sqlite3 ./data/production.db ".backup ./backups/db_backup_$DATE.db"
find ./backups -name "db_backup_*.db" -mtime +7 -delete
echo "✅ 数据库备份完成: db_backup_$DATE.db"
EOF
    
    # 设置执行权限
    chmod +x "$PROJECT_DIR/deploy.sh"
    chmod +x "$PROJECT_DIR/backup.sh"
    
    log_success "管理脚本创建完成"
}

# 主函数
main() {
    log_info "🚀 开始 ArtSlave Linux 自动部署..."
    
    check_root
    detect_os
    update_system
    install_nodejs
    install_pm2
    install_nginx
    install_sqlite
    deploy_project
    create_pm2_config
    start_application
    configure_nginx
    configure_firewall
    create_management_scripts
    
    log_success "🎉 ArtSlave 部署完成！"
    log_info "应用状态: $(pm2 list | grep artslave)"
    log_info "访问地址: http://your-domain.com"
    log_info "管理命令:"
    log_info "  - 查看状态: pm2 status"
    log_info "  - 查看日志: pm2 logs artslave"
    log_info "  - 重启应用: pm2 restart artslave"
    log_info "  - 数据备份: ./backup.sh"
}

# 运行主函数
main "$@"
