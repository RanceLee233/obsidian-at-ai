// 基础类型定义
export interface PluginSettings {
  // 触发词设置
  triggerKeywords: string[];
  
  // 语言设置
  language: 'zh-cn' | 'en';
  
  // AI提供商配置
  providers: AIProviderConfig[];
  defaultProvider: string;
  
  // 模板设置
  templateFolder: string;
  
  // 其他设置
  autoDetectLanguage: boolean;
  // 快速模式：插入后自动关闭面板
  quickMode?: boolean;
}

export type OpenAIAPIType = 'chat_completions' | 'responses';

export interface AIProviderConfig {
  id: string;
  name: string;
  displayName: string;
  baseUrl: string;
  apiKey: string;
  models: ModelConfig[];
  enabled: boolean;
  isBuiltIn: boolean;
  defaultModel?: string;
  temperature?: number;
  maxTokens?: number;
  apiType?: OpenAIAPIType;
}

export interface ModelConfig {
  id: string;
  name: string;
  displayName: string;
  maxTokens?: number;
}

export interface Template {
  id: string;
  title: string;
  description?: string;
  category: string;
  content: string;
  variables?: TemplateVariable[];
  featured?: boolean;
  tags?: string[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  sourcePath?: string;
}

export interface TemplateVariable {
  name: string;
  defaultValue?: string;
  description?: string;
}

export interface AIRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface ProcessContext {
  selectedText: string;
  fullText: string;
  cursorPosition: number;
  noteName: string;
  notePath: string;
  frontmatter: any;
}

// 内置AI提供商配置
export const BUILTIN_PROVIDERS: Omit<AIProviderConfig, 'apiKey' | 'enabled'>[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    displayName: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    isBuiltIn: true,
    apiType: 'chat_completions',
    models: [
      { id: 'gpt-4o', name: 'gpt-4o', displayName: 'GPT-4o' },
      { id: 'gpt-4o-mini', name: 'gpt-4o-mini', displayName: 'GPT-4o Mini' },
      { id: 'gpt-4-turbo', name: 'gpt-4-turbo', displayName: 'GPT-4 Turbo' },
      { id: 'gpt-3.5-turbo', name: 'gpt-3.5-turbo', displayName: 'GPT-3.5 Turbo' }
    ],
    defaultModel: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 2000
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    displayName: 'Anthropic Claude',
    baseUrl: 'https://api.anthropic.com',
    isBuiltIn: true,
    apiType: 'chat_completions',
    models: [
      { id: 'claude-3-5-sonnet-20241022', name: 'claude-3-5-sonnet-20241022', displayName: 'Claude 3.5 Sonnet' },
      { id: 'claude-3-haiku-20240307', name: 'claude-3-haiku-20240307', displayName: 'Claude 3 Haiku' }
    ],
    defaultModel: 'claude-3-5-sonnet-20241022',
    temperature: 0.7,
    maxTokens: 2000
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    displayName: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    isBuiltIn: true,
    apiType: 'chat_completions',
    models: [
      { id: 'anthropic/claude-3.5-sonnet', name: 'anthropic/claude-3.5-sonnet', displayName: 'Claude 3.5 Sonnet' },
      { id: 'openai/gpt-4o', name: 'openai/gpt-4o', displayName: 'GPT-4o' },
      { id: 'google/gemini-pro', name: 'google/gemini-pro', displayName: 'Gemini Pro' }
    ],
    defaultModel: 'anthropic/claude-3.5-sonnet',
    temperature: 0.7,
    maxTokens: 2000
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    displayName: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    isBuiltIn: true,
    apiType: 'chat_completions',
    models: [
      { id: 'deepseek-chat', name: 'deepseek-chat', displayName: 'DeepSeek Chat' },
      { id: 'deepseek-coder', name: 'deepseek-coder', displayName: 'DeepSeek Coder' }
    ],
    defaultModel: 'deepseek-chat',
    temperature: 0.7,
    maxTokens: 2000
  },
  {
    id: 'kimi',
    name: 'Kimi',
    displayName: 'Kimi (Moonshot)',
    baseUrl: 'https://api.moonshot.cn/v1',
    isBuiltIn: true,
    apiType: 'chat_completions',
    models: [
      { id: 'moonshot-v1-8k', name: 'moonshot-v1-8k', displayName: 'Moonshot v1 8K' },
      { id: 'moonshot-v1-32k', name: 'moonshot-v1-32k', displayName: 'Moonshot v1 32K' },
      { id: 'moonshot-v1-128k', name: 'moonshot-v1-128k', displayName: 'Moonshot v1 128K' }
    ],
    defaultModel: 'moonshot-v1-8k',
    temperature: 0.7,
    maxTokens: 2000
  },
  {
    id: 'glm',
    name: 'GLM',
    displayName: 'GLM (智谱)',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    isBuiltIn: true,
    apiType: 'chat_completions',
    models: [
      { id: 'glm-4', name: 'glm-4', displayName: 'GLM-4' },
      { id: 'glm-4-plus', name: 'glm-4-plus', displayName: 'GLM-4 Plus' },
      { id: 'glm-3-turbo', name: 'glm-3-turbo', displayName: 'GLM-3 Turbo' }
    ],
    defaultModel: 'glm-4',
    temperature: 0.7,
    maxTokens: 2000
  },
  {
    id: 'gemini',
    name: 'Gemini',
    displayName: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    isBuiltIn: true,
    apiType: 'chat_completions',
    models: [
      { id: 'gemini-1.5-pro', name: 'gemini-1.5-pro', displayName: 'Gemini 1.5 Pro' },
      { id: 'gemini-1.5-flash', name: 'gemini-1.5-flash', displayName: 'Gemini 1.5 Flash' },
      { id: 'gemini-pro', name: 'gemini-pro', displayName: 'Gemini Pro' }
    ],
    defaultModel: 'gemini-1.5-pro',
    temperature: 0.7,
    maxTokens: 2000
  },
  {
    id: 'grok',
    name: 'Grok',
    displayName: 'xAI Grok',
    baseUrl: 'https://api.x.ai/v1',
    isBuiltIn: true,
    apiType: 'chat_completions',
    models: [
      { id: 'grok-beta', name: 'grok-beta', displayName: 'Grok Beta' },
      { id: 'grok-vision-beta', name: 'grok-vision-beta', displayName: 'Grok Vision Beta' }
    ],
    defaultModel: 'grok-beta',
    temperature: 0.7,
    maxTokens: 2000
  },
  {
    id: 'ollama',
    name: 'Ollama',
    displayName: 'Ollama (本地)',
    baseUrl: 'http://localhost:11434/v1',
    isBuiltIn: true,
    apiType: 'chat_completions',
    models: [
      { id: 'llama3.2', name: 'llama3.2', displayName: 'Llama 3.2' },
      { id: 'qwen2.5', name: 'qwen2.5', displayName: 'Qwen 2.5' },
      { id: 'deepseek-coder-v2', name: 'deepseek-coder-v2', displayName: 'DeepSeek Coder V2' }
    ],
    defaultModel: 'llama3.2',
    temperature: 0.7,
    maxTokens: 2000
  },
  {
    id: 'lmstudio',
    name: 'LM Studio',
    displayName: 'LM Studio (本地)',
    baseUrl: 'http://localhost:1234/v1',
    isBuiltIn: true,
    apiType: 'chat_completions',
    models: [],
    defaultModel: '',
    temperature: 0.7,
    maxTokens: 2000
  },
  {
    id: 'custom',
    name: 'Custom',
    displayName: '自定义提供商',
    baseUrl: '',
    isBuiltIn: false,
    apiType: 'chat_completions',
    models: [],
    defaultModel: '',
    temperature: 0.7,
    maxTokens: 2000
  }
];

// 新的模型管理架构类型定义
export interface AIModelConfig {
  id: string;                    // 唯一ID (如: openai-gpt4o-1, claude-sonnet-2)
  name: string;                  // 显示名称 (用户可自定义, 如: "我的GPT-4o")
  modelId: string;              // 实际模型ID (gpt-4o, claude-3-5-sonnet-20241022)
  provider: string;             // 提供商标识 (openai, anthropic, openrouter)
  providerName: string;         // 提供商显示名称 (OpenAI, Anthropic Claude)
  apiKey: string;               // API密钥
  baseUrl: string;              // API端点
  temperature: number;          // 温度参数 (0-2)
  maxTokens: number;           // 最大tokens
  enabled: boolean;            // 是否启用
  isActive: boolean;           // 是否为当前选中模型 (单选)
  createdAt: number;           // 创建时间戳
  apiType?: OpenAIAPIType;     // OpenAI兼容接口类型
}

// 预设模型模板
export interface PresetModel {
  name: string;                 // 预设显示名称
  modelId: string;             // 模型ID
  provider: string;            // 提供商标识
  providerName: string;        // 提供商显示名称
  baseUrl: string;             // 默认API端点
  temperature: number;         // 默认温度
  maxTokens: number;          // 默认最大tokens
  description?: string;        // 模型描述
  category?: string;           // 分类 (云端API/本地模型/自定义)
}

// 预设模型列表
export const PRESET_MODELS: PresetModel[] = [
  // OpenAI 模型
  {
    name: "GPT-4o",
    modelId: "gpt-4o",
    provider: "openai",
    providerName: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    temperature: 0.7,
    maxTokens: 2000,
    description: "最新的多模态模型，支持文本和图像",
    category: "云端API"
  },
  {
    name: "GPT-4o Mini",
    modelId: "gpt-4o-mini",
    provider: "openai",
    providerName: "OpenAI", 
    baseUrl: "https://api.openai.com/v1",
    temperature: 0.7,
    maxTokens: 2000,
    description: "轻量版GPT-4o，速度更快成本更低",
    category: "云端API"
  },
  // Anthropic 模型
  {
    name: "Claude 3.5 Sonnet",
    modelId: "claude-3-5-sonnet-20241022",
    provider: "anthropic",
    providerName: "Anthropic Claude",
    baseUrl: "https://api.anthropic.com",
    temperature: 0.7,
    maxTokens: 2000,
    description: "Claude最强版本，擅长分析和创作",
    category: "云端API"
  },
  // Google 模型
  {
    name: "Gemini 1.5 Pro",
    modelId: "gemini-1.5-pro",
    provider: "gemini",
    providerName: "Google Gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    temperature: 0.7,
    maxTokens: 2000,
    description: "Google最新大模型",
    category: "云端API"
  },
  // OpenRouter 模型
  {
    name: "Claude 3.5 Sonnet (OpenRouter)",
    modelId: "anthropic/claude-3.5-sonnet",
    provider: "openrouter",
    providerName: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    temperature: 0.7,
    maxTokens: 2000,
    description: "通过OpenRouter访问Claude",
    category: "云端API"
  },
  // 本地模型
  {
    name: "Llama 3.2 (Ollama)",
    modelId: "llama3.2",
    provider: "ollama",
    providerName: "Ollama",
    baseUrl: "http://localhost:11434/v1",
    temperature: 0.7,
    maxTokens: 2000,
    description: "Meta开源模型，本地运行",
    category: "本地模型"
  },
  {
    name: "Qwen 2.5 (Ollama)",
    modelId: "qwen2.5",
    provider: "ollama", 
    providerName: "Ollama",
    baseUrl: "http://localhost:11434/v1",
    temperature: 0.7,
    maxTokens: 2000,
    description: "阿里开源模型，本地运行",
    category: "本地模型"
  }
];

// 扩展的设置接口 (向后兼容)
export interface ExtendedPluginSettings extends PluginSettings {
  models?: AIModelConfig[];          // 新的模型配置列表
  activeModelId?: string;           // 当前选中的模型ID
}

// 默认设置
export const DEFAULT_SETTINGS: PluginSettings = {
  triggerKeywords: ['@ai'],
  language: 'zh-cn',
  providers: BUILTIN_PROVIDERS.map(p => ({
    ...p,
    apiKey: '',
    enabled: false
  })),
  defaultProvider: 'openai',
  templateFolder: '/_ai/prompts/',
  autoDetectLanguage: true,
  quickMode: false
};
