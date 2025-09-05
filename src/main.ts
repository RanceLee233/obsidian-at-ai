import { Plugin, Editor, MarkdownView } from 'obsidian';
import { PluginSettings, DEFAULT_SETTINGS, ProcessContext, ExtendedPluginSettings } from './types';
import { i18n, setLanguage } from './i18n';
import { TriggerManager, TriggerMatch } from './trigger/TriggerManager';
import { AIProviderManager } from './ai/AIProviderManager';
import { TemplateLoader } from './templates/TemplateLoader';
import { AtAIModal } from './ui/InlineAIModal';
import { AtAISettingsTab } from './settings/SettingsTab';

export default class AtAIPlugin extends Plugin {
  settings: ExtendedPluginSettings = DEFAULT_SETTINGS;
  private triggerManager: TriggerManager;
  private aiProviderManager: AIProviderManager;
  private templateLoader: TemplateLoader;
  private isProcessing = false;

  async onload() {
    console.log('Loading @AI plugin...');

    // 加载设置
    await this.loadSettings();

    // 初始化国际化
    if (this.settings.autoDetectLanguage) {
      setLanguage(i18n.detectLanguage());
    } else {
      setLanguage(this.settings.language);
    }

    // 初始化管理器
    this.triggerManager = new TriggerManager(this.settings.triggerKeywords);
    this.aiProviderManager = new AIProviderManager();
    this.templateLoader = new TemplateLoader(this.app, this.settings.templateFolder);

    // 配置触发回调
    this.triggerManager.setTriggerCallback(this.handleTrigger.bind(this));

    // 更新AI提供商
    this.aiProviderManager.updateProviders(this.settings.providers);
    
    // 如果有模型配置，优先使用模型配置
    if (this.settings.models && this.settings.models.length > 0) {
      // TODO: 在后续版本中集成新的模型管理器
      console.log('Detected new model configuration:', this.settings.models);
    }

    // 加载模板
    await this.templateLoader.loadTemplates();

    // 注册编辑器事件
    this.registerEditorEvents();

    // 注册命令
    this.registerCommands();

    // 添加设置选项卡
    this.addSettingTab(new AtAISettingsTab(this.app, this));

    console.log('@AI plugin loaded successfully');
  }

  onunload() {
    console.log('Unloading @AI plugin...');
  }

  /**
   * 注册编辑器事件
   */
  private registerEditorEvents(): void {
    // 使用更可靠的编辑器事件监听
    this.registerEvent(
      this.app.workspace.on('editor-change', (editor: Editor) => {
        // 检查最后输入的字符是否为空格
        const cursor = editor.getCursor();
        const line = editor.getLine(cursor.line);
        if (cursor.ch > 0 && line.charAt(cursor.ch - 1) === ' ') {
          this.triggerManager.handleEditorChange(editor);
        }
      })
    );
    
    // 备用方案：键盘事件监听
    this.registerDomEvent(document, 'keyup', (event: KeyboardEvent) => {
      if (event.key === ' ') {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (view && view.editor) {
          console.log('Space key detected, checking trigger...');
          this.triggerManager.handleEditorChange(view.editor);
        }
      }
    });
  }

  /**
   * 注册命令
   */
  private registerCommands(): void {
    // 打开AI助手命令
    this.addCommand({
      id: 'open-ai-assistant',
      name: 'Open AI Assistant',
      editorCallback: (editor: Editor) => {
        this.openAIModal(editor);
      },
      hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 'a' }]
    });

    // 重新加载模板命令
    this.addCommand({
      id: 'reload-templates',
      name: 'Reload Templates',
      callback: async () => {
        await this.templateLoader.reload();
        console.log('Templates reloaded');
      }
    });
  }

  /**
   * 处理触发事件
   */
  private async handleTrigger(match: TriggerMatch, editor: Editor): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    try {
      // 清理触发词
      this.triggerManager.cleanupTrigger(editor, match);
      
      // 打开AI模态框
      await this.openAIModal(editor);
    } catch (error) {
      console.error('Failed to handle trigger:', error);
    }
  }

  /**
   * 打开AI模态框
   */
  private async openAIModal(editor: Editor): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    try {
      // 获取处理上下文
      const context = this.getProcessContext(editor);
      
      // 检查是否有可用的AI提供商
      const availableProviders = this.aiProviderManager.getAvailableProviders();
      if (availableProviders.length === 0) {
        this.showNotice('No AI providers configured. Please check settings.', 'error');
        return;
      }

      // 创建并打开模态框
      const modal = new AtAIModal(
        this.app,
        this.templateLoader,
        this.aiProviderManager,
        context,
        this.settings,
        this.processTemplate.bind(this)
      );
      
      modal.open();
    } catch (error) {
      console.error('Failed to open AI modal:', error);
      this.showNotice('Failed to open AI assistant', 'error');
    }
  }

  /**
   * 获取处理上下文
   */
  private getProcessContext(editor: Editor): ProcessContext {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    const selectedText = editor.getSelection();
    const fullText = editor.getValue();
    const cursorPosition = editor.getCursor().line;
    const noteName = view?.file?.basename || '';
    const notePath = view?.file?.path || '';
    
    let frontmatter: any = {};
    try {
      if (view?.file) {
        const cache = this.app.metadataCache.getFileCache(view.file);
        frontmatter = cache?.frontmatter || {};
      }
    } catch (error) {
      console.error('Failed to get frontmatter:', error);
    }

    return {
      selectedText,
      fullText,
      cursorPosition,
      noteName,
      notePath,
      frontmatter
    };
  }

  /**
   * 处理模板
   */
  async processTemplate(
    templateId: string,
    modelProvider: string,
    context: ProcessContext,
    outputMode: 'replace' | 'insert' = 'replace'
  ): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      // 获取模板
      const template = this.templateLoader.getTemplate(templateId);
      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }

      // 渲染模板
      const prompt = this.templateLoader.renderTemplate(template, context);

      // 准备AI请求
      const messages = [
        { role: 'system' as const, content: 'You are a helpful AI assistant.' },
        { role: 'user' as const, content: prompt }
      ];

      const request = {
        messages,
        model: template.model || 'gpt-3.5-turbo',
        temperature: template.temperature,
        maxTokens: template.maxTokens
      };

      // 发送AI请求
      this.showNotice('Processing...', 'info');
      const response = await this.aiProviderManager.sendRequest(modelProvider, request);

      // 写入结果
      const view = this.app.workspace.getActiveViewOfType(MarkdownView);
      if (view) {
        const editor = view.editor;
        
        if (outputMode === 'replace' && context.selectedText) {
          // 替换选中文本
          editor.replaceSelection(response.content);
        } else {
          // 在当前位置插入
          const cursor = editor.getCursor();
          editor.replaceRange(
            '\n\n' + response.content,
            cursor
          );
        }
      }

      this.showNotice('AI processing completed', 'success');

    } catch (error: any) {
      console.error('Failed to process template:', error);
      this.showNotice(`AI processing failed: ${error.message}`, 'error');
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 显示通知
   */
  private showNotice(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    // TODO: 改进通知样式
    console.log(`[@AI ${type.toUpperCase()}] ${message}`);
  }

  /**
   * 加载设置
   */
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  /**
   * 保存设置
   */
  async saveSettings() {
    await this.saveData(this.settings);
    
    // 更新各个管理器
    this.triggerManager.setKeywords(this.settings.triggerKeywords);
    this.aiProviderManager.updateProviders(this.settings.providers);
    this.templateLoader.setTemplateFolder(this.settings.templateFolder);
    
    // 更新语言
    setLanguage(this.settings.language);
  }

  /**
   * 获取设置
   */
  getSettings(): PluginSettings {
    return this.settings;
  }

  /**
   * 更新设置
   */
  async updateSettings(newSettings: Partial<ExtendedPluginSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    await this.saveSettings();
    
    // 更新触发管理器的关键词
    if (newSettings.triggerKeywords) {
      this.triggerManager.setKeywords(newSettings.triggerKeywords);
    }
    
    // 更新AI提供商管理器
    if (newSettings.providers) {
      this.aiProviderManager.updateProviders(newSettings.providers);
    }
  }

  /**
   * 获取模板加载器
   */
  getTemplateLoader(): TemplateLoader {
    return this.templateLoader;
  }

  /**
   * 获取AI提供商管理器
   */
  getAIProviderManager(): AIProviderManager {
    return this.aiProviderManager;
  }

  /**
   * 获取触发管理器
   */
  getTriggerManager(): TriggerManager {
    return this.triggerManager;
  }
}