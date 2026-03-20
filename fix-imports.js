const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/app/api/customers/[id]/route.ts',
  'src/app/api/vendors/[id]/route.ts',
  'src/app/api/payments/unpaid-invoices/route.ts',
  'src/app/api/payments/[id]/route.ts',
  'src/app/api/purchases/route.ts',
  'src/app/api/purchases/[id]/post/route.ts',
  'src/app/api/purchases/[id]/route.ts',
  'src/app/api/invoices/[id]/comments/route.ts',
  'src/app/api/invoices/[id]/comments/[commentId]/route.ts',
  'src/app/api/invoices/[id]/related/route.ts',
  'src/app/api/invoices/[id]/audit/route.ts',
  'src/app/api/invoices/[id]/issue/route.ts',
  'src/app/api/invoices/[id]/route.ts',
  'src/app/api/invoices/[id]/lines/[lineId]/route.ts'
];

filesToFix.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);

  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');

    // Replace apiResponse import from api-auth with api-utils
    content = content.replace(
      /import\s*{\s*requireAuth,\s*apiResponse,[^}]*}\s*from\s+@"\/lib\/api-auth"/g,
      'import { requireAuth, apiError, unauthorizedError, notFoundError, forbiddenError, AuthError } from "@/lib/api-auth"\nimport { apiResponse } from "@/lib/api-utils"'
    );

    // Replace any duplicate apiResponse imports
    content = content.replace(
      /import\s*{\s*[^}]*apiResponse[^}]*}\s*from\s+@"\/lib\/api-auth"/g,
      ''
    );

    // Clean up empty import lines
    content = content.replace(/\nimport\s*{\s*}\s*from\s+@"\/lib\/api-auth"\n/g, '\n');

    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Fixed: ${filePath}`);
  } else {
    console.log(`❌ File not found: ${filePath}`);
  }
});

console.log('🎉 Import fixes completed!');