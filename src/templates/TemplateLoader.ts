import { App, TFile, parseYaml } from 'obsidian';
import { Template, ProcessContext } from '../types';

export class TemplateLoader {
  private app: App;
  private templateFolder: string;
  private templates = new Map<string, Template>();
  private builtinTemplates = new Map<string, Template>();

  constructor(app: App, templateFolder: string) {
    this.app = app;
    this.templateFolder = this.normalizePath(templateFolder);
    this.initBuiltinTemplates();
  }

  /**
   * 初始化内置模板
   */
  private initBuiltinTemplates(): void {
    const builtinTemplates: Template[] = [
      {
        id: 'polish.cn',
        title: '中文润色',
        description: '优化表达与结构，保留术语与格式',
        category: 'rewrite',
        featured: true,
        content: `目标：在不改变事实与语义的前提下，优化以下中文内容的表达与结构。
- 保留 Markdown、链接与代码块；不新增事实
- 风格：专业稳健；语气：客观克制

【原文】
{{context}}`
      },
      {
        id: 'continue.cn',
        title: '自然续写',
        description: '承接原文语气与节奏继续写作',
        category: 'continue',
        featured: true,
        content: `请以与原文相同的语气与节奏，续写约300字的自然段。
- 连贯承接，不另起新话题；避免复述已有内容

【原文】
{{context}}`
      },
      {
        id: 'summarize.cn',
        title: '要点总结',
        description: '提炼关键要点，保留重要数据',
        category: 'summarize',
        featured: true,
        content: `基于以下内容提炼5条要点：
- 每条≤30字；保留关键数据；未知写"（不确定）"

【原文】
{{context}}`
      },
      {
        id: 'translate.cn',
        title: '中英互译',
        description: '准确翻译并提供双语对照',
        category: 'translate',
        featured: true,
        content: `将以下内容翻译为英文，输出双语对照表格：

| 中文 | English |
|------|---------|

【原文】
{{context}}`
      },
      {
        id: 'explain.code',
        title: '代码解释',
        description: '解释代码功能和实现逻辑',
        category: 'code',
        content: `请解释以下代码的功能和实现逻辑：
- 主要功能是什么
- 关键算法或逻辑
- 使用的技术栈或库
- 可能的改进建议

【代码】
{{context}}`
      }
    ];

    for (const template of builtinTemplates) {
      this.builtinTemplates.set(template.id, template);
    }
  }

  /**
   * 设置模板文件夹
   */
  setTemplateFolder(folder: string): void {
    // 仅更新路径，不在每次输入时创建目录，避免边输入边生成多层文件夹
    this.templateFolder = this.normalizePath(folder);
  }

  /**
   * 加载所有模板
   */
  async loadTemplates(): Promise<void> {
    // 清空
    this.templates.clear();

    try {
      const folder = this.app.vault.getAbstractFileByPath(this.templateFolder);
      if (!folder) {
        await this.app.vault.createFolder(this.templateFolder);
        // 即使刚创建，也先写入默认模板
        await this.createDefaultTemplateFiles();
        await this.loadUserTemplates();
        return;
      }

      // 总是补齐缺省模板（不会覆盖已有文件）
      await this.createDefaultTemplateFiles();
      // 加载用户模板（仅以文件夹内容为准）
      await this.loadUserTemplates();
      // 若依然为空（极端情况），退回到内置模板以保证可用
      if (this.templates.size === 0) {
        for (const [id, template] of this.builtinTemplates) {
          this.templates.set(id, { ...template });
        }
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
      // 失败时至少提供内置模板以保底
      for (const [id, template] of this.builtinTemplates) {
        this.templates.set(id, { ...template });
      }
    }
  }

  /**
   * 创建示例模板文件
   */
  private async createDefaultTemplateFiles(): Promise<void> {
    const files: { name: string; content: string }[] = [
      {
        name: 'summarize.md',
        content: `# 总结要点\n\n基于以下内容提炼5条要点：每条不超过30字，保留关键数据。\n\n【原文】\n{{context}}`
      },
      {
        name: 'polish.md',
        content: `# 中文润色\n\n在不改变事实与语义的前提下，优化表达与结构，保留 Markdown、链接与代码块。\n\n【原文】\n{{context}}`
      },
      {
        name: 'translate.md',
        content: `# 中英互译\n\n将以下内容翻译为英文，输出为双语对照：\n\n【原文】\n{{context}}`
      },
      {
        name: 'example.md',
        content: `# example\n\n这是一个自定义模板示例。\n\n- 变量 {{context}}: 若选中文本则为所选内容，否则为当前文件全文。\n- 你可以在此文件中直接编写提示词正文，无需 YAML。\n- 文件第一行的一级标题将作为菜单显示名称。\n\n【输入】\n{{context}}\n\n【处理说明】\n请根据上述内容进行处理...`
      }
    ];

    for (const f of files) {
      try {
        const path = `${this.templateFolder}/${f.name}`.replace(/\/+/g, '/');
        if (!this.app.vault.getAbstractFileByPath(path)) {
          await this.app.vault.create(path, f.content);
        }
      } catch (e) {
        console.error('Failed to create default template file:', f.name, e);
      }
    }
  }

  /**
   * 加载用户模板
   */
  private async loadUserTemplates(): Promise<void> {
    const files = this.app.vault.getFiles().filter(file => 
      file.path.startsWith(this.templateFolder) && 
      file.extension === 'md'
    );

    for (const file of files) {
      try {
        const template = await this.parseTemplateFile(file);
        if (template) {
          // 用户模板覆盖同名内置模板
          this.templates.set(template.id, template);
        }
      } catch (error) {
        console.error(`Failed to parse template file ${file.path}:`, error);
      }
    }
  }

  /**
   * 解析模板文件
   */
  private async parseTemplateFile(file: TFile): Promise<Template | null> {
    const content = await this.app.vault.read(file);
    
    // 检查是否有frontmatter
    const frontmatterMatch = content.match(/^---\n(.*?)\n---\n([\s\S]*)$/);
    
    if (!frontmatterMatch) {
      // 无 YAML：尝试首行一级标题作为标题
      const lines = content.split(/\r?\n/);
      let title = file.basename;
      let body = content.trim();
      if (lines[0]?.startsWith('# ')) {
        title = lines[0].replace(/^#\s+/, '').trim();
        body = lines.slice(1).join('\n').trim();
      }
      const id = file.basename;
      return { id, title, category: 'other', content: body, sourcePath: file.path };
    }

    try {
      const frontmatter = parseYaml(frontmatterMatch[1]);
      const body = frontmatterMatch[2].trim();

      if (!frontmatter.id) {
        frontmatter.id = file.basename;
      }

      if (!frontmatter.title) {
        frontmatter.title = frontmatter.id;
      }

      if (!frontmatter.category) {
        frontmatter.category = 'other';
      }

      return {
        ...frontmatter,
        content: body,
        sourcePath: file.path
      } as Template;

    } catch (error) {
      console.error(`Failed to parse frontmatter in ${file.path}:`, error);
      return null;
    }
  }

  /**
   * 获取所有模板
   */
  getTemplates(): Template[] {
    return Array.from(this.templates.values());
  }

  /**
   * 根据ID获取模板
   */
  getTemplate(id: string): Template | undefined {
    return this.templates.get(id);
  }

  /**
   * 根据分类获取模板
   */
  getTemplatesByCategory(category: string): Template[] {
    return Array.from(this.templates.values())
      .filter(template => template.category === category);
  }

  /**
   * 获取推荐模板
   */
  getFeaturedTemplates(): Template[] {
    return Array.from(this.templates.values())
      .filter(template => template.featured === true);
  }

  /**
   * 搜索模板
   */
  searchTemplates(query: string): Template[] {
    const searchTerm = query.toLowerCase().trim();
    if (!searchTerm) {
      return this.getTemplates();
    }

    return Array.from(this.templates.values())
      .filter(template => 
        template.title.toLowerCase().includes(searchTerm) ||
        template.description?.toLowerCase().includes(searchTerm) ||
        template.tags?.some(tag => tag.toLowerCase().includes(searchTerm)) ||
        template.category.toLowerCase().includes(searchTerm)
      );
  }

  /**
   * 渲染模板
   */
  renderTemplate(template: Template, context: ProcessContext): string {
    let rendered = template.content;

    // 替换基础变量
    const variables: Record<string, string> = {
      context: context.selectedText || context.fullText,
      selectedText: context.selectedText,
      fullText: context.fullText,
      noteName: context.noteName,
      notePath: context.notePath,
      today: new Date().toISOString().split('T')[0],
      now: new Date().toLocaleString(),
      time: new Date().toLocaleTimeString(),
      cursorPosition: context.cursorPosition.toString()
    };

    // 添加frontmatter变量
    if (context.frontmatter) {
      for (const [key, value] of Object.entries(context.frontmatter)) {
        if (typeof value === 'string' || typeof value === 'number') {
          variables[`frontmatter.${key}`] = value.toString();
        }
      }
    }

    // 替换所有变量
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      rendered = rendered.replace(regex, value || '');
    }

    return rendered;
  }

  /**
   * 获取所有分类
   */
  getCategories(): string[] {
    const categories = new Set<string>();
    for (const template of this.templates.values()) {
      categories.add(template.category);
    }
    return Array.from(categories).sort();
  }

  /**
   * 重新加载模板
   */
  async reload(): Promise<void> {
    await this.loadTemplates();
  }

  /**
   * 获取模板统计信息
   */
  getStats(): {
    total: number;
    builtin: number;
    user: number;
    categories: number;
  } {
    const templates = this.getTemplates();
    const builtin = templates.filter(t => !t.sourcePath).length;
    const user = templates.filter(t => t.sourcePath).length;
    const categories = this.getCategories().length;

    return {
      total: templates.length,
      builtin,
      user,
      categories
    };
  }

  /** 规范化路径：去除首尾斜杠 */
  private normalizePath(p: string): string {
    const s = (p || '').trim();
    if (!s) return '_ai/prompts';
    return s.replace(/^\/+/, '').replace(/\/+$/, '');
  }
}
