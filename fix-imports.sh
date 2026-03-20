#!/bin/bash

# Replace api-auth imports with api-utils for apiResponse
for file in $(find /Users/tong/Thai-acc/src/app/api/ -name "*.ts" -exec grep -l "from.*api-auth" {} \;); do
    echo "Fixing $file"
    # Remove AuthError if present
    sed -i '' '/AuthError/d' "$file"
    # Replace api-auth import with api-utils
    sed -i '' 's/from "@\/lib\/api-auth"/from "@\/lib\/api-utils"/' "$file"
done

echo "Done fixing imports"
