import * as vscode from 'vscode';

/**
 * i18n messages for the extension
 */
const messages: Record<string, Record<string, string>> = {
  en: {
    // Status bar
    'statusBar.tooltip': 'Click to switch Claude API provider',
    'statusBar.notConfigured': 'Not Configured',

    // Commands
    'command.switchProvider.title': 'Switch Provider',
    'command.editApiKey.title': 'Edit API Key',
    'command.addCustomProvider.title': 'Add Custom Provider',
    'command.viewConfig.title': 'View Current Configuration',

    // Quick pick
    'quickPick.selectProvider': 'Select Claude API Provider',
    'quickPick.currentProvider': '(current)',
    'quickPick.category.official': 'Official',
    'quickPick.category.third_party': 'Third Party',
    'quickPick.category.partner': 'Partner',
    'quickPick.category.custom': 'Custom',
    'quickPick.addCustom': '$(add) Add Custom Provider...',
    'quickPick.editApiKey': '$(key) Edit API Key...',

    // Sidebar
    'sidebar.currentConfig': 'Current Configuration',
    'sidebar.currentProvider': 'Current Provider',
    'sidebar.presetProviders': 'Preset Providers',
    'sidebar.customProviders': 'Custom Providers',
    'sidebar.noConfig': 'No configuration',
    'sidebar.baseUrl': 'Base URL',
    'sidebar.model': 'Model',
    'sidebar.apiKey': 'API Key',
    'sidebar.configured': 'Configured',
    'sidebar.notSet': 'Not Set',
    'sidebar.getStarted': 'Get Started',
    'sidebar.createConfig': 'Create Configuration',
    'sidebar.quickActions': 'Quick Actions',
    'sidebar.switchProviderDesc': 'Switch to another provider',
    'sidebar.addProviderDesc': 'Add a custom provider',
    'sidebar.editApiKeyDesc': 'Update API key',

    // Provider form
    'form.title.add': 'Add Custom Provider',
    'form.title.edit': 'Edit Provider',
    'form.name': 'Provider Name',
    'form.name.placeholder': 'Enter provider name',
    'form.baseUrl': 'Base URL',
    'form.baseUrl.placeholder': 'https://api.example.com',
    'form.apiKey': 'API Key',
    'form.apiKey.placeholder': 'Enter your API key',
    'form.model': 'Model (Optional)',
    'form.model.placeholder': 'e.g. claude-3-sonnet',
    'form.websiteUrl': 'Website URL (Optional)',
    'form.websiteUrl.placeholder': 'https://example.com',
    'form.save': 'Save',
    'form.cancel': 'Cancel',
    'form.test': 'Test Connection',

    // Validation
    'validation.nameRequired': 'Provider name is required',
    'validation.nameTaken': 'Provider name already exists',
    'validation.baseUrlRequired': 'Base URL is required',
    'validation.baseUrlInvalid': 'Base URL must be a valid URL',
    'validation.apiKeyRequired': 'API Key is required',

    // Messages
    'message.providerSwitched': 'Switched to {0}',
    'message.providerAdded': 'Custom provider "{0}" added',
    'message.providerUpdated': 'Provider "{0}" updated',
    'message.providerDeleted': 'Provider "{0}" deleted',
    'message.apiKeyUpdated': 'API Key updated',
    'message.configNotFound': 'Claude configuration not found. Create one?',
    'message.configCreated': 'Claude configuration file created',
    'message.testSuccess': 'Connection test successful',
    'message.testFailed': 'Connection test failed: {0}',

    // Confirm dialogs
    'confirm.deleteProvider': 'Are you sure you want to delete provider "{0}"?',
    'confirm.yes': 'Yes',
    'confirm.no': 'No',

    // Errors
    'error.readConfig': 'Failed to read Claude configuration',
    'error.writeConfig': 'Failed to write Claude configuration',
    'error.generic': 'An error occurred: {0}',
  },
  zh: {
    // Status bar
    'statusBar.tooltip': '点击切换 Claude API 供应商',
    'statusBar.notConfigured': '未配置',

    // Commands
    'command.switchProvider.title': '切换供应商',
    'command.editApiKey.title': '编辑 API Key',
    'command.addCustomProvider.title': '添加自定义供应商',
    'command.viewConfig.title': '查看当前配置',

    // Quick pick
    'quickPick.selectProvider': '选择 Claude API 供应商',
    'quickPick.currentProvider': '(当前)',
    'quickPick.category.official': '官方',
    'quickPick.category.third_party': '第三方',
    'quickPick.category.partner': '合作伙伴',
    'quickPick.category.custom': '自定义',
    'quickPick.addCustom': '$(add) 添加自定义供应商...',
    'quickPick.editApiKey': '$(key) 编辑 API Key...',

    // Sidebar
    'sidebar.currentConfig': '当前配置',
    'sidebar.currentProvider': '当前供应商',
    'sidebar.presetProviders': '预设供应商',
    'sidebar.customProviders': '自定义供应商',
    'sidebar.noConfig': '无配置',
    'sidebar.baseUrl': '请求地址',
    'sidebar.model': '模型',
    'sidebar.apiKey': 'API Key',
    'sidebar.configured': '已配置',
    'sidebar.notSet': '未设置',
    'sidebar.getStarted': '开始使用',
    'sidebar.createConfig': '创建配置',
    'sidebar.quickActions': '快速操作',
    'sidebar.switchProviderDesc': '切换到其他供应商',
    'sidebar.addProviderDesc': '添加自定义供应商',
    'sidebar.editApiKeyDesc': '更新 API Key',

    // Provider form
    'form.title.add': '添加自定义供应商',
    'form.title.edit': '编辑供应商',
    'form.name': '供应商名称',
    'form.name.placeholder': '输入供应商名称',
    'form.baseUrl': '请求地址',
    'form.baseUrl.placeholder': 'https://api.example.com',
    'form.apiKey': 'API Key',
    'form.apiKey.placeholder': '输入你的 API Key',
    'form.model': '模型（可选）',
    'form.model.placeholder': '例如 claude-3-sonnet',
    'form.websiteUrl': '网站地址（可选）',
    'form.websiteUrl.placeholder': 'https://example.com',
    'form.save': '保存',
    'form.cancel': '取消',
    'form.test': '测试连接',

    // Validation
    'validation.nameRequired': '供应商名称不能为空',
    'validation.nameTaken': '供应商名称已存在',
    'validation.baseUrlRequired': '请求地址不能为空',
    'validation.baseUrlInvalid': '请求地址格式无效',
    'validation.apiKeyRequired': 'API Key 不能为空',

    // Messages
    'message.providerSwitched': '已切换到 {0}',
    'message.providerAdded': '已添加自定义供应商 "{0}"',
    'message.providerUpdated': '已更新供应商 "{0}"',
    'message.providerDeleted': '已删除供应商 "{0}"',
    'message.apiKeyUpdated': 'API Key 已更新',
    'message.configNotFound': '未找到 Claude 配置文件，是否创建？',
    'message.configCreated': 'Claude 配置文件已创建',
    'message.testSuccess': '连接测试成功',
    'message.testFailed': '连接测试失败: {0}',

    // Confirm dialogs
    'confirm.deleteProvider': '确定要删除供应商 "{0}" 吗？',
    'confirm.yes': '是',
    'confirm.no': '否',

    // Errors
    'error.readConfig': '读取 Claude 配置失败',
    'error.writeConfig': '写入 Claude 配置失败',
    'error.generic': '发生错误: {0}',
  },
};

/**
 * Get current locale (zh or en)
 */
function getLocale(): string {
  const lang = vscode.env.language;
  if (lang.startsWith('zh')) {
    return 'zh';
  }
  return 'en';
}

/**
 * Get translated message
 * @param key Message key
 * @param args Optional arguments for string interpolation
 */
export function t(key: string, ...args: string[]): string {
  const locale = getLocale();
  let message = messages[locale]?.[key] ?? messages['en']?.[key] ?? key;

  // Replace placeholders {0}, {1}, etc.
  args.forEach((arg, index) => {
    message = message.replace(`{${index}}`, arg);
  });

  return message;
}

/**
 * Check if current locale is Chinese
 */
export function isChineseLocale(): boolean {
  return getLocale() === 'zh';
}
