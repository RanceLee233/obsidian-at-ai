import { BaseAIProvider } from '../AIProvider';
import { AIRequest, AIResponse, OpenAIAPIType } from '../../types';

export class OpenAIProvider extends BaseAIProvider {
  id = 'openai';
  name = 'OpenAI';
  private apiType: OpenAIAPIType;

  constructor(apiKey: string, baseUrl: string, options?: { apiType?: OpenAIAPIType }) {
    super(apiKey, baseUrl, options);
    const requestedType = (options as any)?.apiType;
    this.apiType = requestedType === 'responses' ? 'responses' : 'chat_completions';
  }

  async sendRequest(request: AIRequest): Promise<AIResponse> {
    try {
      if (this.apiType === 'responses') {
        return await this.sendResponsesRequest(request);
      }
      return await this.sendChatCompletionsRequest(request);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  private async sendChatCompletionsRequest(request: AIRequest): Promise<AIResponse> {
    const body = {
      model: request.model,
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 2000,
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
  }

  private async sendResponsesRequest(request: AIRequest): Promise<AIResponse> {
    const body: any = {
      model: request.model,
      input: request.messages.map(message => ({
        role: message.role,
        content: [
          {
            type: message.role === 'assistant' ? 'output_text' : 'input_text',
            text: message.content
          }
        ]
      })),
      stream: true
    };

    if (request.temperature !== undefined) {
      body.temperature = request.temperature;
    }
    if (request.maxTokens !== undefined) {
      body.max_output_tokens = request.maxTokens;
    }

    const response = await this.makeRequest('responses', 'POST', body, {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('text/event-stream')) {
      const streamText = await response.text();
      const { content: streamContent, usage: streamUsage } = this.parseResponsesStream(streamText);

      if (!streamContent) {
        throw new Error('No response from OpenAI Responses API');
      }

      const usage = streamUsage ? {
        promptTokens: streamUsage.input_tokens ?? streamUsage.prompt_tokens,
        completionTokens: streamUsage.output_tokens ?? streamUsage.completion_tokens,
        totalTokens: streamUsage.total_tokens
      } : undefined;

      return {
        content: streamContent,
        usage
      };
    }

    let data: any;
    try {
      data = await response.json();
    } catch (error: any) {
      const fallbackText = await response.text();
      data = this.safeJSONParse(fallbackText) ?? { raw: fallbackText };
    }

    if (data?.error?.message || data?.message) {
      throw new Error(data.error?.message || data.message);
    }

    const content = this.extractResponsesContent(data);
    if (!content) {
      throw new Error('No response from OpenAI Responses API');
    }

    const usageSource = data?.response?.usage || data?.usage;
    const usage = usageSource ? {
      promptTokens: usageSource.input_tokens ?? usageSource.prompt_tokens,
      completionTokens: usageSource.output_tokens ?? usageSource.completion_tokens,
      totalTokens: usageSource.total_tokens
    } : undefined;

    return {
      content,
      usage
    };
  }

  private safeJSONParse(text: string): any {
    try {
      return JSON.parse(text);
    } catch {
      return undefined;
    }
  }

  private parseResponsesStream(streamText: string): { content: string; usage?: any } {
    if (!streamText) {
      return { content: '' };
    }

    const blocks = streamText
      .split(/\n\n+/)
      .map(block => block.trim())
      .filter(block => block.length > 0);

    let output = '';
    const fallbackTexts: string[] = [];
    let usage: any;

    for (const block of blocks) {
      const lines = block.split('\n');
      let eventName = 'message';
      const dataLines: string[] = [];

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) {
          continue;
        }
        if (line.startsWith('event:')) {
          eventName = line.slice(6).trim();
        } else if (line.startsWith('data:')) {
          dataLines.push(line.slice(5).trim());
        }
      }

      if (dataLines.length === 0) {
        continue;
      }

      const payloadText = dataLines.join('\n');

      if (payloadText === '[DONE]') {
        break;
      }

      let payload: any;
      try {
        payload = JSON.parse(payloadText);
      } catch {
        continue;
      }

      if (eventName === 'response.error') {
        const message = payload?.error?.message || payload?.error || 'Responses stream error';
        throw new Error(message);
      }

      if (eventName === 'response.output_text.delta' || eventName === 'response.content_part.delta') {
        const deltaText = payload?.delta?.text ?? payload?.delta ?? payload?.text;
        if (typeof deltaText === 'string' && deltaText.length > 0) {
          output += deltaText;
        }
      }

      if (eventName === 'response.output_item.added' || eventName === 'response.output_item.done' || eventName === 'response.content_part.added') {
        const extracted = this.extractResponsesContent(payload?.item ?? payload?.content_part ?? payload);
        if (extracted) {
          fallbackTexts.push(extracted);
        }
      }

      if (!usage && payload?.response?.usage) {
        usage = payload.response.usage;
      }

      if (eventName === 'response.completed') {
        usage = payload?.response?.usage ?? usage;
        if (!output) {
          const extracted = this.extractResponsesContent(payload?.response ?? payload);
          if (extracted) {
            fallbackTexts.push(extracted);
          }
        }
        break;
      }
    }

    const primary = output.trim();
    const fallback = fallbackTexts
      .map(text => text.trim())
      .filter(text => text.length > 0);

    return {
      content: primary.length > 0 ? primary : (fallback.length > 0 ? fallback.join('\n') : ''),
      usage
    };
  }

  private extractResponsesContent(data: any): string {
    if (!data) {
      return '';
    }

    if (typeof data.output_text === 'string') {
      return data.output_text;
    }
    if (Array.isArray(data.output_text)) {
      return data.output_text.join('\n').trim();
    }

    if (Array.isArray(data.output)) {
      for (const item of data.output) {
        if (!item) continue;
        if (typeof item === 'string') {
          return item;
        }
        if (Array.isArray(item.content)) {
          const textParts = item.content
            .filter((part: any) => part?.text || part?.content)
            .map((part: any) => part.text || part.content || '')
            .filter((part: string) => part.trim().length > 0);
          if (textParts.length > 0) {
            return textParts.join('\n').trim();
          }
        }
        if (item?.content?.text) {
          return item.content.text;
        }
      }
    }

    if (data.result) {
      return String(data.result);
    }

    if (data.message?.content) {
      if (typeof data.message.content === 'string') {
        return data.message.content;
      }
      if (Array.isArray(data.message.content)) {
        return data.message.content.join('\n').trim();
      }
    }

    if (data.content) {
      if (typeof data.content === 'string') {
        return data.content;
      }
      if (Array.isArray(data.content)) {
        const textParts = data.content
          .map((part: any) => typeof part === 'string' ? part : (part?.text || part?.content || ''))
          .filter((part: string) => part.trim().length > 0);
        if (textParts.length > 0) {
          return textParts.join('\n').trim();
        }
      }
    }

    return '';
  }

  async testConnection(): Promise<boolean> {
    try {
      if (this.apiType === 'responses') {
        return await this.testResponsesEndpoint();
      }

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
      if (this.apiType === 'responses') {
        // Responses API通常不提供/models端点，返回空列表以避免报错
        return [];
      }

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

  private async testResponsesEndpoint(): Promise<boolean> {
    try {
      const body = {
        model: 'gpt-4o-mini',
        input: [{ role: 'user', content: 'ping' }],
        stream: false
      };
      const response = await this.makeRequest('responses', 'POST', body, {
        'Authorization': `Bearer ${this.apiKey}`
      });

      return response.ok;
    } catch (error) {
      console.error('Responses endpoint test failed:', error);
      return false;
    }
  }
}
