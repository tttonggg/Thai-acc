import { ERPPlugin } from '@/lib/plugin-interfaces';

export const billingPlugin: ERPPlugin = {
  name: 'billing',
  version: '1.0.0',
  init(ctx) {
    ctx.eventBus.on('invoice.issued', (data) => {
      // Stub: log billing event
      console.log('[billing] Invoice issued:', data);
    });
  },
  services: {
    // Stub: getPlanLimits(), checkQuota()
  },
};
