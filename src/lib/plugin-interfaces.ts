import { PrismaClient } from '@prisma/client';
import { pluginEventBus } from './plugin-event-bus';

export interface PluginContext {
  db: PrismaClient;
  eventBus: typeof pluginEventBus;
  config: Record<string, unknown>;
}

export type PluginHooks = Record<string, (...args: unknown[]) => unknown>;

export interface PluginRoute {
  path: string;
  handler: (...args: unknown[]) => unknown;
}

export interface ERPPlugin {
  name: string;
  version: string;
  init?(ctx: PluginContext): Promise<void> | void;
  destroy?(): Promise<void> | void;
  services?: Record<string, unknown>;
  components?: Record<string, React.ComponentType>;
  routes?: PluginRoute[];
  hooks?: PluginHooks;
}
