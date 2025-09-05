# @AI 插件架构重设计

## 新的设计思路

参考 GitHub Copilot 的模型管理方式，改变当前的架构设计：

### 当前架构问题
- **以提供商为中心**: 用户需要先启用提供商，再选择模型
- **一个提供商一个模型**: 限制了用户的灵活性
- **配置复杂**: 用户需要理解提供商概念

### 新架构设计
- **以模型为中心**: 用户直接添加和管理模型
- **一个模型一个配置**: 每个模型独立配置
- **动态添加**: 用户可以添加任意数量的同提供商模型

## 数据结构变化

### 旧结构
```typescript
AIProviderConfig {
  id: string
  name: string
  apiKey: string
  baseUrl: string
  defaultModel: string
  models: ModelInfo[]
  enabled: boolean
}
```

### 新结构
```typescript
AIModelConfig {
  id: string                    // 唯一ID
  name: string                  // 显示名称 (可自定义)
  modelId: string              // 实际模型ID (gpt-4o, claude-3.5-sonnet等)
  provider: string             // 提供商 (openai, anthropic, openrouter等)
  apiKey: string               // API密钥
  baseUrl: string              // API端点
  temperature: number          // 温度参数
  maxTokens: number           // 最大tokens
  enabled: boolean            // 是否启用
  isActive: boolean           // 是否为当前选中模型 (单选)
}
```

## UI 设计变化

### 模型列表界面
- 表格形式显示所有已添加的模型
- 列: 模型名称 | 提供商 | 当前选择 | 操作
- 单选按钮选择当前使用的模型
- 每行右侧有操作菜单 (编辑、删除)

### 添加模型界面
- 大按钮 "+ 添加模型"
- 弹出模态框选择:
  - **预设模型** (从预设列表选择)
  - **自定义模型** (手动输入所有参数)

### 模型配置界面  
- 弹出详细配置页面
- 包含所有参数: API Key, Base URL, Temperature等
- 去掉不必要的字段 (CORS, Capabilities等)

## 预设模板

```typescript
PRESET_MODELS = [
  {
    name: "GPT-4o",
    modelId: "gpt-4o", 
    provider: "openai",
    baseUrl: "https://api.openai.com/v1"
  },
  {
    name: "Claude 3.5 Sonnet",
    modelId: "claude-3-5-sonnet-20241022",
    provider: "anthropic", 
    baseUrl: "https://api.anthropic.com"
  },
  // ... 更多预设
]
```

## 用户体验优化

1. **简化概念**: 用户不需要理解"提供商"，直接管理"模型"
2. **灵活配置**: 可以添加同一提供商的多个模型
3. **直观操作**: 模型列表 + 单选切换 + 快速添加
4. **预设支持**: 常用模型一键添加，高级用户可完全自定义

这样的设计更符合用户的直觉使用习惯。