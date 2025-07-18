#!/bin/bash

echo "========================================"
echo "ArtSlave n8n 安装脚本"
echo "========================================"
echo

echo "正在检查 Node.js 版本..."
if ! command -v node &> /dev/null; then
    echo "错误: 未找到 Node.js，请先安装 Node.js"
    echo "下载地址: https://nodejs.org/"
    exit 1
fi
node --version

echo
echo "正在检查 npm 版本..."
if ! command -v npm &> /dev/null; then
    echo "错误: 未找到 npm"
    exit 1
fi
npm --version

echo
echo "开始安装 n8n..."
echo "这可能需要几分钟时间，请耐心等待..."
echo

# 尝试全局安装
if npm install -g n8n; then
    echo
    echo "n8n 全局安装成功！"
else
    echo
    echo "全局安装失败，尝试本地安装..."
    cd "$(dirname "$0")/.."
    if npm install n8n; then
        echo
        echo "n8n 本地安装成功！"
    else
        echo
        echo "安装失败！请尝试以下解决方案："
        echo "1. 使用 sudo 运行此脚本: sudo ./install-n8n.sh"
        echo "2. 检查网络连接"
        echo "3. 手动运行: npm install -g n8n"
        exit 1
    fi
fi

echo
echo "正在验证安装..."
if command -v n8n &> /dev/null; then
    n8n --version
    echo "验证成功！"
else
    echo "验证失败，但安装可能已完成"
    echo "请尝试重启终端或重新登录"
fi

echo
echo "========================================"
echo "安装完成！"
echo
echo "使用说明："
echo "1. 返回 ArtSlave 应用"
echo "2. 刷新数据收集页面"
echo "3. 点击"启动 n8n"按钮"
echo "4. 等待启动完成后点击"打开 n8n""
echo
echo "如果仍有问题，请手动运行："
echo "n8n start"
echo "========================================"
echo
