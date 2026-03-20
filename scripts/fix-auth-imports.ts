#!/usr/bin/env bun
/**
 * Fix Authentication Imports in API Routes
 *
 * This script fixes the authentication bug where API routes are using
 * the wrong requireAuth from @/lib/api-utils instead of @/lib/api-auth
 */

import { readFileSync, writeFileSync } from 'fs'
import { globSync } from 'glob'

interface FixResult {
  file: string
  fixed: boolean
  error?: string
}

const results: FixResult[] = []

function fixFile(filePath: string): FixResult {
  try {
    let content = readFileSync(filePath, 'utf-8')
    const originalContent = content
    let modified = false

    // Check if file uses api-utils requireAuth
    if (!content.includes('requireAuth') || !content.includes('api-utils')) {
      return { file: filePath, fixed: false }
    }

    // Step 1: Add NextRequest import if not present
    if (!content.includes('NextRequest')) {
      content = content.replace(
        /import\s+{\s*([^}]+)}\s+from\s+["']@\/lib\/api-utils["']/,
        (match, imports) => {
          // Add NextRequest import at the top
          return `import { NextRequest } from "next/server"\nimport { ${imports} } from "@/lib/api-utils"`
        }
      )
      modified = true
    }

    // Step 2: Change imports from api-utils to api-auth
    content = content.replace(
      /from\s+["']@\/lib\/api-utils["']/g,
      'from "@/lib/api-auth"'
    )

    // Step 3: Add apiSuccess and AuthError to imports if needed
    if (content.includes('apiResponse') && !content.includes('apiSuccess')) {
      content = content.replace(
        /import\s*{\s*([^}]+)}\s+from\s+["']@\/lib\/api-auth["']/,
        (match, imports) => {
          const importList = imports.split(',').map(s => s.trim())
          if (!importList.includes('apiSuccess')) {
            importList.push('apiSuccess')
          }
          if (!importList.includes('AuthError')) {
            importList.push('AuthError')
          }
          return `import { ${importList.join(', ')} } from "@/lib/api-auth"`
        }
      )
      modified = true
    }

    // Step 4: Change Request to NextRequest in function signatures
    content = content.replace(
      /export\s+async\s+function\s+(\w+)\s*\(\s*request\s*:\s*Request/g,
      'export async function $1(request: NextRequest'
    )

    // Step 5: Pass request parameter to requireAuth
    content = content.replace(
      /await\s+requireAuth\(\s*\)/g,
      'await requireAuth(request)'
    )

    // Step 6: Change apiResponse to apiSuccess
    content = content.replace(
      /return\s+apiResponse\(/g,
      'return apiSuccess('
    )

    // Step 7: Change error checking to use AuthError
    content = content.replace(
      /if\s*\(\s*error\s+instanceof\s+Error\s+&&\s+error\.message\.includes\(["']ไม่ได้รับอนุญาต["']\)\s*\)/g,
      'if (error instanceof AuthError)'
    )

    // Only write if content was modified
    if (content !== originalContent) {
      writeFileSync(filePath, content, 'utf-8')
      return { file: filePath, fixed: true }
    }

    return { file: filePath, fixed: false }
  } catch (error) {
    return {
      file: filePath,
      fixed: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

// Find all API route files
const apiFiles = globSync('src/app/api/**/*.ts', {
  ignore: ['**/*.bak', '**/node_modules/**']
})

console.log(`\n🔍 Found ${apiFiles.length} API route files\n`)

// Fix each file
for (const file of apiFiles) {
  const result = fixFile(file)
  results.push(result)

  if (result.fixed) {
    console.log(`✅ Fixed: ${file}`)
  } else if (result.error) {
    console.log(`❌ Error: ${file} - ${result.error}`)
  }
}

// Summary
const fixed = results.filter(r => r.fixed).length
const errors = results.filter(r => r.error).length

console.log(`\n📊 Summary:`)
console.log(`  ✅ Fixed: ${fixed} files`)
console.log(`  ❌ Errors: ${errors} files`)
console.log(`  ⏭️  Skipped: ${results.length - fixed - errors} files`)

if (fixed > 0) {
  console.log(`\n✨ Authentication imports fixed successfully!`)
}

process.exit(errors > 0 ? 1 : 0)
