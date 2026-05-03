import { ERPPlugin, PluginContext } from './plugin-interfaces';
import { billingPlugin } from '@/plugins/billing-plugin';
import { ecommercePlugin } from '@/plugins/ecommerce-plugin';

export const plugins: ERPPlugin[] = [billingPlugin, ecommercePlugin];

export async function initPlugins(ctx: PluginContext): Promise<void> {
  for (const plugin of plugins) {
    try {
      if (plugin.init) {
        const result = plugin.init(ctx);
        if (result instanceof Promise) {
          await result;
        }
      }
    } catch (err) {
      console.warn(`[plugin-registry] Failed to init plugin "${plugin.name}":`, err);
    }
  }
}

export async function destroyPlugins(): Promise<void> {
  for (const plugin of plugins) {
    try {
      if (plugin.destroy) {
        const result = plugin.destroy();
        if (result instanceof Promise) {
          await result;
        }
      }
    } catch (err) {
      console.warn(`[plugin-registry] Failed to destroy plugin "${plugin.name}":`, err);
    }
  }
}

export function getPlugin(name: string): ERPPlugin | undefined {
  return plugins.find((p) => p.name === name);
}
