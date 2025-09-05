#!/bin/bash

# @AI Plugin Local Installation Script
# 本地安装脚本

echo "=== @AI Plugin Local Installation ==="
echo "=== @AI 插件本地安装 ==="

# 检查是否提供了 vault 路径参数
if [ -z "$1" ]; then
    echo "Usage: ./install-local.sh <path-to-your-obsidian-vault>"
    echo "用法: ./install-local.sh <你的Obsidian笔记库路径>"
    echo ""
    echo "Example / 示例:"
    echo "./install-local.sh ~/Documents/MyVault"
    echo "或者:"
    echo "./install-local.sh '/Users/username/Documents/My Obsidian Vault'"
    exit 1
fi

VAULT_PATH="$1"
PLUGIN_DIR="$VAULT_PATH/.obsidian/plugins/obsidian-at-ai"

# 检查 vault 路径是否存在
if [ ! -d "$VAULT_PATH" ]; then
    echo "❌ Vault path does not exist: $VAULT_PATH"
    echo "❌ 笔记库路径不存在: $VAULT_PATH"
    exit 1
fi

# 创建 .obsidian 目录（如果不存在）
if [ ! -d "$VAULT_PATH/.obsidian" ]; then
    echo "📁 Creating .obsidian directory..."
    echo "📁 创建 .obsidian 目录..."
    mkdir -p "$VAULT_PATH/.obsidian"
fi

# 创建 plugins 目录（如果不存在）
if [ ! -d "$VAULT_PATH/.obsidian/plugins" ]; then
    echo "📁 Creating plugins directory..."
    echo "📁 创建 plugins 目录..."
    mkdir -p "$VAULT_PATH/.obsidian/plugins"
fi

# 创建插件目录
echo "📁 Creating plugin directory..."
echo "📁 创建插件目录..."
mkdir -p "$PLUGIN_DIR"

# 复制插件文件
echo "📋 Copying plugin files..."
echo "📋 复制插件文件..."

cp main.js "$PLUGIN_DIR/"
cp manifest.json "$PLUGIN_DIR/"
cp styles.css "$PLUGIN_DIR/"

# 检查文件是否复制成功
if [ -f "$PLUGIN_DIR/main.js" ] && [ -f "$PLUGIN_DIR/manifest.json" ] && [ -f "$PLUGIN_DIR/styles.css" ]; then
    echo "✅ Plugin installed successfully!"
    echo "✅ 插件安装成功！"
    echo ""
    echo "📖 Next steps / 下一步操作:"
    echo "1. Open Obsidian / 打开 Obsidian"
    echo "2. Go to Settings → Community Plugins / 前往 设置 → 第三方插件"
    echo "3. Enable '@AI' plugin / 启用 '@AI' 插件"
    echo "4. Configure AI providers in plugin settings / 在插件设置中配置 AI 提供商"
    echo ""
    echo "🔧 Plugin location / 插件位置:"
    echo "$PLUGIN_DIR"
else
    echo "❌ Installation failed!"
    echo "❌ 安装失败！"
    exit 1
fi