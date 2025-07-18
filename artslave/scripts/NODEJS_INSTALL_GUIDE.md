# 🚨 Node.js 安装指南

## 问题诊断

从错误信息看，您的系统中 Node.js 没有正确安装或没有添加到系统 PATH 中。

错误信息：
```
'Node.js' is not recognized as an internal or external command
```

## 🔧 解决方案

### 方法一：重新安装 Node.js（推荐）

1. **下载 Node.js**
   - 访问：https://nodejs.org/
   - 下载 LTS 版本（推荐）
   - 选择 Windows Installer (.msi)

2. **安装 Node.js**
   - 运行下载的 .msi 文件
   - **重要**：安装时勾选 "Add to PATH" 选项
   - 完成安装后重启计算机

3. **验证安装**
   - 打开新的命令提示符
   - 运行：`node --version`
   - 运行：`npm --version`

### 方法二：修复 PATH 环境变量

如果 Node.js 已安装但无法识别：

1. **找到 Node.js 安装路径**
   - 通常在：`C:\Program Files\nodejs\`
   - 或：`C:\Users\[用户名]\AppData\Roaming\npm\`

2. **添加到 PATH**
   - 右键"此电脑" → 属性 → 高级系统设置
   - 点击"环境变量"
   - 在"系统变量"中找到"Path"
   - 点击"编辑" → "新建"
   - 添加 Node.js 安装路径
   - 确定并重启计算机

### 方法三：使用便携版 Node.js

1. **下载便携版**
   - 访问：https://nodejs.org/en/download/
   - 下载 Windows Binary (.zip)

2. **解压并配置**
   - 解压到：`C:\nodejs\`
   - 将 `C:\nodejs\` 添加到 PATH

## 🧪 测试安装

运行环境检查脚本：
```cmd
scripts\check-environment.bat
```

或手动检查：
```cmd
node --version
npm --version
npx --version
```

## 🚀 安装完成后

1. **重启 ArtSlave**
   ```cmd
   npm run dev
   ```

2. **测试 n8n 启动**
   - 点击"启动 n8n (新窗口)"按钮
   - 或手动运行：`scripts\n8n-start.bat`

## 📞 仍有问题？

如果仍然无法解决：

1. **检查系统要求**
   - Windows 10 或更高版本
   - 64位系统

2. **尝试管理员权限**
   - 以管理员身份运行命令提示符
   - 重新安装 Node.js

3. **清理旧版本**
   - 卸载所有旧版本的 Node.js
   - 清理注册表和环境变量
   - 重新安装最新版本

4. **使用 Node Version Manager**
   - 安装 nvm-windows
   - 使用 nvm 管理 Node.js 版本

## 💡 推荐配置

- **Node.js 版本**：18.x 或 20.x LTS
- **安装位置**：默认位置（C:\Program Files\nodejs\）
- **环境变量**：自动添加到 PATH
- **权限**：以管理员身份安装

安装完成后，n8n 应该可以正常启动了！
