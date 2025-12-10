/**
 * Core type definitions for Claude API Switcher
 */

/**
 * Provider category for classification
 */
export type ProviderCategory =
  | 'official'      // Official Anthropic
  | 'partner'       // Official partners
  | 'third_party'   // Third-party providers
  | 'custom';       // User-defined

/**
 * Claude Code settings.json env configuration
 */
export interface ClaudeEnvConfig {
  ANTHROPIC_BASE_URL?: string;
  ANTHROPIC_AUTH_TOKEN?: string;
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_MODEL?: string;
  [key: string]: string | undefined;
}

/**
 * Full Claude Code settings.json structure
 */
export interface ClaudeSettings {
  env?: ClaudeEnvConfig;
  [key: string]: unknown;
}

/**
 * Provider settings configuration (written to settings.json)
 */
export interface ProviderSettingsConfig {
  env: ClaudeEnvConfig;
}

/**
 * Provider metadata (not written to settings.json)
 */
export interface ProviderMeta {
  websiteUrl?: string;
  apiKeyUrl?: string;
  docsUrl?: string;
  description?: string;
  iconColor?: string;
}

/**
 * Provider definition
 */
export interface Provider {
  id: string;
  name: string;
  settingsConfig: ProviderSettingsConfig;
  category: ProviderCategory;
  meta?: ProviderMeta;
  icon?: string;
  iconColor?: string;
}

/**
 * Custom provider stored in extension storage
 */
export interface CustomProvider extends Provider {
  category: 'custom';
  createdAt: string;
  updatedAt: string;
}

/**
 * Provider with active state for UI display
 */
export interface ProviderWithState extends Provider {
  isActive: boolean;
}

/**
 * Quick pick item for provider selection
 */
export interface ProviderQuickPickItem {
  label: string;
  description?: string;
  detail?: string;
  provider: Provider;
  picked?: boolean;
}

/**
 * API keys for preset providers (stored in extension storage)
 */
export interface PresetApiKeyRecord {
  [providerId: string]: string;
}

/**
 * Configuration change event
 */
export interface ConfigChangeEvent {
  settings: ClaudeSettings;
  source: 'extension' | 'external';
}

/**
 * Form data for adding/editing custom provider
 */
export interface ProviderFormData {
  name: string;
  baseUrl: string;
  apiKey: string;
  model?: string;
  websiteUrl?: string;
  apiKeyUrl?: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

/**
 * Messages between webview and extension
 */
export type WebviewMessage =
  | { type: 'save'; data: ProviderFormData }
  | { type: 'cancel' }
  | { type: 'test'; data: ProviderFormData }
  | { type: 'ready' };

export type ExtensionMessage =
  | { type: 'init'; data: { provider?: CustomProvider; isEdit: boolean } }
  | { type: 'validationError'; errors: Record<string, string> }
  | { type: 'testResult'; success: boolean; message: string }
  | { type: 'saved' };
