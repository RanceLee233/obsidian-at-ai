export const en = {
  // Plugin basic info
  'plugin.name': '@AI',
  'plugin.description': 'Intelligent AI assistant with custom keyword triggers, multiple AI providers, and template-based prompts.',
  
  // Trigger related
  'trigger.placeholder': 'Enter keyword followed by space to trigger AI assistant',
  'trigger.keywords': 'Trigger Keywords',
  'trigger.keywords.desc': 'Set keywords to trigger AI assistant, separate multiple keywords with semicolon',
  'trigger.add': 'Add Keyword',
  'trigger.remove': 'Remove',
  
  // UI interface
  'ui.modal.title': 'AI Assistant',
  'ui.search.placeholder': 'Search templates...',
  'ui.model.label': 'Select Model',
  'ui.model.auto': 'Auto Select',
  'ui.execute': 'Execute',
  'ui.cancel': 'Cancel',
  'ui.close': 'Close',
  'ui.confirm': 'Confirm',
  'ui.save': 'Save',
  'ui.reset': 'Reset',
  'ui.test': 'Test Connection',
  'ui.loading': 'Processing...',
  
  // Template categories
  'category.featured': 'Featured',
  'category.rewrite': 'Rewrite',
  'category.continue': 'Continue',
  'category.summarize': 'Summarize',
  'category.translate': 'Translate',
  'category.code': 'Code',
  'category.other': 'Other',
  
  // Settings page
  'settings.title': '@AI Settings',
  'settings.language': 'Language',
  'settings.language.desc': 'Select interface language',
  'settings.language.auto': 'Auto Detect',
  'settings.language.zh': '简体中文',
  'settings.language.en': 'English',
  // Quick mode
  'settings.quickmode': 'Quick Mode',
  'settings.quickmode.desc': 'When enabled, clicking "Insert to Document" will insert immediately and close the panel',
  
  // AI provider settings
  'settings.providers': 'AI Providers',
  'settings.providers.desc': 'Configure AI service providers and API keys',
  'settings.provider.enabled': 'Enabled',
  'settings.provider.name': 'Display Name',
  'settings.provider.baseurl': 'API URL',
  'settings.provider.apikey': 'API Key',
  'settings.provider.model': 'Default Model',
  'settings.provider.temperature': 'Temperature',
  'settings.provider.maxtokens': 'Max Tokens',
  'settings.provider.test': 'Test Connection',
  'settings.provider.add': 'Add Custom Provider',
  'settings.provider.remove': 'Remove Provider',
  
  // Template settings
  'settings.templates': 'Template Settings',
  'settings.templates.desc': 'Configure template folder and related options',
  'settings.template.folder': 'Template Folder',
  'settings.template.folder.desc': 'Folder path for template files',
  'settings.template.reload': 'Reload Templates',
  
  // Message prompts
  'msg.success': 'Success',
  'msg.error': 'Error',
  'msg.warning': 'Warning',
  'msg.info': 'Info',
  'msg.connection.success': 'Connection test successful',
  'msg.connection.failed': 'Connection test failed',
  'msg.apikey.required': 'Please enter API key',
  'msg.template.not.found': 'Template not found',
  'msg.provider.not.found': 'AI provider not found',
  'msg.provider.disabled': 'AI provider not enabled',
  'msg.processing': 'AI is processing...',
  'msg.processing.done': 'Processing completed',
  'msg.processing.error': 'AI processing error',
  
  // Error messages
  'error.network': 'Network connection error',
  'error.auth': 'API key authentication failed',
  'error.quota': 'API quota exceeded',
  'error.timeout': 'Request timeout',
  'error.unknown': 'Unknown error',
  
  // Help text
  'help.trigger': 'Type the configured keyword (like @ai) followed by space in editor to trigger AI assistant',
  'help.template': 'Create .md files in specified folder as templates, supports YAML frontmatter configuration',
  'help.variables': 'Use {{context}} variable in templates to insert selected text or full content',
  'help.providers': 'At least one AI provider must be enabled with correct API key to use the plugin',
  
  // Template default content
  'template.polish.title': 'Polish Text',
  'template.polish.desc': 'Improve expression and structure while preserving terminology',
  'template.continue.title': 'Continue Writing',
  'template.continue.desc': 'Continue writing following original tone and rhythm',
  'template.summarize.title': 'Summarize Points',
  'template.summarize.desc': 'Extract key points while preserving important data',
  'template.translate.title': 'Bilingual Translation',
  'template.translate.desc': 'Translate text and provide bilingual comparison',
  'template.explain.title': 'Explain Code',
  'template.explain.desc': 'Explain code functionality and implementation logic'
};
