import { BaseAIProvider } from '../AIProvider';
import { AIRequest, AIResponse } from '../../types';

export class GLMProvider extends BaseAIProvider {
  id = 'glm';
  name = 'GLM';

  async sendRequest(request: AIRequest): Promise<AIResponse> {
    try {
      const body = {
        model: request.model,
        messages: request.messages,
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens || 2000,
        stream: false
      };

      const response = await this.makeRequest('chat/completions', 'POST', body, {
        'Authorization': `Bearer ${this.apiKey}`
      });

      const data = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from GLM API');
      }

      const content = data.choices[0].message?.content || '';
      const usage = data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens
      } : undefined;

      return {
        content,
        usage
      };
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      // GLM测试连接
      const testBody = {
        model: 'glm-3-turbo',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 1
      };

      await this.makeRequest('chat/completions', 'POST', testBody, {
        'Authorization': `Bearer ${this.apiKey}`
      });

      return true;
    } catch (error) {
      console.error('GLM connection test failed:', error);
      return false;
    }
  }

  async getModels(): Promise<string[]> {
    return [
      'glm-4',
      'glm-4-plus', 
      'glm-3-turbo'
    ];
  }
}