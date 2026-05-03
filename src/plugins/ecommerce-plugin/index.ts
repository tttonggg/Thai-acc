import { ERPPlugin } from '@/lib/plugin-interfaces';

export const ecommercePlugin: ERPPlugin = {
  name: 'ecommerce',
  version: '1.0.0',
  init(ctx) {
    ctx.eventBus.on('invoice.issued', async (data) => {
      // Stub: sync to e-commerce platform
      console.log('[ecommerce] Sync invoice:', data);
    });
  },
  hooks: {
    'invoice.beforeCreate': async (data) => data,
  },
};
