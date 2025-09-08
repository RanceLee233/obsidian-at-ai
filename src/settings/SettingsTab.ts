import { App, PluginSettingTab, Setting } from 'obsidian';
import AtAIPlugin from '../main';
import { AIProviderConfig, BUILTIN_PROVIDERS, AIModelConfig, ExtendedPluginSettings } from '../types';
import { t, Language } from '../i18n';
import { ModelManagerModal } from '../ui/ModelManagerModal';

export class AtAISettingsTab extends PluginSettingTab {
  plugin: AtAIPlugin;
  private providersContainer: HTMLElement | null = null;

  constructor(app: App, plugin: AtAIPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // 标题
    containerEl.createEl('h1', { text: t('settings.title') });

    // 基本设置部分
    this.createBasicSettings();

    // 触发设置部分
    this.createTriggerSettings();

    // AI模型设置部分 (新架构)
    this.createModelSettings();

    // 模板设置部分
    this.createTemplateSettings();
  }

  private createBasicSettings(): void {
    const { containerEl } = this;
    
    containerEl.createEl('h2', { text: t('settings.language') });

    new Setting(containerEl)
      .setName(t('settings.language'))
      .setDesc(t('settings.language.desc'))
      .addDropdown(dropdown => {
        dropdown
          .addOption('auto', t('settings.language.auto'))
          .addOption('zh-cn', t('settings.language.zh'))
          .addOption('en', t('settings.language.en'))
          .setValue(this.plugin.settings.autoDetectLanguage ? 'auto' : this.plugin.settings.language)
          .onChange(async (value: string) => {
            if (value === 'auto') {
              await this.plugin.updateSettings({
                autoDetectLanguage: true,
                language: 'zh-cn' // 默认值
              });
            } else {
              await this.plugin.updateSettings({
                autoDetectLanguage: false,
                language: value as Language
              });
            }
          });
      });

    // 快速模式：插入后自动关闭面板
    new Setting(containerEl)
      .setName(t('settings.quickmode'))
      .setDesc(t('settings.quickmode.desc'))
      .addToggle(toggle => {
        toggle
          .setValue(!!(this.plugin.settings as any).quickMode)
          .onChange(async (value) => {
            await this.plugin.updateSettings({ quickMode: value } as any);
          });
      });
  }

  private createTriggerSettings(): void {
    const { containerEl } = this;
    
    containerEl.createEl('h2', { text: t('trigger.keywords') });
    containerEl.createEl('p', { 
      text: t('help.trigger'),
      cls: 'setting-item-description'
    });

    const keywordsContainer = containerEl.createEl('div', { cls: 'keywords-container' });
    
    // 显示当前关键词
    this.updateKeywordsList(keywordsContainer);

    // 添加新关键词
    new Setting(containerEl)
      .setName(t('trigger.add'))
      .addText(text => {
        text.setPlaceholder('@ai');
        
        const addButton = text.inputEl.parentElement?.createEl('button', {
          text: t('trigger.add'),
          cls: 'mod-cta'
        });
        
        addButton?.addEventListener('click', () => {
          const keyword = text.getValue().trim();
          if (keyword) {
            const validation = this.plugin.getTriggerManager().validateKeyword(keyword);
            if (validation.valid) {
              const currentKeywords = [...this.plugin.settings.triggerKeywords];
              if (!currentKeywords.includes(keyword)) {
                currentKeywords.push(keyword);
                this.plugin.updateSettings({ triggerKeywords: currentKeywords });
                text.setValue('');
                this.updateKeywordsList(keywordsContainer);
              }
            } else {
              // TODO: 显示错误信息
              console.error('Invalid keyword:', validation.error);
            }
          }
        });

        // 回车键添加
        text.inputEl.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            addButton?.click();
          }
        });
      });
  }

  private updateKeywordsList(container: HTMLElement): void {
    container.empty();
    
    for (const keyword of this.plugin.settings.triggerKeywords) {
      const keywordEl = container.createEl('div', { cls: 'keyword-item' });
      keywordEl.createEl('span', { text: keyword, cls: 'keyword-text' });
      
      const removeBtn = keywordEl.createEl('button', {
        text: t('trigger.remove'),
        cls: 'keyword-remove'
      });
      
      removeBtn.addEventListener('click', () => {
        const currentKeywords = this.plugin.settings.triggerKeywords.filter(k => k !== keyword);
        this.plugin.updateSettings({ triggerKeywords: currentKeywords });
        this.updateKeywordsList(container);
      });
    }
  }

  // 已隐藏传统提供商设置，所有配置已整合到模型管理中
  // private createProviderSettings(): void {
  //   const { containerEl } = this;
    
  //   // 添加折叠区域标识
  //   const providerSection = containerEl.createEl('details', { cls: 'legacy-providers-section' });
  //   const summary = providerSection.createEl('summary');
  //   summary.createEl('h2', { text: t('settings.providers') + ' (传统配置)' });
    
  //   const sectionContainer = providerSection.createEl('div');
    
  //   sectionContainer.createEl('p', { 
  //     text: '传统提供商配置方式。建议使用上方的"AI模型管理"功能。',
  //     cls: 'setting-item-description'
  //   });

  //   const stats = this.plugin.getAIProviderManager().getStats();
  //   sectionContainer.createEl('p', {
  //     text: `Total: ${stats.total}, Enabled: ${stats.enabled}, Configured: ${stats.configured}`,
  //     cls: 'provider-stats'
  //   });

  //   // 提供商列表
  //   this.providersContainer = sectionContainer.createEl('div', { cls: 'providers-container' });
  //   this.updateProvidersList(this.providersContainer);
  // }

  // 已隐藏传统提供商方法，所有配置已整合到模型管理中
  // private updateProvidersList(container: HTMLElement): void {
  //   container.empty();

  //   for (const provider of this.plugin.settings.providers) {
  //     const providerEl = container.createEl('div', { cls: 'provider-item' });
      
  //     // 提供商标题
  //     const headerEl = providerEl.createEl('div', { cls: 'provider-header' });
      
  //     const titleEl = headerEl.createEl('h3', { text: provider.displayName });
      
  //     const toggleEl = headerEl.createEl('input', { type: 'checkbox' });
  //     toggleEl.checked = provider.enabled;
  //     toggleEl.addEventListener('change', () => {
  //       this.updateProviderEnabled(provider.id, toggleEl.checked);
  //     });

  //     // 提供商详细设置
  //     const detailsEl = providerEl.createEl('div', { 
  //       cls: `provider-details ${provider.enabled ? 'expanded' : 'collapsed'}` 
  //     });

  //     this.createProviderDetails(detailsEl, provider);
  //   }
  // }

  // 已隐藏传统提供商详细配置方法，所有配置已整合到模型管理中
  // private createProviderDetails(container: HTMLElement, provider: AIProviderConfig): void {
  //   // API Key
  //   new Setting(container)
  //     .setName(t('settings.provider.apikey'))
  //     .addText(text => {
  //       text.setPlaceholder('sk-...')
  //         .setValue(provider.apiKey)
  //         .onChange(async (value) => {
  //           await this.updateProvider(provider.id, { apiKey: value });
  //         });
        
  //       // 隐藏API Key显示
  //       text.inputEl.type = 'password';
  //     });

  //   // Base URL
  //   new Setting(container)
  //     .setName(t('settings.provider.baseurl'))
  //     .addText(text => {
  //       text.setPlaceholder('https://api.example.com')
  //         .setValue(provider.baseUrl)
  //         .onChange(async (value) => {
  //           await this.updateProvider(provider.id, { baseUrl: value });
  //         });
  //     });

  //   // 默认模型
  //   new Setting(container)
  //     .setName(t('settings.provider.model'))
  //     .setDesc(provider.models.length > 0 ? 
  //       `常用模型: ${provider.models.map(m => m.id).join(', ')}` : 
  //       '请输入您的模型名称')
  //     .addText(text => {
  //       text.setPlaceholder(provider.models[0]?.id || 'gpt-4o')
  //         .setValue(provider.defaultModel || provider.models[0]?.id || '')
  //         .onChange(async (value) => {
  //           await this.updateProvider(provider.id, { defaultModel: value });
  //         });
  //     });

  //   // 测试连接按钮
  //   new Setting(container)
  //     .setName(t('settings.provider.test'))
  //     .addButton(button => {
  //       button
  //         .setButtonText(t('ui.test'))
  //         .setCta()
  //         .onClick(async () => {
  //           button.setButtonText(t('ui.loading'));
  //           button.setDisabled(true);
            
  //           try {
  //             const result = await this.plugin.getAIProviderManager().testProvider(provider.id);
  //             button.setButtonText(result ? t('msg.connection.success') : t('msg.connection.failed'));
  //             setTimeout(() => {
  //               button.setButtonText(t('ui.test'));
  //               button.setDisabled(false);
  //             }, 2000);
  //           } catch (error) {
  //             button.setButtonText(t('msg.connection.failed'));
  //             setTimeout(() => {
  //               button.setButtonText(t('ui.test'));
  //               button.setDisabled(false);
  //             }, 2000);
  //           }
  //         });
  //     });
  // }

  // 已隐藏传统提供商启用/禁用方法，所有配置已整合到模型管理中
  // private async updateProviderEnabled(providerId: string, enabled: boolean): Promise<void> {
  //   const providers = [...this.plugin.settings.providers];
  //   const providerIndex = providers.findIndex(p => p.id === providerId);
    
  //   if (providerIndex !== -1) {
  //     providers[providerIndex] = { ...providers[providerIndex], enabled };
  //     await this.plugin.updateSettings({ providers });
      
  //     // 重新渲染提供商列表以显示/隐藏详细配置
  //     if (this.providersContainer) {
  //       this.updateProvidersList(this.providersContainer);
  //     }
  //   }
  // }

  // 已隐藏传统提供商更新方法，所有配置已整合到模型管理中
  // private async updateProvider(providerId: string, updates: Partial<AIProviderConfig>): Promise<void> {
  //   const providers = [...this.plugin.settings.providers];
  //   const providerIndex = providers.findIndex(p => p.id === providerId);
    
  //   if (providerIndex !== -1) {
  //     providers[providerIndex] = { ...providers[providerIndex], ...updates };
  //     await this.plugin.updateSettings({ providers });
  //   }
  // }

  private createModelSettings(): void {
    const { containerEl } = this;
    
    containerEl.createEl('h2', { text: 'AI 模型管理' });
    containerEl.createEl('p', { 
      text: '管理您的AI模型配置。您可以添加多个来自不同提供商的模型，并选择当前使用的模型。',
      cls: 'setting-item-description'
    });

    // 获取扩展设置
    const extendedSettings = this.plugin.settings as ExtendedPluginSettings;
    const models = extendedSettings.models || [];
    const activeModel = models.find(m => m.isActive);
    
    console.log('Current models in settings:', models);
    console.log('Active model:', activeModel);
    
    // 当前活跃模型显示
    if (activeModel) {
      const currentModelEl = containerEl.createEl('div', { cls: 'current-model-info' });
      currentModelEl.createEl('strong', { text: '当前模型: ' });
      currentModelEl.createSpan({ text: `${activeModel.name} (${activeModel.providerName})` });
    } else {
      containerEl.createEl('div', { 
        text: '未选择模型，请先添加并选择一个模型',
        cls: 'setting-item-description'
      });
    }

    // 模型统计
    containerEl.createEl('p', {
      text: `已配置模型: ${models.length} 个`,
      cls: 'model-stats'
    });
    
    // 交互式“已配置模型”列表（主页展示，不再隐藏）
    const modelListEl = containerEl.createEl('div', { cls: 'simple-model-list' });
    if (models.length === 0) {
      modelListEl.createEl('div', { text: '尚未添加模型', cls: 'inactive-model' });
    } else {
      models.forEach(model => {
        const row = modelListEl.createEl('div', { cls: 'simple-model-item' });
        const radio = row.createEl('input', { type: 'radio' });
        radio.name = 'active-model';
        radio.checked = !!model.isActive;
        radio.addEventListener('change', () => {
          const next = models.map(m => ({ ...m, isActive: m.id === model.id }));
          this.updateModelSettings(next, model.id);
        });
        row.createSpan({ text: ` ${model.modelId} (${model.providerName})`, cls: model.isActive ? 'active-model' : 'inactive-model' });
        // 删除按钮
        const del = row.createEl('button', { text: '删除', cls: 'keyword-remove' });
        del.addEventListener('click', () => {
          const next = models.filter(m => m.id !== model.id);
          const activeId = next.find(m => m.isActive)?.id || next[0]?.id || null;
          this.updateModelSettings(next.map(m => ({ ...m, isActive: m.id === activeId })), activeId);
        });
      });
    }

    // 模型管理按钮
    new Setting(containerEl)
      .setName('模型管理')
      .setDesc('添加、编辑或删除AI模型配置（添加后自动保存）')
      .addButton(button => {
        button
          .setButtonText('打开模型管理器')
          .setCta()
          .onClick(() => {
            new ModelManagerModal(
              this.app,
              this.plugin,
              models,
              extendedSettings.activeModelId ?? null,
              (updatedModels: AIModelConfig[], activeId: string | null) => {
                this.updateModelSettings(updatedModels, activeId);
              }
            ).open();
          });
      });
  }

  private async updateModelSettings(models: AIModelConfig[], activeId: string | null): Promise<void> {
    const extendedSettings = this.plugin.settings as ExtendedPluginSettings;
    
    // 更新所有模型的isActive状态
    models.forEach(model => {
      model.isActive = model.id === activeId;
    });
    
    await this.plugin.updateSettings({ 
      ...extendedSettings,
      models, 
      activeModelId: activeId ?? undefined 
    });
    
    // 重新渲染设置页面以更新显示
    this.display();
  }

  private createTemplateSettings(): void {
    const { containerEl } = this;
    
    containerEl.createEl('h2', { text: t('settings.templates') });
    containerEl.createEl('p', { 
      text: t('help.template'),
      cls: 'setting-item-description'
    });

    // 模板文件夹设置
    new Setting(containerEl)
      .setName(t('settings.template.folder'))
      .setDesc(t('settings.template.folder.desc'))
      .addText(text => {
        text.setPlaceholder('_ai/prompts')
          .setValue(this.plugin.settings.templateFolder)
          .onChange(async (value) => {
            const normalized = (value || '_ai/prompts').replace(/^\/+/, '').replace(/\/+$/, '');
            await this.plugin.updateSettings({ templateFolder: normalized });
          });
      });

    // 重新加载模板按钮
    new Setting(containerEl)
      .setName(t('settings.template.reload'))
      .addButton(button => {
        button
          .setButtonText(t('settings.template.reload'))
          .setCta()
          .onClick(async () => {
            button.setButtonText(t('ui.loading'));
            button.setDisabled(true);
            
            try {
              await this.plugin.getTemplateLoader().reload();
              button.setButtonText(t('msg.success'));
              setTimeout(() => {
                button.setButtonText(t('settings.template.reload'));
                button.setDisabled(false);
              }, 1000);
            } catch (error) {
              button.setButtonText(t('msg.error'));
              setTimeout(() => {
                button.setButtonText(t('settings.template.reload'));
                button.setDisabled(false);
              }, 2000);
            }
          });
      });

    // 模板统计信息
    const stats = this.plugin.getTemplateLoader().getStats();
    containerEl.createEl('p', {
      text: `Templates: ${stats.total} (Built-in: ${stats.builtin}, User: ${stats.user}), Categories: ${stats.categories}`,
      cls: 'template-stats'
    });
  }
}
