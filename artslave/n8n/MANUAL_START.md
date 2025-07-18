# 🚀 n8n 手动启动指南

## ⚠️ 为什么需要手动启动？

由于 ArtSlave 项目使用了 React 19，而 n8n 的某些依赖与 React 19 存在冲突，因此建议手动启动 n8n 以避免依赖问题。

## 📋 手动启动步骤

### 方法一：使用 npx（推荐）

1. **打开命令行**
   - Windows: 按 `Win + R`，输入 `cmd`，按回车
   - Mac/Linux: 打开终端

2. **运行启动命令**
   ```bash
   npx n8n@latest start
   ```

3. **等待启动完成**
   - 首次运行会下载 n8n，需要几分钟
   - 看到 "Editor is now accessible" 表示启动成功

4. **访问 n8n**
   - 打开浏览器访问：http://localhost:5678
   - 首次访问需要设置管理员账户

### 方法二：全局安装后启动

1. **安装 n8n**
   ```bash
   npm install -g n8n
   ```

2. **启动 n8n**
   ```bash
   n8n start
   ```

3. **访问界面**
   - 浏览器访问：http://localhost:5678

## 🔧 配置选项

### 自定义端口
如果 5678 端口被占用：
```bash
N8N_PORT=5679 npx n8n@latest start
```

### 指定数据目录
```bash
N8N_USER_FOLDER=./n8n-data npx n8n@latest start
```

### 完整配置示例
```bash
cd artslave/n8n
N8N_PORT=5678 N8N_HOST=0.0.0.0 N8N_USER_FOLDER=. npx n8n@latest start
```

## 📊 导入预设工作流

启动 n8n 后，可以导入 ArtSlave 的预设工作流：

1. **在 n8n 界面中点击 "Import from File"**

2. **选择工作流文件**：
   - `artslave/n8n/workflows/artslave-data-sync.json`
   - `artslave/n8n/workflows/automated-crawler.json`

3. **配置 API 端点**：
   - 确保工作流中的 API 地址指向：`http://localhost:3000`

## 🚨 常见问题

### 问题 1: 端口被占用
```
Error: listen EADDRINUSE: address already in use :::5678
```

**解决方案**：
```bash
N8N_PORT=5679 npx n8n@latest start
```

### 问题 2: 权限错误
```
Error: EACCES: permission denied
```

**解决方案**：
- Windows: 以管理员身份运行命令行
- Mac/Linux: 使用 `sudo` 或配置 npm 权限

### 问题 3: 网络错误
```
Error: network timeout
```

**解决方案**：
```bash
npm config set registry https://registry.npmmirror.com
npx n8n@latest start
```

## 🔗 与 ArtSlave 集成

### API 端点配置
在 n8n 工作流中使用以下 API 端点：

- **投稿数据**: `http://localhost:3000/api/submissions`
- **数据源**: `http://localhost:3000/api/datasources`
- **爬虫控制**: `http://localhost:3000/api/crawler`
- **AI 匹配**: `http://localhost:3000/api/ai/match`

### 工作流激活
1. 导入工作流后，点击右上角的 "Active" 开关
2. 自动化数据收集工作流会每6小时执行一次
3. 数据同步工作流可以手动触发或通过 Webhook 调用

## 💡 使用技巧

### 1. 后台运行
使用 PM2 或 nohup 让 n8n 在后台运行：
```bash
# 使用 PM2
npm install -g pm2
pm2 start "npx n8n@latest start" --name n8n

# 使用 nohup (Linux/Mac)
nohup npx n8n@latest start > n8n.log 2>&1 &
```

### 2. 开机自启
创建系统服务让 n8n 开机自启动（具体方法因操作系统而异）

### 3. 数据备份
定期备份 n8n 数据目录：
```bash
cp -r ~/.n8n ~/n8n-backup-$(date +%Y%m%d)
```

## 📞 获取帮助

如果遇到问题：

1. **查看 n8n 官方文档**: https://docs.n8n.io/
2. **检查日志输出**: 命令行中的错误信息
3. **社区支持**: https://community.n8n.io/
4. **GitHub Issues**: https://github.com/n8n-io/n8n/issues

---

**提示**: 手动启动 n8n 后，您可以在 ArtSlave 数据收集页面点击"打开 n8n"按钮快速访问工作流界面。
