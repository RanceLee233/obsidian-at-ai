import { AIProvider, AIProviderFactory } from './AIProvider';
import { AIProviderConfig, AIRequest, AIResponse, AIModelConfig } from '../types';

export class AIProviderManager {
  private providers = new Map<string, AIProvider>();
  private configs = new Map<string, AIProviderConfig>();

  /**
   * 更新提供商配置
   */
  updateProviders(configs: AIProviderConfig[]): void {
    // 清除现有提供商
    this.providers.clear();
    this.configs.clear();

    // 添加新的提供商配置
    for (const config of configs) {
      this.configs.set(config.id, config);
      
      // 只为启用且有API密钥的提供商创建实例
      if (config.enabled && config.apiKey.trim()) {
        try {
          const provider = AIProviderFactory.createProvider(
            config.id,
            config.apiKey,
            config.baseUrl
          );
          this.providers.set(config.id, provider);
        } catch (error) {
          console.error(`Failed to create provider ${config.id}:`, error);
        }
      }
    }
  }

  /**
   * 获取可用的提供商
   */
  getAvailableProviders(): AIProviderConfig[] {
    return Array.from(this.configs.values()).filter(config => 
      config.enabled && config.apiKey.trim() && this.providers.has(config.id)
    );
  }

  /**
   * 获取提供商配置
   */
  getProviderConfig(id: string): AIProviderConfig | undefined {
    return this.configs.get(id);
  }

  /**
   * 获取提供商实例
   */
  getProvider(id: string): AIProvider | undefined {
    return this.providers.get(id);
  }

  /**
   * 发送AI请求
   */
  async sendRequest(providerId: string, request: AIRequest): Promise<AIResponse> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found or not enabled`);
    }

    const config = this.configs.get(providerId);
    if (!config) {
      throw new Error(`Provider config ${providerId} not found`);
    }

    // 应用默认参数
    const finalRequest: AIRequest = {
      ...request,
      temperature: request.temperature ?? config.temperature,
      maxTokens: request.maxTokens ?? config.maxTokens
    };

    // 确保使用正确的模型
    if (!finalRequest.model) {
      finalRequest.model = config.defaultModel || config.models[0]?.id || 'gpt-3.5-turbo';
    }

    return await provider.sendRequest(finalRequest);
  }

  /**
   * 使用模型级配置发送请求（绕过全局提供商配置）
   */
  async sendRequestWithModel(model: AIModelConfig, request: AIRequest): Promise<AIResponse> {
    if (!model.apiKey || !model.baseUrl) {
      throw new Error('Model missing apiKey or baseUrl');
    }
    // 临时创建 provider 实例
    const provider = AIProviderFactory.createProvider(model.provider, model.apiKey, model.baseUrl);
    const finalRequest: AIRequest = {
      ...request,
      model: request.model || model.modelId
    };
    return await provider.sendRequest(finalRequest);
  }

  /**
   * 测试提供商连接
   */
  async testProvider(id: string): Promise<boolean> {
    const provider = this.providers.get(id);
    if (!provider) {
      return false;
    }

    try {
      return await provider.testConnection();
    } catch (error) {
      console.error(`Provider ${id} test failed:`, error);
      return false;
    }
  }

  /**
   * 获取提供商模型列表
   */
  async getProviderModels(id: string): Promise<string[]> {
    const provider = this.providers.get(id);
    if (!provider) {
      return [];
    }

    try {
      return await provider.getModels();
    } catch (error) {
      console.error(`Failed to get models for provider ${id}:`, error);
      // 返回配置中的默认模型
      const config = this.configs.get(id);
      return config?.models.map(m => m.id) || [];
    }
  }

  /**
   * 自动选择最佳提供商
   */
  getAutoProvider(): string | null {
    const availableProviders = this.getAvailableProviders();
    
    if (availableProviders.length === 0) {
      return null;
    }

    // 优先级排序：OpenAI > Claude > 其他
    const priorityOrder = ['openai', 'anthropic', 'openrouter', 'deepseek', 'kimi', 'glm'];
    
    for (const id of priorityOrder) {
      if (availableProviders.some(p => p.id === id)) {
        return id;
      }
    }

    // 如果没有找到优先级提供商，返回第一个可用的
    return availableProviders[0].id;
  }

  /**
   * 获取提供商统计信息
   */
  getStats(): {
    total: number;
    enabled: number;
    configured: number;
  } {
    const total = this.configs.size;
    const enabled = Array.from(this.configs.values()).filter(c => c.enabled).length;
    const configured = Array.from(this.configs.values()).filter(c => c.enabled && c.apiKey.trim()).length;

    return { total, enabled, configured };
  }

  /**
   * 验证提供商配置
   */
  validateConfig(config: AIProviderConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.name.trim()) {
      errors.push('Provider name is required');
    }

    if (!config.baseUrl.trim()) {
      errors.push('Base URL is required');
    } else {
      try {
        new URL(config.baseUrl);
      } catch {
        errors.push('Invalid base URL format');
      }
    }

    if (config.enabled && !config.apiKey.trim()) {
      errors.push('API key is required for enabled providers');
    }

    if (config.models.length === 0) {
      errors.push('At least one model must be configured');
    }

    if (config.temperature !== undefined && (config.temperature < 0 || config.temperature > 2)) {
      errors.push('Temperature must be between 0 and 2');
    }

    if (config.maxTokens !== undefined && (config.maxTokens < 1 || config.maxTokens > 100000)) {
      errors.push('Max tokens must be between 1 and 100000');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
