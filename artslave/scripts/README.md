# ArtSlave n8n 安装指南

## 🚀 快速安装

### Windows 用户

1. **以管理员身份运行命令提示符**
   - 按 `Win + R`，输入 `cmd`
   - 按 `Ctrl + Shift + Enter` 以管理员身份运行

2. **运行安装脚本**
   ```cmd
   cd /d "你的项目路径\artslave\scripts"
   install-n8n.bat
   ```

3. **或者手动安装**
   ```cmd
   npm install -g n8n
   ```

### Linux/Mac 用户

1. **运行安装脚本**
   ```bash
   cd artslave/scripts
   chmod +x install-n8n.sh
   ./install-n8n.sh
   ```

2. **或者手动安装**
   ```bash
   sudo npm install -g n8n
   ```

## 🔧 手动安装步骤

### 1. 检查 Node.js 环境

确保您已安装 Node.js 16 或更高版本：

```bash
node --version
npm --version
```

如果没有安装，请从 [nodejs.org](https://nodejs.org/) 下载安装。

### 2. 安装 n8n

#### 方法一：全局安装（推荐）
```bash
npm install -g n8n
```

#### 方法二：使用 npx（无需全局安装）
```bash
npx n8n
```

#### 方法三：本地项目安装
```bash
cd artslave
npm install n8n
```

### 3. 验证安装

```bash
n8n --version
```

如果显示版本号，说明安装成功。

## 🚨 常见问题解决

### 问题 1: 权限错误

**Windows:**
- 以管理员身份运行命令提示符
- 或者使用 `npm install -g n8n --force`

**Linux/Mac:**
- 使用 `sudo npm install -g n8n`
- 或者配置 npm 全局目录权限

### 问题 2: 网络连接问题

```bash
# 使用淘宝镜像
npm install -g n8n --registry https://registry.npmmirror.com

# 或者使用 cnpm
npm install -g cnpm --registry https://registry.npmmirror.com
cnpm install -g n8n
```

### 问题 3: 端口被占用

如果 5678 端口被占用，可以指定其他端口：

```bash
N8N_PORT=5679 n8n start
```

### 问题 4: 防火墙阻止

确保防火墙允许 Node.js 和 npm 访问网络。

## 🔄 启动 n8n

### 方法一：通过 ArtSlave 界面
1. 打开 ArtSlave 数据收集页面
2. 点击"启动 n8n"按钮
3. 等待启动完成
4. 点击"打开 n8n"访问界面

### 方法二：手动启动
```bash
n8n start
```

然后在浏览器中访问 `http://localhost:5678`

## 📝 配置说明

n8n 启动时会使用以下配置：

- **主机**: 0.0.0.0（允许外部访问）
- **端口**: 5678
- **协议**: HTTP
- **Webhook URL**: http://localhost:5678
- **日志级别**: info
- **日志文件**: artslave/n8n/n8n.log

## 🔗 相关链接

- [n8n 官方文档](https://docs.n8n.io/)
- [n8n GitHub](https://github.com/n8n-io/n8n)
- [Node.js 下载](https://nodejs.org/)
- [npm 文档](https://docs.npmjs.com/)

## 💡 使用提示

1. **首次启动**: n8n 首次启动时会创建默认配置，可能需要几分钟
2. **工作流导入**: 可以导入 `artslave/n8n/workflows/` 目录下的预设工作流
3. **数据持久化**: n8n 数据默认存储在用户目录下的 `.n8n` 文件夹
4. **安全设置**: 生产环境建议启用身份验证和 HTTPS

## 🆘 获取帮助

如果仍有问题：

1. 查看 n8n 日志文件：`artslave/n8n/n8n.log`
2. 检查 ArtSlave 控制台输出
3. 访问 [n8n 社区论坛](https://community.n8n.io/)
4. 提交 GitHub Issue
