module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/login',
        'http://localhost:3000/dashboard',
        'http://localhost:3000/invoices',
        'http://localhost:3000/accounts',
        'http://localhost:3000/reports',
      ],
      numberOfRuns: 3,
      startServerCommand: 'npm start',
      startServerReadyPattern: 'ready started server',
      startServerReadyTimeout: 60000,
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 1 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
        'categories:pwa': 'off',

        // Core Web Vitals
        'first-contentful-paint': ['warn', { maxNumericValue: 1800 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 200 }],
        interactive: ['warn', { maxNumericValue: 3800 }],

        // Resource budgets
        'resource-summary:script:size': ['warn', { maxNumericValue: 500000 }],
        'resource-summary:image:size': ['warn', { maxNumericValue: 1000000 }],
        'resource-summary:total:size': ['warn', { maxNumericValue: 2000000 }],
        'resource-summary:document:size': ['warn', { maxNumericValue: 50000 }],

        // DOM size
        'dom-size': ['warn', { maxNumericValue: 1500 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
