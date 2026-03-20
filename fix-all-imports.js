const fs = require('fs');
const path = require('path');

// Read all API route files and fix imports
const apiDir = path.join(process.cwd(), 'src/app/api');
const files = fs.readdirSync(apiDir, { recursive: true });

files.forEach(file => {
  if (file.endsWith('route.ts')) {
    const fullPath = path.join(apiDir, file);

    if (fs.existsSync(fullPath)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;

      // Fix 1: Replace apiResponse imports from api-auth with api-utils
      content = content.replace(
        /import\s*{\s*requireAuth,\s*apiResponse,[^}]*}\s*from\s+@"\/lib\/api-auth"/g,
        'import { requireAuth, apiError, unauthorizedError, notFoundError, forbiddenError, AuthError } from "@/lib/api-auth"\nimport { apiResponse } from "@/lib/api-utils"'
      );

      // Fix 2: Replace any remaining apiResponse imports from api-auth
      content = content.replace(
        /import\s*{\s*[^}]*apiResponse[^}]*}\s*from\s+@"\/lib\/api-auth"/g,
        ''
      );

      // Fix 3: Replace apiSuccess imports from api-auth with api-utils
      content = content.replace(
        /import\s*{\s*requireAuth,\s*apiSuccess,[^}]*}\s*from\s+@"\/lib\/api-auth"/g,
        'import { requireAuth, apiError, unauthorizedError, notFoundError, forbiddenError, AuthError } from "@/lib/api-auth"\nimport { apiResponse } from "@/lib/api-utils"'
      );

      // Fix 4: Replace any remaining apiSuccess imports from api-auth
      content = content.replace(
        /import\s*{\s*[^}]*apiSuccess[^}]*}\s*from\s+@"\/lib\/api-auth"/g,
        ''
      );

      // Fix 5: Replace AuthError imports from api-utils with api-auth
      content = content.replace(
        /import\s*{\s*[^}]*AuthError[^}]*}\s*from\s+@"\/lib\/api-utils"/g,
        'import { AuthError } from "@/lib/api-auth"'
      );

      // Clean up empty import lines
      content = content.replace(/\nimport\s*{\s*}\s*from\s+@"\/lib\/api-auth"\n/g, '\n');
      content = content.replace(/\n\s*from\s+@"\/lib\/api-auth"\n\n/g, '\n');

      // Only write if content changed
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ Fixed: ${file}`);
      }
    }
  }
});

console.log('🎉 All import fixes completed!');