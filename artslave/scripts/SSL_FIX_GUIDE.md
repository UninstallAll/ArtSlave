# 🔧 SSL 网络错误修复指南

## 问题诊断

您遇到的错误：
```
npm error code ERR_SSL_CIPHER_OPERATION_FAILED
npm error errno ERR_SSL_CIPHER_OPERATION_FAILED
```

这是一个常见的网络连接问题，通常由以下原因引起：
1. 网络防火墙或代理设置
2. SSL 证书验证问题
3. npm 官方源连接不稳定

## 🚀 快速解决方案

### 方法一：使用中国镜像（推荐）

直接运行修复版脚本：
```cmd
scripts\n8n-china.bat
```

或手动执行：
```cmd
npx --registry https://registry.npmmirror.com n8n@latest start
```

### 方法二：配置 npm 镜像

在命令行中执行：
```cmd
npm config set registry https://registry.npmmirror.com
npm config set strict-ssl false
npx n8n@latest start
```

### 方法三：使用 cnpm

1. 安装 cnpm：
```cmd
npm install -g cnpm --registry=https://registry.npmmirror.com
```

2. 使用 cnpm 安装 n8n：
```cmd
cnpm install -g n8n
n8n start
```

### 方法四：临时禁用 SSL 验证

```cmd
npm config set strict-ssl false
npm config set registry http://registry.npmjs.org/
npx n8n@latest start
```

## 🎯 推荐步骤

1. **立即尝试**：运行 `scripts\n8n-china.bat`
2. **如果成功**：n8n 将在 http://localhost:5678 启动
3. **如果失败**：尝试方法二或三

## 🔄 恢复默认设置

如果需要恢复 npm 默认设置：
```cmd
npm config delete registry
npm config delete strict-ssl
```

## 💡 长期解决方案

为了避免将来遇到类似问题，建议：

1. **配置企业代理**（如果在企业网络中）
2. **使用稳定的镜像源**
3. **配置防火墙白名单**

## 🧪 测试连接

测试网络连接：
```cmd
ping registry.npmmirror.com
curl -I https://registry.npmmirror.com
```

## 📞 仍有问题？

如果所有方法都失败：

1. **检查网络连接**
2. **联系网络管理员**（企业环境）
3. **尝试使用手机热点**
4. **使用 VPN**（如果允许）

---

**现在请尝试运行 `scripts\n8n-china.bat` 脚本！** 🚀
