export const zhCn = {
  // 插件基本信息
  'plugin.name': '@AI',
  'plugin.description': '智能AI助手，支持自定义关键词触发，多AI提供商和基于模板的提示词。',
  
  // 触发相关
  'trigger.placeholder': '输入关键词后按空格触发AI助手',
  'trigger.keywords': '触发关键词',
  'trigger.keywords.desc': '设置触发AI助手的关键词，多个关键词用分号分隔',
  'trigger.add': '添加关键词',
  'trigger.remove': '删除',
  
  // UI界面
  'ui.modal.title': 'AI助手',
  'ui.search.placeholder': '搜索模板...',
  'ui.model.label': '选择模型',
  'ui.model.auto': '自动选择',
  'ui.execute': '执行',
  'ui.cancel': '取消',
  'ui.close': '关闭',
  'ui.confirm': '确认',
  'ui.save': '保存',
  'ui.reset': '重置',
  'ui.test': '测试连接',
  'ui.loading': '处理中...',
  
  // 模板分类
  'category.featured': '常用',
  'category.rewrite': '改写',
  'category.continue': '续写',
  'category.summarize': '总结',
  'category.translate': '翻译',
  'category.code': '代码',
  'category.other': '其他',
  
  // 设置页面
  'settings.title': '@AI 设置',
  'settings.language': '语言',
  'settings.language.desc': '选择界面语言',
  'settings.language.auto': '自动检测',
  'settings.language.zh': '简体中文',
  'settings.language.en': 'English',
  
  // AI提供商设置
  'settings.providers': 'AI提供商',
  'settings.providers.desc': '配置AI服务提供商和API密钥',
  'settings.provider.enabled': '启用',
  'settings.provider.name': '显示名称',
  'settings.provider.baseurl': 'API地址',
  'settings.provider.apikey': 'API密钥',
  'settings.provider.model': '默认模型',
  'settings.provider.temperature': '温度',
  'settings.provider.maxtokens': '最大Token数',
  'settings.provider.test': '测试连接',
  'settings.provider.add': '添加自定义提供商',
  'settings.provider.remove': '删除提供商',
  
  // 模板设置
  'settings.templates': '模板设置',
  'settings.templates.desc': '配置模板文件夹和相关选项',
  'settings.template.folder': '模板文件夹',
  'settings.template.folder.desc': '模板文件存放的文件夹路径',
  'settings.template.reload': '重新加载模板',
  
  // 消息提示
  'msg.success': '成功',
  'msg.error': '错误',
  'msg.warning': '警告',
  'msg.info': '信息',
  'msg.connection.success': '连接测试成功',
  'msg.connection.failed': '连接测试失败',
  'msg.apikey.required': '请输入API密钥',
  'msg.template.not.found': '未找到模板',
  'msg.provider.not.found': '未找到AI提供商',
  'msg.provider.disabled': 'AI提供商未启用',
  'msg.processing': 'AI正在处理中...',
  'msg.processing.done': '处理完成',
  'msg.processing.error': 'AI处理出错',
  
  // 错误消息
  'error.network': '网络连接错误',
  'error.auth': 'API密钥验证失败',
  'error.quota': 'API配额不足',
  'error.timeout': '请求超时',
  'error.unknown': '未知错误',
  
  // 帮助文本
  'help.trigger': '在编辑器中输入设置的关键词（如@ai）加空格即可触发AI助手',
  'help.template': '在指定文件夹中创建.md文件作为模板，支持YAML frontmatter配置',
  'help.variables': '模板中可使用{{context}}变量来插入选中文本或全文内容',
  'help.providers': '需要至少启用一个AI提供商并配置正确的API密钥才能使用',
  
  // 模板默认内容
  'template.polish.title': '中文润色',
  'template.polish.desc': '优化表达与结构，保留术语与格式',
  'template.continue.title': '自然续写',
  'template.continue.desc': '承接原文语气与节奏继续写作',
  'template.summarize.title': '要点总结',
  'template.summarize.desc': '提炼关键要点，保留重要数据',
  'template.translate.title': '双语翻译',
  'template.translate.desc': '翻译文本并提供双语对照',
  'template.explain.title': '代码解释',
  'template.explain.desc': '解释代码功能和实现逻辑'
};

export type I18nKey = keyof typeof zhCn;