import { PrismaClient } from '@prisma/client';
import { pluginEventBus } from './plugin-event-bus';

export interface PluginContext {
  db: PrismaClient;
  eventBus: typeof pluginEventBus;
  config: Record<string, unknown>;
}

export type PluginHooks = Record<string, Function>;

export interface PluginRoute {
  path: string;
  handler: Function;
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
