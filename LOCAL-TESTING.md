# @AI 插件本地测试指南

## 快速安装

### 1. 准备工作
确保您有：
- Obsidian 1.9.0+ 版本
- 一个测试用的 Obsidian 笔记库

### 2. 使用安装脚本（推荐）

```bash
# 在项目目录中运行
./install-local.sh "/path/to/your/obsidian/vault"

# 示例：
./install-local.sh ~/Documents/MyVault
# 或者带空格的路径：
./install-local.sh "/Users/username/Documents/My Obsidian Vault"
```

### 3. 手动安装
如果脚本失败，可以手动安装：

```bash
# 创建插件目录
mkdir -p "/path/to/vault/.obsidian/plugins/obsidian-at-ai"

# 复制文件
cp main.js "/path/to/vault/.obsidian/plugins/obsidian-at-ai/"
cp manifest.json "/path/to/vault/.obsidian/plugins/obsidian-at-ai/"
cp styles.css "/path/to/vault/.obsidian/plugins/obsidian-at-ai/"
```

## 激活插件

1. 打开 Obsidian
2. 设置 → 第三方插件
3. 确保"受限模式"已关闭
4. 在已安装插件列表中找到 "@AI"
5. 点击开关启用插件

## 配置测试

### 1. 基本设置
- 设置 → @AI 设置
- 配置触发关键词（默认：`@ai;@gpt;@助手`）
- 选择语言（中文/English）

### 2. 添加 AI 提供商
至少配置一个 AI 提供商：

**OpenAI 示例：**
```
API Key: sk-xxxxxxxxxxxxxxxx
Base URL: https://api.openai.com/v1
Model: gpt-4o
```

**DeepSeek 示例：**
```
API Key: sk-xxxxxxxxxxxxxxxx  
Base URL: https://api.deepseek.com/v1
Model: deepseek-chat
```

### 3. 测试连接
- 在设置面板点击"测试连接"
- 确保显示"✅ 连接成功"

## 功能测试

### 1. 基础触发测试

在任意笔记中：
```
1. 输入 "@ai " (注意空格)
2. 应该弹出模板选择界面
3. 选择一个模板并执行
```

### 2. 快捷键测试
- 按 `Ctrl/Cmd + Shift + A`
- 应该直接打开模板选择界面

### 3. 模板系统测试

**创建测试模板：**
```bash
# 在笔记库中创建
mkdir -p "_ai/prompts"
```

创建文件 `_ai/prompts/test-template.md`：
```markdown
---
id: test-template
title: 测试模板
description: 简单的测试模板
category: other
featured: false
---

这是一个测试模板。

输入内容：
{{context}}

请分析以上内容。
```

### 4. 文本处理测试

**选中文本测试：**
1. 选择一段文本
2. 输入 `@ai `
3. 选择"润色文本"或其他模板
4. 查看结果

**全文处理测试：**
1. 不选择任何文本
2. 输入 `@ai `
3. 选择"总结要点"
4. 应该处理整个笔记内容

## 调试信息

### 1. 控制台查看
- 打开开发者工具 (`Ctrl/Cmd + Shift + I`)
- 查看 Console 标签页
- 寻找 "@AI" 相关的日志信息

### 2. 插件目录验证
检查文件是否正确安装：
```bash
ls -la "/path/to/vault/.obsidian/plugins/obsidian-at-ai/"
# 应该看到：main.js, manifest.json, styles.css
```

### 3. 模板加载验证
检查模板文件夹：
```bash
ls -la "/path/to/vault/_ai/prompts/"
# 应该看到内置模板文件
```

## 常见问题

### Q: 插件无法启用？
A: 确保 Obsidian 版本 ≥ 1.9.0，重启应用

### Q: 输入 @ai 没有反应？
A: 确保：
- 触发词后有空格
- 插件已启用
- 至少配置一个 AI 提供商

### Q: 模板没有加载？
A: 检查：
- 模板文件夹路径设置
- YAML 前置数据格式
- 点击"重新加载模板"

### Q: AI 无响应？
A: 验证：
- API 密钥正确性
- 网络连接
- 提供商设置启用状态

## 开发调试

如果需要修改代码：

```bash
# 修改源码后重新编译
npm run build

# 重新安装到测试库
./install-local.sh "/path/to/vault"

# 重启 Obsidian 或重载插件
```

## 测试完成

插件正常工作的标志：
- ✅ 能够通过 @ai 触发
- ✅ 模板选择界面正常显示
- ✅ AI 提供商连接成功
- ✅ 文本处理功能正常
- ✅ 快捷键工作正常

## 问题反馈

如遇到问题，请提供：
1. Obsidian 版本号
2. 操作系统版本
3. 错误消息截图
4. 控制台错误日志

---

**祝您测试愉快！🚀**