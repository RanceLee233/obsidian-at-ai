import { App, Modal, Setting, MarkdownView } from 'obsidian';
import { TemplateLoader } from '../templates/TemplateLoader';
import { AIProviderManager } from '../ai/AIProviderManager';
import { ProcessContext, PluginSettings, Template, AIModelConfig, ExtendedPluginSettings } from '../types';
import { t } from '../i18n';

export class AtAIModal extends Modal {
  private templateLoader: TemplateLoader;
  private aiProviderManager: AIProviderManager;
  private context: ProcessContext;
  private settings: PluginSettings;
  private onExecute: (templateId: string, modelProvider: string, context: ProcessContext & { selectedModel?: AIModelConfig }, outputMode: 'replace' | 'insert') => Promise<string>;
  private outputEl: HTMLElement | null = null;
  private lastOutput: string = '';
  private lastPrompt: string = '';
  
  private searchQuery = '';
  private selectedCategory = 'featured';
  private chatMessages: { role: 'user'|'assistant'|'system'; content: string }[] = [];
  private selectedProvider = '';
  private configuredModels: AIModelConfig[] = [];
  private selectedModelId: string | null = null;
  private selectedTemplate: Template | null = null;

  constructor(
    app: App,
    templateLoader: TemplateLoader,
    aiProviderManager: AIProviderManager,
    context: ProcessContext,
    settings: PluginSettings,
    onExecute: (templateId: string, modelProvider: string, context: ProcessContext & { selectedModel?: AIModelConfig }, outputMode: 'replace' | 'insert') => Promise<string>
  ) {
    super(app);
    this.templateLoader = templateLoader;
    this.aiProviderManager = aiProviderManager;
    this.context = context;
    this.settings = settings;
    this.onExecute = onExecute;
    
    // 读取“已配置模型”（新架构，若存在则优先使用）
    const ext = this.settings as ExtendedPluginSettings;
    this.configuredModels = (ext.models || []).filter(m => m.enabled);
    if (this.configuredModels.length > 0) {
      this.selectedModelId = ext.activeModelId || this.configuredModels[0].id;
      // 与旧逻辑兼容：selectedProvider 仍然用于 sendRequest 的 provider 指定
      const active = this.configuredModels.find(m => m.id === this.selectedModelId);
      this.selectedProvider = active?.provider || '';
    } else {
      // 回退到旧的“提供商”选择
      const autoProvider = this.aiProviderManager.getAutoProvider();
      this.selectedProvider = autoProvider || '';
    }
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    // 扩展宽度
    this.modalEl.addClass('at-ai-inline-modal');
    
    // 添加标题
    const titleEl = contentEl.createEl('div', { cls: 'modal-title' });
    titleEl.textContent = t('ui.modal.title');

    // 创建主要内容区域
    this.createMainContent();
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }

  private createMainContent(): void {
    const { contentEl } = this;

    // 搜索框
    const searchContainer = contentEl.createEl('div', { cls: 'search-container' });
    const searchInput = searchContainer.createEl('input', {
      type: 'text',
      placeholder: t('ui.search.placeholder'),
      cls: 'search-input'
    });

    searchInput.addEventListener('input', (e) => {
      this.searchQuery = (e.target as HTMLInputElement).value;
      this.updateTemplateList();
    });

    // 分类标签
    this.createCategoryTabs();

    // 模板列表
    const templateContainer = contentEl.createEl('div', { cls: 'template-container' });
    this.updateTemplateList();

    // 结果输出区域
    this.outputEl = contentEl.createEl('div', { cls: 'ai-output-container' });

    // 底部工具栏
    this.createBottomToolbar();
  }

  private createCategoryTabs(): void {
    const { contentEl } = this;
    
    const tabsContainer = contentEl.createEl('div', { cls: 'category-tabs' });
    
    const categories = [
      { id: 'chat', name: '对话' },
      { id: 'featured', name: '常用' }
    ];

    for (const category of categories) {
      const tabEl = tabsContainer.createEl('button', {
        text: category.name,
        cls: category.id === this.selectedCategory ? 'tab-active' : 'tab'
      });

      tabEl.addEventListener('click', () => {
        // 更新选中状态
        tabsContainer.querySelectorAll('.tab, .tab-active').forEach(el => {
          el.className = 'tab';
        });
        tabEl.className = 'tab-active';
        
        this.selectedCategory = category.id;
        // 切换分类时清空执行区，避免历史混杂
        this.lastOutput = '';
        this.lastPrompt = '';
        if (this.outputEl) this.outputEl.empty();
        this.updateTemplateList();
      });
    }
  }

  private updateTemplateList(): void {
    // 获取模板列表容器
    let templateContainer = this.contentEl.querySelector('.template-list') as HTMLElement;
    if (!templateContainer) {
      templateContainer = this.contentEl.createEl('div', { cls: 'template-list' });
      // 插入到分类标签后面
      const categoryTabs = this.contentEl.querySelector('.category-tabs');
      if (categoryTabs) {
        categoryTabs.after(templateContainer);
      }
    }

    templateContainer.empty();

    // 对话模式：显示一个对话面板
    if (this.selectedCategory === 'chat') {
      this.renderChatPanel(templateContainer);
      return;
    }

    // 获取模板
    let templates: Template[] = [];
    
    if (this.searchQuery.trim()) {
      templates = this.templateLoader.searchTemplates(this.searchQuery);
    } else if (this.selectedCategory === 'featured') {
      templates = this.templateLoader.getFeaturedTemplates();
    } else {
      templates = this.templateLoader.getTemplatesByCategory(this.selectedCategory);
    }

    // 若分类为空且未搜索，则退回显示“全部”以便快速发现
    if (templates.length === 0 && !this.searchQuery.trim()) {
      templates = this.templateLoader.getTemplates();
    }

    // 显示模板卡片
    if (templates.length === 0) {
      const emptyEl = templateContainer.createEl('div', { cls: 'empty-message' });
      emptyEl.textContent = 'No templates found';
      return;
    }

    for (const template of templates) {
      this.createTemplateCard(templateContainer, template);
    }
  }

  private renderChatPanel(container: HTMLElement) {
    // 历史消息区域
    const historyEl = container.createEl('div', { cls: 'chat-history' });
    
    if (this.chatMessages.length === 0) {
      historyEl.createEl('div', { cls: 'empty-message', text: '开始与AI对话' });
    } else {
      this.chatMessages.forEach(msg => {
        const msgEl = historyEl.createEl('div', { 
          cls: `chat-message ${msg.role === 'user' ? 'user-message' : 'ai-message'}` 
        });
        
        const avatarEl = msgEl.createEl('div', { cls: 'message-avatar' });
        avatarEl.textContent = msg.role === 'user' ? '你' : 'AI';
        
        const contentEl = msgEl.createEl('div', { cls: 'message-content' });
        const bubble = contentEl.createEl('div', { cls: 'message-bubble' });
        bubble.textContent = msg.content;
      });
    }

    // 输入区域
    const inputWrap = container.createEl('div', { cls: 'chat-input-container' });
    const textarea = inputWrap.createEl('textarea', { 
      cls: 'chat-input',
      placeholder: '输入要讨论的问题...'
    }) as HTMLTextAreaElement;
    
    const sendBtn = inputWrap.createEl('button', { cls: 'chat-send-btn', text: '发送' });
    const send = async () => {
      const question = (textarea.value || '').trim();
      if (!question) return;
      this.chatMessages.push({ role: 'user', content: question });
      textarea.value = '';
      // 立即更新 UI
      container.empty();
      this.renderChatPanel(container);

      // 组装 prompt 并调用
      const contextText = this.context.selectedText || this.context.fullText || '';
      const chatPrompt = `基于以下内容回答用户问题。若问题与内容无关，也应尽量参考原文再作答。\n\n【内容】\n${contextText}\n\n【用户】\n${question}`;
      // 使用内联提示词
      this.selectedTemplate = { id: '__inline__', title: '对话', category: 'other', content: chatPrompt } as any;
      await this.executeTemplate(true);
      // 将结果写入历史（在 executeTemplate 完成后 lastOutput 已更新）
      if (this.lastOutput) {
        this.chatMessages.push({ role: 'assistant', content: this.lastOutput });
        container.empty();
        this.renderChatPanel(container);
      }
    };
    sendBtn.addEventListener('click', send);
    textarea.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) send(); });
  }

  private createTemplateCard(container: HTMLElement, template: Template): void {
    const cardEl = container.createEl('div', {
      cls: `template-card ${this.selectedTemplate?.id === template.id ? 'selected' : ''}`
    });

    // 标题行：包含标题和展开按钮
    const titleRow = cardEl.createEl('div', { cls: 'template-title-row' });
    const titleEl = titleRow.createEl('div', { cls: 'template-title', text: template.title });
    
    // 显示提示词按钮
    const toggleBtn = titleRow.createEl('button', { 
      cls: 'template-toggle-btn',
      text: '显示提示词'
    });
    
    // 提示词内容区域（初始隐藏）
    const promptEl = cardEl.createEl('div', { cls: 'template-prompt-content' });
    const promptPre = promptEl.createEl('pre');
    promptPre.textContent = template.content || '';
    promptEl.style.display = 'none';
    
    // 切换显示/隐藏提示词
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // 防止触发卡片点击
      if (promptEl.style.display === 'none') {
        promptEl.style.display = 'block';
        toggleBtn.textContent = '隐藏提示词';
      } else {
        promptEl.style.display = 'none';
        toggleBtn.textContent = '显示提示词';
      }
    });
    
    if (template.description) {
      const descEl = cardEl.createEl('div', { cls: 'template-description', text: template.description });
    }

    // 标签
    if (template.tags && template.tags.length > 0) {
      const tagsEl = cardEl.createEl('div', { cls: 'template-tags' });
      for (const tag of template.tags) {
        tagsEl.createEl('span', { cls: 'template-tag', text: tag });
      }
    }

    // 点击卡片执行（避开按钮区域）
    cardEl.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).classList.contains('template-toggle-btn')) {
        return;
      }
      this.selectedTemplate = template;
      this.executeTemplate();
    });
  }

  private createBottomToolbar(): void {
    const { contentEl } = this;
    
    const toolbarEl = contentEl.createEl('div', { cls: 'bottom-toolbar' });
    
    // 模型/提供商选择
    const providerContainer = toolbarEl.createEl('div', { cls: 'provider-container' });
    providerContainer.createEl('label', { text: t('ui.model.label') + ':' });

    if (this.configuredModels.length > 0) {
      // 显示“已配置模型”下拉
      const modelSelect = providerContainer.createEl('select', { cls: 'provider-select' });
      for (const m of this.configuredModels) {
        const opt = modelSelect.createEl('option', {
          value: m.id,
          text: `${m.name} (${m.providerName})`
        });
      }
      modelSelect.value = this.selectedModelId ?? this.configuredModels[0].id;
      modelSelect.addEventListener('change', (e) => {
        const id = (e.target as HTMLSelectElement).value;
        this.selectedModelId = id;
        const active = this.configuredModels.find(m => m.id === id);
        this.selectedProvider = active?.provider || '';
      });
    } else {
      // 回退：显示“提供商”下拉（旧逻辑）
      const providerSelect = providerContainer.createEl('select', { cls: 'provider-select' });
      const autoOption = providerSelect.createEl('option', { value: 'auto', text: t('ui.model.auto') });
      const availableProviders = this.aiProviderManager.getAvailableProviders();
      for (const provider of availableProviders) {
        providerSelect.createEl('option', { value: provider.id, text: provider.displayName });
      }
      providerSelect.value = this.selectedProvider || 'auto';
      providerSelect.addEventListener('change', (e) => {
        this.selectedProvider = (e.target as HTMLSelectElement).value;
      });
    }

    // 执行按钮
    const buttonContainer = toolbarEl.createEl('div', { cls: 'button-container' });
    
    const executeBtn = buttonContainer.createEl('button', { text: '执行', cls: 'mod-cta execute-btn' });
    
    executeBtn.addEventListener('click', () => {
      this.executeTemplate();
    });

    const insertBtn = buttonContainer.createEl('button', { text: '插入到文档', cls: 'cancel-btn' });
    insertBtn.addEventListener('click', () => {
      if (!this.lastOutput) return;
      const view = this.app.workspace.getActiveViewOfType(MarkdownView);
      const editor = view?.editor;
      if (!editor) return;
      if (this.context.selectedText) {
        editor.replaceSelection(this.lastOutput);
      } else {
        const cursor = editor.getCursor();
        editor.replaceRange('\n\n' + this.lastOutput, cursor);
      }
    });

    const cancelBtn = buttonContainer.createEl('button', { text: t('ui.cancel'), cls: 'cancel-btn' });
    
    cancelBtn.addEventListener('click', () => {
      this.close();
    });

    // 初始化执行按钮状态
    this.updateExecuteButton();
  }

  private updateExecuteButton(): void {
    const executeBtn = this.contentEl.querySelector('.execute-btn') as HTMLButtonElement;
    if (executeBtn) {
      executeBtn.disabled = !this.selectedTemplate || !this.selectedProvider;
    }
  }

  private async executeTemplate(isInline = false): Promise<void> {
    if (!this.selectedTemplate) {
      return;
    }

    let provider = this.selectedProvider;
    if (provider === 'auto') {
      provider = this.aiProviderManager.getAutoProvider() || '';
    }

    if (!provider) {
      // TODO: 显示错误提示
      return;
    }

    try {
      // 准备提示词
      this.lastPrompt = isInline ? (this.selectedTemplate.content || '') : this.templateLoader.renderTemplate(this.selectedTemplate, this.context);
      
      // 显示执行状态
      if (this.outputEl) {
        this.outputEl.empty();
        
        // 状态栏
        const statusBar = this.outputEl.createEl('div', { cls: 'ai-status-bar' });
        const statusIcon = statusBar.createEl('span', { cls: 'status-icon loading' });
        const statusText = statusBar.createEl('span', { cls: 'status-text', text: '正在执行...' });
        
        // 结果区域（初始为空）
        const resultContainer = this.outputEl.createEl('div', { cls: 'ai-result-container' });
      }
      // 确定输出模式
      const outputMode = this.context.selectedText ? 'replace' : 'insert';
      // 若选择了“已配置模型”，一起传给处理函数（以便覆盖模板中的 model）
      const selectedModel = this.configuredModels.find(m => m.id === this.selectedModelId || '');
      const result = await this.onExecute(this.selectedTemplate.id, provider, { ...this.context, selectedModel, inlinePrompt: isInline ? this.lastPrompt : undefined } as any, outputMode);
      this.lastOutput = result || '';
      
      if (this.outputEl) {
        // 更新状态栏
        const statusBar = this.outputEl.querySelector('.ai-status-bar');
        if (statusBar) {
          const statusIcon = statusBar.querySelector('.status-icon');
          const statusText = statusBar.querySelector('.status-text');
          if (statusIcon) {
            statusIcon.className = 'status-icon success';
          }
          if (statusText) {
            statusText.textContent = '执行成功';
          }
        }
        
        // 显示结果
        const resultContainer = this.outputEl.querySelector('.ai-result-container');
        if (resultContainer) {
          resultContainer.empty();
          const pre = resultContainer.createEl('pre', { cls: 'ai-result-content' });
          pre.textContent = this.lastOutput || '(无输出)';
        }
      }
    } catch (error: any) {
      console.error('Failed to execute template:', error);
      if (this.outputEl) {
        // 更新状态栏显示错误
        const statusBar = this.outputEl.querySelector('.ai-status-bar');
        if (!statusBar) {
          this.outputEl.empty();
          const newStatusBar = this.outputEl.createEl('div', { cls: 'ai-status-bar' });
          newStatusBar.createEl('span', { cls: 'status-icon error' });
          newStatusBar.createEl('span', { cls: 'status-text', text: `请求失败：${error?.message || error}` });
        } else {
          const statusIcon = statusBar.querySelector('.status-icon');
          const statusText = statusBar.querySelector('.status-text');
          if (statusIcon) {
            statusIcon.className = 'status-icon error';
          }
          if (statusText) {
            statusText.textContent = `请求失败：${error?.message || error}`;
          }
        }
        
        // 清空结果区域
        const resultContainer = this.outputEl.querySelector('.ai-result-container');
        if (resultContainer) {
          resultContainer.empty();
        }
      }
    }
  }
}
