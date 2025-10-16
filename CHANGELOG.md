# Changelog

All notable changes to the @AI plugin will be documented in this file.

## [1.0.2] - 2025-02-XX

### Added
- 支持在模型管理器中选择 OpenAI Responses API 模式，兼容 `/v1/responses` 端点。
- 新增 Responses 流式解析，自动拼接 `/responses` 并获取输出。
- 允许同时保留 DeepSeek 配置并新增基于 Responses 的模型。

## [1.0.0] - 2025-01-XX

### Added
- Initial release of @AI plugin for Obsidian
- Custom trigger keyword support (default: `@ai `)
- Multiple AI provider integration:
  - OpenAI (GPT-4o, GPT-4 Turbo, GPT-3.5 Turbo)
  - Anthropic (Claude 3.5 Sonnet, Claude 3 Haiku)  
  - OpenRouter (Multiple model access)
  - DeepSeek (Chat & Coder models)
  - Kimi/Moonshot (Various context lengths)
  - GLM/智谱 (GLM-4, GLM-4 Plus, GLM-3 Turbo)
  - Custom provider support
- Template system with YAML frontmatter
- Built-in templates:
  - Text polishing (Chinese & English)
  - Content summarization
  - Translation
  - Code explanation
  - Continue writing
- Bilingual interface (Chinese & English)
- Auto language detection
- Smart context detection (selected text vs full note)
- Categorized template organization
- Template search functionality
- Keyboard shortcuts (`Ctrl/Cmd + Shift + A`)
- Comprehensive settings panel
- Template folder customization
- Provider connection testing
- Error handling and user feedback
- Responsive design for different screen sizes

### Features
- **Smart Triggering**: Type custom keywords followed by space
- **Template Variables**: Use `{{context}}`, `{{noteName}}`, `{{today}}` etc.
- **Multiple Output Modes**: Replace selection or insert at cursor
- **Provider Auto-Selection**: Automatic fallback to available providers
- **Template Management**: Create, edit, and organize templates
- **Internationalization**: Full Chinese and English support
- **Security**: API keys stored securely in Obsidian settings

### Technical
- Built with TypeScript for type safety
- Modular architecture for easy maintenance
- Obsidian 1.9.0+ compatibility
- ESBuild for fast compilation
- CSS custom properties for theme integration
- Error boundaries for graceful failure handling

### Documentation
- Comprehensive README in Chinese and English
- Usage guide with examples
- Template creation instructions
- Troubleshooting guide
- Contributing guidelines

---

## Upcoming Features (Roadmap)

### [1.1.0] - Planned
- [ ] Streaming response support
- [ ] Template sharing community
- [ ] Batch processing for multiple selections
- [ ] Custom CSS styling options
- [ ] Template import/export functionality
- [ ] Usage statistics and analytics
- [ ] More built-in template categories

### [1.2.0] - Planned
- [ ] Plugin API for third-party integrations
- [ ] Advanced template scripting
- [ ] Multi-language template support
- [ ] Template versioning system
- [ ] Collaborative template sharing
- [ ] Performance optimizations
- [ ] Mobile app support improvements

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on how to get started.

## Support

If you encounter any issues or have feature requests, please:
1. Check the [troubleshooting guide](USAGE.md#troubleshooting)
2. Search [existing issues](https://github.com/yourusername/obsidian-at-ai/issues)
3. Create a [new issue](https://github.com/yourusername/obsidian-at-ai/issues/new) with detailed information

---

**Note**: This changelog follows [Keep a Changelog](https://keepachangelog.com/) format.
