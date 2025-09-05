import { OpenAIProvider } from './OpenAIProvider';

export class OpenRouterProvider extends OpenAIProvider {
  id = 'openrouter';
  name = 'OpenRouter';

  protected async makeRequest(
    endpoint: string,
    method: 'GET' | 'POST' = 'POST',
    body?: any,
    headers: Record<string, string> = {}
  ): Promise<Response> {
    // OpenRouter使用OpenAI兼容格式，但需要特殊的headers
    const openRouterHeaders = {
      'Authorization': `Bearer ${this.apiKey}`,
      'HTTP-Referer': 'https://github.com/yourusername/obsidian-at-ai',
      'X-Title': '@AI Obsidian Plugin',
      ...headers
    };

    return super.makeRequest(endpoint, method, body, openRouterHeaders);
  }
}