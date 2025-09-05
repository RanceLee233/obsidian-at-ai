import { OpenAIProvider } from './OpenAIProvider';

export class DeepSeekProvider extends OpenAIProvider {
  id = 'deepseek';
  name = 'DeepSeek';

  async getModels(): Promise<string[]> {
    // DeepSeek的模型相对固定
    return ['deepseek-chat', 'deepseek-coder'];
  }
}