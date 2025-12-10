import * as vscode from 'vscode';
import { ClaudeConfigManager } from './providers/claudeConfigManager';
import { PresetManager } from './providers/presetManager';
import { StatusBarManager } from './ui/statusBar';
import { registerCommands } from './ui/commands';
import { MainViewProvider } from './ui/sidebarProvider';

/**
 * Extension activation
 */
export function activate(context: vscode.ExtensionContext): void {
  console.log('Claude API Switcher is now active');

  // Initialize managers
  const configManager = ClaudeConfigManager.getInstance();
  const presetManager = PresetManager.getInstance();
  presetManager.initialize(context);

  // Create status bar
  const statusBar = new StatusBarManager();
  context.subscriptions.push({ dispose: () => statusBar.dispose() });

  // Create main sidebar provider
  const mainViewProvider = new MainViewProvider();

  // Register main tree view
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('claudeMain', mainViewProvider)
  );

  // Create refresh function
  const refreshSidebar = () => {
    mainViewProvider.refresh();
  };

  // Register commands
  const commandDisposables = registerCommands(context, statusBar, refreshSidebar);
  context.subscriptions.push(...commandDisposables);

  // Start config file watcher
  const watcherDisposable = configManager.startWatching();
  context.subscriptions.push(watcherDisposable);

  // Listen for config changes
  context.subscriptions.push(
    configManager.onConfigChange(async () => {
      await statusBar.update();
      refreshSidebar();
    })
  );

  // Listen for preset manager changes
  context.subscriptions.push(
    presetManager.onProvidersChange(() => {
      refreshSidebar();
    })
  );

  // Listen for configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('claudeSwitch')) {
        statusBar.update();
      }
    })
  );

  // Initial update
  statusBar.update();

  // Dispose on deactivation
  context.subscriptions.push(
    { dispose: () => mainViewProvider.dispose() },
    { dispose: () => configManager.dispose() },
    { dispose: () => presetManager.dispose() }
  );
}

/**
 * Extension deactivation
 */
export function deactivate(): void {
  console.log('Claude API Switcher is now deactivated');
}
