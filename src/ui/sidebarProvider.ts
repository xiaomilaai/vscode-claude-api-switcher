import * as vscode from 'vscode';
import { ClaudeConfigManager } from '../providers/claudeConfigManager';
import { PresetManager } from '../providers/presetManager';
import { t } from '../i18n';
import type { Provider, ClaudeEnvConfig } from '../config/types';

/**
 * Tree item types for the sidebar
 */
type TreeItemType = 'group' | 'action' | 'config-item';

/**
 * Base tree item interface
 */
interface BaseTreeItem {
  type: TreeItemType;
}

/**
 * Group header item (collapsible)
 */
interface GroupTreeItem extends BaseTreeItem {
  type: 'group';
  label: string;
  icon?: string;
  children?: SidebarTreeItem[];
}

/**
 * Action item (clickable command)
 */
interface ActionTreeItem extends BaseTreeItem {
  type: 'action';
  label: string;
  icon?: string;
  command: vscode.Command;
  description?: string;
}

/**
 * Config item (for current configuration)
 */
interface ConfigTreeItem extends BaseTreeItem {
  type: 'config-item';
  label: string;
  value: string;
  icon?: string;
  command?: vscode.Command;
}

type SidebarTreeItem = GroupTreeItem | ActionTreeItem | ConfigTreeItem;

/**
 * Main sidebar view provider (unified view)
 * Shows current config, quick actions, and providers in a single view
 */
export class MainViewProvider implements vscode.TreeDataProvider<SidebarTreeItem> {
  private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<SidebarTreeItem | undefined>();
  readonly onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;

  private configManager: ClaudeConfigManager;
  private presetManager: PresetManager;

  constructor() {
    this.configManager = ClaudeConfigManager.getInstance();
    this.presetManager = PresetManager.getInstance();
  }

  refresh(): void {
    this.onDidChangeTreeDataEmitter.fire(undefined);
  }

  getTreeItem(element: SidebarTreeItem): vscode.TreeItem {
    const item = new vscode.TreeItem(element.label);

    if (element.type === 'group') {
      item.contextValue = 'group';
      const groupItem = element as GroupTreeItem;
      if (groupItem.children && groupItem.children.length > 0) {
        item.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
      } else {
        item.collapsibleState = vscode.TreeItemCollapsibleState.None;
      }
      item.iconPath = element.icon ? new vscode.ThemeIcon(element.icon) : undefined;
      return item;
    }

    if (element.type === 'action') {
      item.description = element.description;
      item.iconPath = element.icon ? new vscode.ThemeIcon(element.icon) : undefined;
      item.command = element.command;
      item.contextValue = 'action';
      return item;
    }

    if (element.type === 'config-item') {
      item.description = element.value;
      item.iconPath = element.icon ? new vscode.ThemeIcon(element.icon) : undefined;
      item.contextValue = 'configItem';
      if (element.command) {
        item.command = element.command;
      }
      return item;
    }

    return item;
  }

  async getChildren(element?: SidebarTreeItem): Promise<SidebarTreeItem[]> {
    // 如果没有 element，返回顶级分组
    if (!element) {
      return this.getRootItems();
    }

    // 如果 element 是分组，返回其子项
    if (element.type === 'group') {
      const groupItem = element as GroupTreeItem;
      return groupItem.children || [];
    }

    // 其他类型的 items 没有子项
    return [];
  }

  private async getRootItems(): Promise<SidebarTreeItem[]> {
    const items: SidebarTreeItem[] = [];
    const env = await this.configManager.getEnv();

    // 1. Current Configuration Section
    const currentConfigChildren: SidebarTreeItem[] = [];

    if (!env) {
      currentConfigChildren.push({
        type: 'action',
        label: t('sidebar.getStarted'),
        icon: 'rocket',
        description: t('sidebar.createConfig'),
        command: {
          command: 'claudeSwitch.viewConfig',
          title: t('sidebar.createConfig'),
        },
      });
    } else {
      // Current provider detection
      const currentProvider = await this.detectCurrentProvider();

      if (currentProvider) {
        currentConfigChildren.push({
          type: 'config-item',
          label: t('sidebar.currentProvider'),
          value: currentProvider.name,
          icon: 'check',
        });
      }

      // Base URL
      const baseUrl = env.ANTHROPIC_BASE_URL;
      currentConfigChildren.push({
        type: 'config-item',
        label: t('sidebar.baseUrl'),
        value: baseUrl || 'Official API',
        icon: 'link',
      });

      // Model
      const model = env.ANTHROPIC_MODEL;
      if (model) {
        currentConfigChildren.push({
          type: 'config-item',
          label: t('sidebar.model'),
          value: model,
          icon: 'symbol-class',
        });
      }

      // API Key status - only show for non-official providers
      const isOfficial = currentProvider && currentProvider.category === 'official';
      const hasApiKey = !!(env.ANTHROPIC_AUTH_TOKEN || env.ANTHROPIC_API_KEY);

      if (!isOfficial) {
        currentConfigChildren.push({
          type: 'config-item',
          label: t('sidebar.apiKey'),
          value: hasApiKey ? t('sidebar.configured') : t('sidebar.notSet'),
          icon: hasApiKey ? 'key' : 'warning',
          command: {
            command: 'claudeSwitch.editApiKey',
            title: 'Edit API Key',
          },
        });
      }
    }

    items.push({
      type: 'group',
      label: t('sidebar.currentConfig'),
      icon: 'settings-gear',
      children: currentConfigChildren,
    });

    // 2. Quick Actions Section
    const quickActionsChildren: SidebarTreeItem[] = [];

    quickActionsChildren.push({
      type: 'action',
      label: t('command.switchProvider.title'),
      icon: 'refresh',
      description: t('sidebar.switchProviderDesc'),
      command: {
        command: 'claudeSwitch.switchProvider',
        title: t('command.switchProvider.title'),
      },
    });

    quickActionsChildren.push({
      type: 'action',
      label: t('command.addCustomProvider.title'),
      icon: 'add',
      description: t('sidebar.addProviderDesc'),
      command: {
        command: 'claudeSwitch.addCustomProvider',
        title: t('command.addCustomProvider.title'),
      },
    });

    quickActionsChildren.push({
      type: 'action',
      label: t('command.editApiKey.title'),
      icon: 'key',
      description: t('sidebar.editApiKeyDesc'),
      command: {
        command: 'claudeSwitch.editApiKey',
        title: t('command.editApiKey.title'),
      },
    });

    items.push({
      type: 'group',
      label: t('sidebar.quickActions'),
      icon: 'zap',
      children: quickActionsChildren,
    });

    return items;
  }

  private async detectCurrentProvider(): Promise<Provider | undefined> {
    const env = await this.configManager.getEnv();
    if (!env) {
      return undefined;
    }

    const currentBaseUrl = env.ANTHROPIC_BASE_URL || '';

    // Check presets
    const presets = this.presetManager.getPresets();
    for (const preset of presets) {
      if (await this.isProviderActive(preset)) {
        return preset;
      }
    }

    // Check custom providers
    const customProviders = this.presetManager.getCustomProviders();
    for (const custom of customProviders) {
      if (await this.isProviderActive(custom)) {
        return custom;
      }
    }

    return undefined;
  }

  private async isProviderActive(provider: Provider): Promise<boolean> {
    const env = await this.configManager.getEnv();
    if (!env) {
      return false;
    }

    const currentBaseUrl = env.ANTHROPIC_BASE_URL || '';
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

  dispose(): void {
    this.onDidChangeTreeDataEmitter.dispose();
  }
}

