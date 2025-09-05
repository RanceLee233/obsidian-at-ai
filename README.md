# @AI for Obsidian / Obsidian @AI 插件

[English](#english) | [中文](#中文)

---

## English

### Overview

@AI is an intelligent AI assistant plugin for Obsidian that allows you to trigger AI help with custom keywords. It supports multiple AI providers, template-based prompts, and provides a seamless integration with your note-taking workflow.

### Features

- **🚀 Custom Trigger Keywords**: Set your own keywords (like `@ai`, `@gpt`, `@助手`) to trigger the AI assistant
- **🤖 Multiple AI Providers**: Support for OpenAI, Anthropic Claude, OpenRouter, DeepSeek, Kimi, GLM, and custom providers
- **📝 Template System**: Use predefined templates or create your own in a dedicated folder
- **🌍 Bilingual Support**: Full Chinese and English interface with auto-detection
- **⚡ Smart Context**: Automatically detects selected text or full note content
- **🎨 Clean UI**: Lightweight popup with categorized templates and easy selection

### Supported AI Providers

- **OpenAI** - GPT-4o, GPT-4 Turbo, GPT-3.5 Turbo
- **Anthropic** - Claude 3.5 Sonnet, Claude 3 Haiku
- **OpenRouter** - Access to multiple models through one API
- **DeepSeek** - DeepSeek Chat, DeepSeek Coder
- **Kimi (Moonshot)** - Moonshot v1 models with different context lengths
- **GLM (智谱)** - GLM-4, GLM-4 Plus, GLM-3 Turbo
- **Custom Providers** - Add any OpenAI-compatible API

### Installation

#### Method 1: Community Plugin (Recommended)
1. Open Obsidian Settings
2. Go to Community Plugins and turn off Restricted Mode
3. Search for "@AI" and install
4. Enable the plugin

#### Method 2: Manual Installation
1. Download the latest release from GitHub
2. Extract files to your vault's `.obsidian/plugins/obsidian-at-ai/` folder
3. Enable the plugin in Community Plugins settings

#### Method 3: Development Build
1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run build` to build the plugin
4. Copy `main.js`, `manifest.json`, and `styles.css` to your plugins folder

### Quick Start

1. **Configure AI Provider**: Go to plugin settings and add your API key for at least one provider
2. **Set Trigger Keywords**: By default, type `@ai ` (with space) in any note
3. **Choose Template**: Select from built-in templates or create your own
4. **Get AI Response**: The result will replace selected text or insert at cursor position

### Configuration

#### Trigger Keywords
- Add multiple keywords separated by semicolons: `@ai;@gpt;@助手`
- Keywords support Unicode characters (Chinese, Japanese, etc.)
- Use space after keyword to trigger the assistant

#### AI Providers Setup
Each provider requires:
- **API Key**: Your authentication key
- **Base URL**: API endpoint (pre-filled for known providers)
- **Model Selection**: Choose default model
- **Parameters**: Temperature, max tokens, etc.

#### Template System
- **Location**: Templates are stored in `/_ai/prompts/` by default
- **Format**: Markdown files with YAML frontmatter
- **Variables**: Use `{{context}}` to insert selected text
- **Categories**: Organize templates by category (rewrite, summarize, etc.)

### Template Example

```markdown
---
id: polish.en
title: Polish Text
description: Improve writing while preserving meaning
category: rewrite
featured: true
tags: [editing, improvement]
temperature: 0.3
---

Please improve the following text while preserving its original meaning:

{{context}}
```

### Usage Examples

1. **Text Polishing**: Select text → type `@ai ` → choose "Polish Text"
2. **Summarization**: Select content → `@ai ` → "Summarize Points" 
3. **Translation**: Select text → `@ai ` → "Translate"
4. **Code Explanation**: Select code → `@ai ` → "Explain Code"

### Keyboard Shortcuts

- `Ctrl/Cmd + Shift + A`: Open AI assistant directly
- `Enter`: Execute selected template
- `Esc`: Cancel and close modal

### Troubleshooting

**Plugin not loading?**
- Ensure Obsidian version is 1.9.0 or higher
- Check console for error messages
- Try disabling and re-enabling the plugin

**No response from AI?**
- Verify API key is correct
- Check internet connection  
- Ensure the provider is enabled in settings
- Check API rate limits and quotas

**Templates not loading?**
- Verify template folder path in settings
- Check template file format (YAML frontmatter + markdown)
- Use "Reload Templates" button in settings

### Contributing

Contributions are welcome! Please feel free to:
- Report bugs and issues
- Suggest new features
- Submit pull requests
- Improve documentation

### License

MIT License - see LICENSE file for details.

---

## 中文

### 概述

@AI 是一个智能的 Obsidian AI 助手插件，允许您使用自定义关键词触发 AI 帮助。支持多种 AI 提供商、基于模板的提示词，并与您的笔记工作流程无缝集成。

### 功能特色

- **🚀 自定义触发关键词**：设置您自己的关键词（如 `@ai`、`@gpt`、`@助手`）来触发 AI 助手
- **🤖 多AI提供商支持**：支持 OpenAI、Anthropic Claude、OpenRouter、DeepSeek、Kimi、GLM 和自定义提供商
- **📝 模板系统**：使用预定义模板或在专用文件夹中创建您自己的模板
- **🌍 双语支持**：完整的中英文界面，支持自动检测
- **⚡ 智能上下文**：自动检测选中文本或完整笔记内容
- **🎨 简洁界面**：轻量级弹窗，分类模板，易于选择

### 支持的 AI 提供商

- **OpenAI** - GPT-4o、GPT-4 Turbo、GPT-3.5 Turbo
- **Anthropic** - Claude 3.5 Sonnet、Claude 3 Haiku
- **OpenRouter** - 通过一个 API 访问多种模型
- **DeepSeek** - DeepSeek Chat、DeepSeek Coder
- **Kimi (月之暗面)** - 支持不同上下文长度的 Moonshot v1 模型
- **GLM (智谱)** - GLM-4、GLM-4 Plus、GLM-3 Turbo
- **自定义提供商** - 添加任何兼容 OpenAI 的 API

### 安装方法

#### 方法一：社区插件（推荐）
1. 打开 Obsidian 设置
2. 前往社区插件并关闭受限模式
3. 搜索 "@AI" 并安装
4. 启用插件

#### 方法二：手动安装
1. 从 GitHub 下载最新版本
2. 解压文件到您的笔记库 `.obsidian/plugins/obsidian-at-ai/` 文件夹
3. 在社区插件设置中启用插件

#### 方法三：开发构建
1. 克隆此存储库
2. 运行 `npm install` 安装依赖
3. 运行 `npm run build` 构建插件
4. 将 `main.js`、`manifest.json` 和 `styles.css` 复制到插件文件夹

### 快速开始

1. **配置AI提供商**：前往插件设置，为至少一个提供商添加 API 密钥
2. **设置触发关键词**：默认情况下，在任何笔记中输入 `@ai ` (带空格)
3. **选择模板**：从内置模板中选择或创建您自己的模板
4. **获取AI响应**：结果将替换选中文本或在光标位置插入

### 配置说明

#### 触发关键词
- 添加多个关键词，用分号分隔：`@ai;@gpt;@助手`
- 关键词支持 Unicode 字符（中文、日文等）
- 在关键词后使用空格来触发助手

#### AI 提供商设置
每个提供商需要：
- **API 密钥**：您的身份验证密钥
- **基础 URL**：API 端点（已知提供商会预填充）
- **模型选择**：选择默认模型
- **参数设置**：温度、最大令牌数等

#### 模板系统
- **位置**：模板默认存储在 `/_ai/prompts/` 
- **格式**：带有 YAML 前置数据的 Markdown 文件
- **变量**：使用 `{{context}}` 插入选中文本
- **分类**：按类别组织模板（改写、总结等）

### 模板示例

```markdown
---
id: polish.cn
title: 中文润色
description: 优化表达与结构，保留术语与格式
category: rewrite
featured: true
tags: [润色, 改写]
temperature: 0.3
---

目标：在不改变事实与语义的前提下，优化以下中文内容的表达与结构。

{{context}}
```

### 使用示例

1. **文本润色**：选择文本 → 输入 `@ai ` → 选择 "中文润色"
2. **内容总结**：选择内容 → `@ai ` → "要点总结"
3. **文本翻译**：选择文本 → `@ai ` → "翻译"
4. **代码解释**：选择代码 → `@ai ` → "代码解释"

### 键盘快捷键

- `Ctrl/Cmd + Shift + A`：直接打开 AI 助手
- `Enter`：执行选中的模板
- `Esc`：取消并关闭弹窗

### 故障排除

**插件未加载？**
- 确保 Obsidian 版本为 1.9.0 或更高
- 检查控制台错误消息
- 尝试禁用后重新启用插件

**AI 无响应？**
- 验证 API 密钥是否正确
- 检查网络连接
- 确保提供商在设置中已启用
- 检查 API 速率限制和配额

**模板未加载？**
- 验证设置中的模板文件夹路径
- 检查模板文件格式（YAML 前置数据 + markdown）
- 使用设置中的"重新加载模板"按钮

### 贡献

欢迎贡献！您可以：
- 报告错误和问题
- 建议新功能
- 提交拉取请求
- 改进文档

### 许可证

MIT 许可证 - 详情请见 LICENSE 文件。

---

**Repository**: [obsidian-at-ai](https://github.com/yourusername/obsidian-at-ai)

**Issues & Support**: [GitHub Issues](https://github.com/yourusername/obsidian-at-ai/issues)