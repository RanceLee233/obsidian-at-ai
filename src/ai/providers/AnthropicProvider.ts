import { BaseAIProvider } from '../AIProvider';
import { AIRequest, AIResponse } from '../../types';

export class AnthropicProvider extends BaseAIProvider {
  id = 'anthropic';
  name = 'Anthropic';

  async sendRequest(request: AIRequest): Promise<AIResponse> {
    try {
      // Anthropic API需要将system消息单独处理
      const systemMessage = request.messages.find(m => m.role === 'system');
      const userMessages = request.messages.filter(m => m.role !== 'system');

      const body: any = {
        model: request.model,
        messages: userMessages,
        max_tokens: request.maxTokens || 2000,
        temperature: request.temperature || 0.7
      };

      if (systemMessage) {
        body.system = systemMessage.content;
      }

      const response = await this.makeRequest('v1/messages', 'POST', body, {
        'Authorization': `Bearer ${this.apiKey}`,
        'anthropic-version': '2023-06-01'
      });

      const data = await response.json();
      
      if (!data.content || data.content.length === 0) {
        throw new Error('No response from Anthropic API');
      }

      const content = data.content[0]?.text || '';
      const usage = data.usage ? {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: (data.usage.input_tokens || 0) + (data.usage.output_tokens || 0)
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
      // Anthropic没有models端点，我们发送一个最小请求来测试
      const testBody = {
        model: 'claude-3-haiku-20240307',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 1
      };

      await this.makeRequest('v1/messages', 'POST', testBody, {
        'Authorization': `Bearer ${this.apiKey}`,
        'anthropic-version': '2023-06-01'
      });

      return true;
    } catch (error) {
      console.error('Anthropic connection test failed:', error);
      return false;
    }
  }

  async getModels(): Promise<string[]> {
    // Anthropic API没有公开的models端点，返回已知的模型
    return [
      'claude-3-5-sonnet-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307'
    ];
  }
}