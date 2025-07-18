# 🚀 手动启动 n8n - 复制粘贴命令

## 最简单的方法

打开 **PowerShell** 或 **命令提示符**，复制粘贴以下命令：

### 方法一：PowerShell（推荐）

```powershell
cd "S:\ArtSlave\artslave\n8n"
npm config set strict-ssl false
npx n8n@latest start
```

### 方法二：命令提示符

```cmd
cd /d S:\ArtSlave\artslave\n8n
npm config set strict-ssl false
npx n8n@latest start
```

### 方法三：一行命令

```powershell
cd "S:\ArtSlave\artslave\n8n"; npm config set strict-ssl false; npx n8n@latest start
```

## 🎯 执行步骤

1. **按 Win + R**，输入 `powershell`，按回车
2. **复制上面的命令**（方法一）
3. **粘贴到 PowerShell 中**，按回车
4. **等待下载完成**（首次需要几分钟）
5. **看到 "Editor is now accessible"** 表示成功
6. **访问**: http://localhost:5678

## 🔧 如果遇到问题

### SSL 错误
```powershell
npm config set registry http://registry.npmjs.org/
npm config set strict-ssl false
npx n8n@latest start
```

### 权限错误
以管理员身份运行 PowerShell

### 网络超时
```powershell
npm config set fetch-timeout 600000
npm config set fetch-retry-mintimeout 20000
npm config set fetch-retry-maxtimeout 120000
npx n8n@latest start
```

## ✅ 成功标志

当您看到类似这样的输出时，表示成功：

```
Editor is now accessible via:
http://localhost:5678

Press "o" to open in Browser.
```

然后在浏览器中访问：**http://localhost:5678**

## 🛑 停止 n8n

在 PowerShell 窗口中按 **Ctrl + C**

---

**现在请复制方法一的命令到 PowerShell 中执行！** 🚀
