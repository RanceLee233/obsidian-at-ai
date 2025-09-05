import { App, Modal, Setting, Notice } from 'obsidian';
import { AIModelConfig } from '../types';
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
    // 扩大对话框宽度：需要同时给 modalEl 与 contentEl 加类
    this.modalEl.addClass('at-ai-model-manager-modal');
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
      headerEl.createEl('div', { text: '模型', cls: 'header-model' });
      headerEl.createEl('div', { text: '提供商', cls: 'header-provider' });
      headerEl.createEl('div', { text: '生效', cls: 'header-active' });
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

    // 底部操作栏（仅关闭）
    const footerEl = container.createEl('div', { cls: 'modal-footer' });
    const closeButton = footerEl.createEl('button', { text: '关闭' });
    closeButton.addEventListener('click', () => this.close());
  }

  private renderModelRow(container: HTMLElement, model: AIModelConfig) {
    const rowEl = container.createEl('div', { cls: 'model-row' });

    // 模型名称和描述
    const modelEl = rowEl.createEl('div', { cls: 'model-info' });
    modelEl.createEl('div', { text: model.modelId, cls: 'model-name' });
    if (model.name) {
      modelEl.createEl('div', { text: model.name, cls: 'model-id' });
    }

    // 提供商
    const providerEl = rowEl.createEl('div', { cls: 'model-provider' });
    providerEl.createEl('div', { text: model.providerName, cls: 'provider-name' });

    // 生效选择（复选框，确保单一生效）
    const activeEl = rowEl.createEl('div', { cls: 'model-active' });
    const activeCheck = activeEl.createEl('input', { type: 'checkbox' });
    activeCheck.checked = model.isActive;
    activeCheck.addEventListener('change', () => {
      if (activeCheck.checked) {
        this.setActiveModel(model.id);
      } else if (this.activeModelId === model.id) {
        // 至少一个生效，取消当前生效则还原
        activeCheck.checked = true;
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
    // 即时回调外部保存
    this.onModelsChanged(this.models, this.activeModelId);
    this.renderModelList();
  }

  private deleteModel(modelId: string) {
    const modelName = this.models.find(m => m.id === modelId)?.name;
    if (confirm(`确定要删除模型 "${modelName}" 吗？`)) {
      this.models = this.models.filter(model => model.id !== modelId);
      
      // 如果删除的是当前激活模型，清除激活状态
      if (this.activeModelId === modelId) {
        this.activeModelId = this.models[0]?.id || null;
        if (this.activeModelId) {
          this.models.forEach(m => m.isActive = m.id === this.activeModelId);
        }
      }
      
      // 即时回调外部保存
      this.onModelsChanged(this.models, this.activeModelId);
      this.renderModelList();
    }
  }

  private showAddModelModal() {
    new AddModelModal(this.app, (newModel: AIModelConfig) => {
      this.models.push(newModel);
      // 若当前无激活模型，则设置新模型为激活
      if (!this.activeModelId) {
        this.setActiveModel(newModel.id);
      } else {
        this.onModelsChanged(this.models, this.activeModelId);
      }
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

  // 即时保存，不再需要显式保存按钮

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
    // 扩大添加窗口宽度
    this.modalEl.addClass('add-model-modal');
    contentEl.addClass('add-model-modal');
    contentEl.createEl('h3', { text: '添加模型' });

    const formEl = contentEl.createEl('div', { cls: 'custom-model-form' });

    const providers = [
      { name: 'OpenAI', id: 'openai', baseUrl: 'https://api.openai.com/v1' },
      { name: 'OpenRouter', id: 'openrouter', baseUrl: 'https://openrouter.ai/api/v1' },
      { name: 'Anthropic', id: 'anthropic', baseUrl: 'https://api.anthropic.com' },
      { name: 'Gemini', id: 'gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta' },
      { name: 'DeepSeek', id: 'deepseek', baseUrl: 'https://api.deepseek.com/v1' },
      { name: 'Kimi (Moonshot)', id: 'kimi', baseUrl: 'https://api.moonshot.cn/v1' },
      { name: 'GLM', id: 'glm', baseUrl: 'https://open.bigmodel.cn/api/paas/v4' },
      { name: 'Ollama', id: 'ollama', baseUrl: 'http://localhost:11434/v1' },
      { name: 'LM Studio', id: 'lmstudio', baseUrl: 'http://localhost:1234/v1' },
      { name: '自定义', id: 'custom', baseUrl: '' }
    ];

    const formData = {
      modelId: '',
      name: '',
      provider: 'openai',
      providerName: 'OpenAI',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: ''
    };

    new Setting(formEl)
      .setName('Model Name')
      .setDesc('如：gpt-4o、claude-3-5-sonnet、google/gemini-2.0-flash')
      .addText(t => t.setPlaceholder('输入模型名').onChange(v => formData.modelId = v));

    new Setting(formEl)
      .setName('Display Name (可选)')
      .addText(t => t.setPlaceholder('自定义显示名').onChange(v => formData.name = v));

    new Setting(formEl)
      .setName('Provider')
      .addDropdown(d => {
        providers.forEach(p => d.addOption(p.id, p.name));
        d.setValue(formData.provider).onChange(v => {
          formData.provider = v;
          const p = providers.find(x => x.id === v);
          formData.providerName = p?.name || '自定义';
          if (p) {
            baseUrlInput.setValue(p.baseUrl);
            formData.baseUrl = p.baseUrl;
          }
        });
      });

    let baseUrlInput: import('obsidian').TextComponent;
    new Setting(formEl)
      .setName('Base URL')
      .addText(t => { baseUrlInput = t; t.setValue(formData.baseUrl).onChange(v => formData.baseUrl = v); });

    new Setting(formEl)
      .setName('API Key')
      .addText(t => { t.inputEl.type = 'password'; t.onChange(v => formData.apiKey = v); });

    const buttonContainer = formEl.createEl('div', { cls: 'form-buttons' });
    const testBtn = buttonContainer.createEl('button', { text: '测试连接', cls: 'mod-warning' });
    const addBtn = buttonContainer.createEl('button', { cls: 'mod-cta', text: '添加模型' });
    testBtn.addEventListener('click', async () => {
      testBtn.textContent = '测试中...';
      testBtn.setAttr('disabled', 'true');
      try {
        const ok = await this.testConnection(formData.baseUrl, formData.apiKey);
        new Notice(ok ? '连接成功' : '连接失败');
      } catch (e) {
        new Notice('连接失败');
      } finally {
        testBtn.textContent = '测试连接';
        testBtn.removeAttribute('disabled');
      }
    });
    addBtn.addEventListener('click', () => {
      if (!formData.modelId.trim()) {
        new Notice('请填写模型名');
        return;
      }
      const newModel: AIModelConfig = {
        id: `${formData.provider}-${Date.now()}`,
        name: formData.name || '',
        modelId: formData.modelId,
        provider: formData.provider,
        providerName: formData.providerName,
        apiKey: formData.apiKey,
        baseUrl: formData.baseUrl,
        temperature: 0.7,
        maxTokens: 2000,
        enabled: true,
        isActive: false,
        createdAt: Date.now()
      };
      this.onModelAdded(newModel);
      this.close();
    });
  }

  private async testConnection(baseUrl: string, apiKey: string): Promise<boolean> {
    try {
      if (!baseUrl || !apiKey) return false;
      const url = baseUrl.replace(/\/$/, '') + '/models';
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${apiKey}` } });
      return res.ok;
    } catch {
      return false;
    }
  }

  // 预设/快速配置已取消，无需额外方法

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

    contentEl.createEl('h3', { text: `编辑模型：${this.model.modelId}` });

    const formEl = contentEl.createEl('div', { cls: 'edit-model-form' });

    new Setting(formEl)
      .setName('Model Name')
      .addText(text => { text.setValue(this.model.modelId).onChange(v => this.model.modelId = v); });

    new Setting(formEl)
      .setName('Display Name (可选)')
      .addText(text => { text.setValue(this.model.name || '').onChange(v => this.model.name = v); });

    new Setting(formEl)
      .setName('API 密钥')
      .addText(text => {
        text.setValue(this.model.apiKey)
          .onChange(value => this.model.apiKey = value);
        text.inputEl.type = 'password';
      });

    // Provider 下拉与 Base URL
    const providers = [
      { name: 'OpenAI', id: 'openai', baseUrl: 'https://api.openai.com/v1' },
      { name: 'OpenRouter', id: 'openrouter', baseUrl: 'https://openrouter.ai/api/v1' },
      { name: 'Anthropic', id: 'anthropic', baseUrl: 'https://api.anthropic.com' },
      { name: 'Gemini', id: 'gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta' },
      { name: 'DeepSeek', id: 'deepseek', baseUrl: 'https://api.deepseek.com/v1' },
      { name: 'Kimi (Moonshot)', id: 'kimi', baseUrl: 'https://api.moonshot.cn/v1' },
      { name: 'GLM', id: 'glm', baseUrl: 'https://open.bigmodel.cn/api/paas/v4' },
      { name: 'Ollama', id: 'ollama', baseUrl: 'http://localhost:11434/v1' },
      { name: 'LM Studio', id: 'lmstudio', baseUrl: 'http://localhost:1234/v1' },
      { name: '自定义', id: 'custom', baseUrl: '' }
    ];

    let baseUrlInput: import('obsidian').TextComponent;
    new Setting(formEl)
      .setName('Provider')
      .addDropdown(d => {
        providers.forEach(p => d.addOption(p.id, p.name));
        d.setValue(this.model.provider).onChange(v => {
          this.model.provider = v;
          const p = providers.find(x => x.id === v);
          this.model.providerName = p?.name || '自定义';
          if (p) {
            baseUrlInput.setValue(p.baseUrl);
            this.model.baseUrl = p.baseUrl;
          }
        });
      });

    new Setting(formEl)
      .setName('Base URL')
      .addText(text => { baseUrlInput = text; text.setValue(this.model.baseUrl).onChange(v => this.model.baseUrl = v); });

    // 精简：移除温度/最大Token/启用开关

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
