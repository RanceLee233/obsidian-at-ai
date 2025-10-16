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
        // 更稳健的检测：最后字符为空格或换行都尝试触发
        const cursor = editor.getCursor();
        const line = editor.getLine(cursor.line);
        const prevChar = cursor.ch > 0 ? line.charAt(cursor.ch - 1) : '';
        if (prevChar === ' ' || prevChar === '\u00A0') {
          this.triggerManager.handleEditorChange(editor);
        }
      })
    );
    
    // 备用方案：键盘事件监听
    this.registerDomEvent(document, 'keyup', (event: KeyboardEvent) => {
      const isSpace = event.key === ' ' || event.key === 'Spacebar' || event.code === 'Space';
      if (isSpace) {
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
      
      // 检查是否可用：提供商或“已配置模型”任一存在即可
      const availableProviders = this.aiProviderManager.getAvailableProviders();
      const ext = this.settings as ExtendedPluginSettings;
      const hasModels = (ext.models && ext.models.filter(m => m.enabled).length > 0) || false;
      if (availableProviders.length === 0 && !hasModels) {
        this.showNotice('No AI models/providers configured. Please add a model in settings.', 'error');
        return;
      }

      // 创建并打开模态框
      const modal = new AtAIModal(
        this.app,
        this.templateLoader,
        this.aiProviderManager,
        context,
        this.settings,
        // 生成与应用分离：先生成，用户确认后再应用
        async (templateId, provider, context, outputMode) => {
          return await this.processTemplate(templateId, provider, context as any, outputMode);
        }
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
    context: ProcessContext & { selectedModel?: import('./types').AIModelConfig, inlinePrompt?: string },
    outputMode: 'replace' | 'insert' = 'replace'
  ): Promise<string> {
    if (this.isProcessing) {
      return '';
    }

    this.isProcessing = true;

    try {
      // 解析模板/内联提示词
      let prompt = context.inlinePrompt;
      const tpl = this.templateLoader.getTemplate(templateId);
      if (!prompt) {
        if (!tpl) throw new Error(`Template ${templateId} not found`);
        prompt = this.templateLoader.renderTemplate(tpl, context);
      }

      // 准备AI请求
      const messages = [
        { role: 'system' as const, content: 'You are a helpful AI assistant.' },
        { role: 'user' as const, content: prompt }
      ];

      const request = {
        messages,
        // 若用户在“模型管理器”里选择了模型，则优先使用该模型ID
        model: context.selectedModel?.modelId || tpl?.model || 'gpt-3.5-turbo',
        temperature: tpl?.temperature,
        maxTokens: tpl?.maxTokens
      };

      // 发送AI请求
      this.showNotice('Processing...', 'info');
      let response;
      if ((context as any).selectedModel) {
        response = await this.aiProviderManager.sendRequestWithModel((context as any).selectedModel, request);
      } else {
        response = await this.aiProviderManager.sendRequest(modelProvider, request);
      }

      // 返回给调用方预览，由调用方决定是否插入
      this.showNotice('AI processing completed (preview ready)', 'success');
      return response.content;
    } catch (error: any) {
      console.error('Failed to process template:', error);
      this.showNotice(`AI processing failed: ${error.message}`, 'error');
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  /** 将结果应用到编辑器 */
  async applyResult(editor: Editor, content: string, outputMode: 'replace' | 'insert') {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) return;
    if (outputMode === 'replace' && editor.getSelection()) {
      editor.replaceSelection(content);
    } else {
      const cursor = editor.getCursor();
      editor.replaceRange('\n\n' + content, cursor);
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
    const storedData = await this.loadData();
    const mergedSettings: ExtendedPluginSettings = Object.assign({}, DEFAULT_SETTINGS, storedData);

    mergedSettings.providers = (mergedSettings.providers || []).map(provider => ({
      ...provider,
      apiType: provider.apiType || 'chat_completions'
    }));

    if (mergedSettings.models && Array.isArray(mergedSettings.models)) {
      mergedSettings.models = mergedSettings.models.map(model => ({
        ...model,
        apiType: model.apiType || 'chat_completions'
      }));
    }

    this.settings = mergedSettings;
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
