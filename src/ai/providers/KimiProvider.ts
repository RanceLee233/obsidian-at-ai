import { OpenAIProvider } from './OpenAIProvider';

export class KimiProvider extends OpenAIProvider {
  id = 'kimi';
  name = 'Kimi';

  async getModels(): Promise<string[]> {
    return [
      'moonshot-v1-8k',
      'moonshot-v1-32k',
      'moonshot-v1-128k'
    ];
  }
}