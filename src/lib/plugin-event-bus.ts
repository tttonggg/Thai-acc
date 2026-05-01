// Plugin event bus - pub/sub for ERP plugin communication
export type EventHandler<T = unknown> = (data: T) => void | Promise<void>;

type Subscription = {
  handler: EventHandler;
};

class PluginEventBus {
  private listeners: Map<string, Subscription[]> = new Map();

  on<T = unknown>(event: string, handler: EventHandler<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    const subs = this.listeners.get(event)!;
    const sub: Subscription = { handler: handler as EventHandler };
    subs.push(sub);

    // Return unsubscribe function
    return () => this.off(event, handler);
  }

  off<T = unknown>(event: string, handler: EventHandler<T>): void {
    const subs = this.listeners.get(event);
    if (subs) {
      const index = subs.findIndex((s) => s.handler === handler);
      if (index > -1) {
        subs.splice(index, 1);
      }
    }
  }

  async emit<T = unknown>(event: string, data: T): Promise<void> {
    const subs = this.listeners.get(event);
    if (subs) {
      await Promise.all(
        subs.map(async (sub) => {
          try {
            const result = sub.handler(data);
            if (result instanceof Promise) {
              await result;
            }
          } catch (err) {
            console.error(`[PluginEventBus] Error in handler for "${event}":`, err);
          }
        })
      );
    }
  }
}

export const pluginEventBus = new PluginEventBus();
