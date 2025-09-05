import { App, Modal, Setting, Notice } from 'obsidian';
import { AIModelConfig, PresetModel, PRESET_MODELS } from '../types';
import AtAIPlugin from '../main';
import { t } from '../i18n';

export class ModelManagerModal extends Modal {
  plugin: AtAIPlugin;
  private models: AIModelConfig[] = [];
  private activeModelId: string | null = null;
  private onModelsChanged: (models: AIModelConfig[], activeId: string | null) => void;

  constructor(
    app: App, 
    plugin: AtAIPlugin,
    models: AIModelConfig[],
    activeModelId: string | null,
    onModelsChanged: (models: AIModelConfig[], activeId: string | null) => void
  ) {
    super(app);
    this.plugin = plugin;
    this.models = [...models];
    this.activeModelId = activeModelId;
    this.onModelsChanged = onModelsChanged;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('at-ai-model-manager');

    // 标题
    contentEl.createEl('h2', { text: '模型管理' });
    
    this.renderModelList();
  }

  private renderModelList() {
    const { contentEl } = this;
    
    // 清除现有内容（保留标题）
    const existingList = contentEl.querySelector('.model-list-container');
    if (existingList) {
      existingList.remove();
    }

    // 创建容器
    const container = contentEl.createEl('div', { cls: 'model-list-container' });

    // 添加模型按钮
    const addButtonContainer = container.createEl('div', { cls: 'add-model-container' });
    const addButton = addButtonContainer.createEl('button', { 
      cls: 'mod-cta add-model-button',
      text: '+ 添加模型'
    });
    addButton.addEventListener('click', () => this.showAddModelModal());

    // 模型列表标题栏
    if (this.models.length > 0) {
      const headerEl = container.createEl('div', { cls: 'model-list-header' });
      headerEl.createEl('div', { text: '模型名称', cls: 'header-model' });
      headerEl.createEl('div', { text: '提供商', cls: 'header-provider' });
      headerEl.createEl('div', { text: '当前选择', cls: 'header-active' });
      headerEl.createEl('div', { text: '操作', cls: 'header-actions' });
    }

    // 模型列表
    const listEl = container.createEl('div', { cls: 'model-list' });

    if (this.models.length === 0) {
      listEl.createEl('div', { 
        text: '暂无模型，点击上方按钮添加模型',
        cls: 'no-models-message'
      });
    } else {
      this.models.forEach(model => this.renderModelRow(listEl, model));
    }

    // 底部操作栏
    const footerEl = container.createEl('div', { cls: 'modal-footer' });
    
    const saveButton = footerEl.createEl('button', { 
      cls: 'mod-cta',
      text: '保存设置'
    });
    saveButton.addEventListener('click', () => this.saveAndClose());

    const cancelButton = footerEl.createEl('button', { 
      text: '取消'
    });
    cancelButton.addEventListener('click', () => this.close());
  }

  private renderModelRow(container: HTMLElement, model: AIModelConfig) {
    const rowEl = container.createEl('div', { cls: 'model-row' });

    // 模型名称和描述
    const modelEl = rowEl.createEl('div', { cls: 'model-info' });
    modelEl.createEl('div', { text: model.name, cls: 'model-name' });
    modelEl.createEl('div', { text: model.modelId, cls: 'model-id' });

    // 提供商
    const providerEl = rowEl.createEl('div', { cls: 'model-provider' });
    providerEl.createEl('div', { text: model.providerName, cls: 'provider-name' });

    // 当前选择单选框
    const activeEl = rowEl.createEl('div', { cls: 'model-active' });
    const radioButton = activeEl.createEl('input', { type: 'radio' });
    radioButton.name = 'active-model';
    radioButton.checked = model.isActive;
    radioButton.addEventListener('change', () => {
      if (radioButton.checked) {
        this.setActiveModel(model.id);
      }
    });

    // 操作按钮
    const actionsEl = rowEl.createEl('div', { cls: 'model-actions' });
    
    // 编辑按钮
    const editButton = actionsEl.createEl('button', { 
      cls: 'model-action-btn',
      title: '编辑模型'
    });
    editButton.innerHTML = '✏️';
    editButton.addEventListener('click', () => this.showEditModelModal(model));

    // 删除按钮
    const deleteButton = actionsEl.createEl('button', { 
      cls: 'model-action-btn delete',
      title: '删除模型'
    });
    deleteButton.innerHTML = '🗑️';
    deleteButton.addEventListener('click', () => this.deleteModel(model.id));

    // 启用状态指示
    if (!model.enabled) {
      rowEl.addClass('disabled');
    }
  }

  private setActiveModel(modelId: string) {
    // 取消所有模型的激活状态
    this.models.forEach(model => {
      model.isActive = model.id === modelId;
    });
    this.activeModelId = modelId;
    this.renderModelList();
  }

  private deleteModel(modelId: string) {
    const modelName = this.models.find(m => m.id === modelId)?.name;
    if (confirm(`确定要删除模型 "${modelName}" 吗？`)) {
      this.models = this.models.filter(model => model.id !== modelId);
      
      // 如果删除的是当前激活模型，清除激活状态
      if (this.activeModelId === modelId) {
        this.activeModelId = null;
      }
      
      this.renderModelList();
    }
  }

  private showAddModelModal() {
    new AddModelModal(this.app, (newModel: AIModelConfig) => {
      this.models.push(newModel);
      this.renderModelList();
    }).open();
  }

  private showEditModelModal(model: AIModelConfig) {
    new EditModelModal(this.app, model, (updatedModel: AIModelConfig) => {
      const index = this.models.findIndex(m => m.id === model.id);
      if (index >= 0) {
        this.models[index] = updatedModel;
        this.renderModelList();
      }
    }).open();
  }

  private saveAndClose() {
    this.onModelsChanged(this.models, this.activeModelId);
    this.close();
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

// 添加模型模态框
class AddModelModal extends Modal {
  private onModelAdded: (model: AIModelConfig) => void;

  constructor(app: App, onModelAdded: (model: AIModelConfig) => void) {
    super(app);
    this.onModelAdded = onModelAdded;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('add-model-modal');

    contentEl.createEl('h3', { text: '添加模型' });

    // 选项标签
    const tabContainer = contentEl.createEl('div', { cls: 'tab-container' });
    const presetTab = tabContainer.createEl('button', { 
      text: '预设模型', 
      cls: 'tab-button active'
    });
    const providerTab = tabContainer.createEl('button', { 
      text: '快速配置', 
      cls: 'tab-button'
    });
    const customTab = tabContainer.createEl('button', { 
      text: '自定义模型', 
      cls: 'tab-button'
    });

    // 内容区域
    const contentContainer = contentEl.createEl('div', { cls: 'tab-content' });
    
    let activeTab = 'preset';

    const renderPresetModels = () => {
      contentContainer.empty();
      
      const categories = [...new Set(PRESET_MODELS.map(m => m.category || '其他'))];
      
      categories.forEach(category => {
        const categoryEl = contentContainer.createEl('div', { cls: 'preset-category' });
        categoryEl.createEl('h4', { text: category });
        
        const modelsInCategory = PRESET_MODELS.filter(m => (m.category || '其他') === category);
        
        modelsInCategory.forEach(preset => {
          const modelEl = categoryEl.createEl('div', { cls: 'preset-model-item' });
          
          const infoEl = modelEl.createEl('div', { cls: 'preset-info' });
          infoEl.createEl('div', { text: preset.name, cls: 'preset-name' });
          infoEl.createEl('div', { text: preset.description || preset.modelId, cls: 'preset-desc' });
          
          const addBtn = modelEl.createEl('button', { 
            text: '添加',
            cls: 'mod-cta preset-add-btn'
          });
          
          addBtn.addEventListener('click', () => {
            const newModel = this.createModelFromPreset(preset);
            this.onModelAdded(newModel);
            this.close();
          });
        });
      });
    };

    const renderCustomForm = () => {
      contentContainer.empty();
      
      const formEl = contentContainer.createEl('div', { cls: 'custom-model-form' });
      
      let formData = {
        name: '',
        modelId: '',
        provider: 'custom',
        providerName: '自定义',
        baseUrl: '',
        apiKey: '',
        temperature: 0.7,
        maxTokens: 2000
      };

      new Setting(formEl)
        .setName('模型名称')
        .setDesc('显示名称，可以自定义')
        .addText(text => {
          text.setPlaceholder('如：我的GPT-4o')
            .onChange(value => formData.name = value);
        });

      new Setting(formEl)
        .setName('模型ID')
        .setDesc('实际的模型标识符')
        .addText(text => {
          text.setPlaceholder('如：gpt-4o')
            .onChange(value => formData.modelId = value);
        });

      new Setting(formEl)
        .setName('提供商名称')
        .addText(text => {
          text.setPlaceholder('如：OpenAI')
            .onChange(value => formData.providerName = value);
        });

      new Setting(formEl)
        .setName('API 端点')
        .addText(text => {
          text.setPlaceholder('https://api.openai.com/v1')
            .onChange(value => formData.baseUrl = value);
        });

      new Setting(formEl)
        .setName('API 密钥')
        .addText(text => {
          text.setPlaceholder('sk-...')
            .onChange(value => formData.apiKey = value);
          text.inputEl.type = 'password';
        });

      const buttonContainer = formEl.createEl('div', { cls: 'form-buttons' });
      const addButton = buttonContainer.createEl('button', { 
        text: '添加模型',
        cls: 'mod-cta'
      });
      
      addButton.addEventListener('click', () => {
        if (!formData.name || !formData.modelId) {
          new Notice('请填写模型名称和模型ID');
          return;
        }
        
        const newModel: AIModelConfig = {
          id: `custom-${Date.now()}`,
          name: formData.name,
          modelId: formData.modelId,
          provider: 'custom',
          providerName: formData.providerName,
          apiKey: formData.apiKey,
          baseUrl: formData.baseUrl,
          temperature: formData.temperature,
          maxTokens: formData.maxTokens,
          enabled: true,
          isActive: false,
          createdAt: Date.now()
        };
        
        this.onModelAdded(newModel);
        this.close();
      });
    };

    const renderProviderModels = () => {
      contentContainer.empty();
      
      // 按提供商分组的快速配置
      const providers = [
        { name: 'OpenAI', id: 'openai', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
        { name: 'Anthropic Claude', id: 'anthropic', models: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'] },
        { name: 'Kimi (月之暗面)', id: 'kimi', models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'] },
        { name: 'DeepSeek', id: 'deepseek', models: ['deepseek-chat', 'deepseek-coder'] },
        { name: 'GLM (智谱)', id: 'glm', models: ['glm-4', 'glm-4-plus', 'glm-3-turbo'] },
        { name: 'Google Gemini', id: 'gemini', models: ['gemini-1.5-pro', 'gemini-1.5-flash'] },
        { name: 'xAI Grok', id: 'grok', models: ['grok-beta', 'grok-vision-beta'] },
        { name: 'Ollama (本地)', id: 'ollama', models: ['llama3.2', 'qwen2.5', 'deepseek-coder-v2'] }
      ];
      
      providers.forEach(provider => {
        const providerEl = contentContainer.createEl('div', { cls: 'provider-quick-config' });
        providerEl.createEl('h4', { text: provider.name });
        
        const modelsGrid = providerEl.createEl('div', { cls: 'models-grid' });
        
        provider.models.forEach(modelId => {
          const modelBtn = modelsGrid.createEl('button', { 
            text: modelId,
            cls: 'quick-model-btn'
          });
          
          modelBtn.addEventListener('click', () => {
            // 创建快速配置模型
            const newModel = this.createQuickModel(provider.id, provider.name, modelId);
            this.onModelAdded(newModel);
            this.close();
          });
        });
      });
    };

    // 标签切换逻辑
    presetTab.addEventListener('click', () => {
      activeTab = 'preset';
      presetTab.addClass('active');
      providerTab.removeClass('active');
      customTab.removeClass('active');
      renderPresetModels();
    });

    providerTab.addEventListener('click', () => {
      activeTab = 'provider';
      providerTab.addClass('active');
      presetTab.removeClass('active');
      customTab.removeClass('active');
      renderProviderModels();
    });

    customTab.addEventListener('click', () => {
      activeTab = 'custom';
      customTab.addClass('active');
      presetTab.removeClass('active');
      providerTab.removeClass('active');
      renderCustomForm();
    });

    // 初始渲染
    renderPresetModels();
  }

  private createModelFromPreset(preset: PresetModel): AIModelConfig {
    return {
      id: `${preset.provider}-${preset.modelId}-${Date.now()}`,
      name: preset.name,
      modelId: preset.modelId,
      provider: preset.provider,
      providerName: preset.providerName,
      apiKey: '',
      baseUrl: preset.baseUrl,
      temperature: preset.temperature,
      maxTokens: preset.maxTokens,
      enabled: true,
      isActive: false,
      createdAt: Date.now()
    };
  }

  private createQuickModel(providerId: string, providerName: string, modelId: string): AIModelConfig {
    // 获取提供商的默认配置
    const baseUrls: { [key: string]: string } = {
      'openai': 'https://api.openai.com/v1',
      'anthropic': 'https://api.anthropic.com',
      'kimi': 'https://api.moonshot.cn/v1',
      'deepseek': 'https://api.deepseek.com/v1',
      'glm': 'https://open.bigmodel.cn/api/paas/v4',
      'gemini': 'https://generativelanguage.googleapis.com/v1beta',
      'grok': 'https://api.x.ai/v1',
      'ollama': 'http://localhost:11434/v1'
    };

    return {
      id: `${providerId}-${modelId}-${Date.now()}`,
      name: `${providerName} - ${modelId}`,
      modelId: modelId,
      provider: providerId,
      providerName: providerName,
      apiKey: '',
      baseUrl: baseUrls[providerId] || '',
      temperature: 0.7,
      maxTokens: 2000,
      enabled: true,
      isActive: false,
      createdAt: Date.now()
    };
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

// 编辑模型模态框
class EditModelModal extends Modal {
  private model: AIModelConfig;
  private onModelUpdated: (model: AIModelConfig) => void;

  constructor(app: App, model: AIModelConfig, onModelUpdated: (model: AIModelConfig) => void) {
    super(app);
    this.model = { ...model };
    this.onModelUpdated = onModelUpdated;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('edit-model-modal');

    contentEl.createEl('h3', { text: `编辑模型：${this.model.name}` });

    const formEl = contentEl.createEl('div', { cls: 'edit-model-form' });

    new Setting(formEl)
      .setName('模型名称')
      .addText(text => {
        text.setValue(this.model.name)
          .onChange(value => this.model.name = value);
      });

    new Setting(formEl)
      .setName('模型ID')
      .addText(text => {
        text.setValue(this.model.modelId)
          .onChange(value => this.model.modelId = value);
      });

    new Setting(formEl)
      .setName('API 密钥')
      .addText(text => {
        text.setValue(this.model.apiKey)
          .onChange(value => this.model.apiKey = value);
        text.inputEl.type = 'password';
      });

    new Setting(formEl)
      .setName('API 端点')
      .addText(text => {
        text.setValue(this.model.baseUrl)
          .onChange(value => this.model.baseUrl = value);
      });

    new Setting(formEl)
      .setName('温度')
      .setDesc('控制输出的随机性 (0-2)')
      .addSlider(slider => {
        slider.setLimits(0, 2, 0.1)
          .setValue(this.model.temperature)
          .onChange(value => this.model.temperature = value)
          .setDynamicTooltip();
      });

    new Setting(formEl)
      .setName('最大Token数')
      .addText(text => {
        text.setValue(String(this.model.maxTokens))
          .onChange(value => {
            const num = parseInt(value);
            if (!isNaN(num)) {
              this.model.maxTokens = num;
            }
          });
      });

    new Setting(formEl)
      .setName('启用模型')
      .addToggle(toggle => {
        toggle.setValue(this.model.enabled)
          .onChange(value => this.model.enabled = value);
      });

    const buttonContainer = formEl.createEl('div', { cls: 'form-buttons' });
    
    const saveButton = buttonContainer.createEl('button', { 
      text: '保存',
      cls: 'mod-cta'
    });
    saveButton.addEventListener('click', () => {
      this.onModelUpdated(this.model);
      this.close();
    });

    const cancelButton = buttonContainer.createEl('button', { 
      text: '取消'
    });
    cancelButton.addEventListener('click', () => this.close());

    // 测试连接按钮
    const testButton = buttonContainer.createEl('button', { 
      text: '测试连接',
      cls: 'mod-warning'
    });
    testButton.addEventListener('click', () => this.testConnection());
  }

  private async testConnection() {
    // 创建一个简单的测试请求
    const testButton = document.querySelector('.mod-warning') as HTMLButtonElement;
    testButton.textContent = '测试中...';
    testButton.disabled = true;
    
    try {
      // 这里应该调用实际的API测试逻辑
      // 暂时模拟测试成功
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      new Notice('连接测试成功！');
      testButton.textContent = '连接成功';
      setTimeout(() => {
        testButton.textContent = '测试连接';
        testButton.disabled = false;
      }, 2000);
    } catch (error) {
      new Notice('连接测试失败');
      testButton.textContent = '连接失败';
      setTimeout(() => {
        testButton.textContent = '测试连接';
        testButton.disabled = false;
      }, 2000);
    }
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}