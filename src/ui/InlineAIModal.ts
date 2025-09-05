import { App, Modal, Setting } from 'obsidian';
import { TemplateLoader } from '../templates/TemplateLoader';
import { AIProviderManager } from '../ai/AIProviderManager';
import { ProcessContext, PluginSettings, Template } from '../types';
import { t } from '../i18n';

export class AtAIModal extends Modal {
  private templateLoader: TemplateLoader;
  private aiProviderManager: AIProviderManager;
  private context: ProcessContext;
  private settings: PluginSettings;
  private onExecute: (templateId: string, modelProvider: string, context: ProcessContext, outputMode: 'replace' | 'insert') => Promise<void>;
  
  private searchQuery = '';
  private selectedCategory = 'featured';
  private selectedProvider = '';
  private selectedTemplate: Template | null = null;

  constructor(
    app: App,
    templateLoader: TemplateLoader,
    aiProviderManager: AIProviderManager,
    context: ProcessContext,
    settings: PluginSettings,
    onExecute: (templateId: string, modelProvider: string, context: ProcessContext, outputMode: 'replace' | 'insert') => Promise<void>
  ) {
    super(app);
    this.templateLoader = templateLoader;
    this.aiProviderManager = aiProviderManager;
    this.context = context;
    this.settings = settings;
    this.onExecute = onExecute;
    
    // 设置默认提供商
    const autoProvider = this.aiProviderManager.getAutoProvider();
    this.selectedProvider = autoProvider || '';
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    
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

    // 底部工具栏
    this.createBottomToolbar();
  }

  private createCategoryTabs(): void {
    const { contentEl } = this;
    
    const tabsContainer = contentEl.createEl('div', { cls: 'category-tabs' });
    
    const categories = [
      { id: 'featured', name: t('category.featured') },
      { id: 'rewrite', name: t('category.rewrite') },
      { id: 'continue', name: t('category.continue') },
      { id: 'summarize', name: t('category.summarize') },
      { id: 'translate', name: t('category.translate') },
      { id: 'code', name: t('category.code') },
      { id: 'other', name: t('category.other') }
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

    // 获取模板
    let templates: Template[] = [];
    
    if (this.searchQuery.trim()) {
      templates = this.templateLoader.searchTemplates(this.searchQuery);
    } else if (this.selectedCategory === 'featured') {
      templates = this.templateLoader.getFeaturedTemplates();
    } else {
      templates = this.templateLoader.getTemplatesByCategory(this.selectedCategory);
    }

    // 显示模板卡片
    if (templates.length === 0) {
      const emptyEl = templateContainer.createEl('div', { cls: 'empty-message' });
      emptyEl.textContent = this.searchQuery ? 
        'No templates found' : 
        `No templates in ${this.selectedCategory} category`;
      return;
    }

    for (const template of templates) {
      this.createTemplateCard(templateContainer, template);
    }
  }

  private createTemplateCard(container: HTMLElement, template: Template): void {
    const cardEl = container.createEl('div', {
      cls: `template-card ${this.selectedTemplate?.id === template.id ? 'selected' : ''}`
    });

    // 标题和描述
    const titleEl = cardEl.createEl('div', { cls: 'template-title', text: template.title });
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

    // 点击事件
    cardEl.addEventListener('click', () => {
      // 清除其他选中状态
      container.querySelectorAll('.template-card').forEach(el => {
        el.removeClass('selected');
      });
      
      // 选中当前卡片
      cardEl.addClass('selected');
      this.selectedTemplate = template;
      
      // 更新执行按钮状态
      this.updateExecuteButton();
    });

    // 双击直接执行
    cardEl.addEventListener('dblclick', () => {
      this.selectedTemplate = template;
      this.executeTemplate();
    });
  }

  private createBottomToolbar(): void {
    const { contentEl } = this;
    
    const toolbarEl = contentEl.createEl('div', { cls: 'bottom-toolbar' });
    
    // 模型选择
    const providerContainer = toolbarEl.createEl('div', { cls: 'provider-container' });
    const providerLabel = providerContainer.createEl('label', { text: t('ui.model.label') + ':' });
    
    const providerSelect = providerContainer.createEl('select', { cls: 'provider-select' });
    
    // 添加自动选择选项
    const autoOption = providerSelect.createEl('option', { 
      value: 'auto', 
      text: t('ui.model.auto') 
    });
    
    // 添加可用提供商
    const availableProviders = this.aiProviderManager.getAvailableProviders();
    for (const provider of availableProviders) {
      const option = providerSelect.createEl('option', {
        value: provider.id,
        text: provider.displayName
      });
    }
    
    providerSelect.value = this.selectedProvider || 'auto';
    providerSelect.addEventListener('change', (e) => {
      this.selectedProvider = (e.target as HTMLSelectElement).value;
    });

    // 执行按钮
    const buttonContainer = toolbarEl.createEl('div', { cls: 'button-container' });
    
    const executeBtn = buttonContainer.createEl('button', {
      text: t('ui.execute'),
      cls: 'mod-cta execute-btn'
    });
    
    executeBtn.addEventListener('click', () => {
      this.executeTemplate();
    });

    const cancelBtn = buttonContainer.createEl('button', {
      text: t('ui.cancel'),
      cls: 'cancel-btn'
    });
    
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

  private async executeTemplate(): Promise<void> {
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
      this.close();
      
      // 确定输出模式
      const outputMode = this.context.selectedText ? 'replace' : 'insert';
      
      await this.onExecute(
        this.selectedTemplate.id,
        provider,
        this.context,
        outputMode
      );
    } catch (error) {
      console.error('Failed to execute template:', error);
      // TODO: 显示错误提示
    }
  }
}