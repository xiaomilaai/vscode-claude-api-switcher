import * as vscode from 'vscode';
import type { Provider, CustomProvider, ProviderCategory, ClaudeEnvConfig, PresetApiKeyRecord } from '../config/types';
import { providerPresets, findPresetById, getPresetsByCategory } from '../config/presets';

const CUSTOM_PROVIDERS_KEY = 'claudeSwitch.customProviders';
const PRESET_API_KEYS_KEY = 'claudeSwitch.presetApiKeys';

/**
 * Manages provider presets and custom providers
 */
export class PresetManager {
  private static instance: PresetManager;
  private context: vscode.ExtensionContext | null = null;
  private readonly onProvidersChangeEmitter = new vscode.EventEmitter<void>();
  public readonly onProvidersChange = this.onProvidersChangeEmitter.event;

  private constructor() {}

  public static getInstance(): PresetManager {
    if (!PresetManager.instance) {
      PresetManager.instance = new PresetManager();
    }
    return PresetManager.instance;
  }

  /**
   * Initialize with extension context
   */
  public initialize(context: vscode.ExtensionContext): void {
    this.context = context;
  }

  /**
   * Get all preset providers
   */
  public getPresets(): Provider[] {
    return [...providerPresets];
  }

  /**
   * Get presets by category
   */
  public getPresetsByCategory(category: ProviderCategory): Provider[] {
    return getPresetsByCategory(category);
  }

  /**
   * Find preset by ID
   */
  public findPreset(id: string): Provider | undefined {
    return findPresetById(id);
  }

  /**
   * Get all custom providers
   */
  public getCustomProviders(): CustomProvider[] {
    if (!this.context) {
      return [];
    }
    return this.context.globalState.get<CustomProvider[]>(CUSTOM_PROVIDERS_KEY, []);
  }

  /**
   * Add a custom provider
   */
  public async addCustomProvider(
    name: string,
    env: ClaudeEnvConfig,
    meta?: { websiteUrl?: string; apiKeyUrl?: string }
  ): Promise<CustomProvider> {
    if (!this.context) {
      throw new Error('PresetManager not initialized');
    }

    const customProviders = this.getCustomProviders();

    // Generate unique ID
    const id = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const newProvider: CustomProvider = {
      id,
      name,
      category: 'custom',
      settingsConfig: { env },
      meta,
      createdAt: now,
      updatedAt: now,
    };

    customProviders.push(newProvider);
    await this.context.globalState.update(CUSTOM_PROVIDERS_KEY, customProviders);
    this.onProvidersChangeEmitter.fire();

    return newProvider;
  }

  /**
   * Update a custom provider
   */
  public async updateCustomProvider(
    id: string,
    updates: {
      name?: string;
      env?: ClaudeEnvConfig;
      meta?: { websiteUrl?: string; apiKeyUrl?: string };
    }
  ): Promise<CustomProvider | undefined> {
    if (!this.context) {
      throw new Error('PresetManager not initialized');
    }

    const customProviders = this.getCustomProviders();
    const index = customProviders.findIndex(p => p.id === id);

    if (index === -1) {
      return undefined;
    }

    const provider = customProviders[index];
    const updatedProvider: CustomProvider = {
      ...provider,
      name: updates.name ?? provider.name,
      settingsConfig: updates.env
        ? { env: updates.env }
        : provider.settingsConfig,
      meta: updates.meta ?? provider.meta,
      updatedAt: new Date().toISOString(),
    };

    customProviders[index] = updatedProvider;
    await this.context.globalState.update(CUSTOM_PROVIDERS_KEY, customProviders);
    this.onProvidersChangeEmitter.fire();

    return updatedProvider;
  }

  /**
   * Delete a custom provider
   */
  public async deleteCustomProvider(id: string): Promise<boolean> {
    if (!this.context) {
      throw new Error('PresetManager not initialized');
    }

    const customProviders = this.getCustomProviders();
    const index = customProviders.findIndex(p => p.id === id);

    if (index === -1) {
      return false;
    }

    customProviders.splice(index, 1);
    await this.context.globalState.update(CUSTOM_PROVIDERS_KEY, customProviders);
    this.onProvidersChangeEmitter.fire();

    return true;
  }

  /**
   * Find a custom provider by ID
   */
  public findCustomProvider(id: string): CustomProvider | undefined {
    return this.getCustomProviders().find(p => p.id === id);
  }

  /**
   * Get all providers (presets + custom)
   */
  public getAllProviders(): Provider[] {
    return [...this.getPresets(), ...this.getCustomProviders()];
  }

  /**
   * Find any provider by ID (preset or custom)
   */
  public findProvider(id: string): Provider | undefined {
    return this.findPreset(id) ?? this.findCustomProvider(id);
  }

  /**
   * Check if a provider name already exists
   */
  public isNameTaken(name: string, excludeId?: string): boolean {
    const allProviders = this.getAllProviders();
    return allProviders.some(
      p => p.name.toLowerCase() === name.toLowerCase() && p.id !== excludeId
    );
  }

  /**
   * Get all preset API keys
   */
  public getPresetApiKeys(): PresetApiKeyRecord {
    if (!this.context) {
      return {};
    }
    return this.context.globalState.get<PresetApiKeyRecord>(PRESET_API_KEYS_KEY, {});
  }

  /**
   * Get a preset provider's API key
   */
  public getPresetApiKey(providerId: string): string | undefined {
    const keys = this.getPresetApiKeys();
    return keys[providerId];
  }

  /**
   * Set a preset provider's API key
   */
  public async setPresetApiKey(providerId: string, apiKey: string): Promise<void> {
    if (!this.context) {
      throw new Error('PresetManager not initialized');
    }

    const keys = this.getPresetApiKeys();
    keys[providerId] = apiKey;
    await this.context.globalState.update(PRESET_API_KEYS_KEY, keys);
  }

  /**
   * Get a provider's API key (works for both preset and custom providers)
   */
  public getProviderApiKey(providerId: string): string | undefined {
    // Try preset first
    const presetKey = this.getPresetApiKey(providerId);
    if (presetKey !== undefined) {
      return presetKey;
    }

    // Try custom providers
    const customProviders = this.getCustomProviders();
    const customProvider = customProviders.find(p => p.id === providerId);
    if (customProvider) {
      return customProvider.settingsConfig.env.ANTHROPIC_AUTH_TOKEN ||
             customProvider.settingsConfig.env.ANTHROPIC_API_KEY;
    }

    return undefined;
  }

  /**
   * Update a provider's API key
   */
  public async updateProviderApiKey(
    providerId: string,
    apiKey: string,
    isCustom: boolean = false
  ): Promise<void> {
    if (isCustom) {
      // Update custom provider
      const customProviders = this.getCustomProviders();
      const index = customProviders.findIndex(p => p.id === providerId);

      if (index !== -1) {
        const provider = customProviders[index];
        const env = provider.settingsConfig.env;
        const keyField = env.ANTHROPIC_API_KEY !== undefined ? 'ANTHROPIC_API_KEY' : 'ANTHROPIC_AUTH_TOKEN';

        await this.updateCustomProvider(providerId, {
          env: {
            ...env,
            [keyField]: apiKey,
          },
        });
      }
    } else {
      // Update preset provider
      await this.setPresetApiKey(providerId, apiKey);
    }
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    this.onProvidersChangeEmitter.dispose();
  }
}
