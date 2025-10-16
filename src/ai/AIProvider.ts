import { requestUrl } from 'obsidian';
import { AIRequest, AIResponse } from '../types';

export interface AIProvider {
  id: string;
  name: string;
  
  /**
   * 发送AI请求
   */
  sendRequest(request: AIRequest): Promise<AIResponse>;
  
  /**
   * 测试连接
   */
  testConnection(): Promise<boolean>;
  
  /**
   * 获取支持的模型列表
   */
  getModels(): Promise<string[]>;
}

export abstract class BaseAIProvider implements AIProvider {
  abstract id: string;
  abstract name: string;
  
  protected apiKey: string;
  protected baseUrl: string;
  protected options: any;
  
  constructor(apiKey: string, baseUrl: string, options?: any) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.options = options || {};
  }

  abstract sendRequest(request: AIRequest): Promise<AIResponse>;
  
  abstract testConnection(): Promise<boolean>;
  
  abstract getModels(): Promise<string[]>;

  /**
   * 通用HTTP请求方法
   */
  protected async makeRequest(
    endpoint: string,
    method: 'GET' | 'POST' = 'POST',
    body?: any,
    headers: Record<string, string> = {}
  ): Promise<Response> {
    const url = `${this.baseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

    const normalizedHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers
    };

    const requestBody = body && method !== 'GET' ? JSON.stringify(body) : undefined;

    if (typeof requestUrl === 'function') {
      const obsidianResponse = await requestUrl({
        url,
        method,
        headers: normalizedHeaders,
        body: requestBody
      });

      const headers = new Headers(obsidianResponse.headers || {});
      const bodyInit = obsidianResponse.text !== undefined
        ? obsidianResponse.text
        : obsidianResponse.arrayBuffer;
      const response = new Response(bodyInit, {
        status: obsidianResponse.status,
        headers
      });

      if (!response.ok) {
        const errorText = await response.clone().text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      return response;
    }

    const fetchOptions: RequestInit = {
      method,
      headers: normalizedHeaders,
      body: requestBody
    };

    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return response;
  }

  /**
   * 处理常见错误
   */
  protected handleError(error: any): never {
    if (error.message?.includes('401') || error.message?.includes('403')) {
      throw new Error('API key authentication failed');
    } else if (error.message?.includes('429')) {
      throw new Error('API quota exceeded');
    } else if (error.message?.includes('timeout') || error.name === 'TimeoutError') {
      throw new Error('Request timeout');
    } else if (error.message?.includes('fetch')) {
      throw new Error('Network connection error');
    } else {
      throw new Error(error.message || 'Unknown error');
    }
  }

  /**
   * 估算token数量（简单估算）
   */
  protected estimateTokens(text: string): number {
    // 简单估算：中文字符按1.5个token，英文单词按1个token，标点符号按0.5个token
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
    const punctuation = (text.match(/[^\w\s\u4e00-\u9fa5]/g) || []).length;
    
    return Math.ceil(chineseChars * 1.5 + englishWords * 1 + punctuation * 0.5);
  }
}

/**
 * AI提供商工厂
 */
export class AIProviderFactory {
  /**
   * 创建AI提供商实例
   */
  static createProvider(
    id: string,
    apiKey: string,
    baseUrl: string,
    options?: any
  ): AIProvider {
    switch (id) {
      case 'openai':
        return new (require('./providers/OpenAIProvider').OpenAIProvider)(apiKey, baseUrl, options);
      case 'anthropic':
        return new (require('./providers/AnthropicProvider').AnthropicProvider)(apiKey, baseUrl, options);
      case 'openrouter':
        return new (require('./providers/OpenRouterProvider').OpenRouterProvider)(apiKey, baseUrl, options);
      case 'deepseek':
        return new (require('./providers/DeepSeekProvider').DeepSeekProvider)(apiKey, baseUrl, options);
      case 'kimi':
        return new (require('./providers/KimiProvider').KimiProvider)(apiKey, baseUrl, options);
      case 'glm':
        return new (require('./providers/GLMProvider').GLMProvider)(apiKey, baseUrl, options);
      default:
        // 自定义提供商，默认使用OpenAI兼容格式
        return new (require('./providers/OpenAIProvider').OpenAIProvider)(apiKey, baseUrl, options);
    }
  }
}
