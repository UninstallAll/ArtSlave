# 🇩🇪 德国网络环境 n8n 启动指南

## 网络环境优化

在德国使用 n8n 的最佳配置：

### 🚀 推荐启动方式

#### 方法一：SSL 修复版（推荐）
```cmd
scripts\n8n-ssl-fix.bat
```

#### 方法二：欧洲版
```cmd
scripts\n8n-europe.bat
```

#### 方法三：直接命令行
```cmd
npx n8n@latest start
```

### 🔧 网络配置优化

如果仍遇到 SSL 问题，可以手动配置：

```cmd
# 增加超时时间
npm config set fetch-timeout 300000
npm config set fetch-retry-mintimeout 20000
npm config set fetch-retry-maxtimeout 120000

# 减少并发连接
npm config set maxsockets 1

# 启动 n8n
npx n8n@latest start
```

### 🌍 德国常用镜像源

如果官方源速度慢，可以尝试：

#### 1. 使用 Yarn（通常更稳定）
```cmd
npm install -g yarn
yarn global add n8n
n8n start
```

#### 2. 使用德国/欧洲 CDN
```cmd
npm config set registry https://registry.npmjs.org
npm config set cache-max 3600
```

### 🏢 企业网络环境

如果在企业网络中：

#### 1. 配置代理
```cmd
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080
```

#### 2. 证书问题
```cmd
npm config set strict-ssl false
npm config set ca ""
```

### 🔍 网络诊断

测试网络连接：
```cmd
# 测试 npm 连接
npm ping

# 测试注册表连接
curl -I https://registry.npmjs.org

# 检查 DNS
nslookup registry.npmjs.org
```

### ⚡ 快速解决方案

如果急需使用，可以：

1. **使用 Docker**（如果已安装）：
```cmd
docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n
```

2. **使用 Yarn**：
```cmd
npx yarn create n8n-app
```

3. **下载离线包**：
从 GitHub Releases 下载预编译版本

### 🎯 德国特定优化

1. **时区设置**：
```cmd
set TZ=Europe/Berlin
```

2. **语言设置**：
```cmd
set N8N_DEFAULT_LOCALE=de
```

3. **数据存储**：
```cmd
set N8N_USER_FOLDER=C:\n8n-data
```

### 📞 仍有问题？

1. **检查防火墙**：确保允许 Node.js 访问网络
2. **VPN 影响**：如果使用 VPN，尝试断开后重试
3. **ISP 限制**：某些德国 ISP 可能有特殊限制
4. **使用手机热点**：测试是否为网络环境问题

---

**现在请尝试运行 `scripts\n8n-ssl-fix.bat` 脚本！** 🚀

这个版本专门针对德国网络环境进行了优化。
