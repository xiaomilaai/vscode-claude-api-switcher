import * as vscode from 'vscode';
import { ClaudeConfigManager } from '../providers/claudeConfigManager';
import { PresetManager } from '../providers/presetManager';
import { StatusBarManager } from './statusBar';
import { t } from '../i18n';
import type { Provider, ProviderQuickPickItem, ClaudeEnvConfig } from '../config/types';

/**
 * Register all commands for the extension
 */
export function registerCommands(
  context: vscode.ExtensionContext,
  statusBar: StatusBarManager,
  refreshSidebar: () => void
): vscode.Disposable[] {
  const configManager = ClaudeConfigManager.getInstance();
  const presetManager = PresetManager.getInstance();

  const disposables: vscode.Disposable[] = [];

  // Switch Provider command
  disposables.push(
    vscode.commands.registerCommand('claudeSwitch.switchProvider', async () => {
      await showProviderPicker(configManager, presetManager, statusBar, refreshSidebar);
    })
  );

  // Edit API Key command
  disposables.push(
    vscode.commands.registerCommand('claudeSwitch.editApiKey', async () => {
      await editApiKey(configManager, presetManager, statusBar, refreshSidebar);
    })
  );

  // Add Custom Provider command
  disposables.push(
    vscode.commands.registerCommand('claudeSwitch.addCustomProvider', async () => {
      await addCustomProvider(context, presetManager, configManager, statusBar, refreshSidebar);
    })
  );

  // View Config command
  disposables.push(
    vscode.commands.registerCommand('claudeSwitch.viewConfig', async () => {
      await viewConfig(configManager);
    })
  );

  // Refresh Sidebar command
  disposables.push(
    vscode.commands.registerCommand('claudeSwitch.refreshSidebar', () => {
      refreshSidebar();
    })
  );

  // Apply Provider command
  disposables.push(
    vscode.commands.registerCommand('claudeSwitch.applyProvider', async (item: { provider: Provider }) => {
      if (item?.provider) {
        await applyProvider(item.provider, configManager, presetManager, statusBar, refreshSidebar);
      }
    })
  );

  // Edit Provider command
  disposables.push(
    vscode.commands.registerCommand('claudeSwitch.editProvider', async (item: { provider: Provider }) => {
      if (item?.provider && item.provider.category === 'custom') {
        await editCustomProvider(context, item.provider.id, presetManager, configManager, statusBar, refreshSidebar);
      }
    })
  );

  // Delete Provider command
  disposables.push(
    vscode.commands.registerCommand('claudeSwitch.deleteProvider', async (item: { provider: Provider }) => {
      if (item?.provider && item.provider.category === 'custom') {
        await deleteCustomProvider(item.provider, presetManager, refreshSidebar);
      }
    })
  );

  // Open Website command
  disposables.push(
    vscode.commands.registerCommand('claudeSwitch.openWebsite', async (item: { provider: Provider }) => {
      if (item?.provider?.meta?.websiteUrl) {
        await vscode.env.openExternal(vscode.Uri.parse(item.provider.meta.websiteUrl));
      }
    })
  );

  return disposables;
}

/**
 * Show provider picker quick pick
 */
async function showProviderPicker(
  configManager: ClaudeConfigManager,
  presetManager: PresetManager,
  statusBar: StatusBarManager,
  refreshSidebar: () => void
): Promise<void> {
  const currentEnv = await configManager.getEnv();
  const currentBaseUrl = currentEnv?.ANTHROPIC_BASE_URL || '';

  // Build quick pick items
  const items: (ProviderQuickPickItem | vscode.QuickPickItem)[] = [];

  // Add official provider
  const officialPresets = presetManager.getPresetsByCategory('official');
  if (officialPresets.length > 0) {
    items.push({ label: t('quickPick.category.official'), kind: vscode.QuickPickItemKind.Separator });
    for (const preset of officialPresets) {
      const isActive = !currentBaseUrl && !preset.settingsConfig.env.ANTHROPIC_BASE_URL;
      items.push(createQuickPickItem(preset, isActive));
    }
  }

  // Add third-party providers
  const thirdPartyPresets = presetManager.getPresetsByCategory('third_party');
  if (thirdPartyPresets.length > 0) {
    items.push({ label: t('quickPick.category.third_party'), kind: vscode.QuickPickItemKind.Separator });
    for (const preset of thirdPartyPresets) {
      const isActive = isProviderActive(preset, currentBaseUrl);
      items.push(createQuickPickItem(preset, isActive));
    }
  }

  // Add custom providers
  const customProviders = presetManager.getCustomProviders();
  if (customProviders.length > 0) {
    items.push({ label: t('quickPick.category.custom'), kind: vscode.QuickPickItemKind.Separator });
    for (const custom of customProviders) {
      const isActive = isProviderActive(custom, currentBaseUrl);
      items.push(createQuickPickItem(custom, isActive));
    }
  }

  // Add actions separator
  items.push({ label: '', kind: vscode.QuickPickItemKind.Separator });
  items.push({
    label: t('quickPick.addCustom'),
    alwaysShow: true,
  } as vscode.QuickPickItem);
  items.push({
    label: t('quickPick.editApiKey'),
    alwaysShow: true,
  } as vscode.QuickPickItem);

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: t('quickPick.selectProvider'),
    matchOnDescription: true,
    matchOnDetail: true,
  });

  if (!selected) {
    return;
  }

  // Handle special actions
  if (selected.label === t('quickPick.addCustom')) {
    await vscode.commands.executeCommand('claudeSwitch.addCustomProvider');
    return;
  }
  if (selected.label === t('quickPick.editApiKey')) {
    await vscode.commands.executeCommand('claudeSwitch.editApiKey');
    return;
  }

  // Apply selected provider
  const providerItem = selected as ProviderQuickPickItem;
  if (providerItem.provider) {
    await applyProvider(providerItem.provider, configManager, presetManager, statusBar, refreshSidebar);
  }
}

/**
 * Create a quick pick item for a provider
 */
function createQuickPickItem(provider: Provider, isActive: boolean): ProviderQuickPickItem {
  const baseUrl = provider.settingsConfig.env.ANTHROPIC_BASE_URL || 'Official API';
  const model = provider.settingsConfig.env.ANTHROPIC_MODEL;

  return {
    label: `${isActive ? '$(check) ' : ''}${provider.name}`,
    description: isActive ? t('quickPick.currentProvider') : undefined,
    detail: model ? `${baseUrl} | ${model}` : baseUrl,
    provider,
    picked: isActive,
  };
}

/**
 * Check if a provider is currently active
 */
function isProviderActive(provider: Provider, currentBaseUrl: string): boolean {
  const providerBaseUrl = provider.settingsConfig.env.ANTHROPIC_BASE_URL || '';

  if (!providerBaseUrl && !currentBaseUrl) {
    return true;
  }

  if (!providerBaseUrl || !currentBaseUrl) {
    return false;
  }

  try {
    const providerHost = new URL(providerBaseUrl).host;
    const currentHost = new URL(currentBaseUrl).host;
    return providerHost === currentHost;
  } catch {
    return providerBaseUrl === currentBaseUrl;
  }
}

/**
 * Apply a provider configuration
 */
async function applyProvider(
  provider: Provider,
  configManager: ClaudeConfigManager,
  presetManager: PresetManager,
  statusBar: StatusBarManager,
  refreshSidebar: () => void
): Promise<void> {
  try {
    // Get saved API key for this provider
    const savedApiKey = presetManager.getProviderApiKey(provider.id);
    const isCustom = provider.category === 'custom';

    // If no saved API key, prompt user to enter it
    let apiKeyToUse = savedApiKey;
    if (savedApiKey === undefined && provider.category !== 'official') {
      const apiKey = await vscode.window.showInputBox({
        prompt: t('form.apiKey'),
        placeHolder: t('form.apiKey.placeholder'),
        password: true,
        validateInput: (value) => {
          if (!value.trim()) {
            return t('validation.apiKeyRequired');
          }
          return null;
        },
      });

      if (apiKey === undefined) {
        return; // Cancelled
      }

      apiKeyToUse = apiKey;

      // Save the API key for future use
      await presetManager.updateProviderApiKey(provider.id, apiKey, isCustom);
    }

    // Build the env config
    let envConfig: ClaudeEnvConfig;

    // For official provider, clear all env settings (empty object)
    if (provider.category === 'official') {
      envConfig = {};
    } else {
      envConfig = { ...provider.settingsConfig.env };

      // Add API key if available
      if (apiKeyToUse) {
        // Use the same key field that provider uses
        if (envConfig.ANTHROPIC_API_KEY !== undefined) {
          envConfig.ANTHROPIC_API_KEY = apiKeyToUse;
        } else {
          envConfig.ANTHROPIC_AUTH_TOKEN = apiKeyToUse;
        }
      }
    }

    await configManager.updateEnv(envConfig);
    await statusBar.update();
    refreshSidebar();
    vscode.window.showInformationMessage(t('message.providerSwitched', provider.name));
  } catch (error) {
    vscode.window.showErrorMessage(t('error.writeConfig'));
    console.error('Failed to apply provider:', error);
  }
}

/**
 * Edit current API Key
 */
async function editApiKey(
  configManager: ClaudeConfigManager,
  presetManager: PresetManager,
  statusBar: StatusBarManager,
  refreshSidebar: () => void
): Promise<void> {
  const currentEnv = await configManager.getEnv();
  const currentBaseUrl = currentEnv?.ANTHROPIC_BASE_URL || '';

  // Find the current provider
  let currentProvider: Provider | undefined;
  let isCustom = false;

  // Check presets
  const presets = presetManager.getPresets();
  for (const preset of presets) {
    const presetBaseUrl = preset.settingsConfig.env.ANTHROPIC_BASE_URL;
    if (!presetBaseUrl && !currentBaseUrl) {
      currentProvider = preset;
      break;
    }
    if (presetBaseUrl && currentBaseUrl) {
      try {
        const presetHost = new URL(presetBaseUrl).host;
        const currentHost = new URL(currentBaseUrl).host;
        if (presetHost === currentHost) {
          currentProvider = preset;
          break;
        }
      } catch {
        // Ignore URL parsing errors
      }
    }
  }

  // Check custom providers if no preset matched
  if (!currentProvider) {
    const customProviders = presetManager.getCustomProviders();
    for (const custom of customProviders) {
      const customBaseUrl = custom.settingsConfig.env.ANTHROPIC_BASE_URL;
      if (customBaseUrl && currentBaseUrl) {
        try {
          const customHost = new URL(customBaseUrl).host;
          const currentHost = new URL(currentBaseUrl).host;
          if (customHost === currentHost) {
            currentProvider = custom;
            isCustom = true;
            break;
          }
        } catch {
          // Ignore URL parsing errors
        }
      }
    }
  }

  // Get current API key from provider's saved data
  const currentKey = currentProvider
    ? presetManager.getProviderApiKey(currentProvider.id) || ''
    : (currentEnv?.ANTHROPIC_AUTH_TOKEN || currentEnv?.ANTHROPIC_API_KEY || '');

  const newKey = await vscode.window.showInputBox({
    prompt: t('form.apiKey'),
    value: currentKey,
    password: true,
    placeHolder: t('form.apiKey.placeholder'),
  });

  if (newKey === undefined) {
    return; // Cancelled
  }

  try {
    if (currentProvider) {
      // Update the provider's saved API key
      await presetManager.updateProviderApiKey(currentProvider.id, newKey, isCustom);
    } else {
      // No provider detected, just update the current env
      const keyField = currentEnv?.ANTHROPIC_API_KEY !== undefined
        ? 'ANTHROPIC_API_KEY'
        : 'ANTHROPIC_AUTH_TOKEN';

      await configManager.updateEnv({
        ...currentEnv,
        [keyField]: newKey,
      });
    }

    await statusBar.update();
    refreshSidebar();
    vscode.window.showInformationMessage(t('message.apiKeyUpdated'));
  } catch (error) {
    vscode.window.showErrorMessage(t('error.writeConfig'));
    console.error('Failed to update API key:', error);
  }
}

/**
 * Add a custom provider via input boxes
 */
async function addCustomProvider(
  context: vscode.ExtensionContext,
  presetManager: PresetManager,
  configManager: ClaudeConfigManager,
  statusBar: StatusBarManager,
  refreshSidebar: () => void
): Promise<void> {
  // Get provider name
  const name = await vscode.window.showInputBox({
    prompt: t('form.name'),
    placeHolder: t('form.name.placeholder'),
    validateInput: (value) => {
      if (!value.trim()) {
        return t('validation.nameRequired');
      }
      if (presetManager.isNameTaken(value)) {
        return t('validation.nameTaken');
      }
      return null;
    },
  });

  if (!name) {
    return;
  }

  // Get base URL
  const baseUrl = await vscode.window.showInputBox({
    prompt: t('form.baseUrl'),
    placeHolder: t('form.baseUrl.placeholder'),
    validateInput: (value) => {
      if (!value.trim()) {
        return t('validation.baseUrlRequired');
      }
      try {
        new URL(value);
        return null;
      } catch {
        return t('validation.baseUrlInvalid');
      }
    },
  });

  if (!baseUrl) {
    return;
  }

  // Get API key
  const apiKey = await vscode.window.showInputBox({
    prompt: t('form.apiKey'),
    placeHolder: t('form.apiKey.placeholder'),
    password: true,
  });

  if (apiKey === undefined) {
    return;
  }

  // Get model (optional)
  const model = await vscode.window.showInputBox({
    prompt: t('form.model'),
    placeHolder: t('form.model.placeholder'),
  });

  // Create custom provider
  try {
    const env: ClaudeEnvConfig = {
      ANTHROPIC_BASE_URL: baseUrl,
      ANTHROPIC_AUTH_TOKEN: apiKey,
    };

    if (model) {
      env.ANTHROPIC_MODEL = model;
    }

    const newProvider = await presetManager.addCustomProvider(name, env);
    refreshSidebar();

    // Ask if user wants to apply the new provider
    const apply = await vscode.window.showInformationMessage(
      t('message.providerAdded', name),
      t('confirm.yes'),
      t('confirm.no')
    );

    if (apply === t('confirm.yes')) {
      await applyProvider(newProvider, configManager, presetManager, statusBar, refreshSidebar);
    }
  } catch (error) {
    vscode.window.showErrorMessage(t('error.generic', String(error)));
    console.error('Failed to add custom provider:', error);
  }
}

/**
 * Edit a custom provider
 */
async function editCustomProvider(
  context: vscode.ExtensionContext,
  providerId: string,
  presetManager: PresetManager,
  configManager: ClaudeConfigManager,
  statusBar: StatusBarManager,
  refreshSidebar: () => void
): Promise<void> {
  const provider = presetManager.findCustomProvider(providerId);
  if (!provider) {
    return;
  }

  // Get new name
  const name = await vscode.window.showInputBox({
    prompt: t('form.name'),
    value: provider.name,
    validateInput: (value) => {
      if (!value.trim()) {
        return t('validation.nameRequired');
      }
      if (presetManager.isNameTaken(value, providerId)) {
        return t('validation.nameTaken');
      }
      return null;
    },
  });

  if (!name) {
    return;
  }

  // Get base URL
  const baseUrl = await vscode.window.showInputBox({
    prompt: t('form.baseUrl'),
    value: provider.settingsConfig.env.ANTHROPIC_BASE_URL || '',
    validateInput: (value) => {
      if (!value.trim()) {
        return t('validation.baseUrlRequired');
      }
      try {
        new URL(value);
        return null;
      } catch {
        return t('validation.baseUrlInvalid');
      }
    },
  });

  if (!baseUrl) {
    return;
  }

  // Get API key
  const currentKey = provider.settingsConfig.env.ANTHROPIC_AUTH_TOKEN ||
    provider.settingsConfig.env.ANTHROPIC_API_KEY || '';
  const apiKey = await vscode.window.showInputBox({
    prompt: t('form.apiKey'),
    value: currentKey,
    password: true,
  });

  if (apiKey === undefined) {
    return;
  }

  // Get model
  const model = await vscode.window.showInputBox({
    prompt: t('form.model'),
    value: provider.settingsConfig.env.ANTHROPIC_MODEL || '',
  });

  // Update provider
  try {
    const env: ClaudeEnvConfig = {
      ANTHROPIC_BASE_URL: baseUrl,
      ANTHROPIC_AUTH_TOKEN: apiKey,
    };

    if (model) {
      env.ANTHROPIC_MODEL = model;
    }

    await presetManager.updateCustomProvider(providerId, {
      name,
      env,
    });

    refreshSidebar();
    vscode.window.showInformationMessage(t('message.providerUpdated', name));
  } catch (error) {
    vscode.window.showErrorMessage(t('error.generic', String(error)));
    console.error('Failed to update custom provider:', error);
  }
}

/**
 * Delete a custom provider
 */
async function deleteCustomProvider(
  provider: Provider,
  presetManager: PresetManager,
  refreshSidebar: () => void
): Promise<void> {
  const confirm = await vscode.window.showWarningMessage(
    t('confirm.deleteProvider', provider.name),
    { modal: true },
    t('confirm.yes')
  );

  if (confirm !== t('confirm.yes')) {
    return;
  }

  try {
    await presetManager.deleteCustomProvider(provider.id);
    refreshSidebar();
    vscode.window.showInformationMessage(t('message.providerDeleted', provider.name));
  } catch (error) {
    vscode.window.showErrorMessage(t('error.generic', String(error)));
    console.error('Failed to delete custom provider:', error);
  }
}

/**
 * View current configuration
 */
async function viewConfig(configManager: ClaudeConfigManager): Promise<void> {
  const configPath = configManager.getConfigPath();

  try {
    const exists = await configManager.configExists();
    if (!exists) {
      const create = await vscode.window.showInformationMessage(
        t('message.configNotFound'),
        t('confirm.yes'),
        t('confirm.no')
      );

      if (create === t('confirm.yes')) {
        await configManager.ensureConfigExists();
        vscode.window.showInformationMessage(t('message.configCreated'));
      } else {
        return;
      }
    }

    const doc = await vscode.workspace.openTextDocument(configPath);
    await vscode.window.showTextDocument(doc);
  } catch (error) {
    vscode.window.showErrorMessage(t('error.readConfig'));
    console.error('Failed to view config:', error);
  }
}
