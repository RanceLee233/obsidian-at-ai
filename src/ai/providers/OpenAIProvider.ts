import { BaseAIProvider } from '../AIProvider';
import { AIRequest, AIResponse } from '../../types';

export class OpenAIProvider extends BaseAIProvider {
  id = 'openai';
  name = 'OpenAI';

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
        throw new Error('No response from OpenAI API');
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
      const response = await this.makeRequest('models', 'GET', undefined, {
        'Authorization': `Bearer ${this.apiKey}`
      });

      const data = await response.json();
      return Array.isArray(data.data) && data.data.length > 0;
    } catch (error) {
      console.error('OpenAI connection test failed:', error);
      return false;
    }
  }

  async getModels(): Promise<string[]> {
    try {
      const response = await this.makeRequest('models', 'GET', undefined, {
        'Authorization': `Bearer ${this.apiKey}`
      });

      const data = await response.json();
      
      if (Array.isArray(data.data)) {
        return data.data
          .filter((model: any) => model.id.includes('gpt'))
          .map((model: any) => model.id)
          .sort();
      }
      
      return [];
    } catch (error) {
      console.error('Failed to fetch OpenAI models:', error);
      return [];
    }
  }
}