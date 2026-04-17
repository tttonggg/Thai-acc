<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-04-17 -->

# Progressive Web App (PWA)

## Purpose
PWA provider and service worker configuration for offline capabilities and install prompts.

## Key Files
| File | Description |
|------|-------------|
| `pwa-provider.tsx` | PWA initialization and update notifications |

## For AI Agents

### PWA Features
- Offline support via service worker
- Install prompt for mobile devices
- Background sync for offline changes
- Push notifications (future)

### PWA Provider Usage
```tsx
import { PWAProvider } from './pwa-provider'

// Wrap app with PWA provider
<PWAProvider>
  {children}
</PWAProvider>
```

### Service Worker
The service worker caches:
- App shell (static assets)
- API responses (with network-first strategy)
- Offline fallback pages

## Dependencies

### External
- next-pwa - PWA generation
- workbox - Service worker toolkit
- lucide-react - Icons for install prompt