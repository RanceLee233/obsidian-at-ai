# @AI Plugin Usage Guide / @AI 插件使用指南

## Quick Setup / 快速设置

### 1. Install Plugin / 安装插件
- Enable in Community Plugins / 在社区插件中启用
- Or manual install in `.obsidian/plugins/obsidian-at-ai/` / 或手动安装到插件文件夹

### 2. Configure API / 配置 API
1. Open Settings → @AI Settings / 打开设置 → @AI 设置
2. Click “模型管理”按钮以维护多个模型配置 / 通过“模型管理”按钮维护多个模型
3. 在弹窗中选择 Provider、API 模式（Chat Completions 或 Responses） / 在弹窗中选择 Provider 与 API 模式（Chat Completions 或 Responses）
4. Responses 模式下 Base URL 需指向根路径（例如 `https://crs.discoverlabs.ac.cn/openai/v1`，插件会自动追加 `/responses`）/ Responses 模式下 Base URL 填写根路径（例如 `https://crs.discoverlabs.ac.cn/openai/v1`，插件会自动拼接 `/responses`）
5. 填写 API Key 并测试连接（Responses 会发起一次流式探针请求）/ 填写 API Key 并测试连接（Responses 会执行一次流式探针请求）
5. 保存后即可与既有 DeepSeek 等配置共存 / 保存后即可与现有 DeepSeek 等配置共存

### 3. Start Using / 开始使用
- Type `@ai ` (with space) in any note / 在任何笔记中输入 `@ai ` (带空格)
- Or use `Ctrl/Cmd + Shift + A` / 或使用快捷键
- Select a template and execute / 选择模板并执行

## Template Examples / 模板示例

### Creating Custom Templates / 创建自定义模板

1. Navigate to `/_ai/prompts/` folder / 导航到模板文件夹
2. Create `.md` file with YAML frontmatter / 创建带前置数据的 Markdown 文件

```markdown
---
id: my-template
title: My Custom Template  
description: What this template does
category: other
featured: false
---

Your custom prompt here.

Use {{context}} to insert selected text.

Process the following content:
{{context}}
```

### Popular Use Cases / 常用场景

**Polish Writing / 润色文本**
```
Select text → @ai → Polish Text
选择文本 → @ai → 中文润色
```

**Summarize Notes / 总结笔记**
```
Select content → @ai → Summarize Points  
选择内容 → @ai → 要点总结
```

**Translate Content / 翻译内容**
```
Select text → @ai → Translate
选择文本 → @ai → 翻译
```

**Explain Code / 解释代码**
```
Select code block → @ai → Explain Code
选择代码块 → @ai → 代码解释
```

## Tips & Tricks / 使用技巧

### Keyboard Shortcuts / 键盘快捷键
- `Ctrl/Cmd + Shift + A`: Open AI assistant / 打开 AI 助手
- `Tab`: Navigate templates / 切换模板
- `Enter`: Execute template / 执行模板
- `Esc`: Close modal / 关闭弹窗

### Custom Keywords / 自定义关键词
- Add multiple: `@ai;@gpt;@助手` / 添加多个关键词
- Use Chinese: `@人工智能;@AI助手` / 支持中文关键词
- Keep it short and memorable / 保持简短易记

### Template Variables / 模板变量
- `{{context}}` - Selected text or full note / 选中文本或全文
- `{{noteName}}` - Current note name / 当前笔记名称
- `{{today}}` - Current date / 当前日期
- `{{now}}` - Current timestamp / 当前时间戳

### Best Practices / 最佳实践

1. **Start Small**: Begin with built-in templates / 从内置模板开始
2. **Organize**: Use categories to organize templates / 使用分类组织模板
3. **Iterate**: Refine prompts based on results / 根据结果优化提示词
4. **Test**: Use different providers for comparison / 测试不同提供商效果

## Troubleshooting / 问题排解

### Common Issues / 常见问题

**❌ No AI providers configured**
- Solution: Add API key in settings / 解决：在设置中添加 API 密钥

**❌ Template not found** 
- Solution: Check template folder path / 解决：检查模板文件夹路径

**❌ Connection timeout**
- Solution: Check network and API status / 解决：检查网络和 API 状态

**❌ Invalid response**
- Solution: Try different model or adjust parameters / 解决：尝试不同模型或调整参数

### Getting Help / 获取帮助

1. Check console for errors / 检查控制台错误
2. Review plugin settings / 检查插件设置
3. Test with simple templates first / 先测试简单模板
4. Report issues on GitHub / 在 GitHub 报告问题

---

Happy note-taking with AI! / 享受 AI 辅助的笔记体验！
