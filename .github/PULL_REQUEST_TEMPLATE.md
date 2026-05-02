## Summary
<!-- Briefly describe what this PR does -->

## Changes
<!-- List the key changes -->
- 
- 
- 

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Refactoring
- [ ] Documentation update

## Testing
<!-- How did you test this? -->
- [ ] Backend tests pass (`pytest tests/ -q`)
- [ ] Frontend build passes (`npm run build`)
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] No hardcoded secrets or credentials
- [ ] Multi-tenancy (`company_id` filter) verified for new queries
- [ ] Soft delete (`deleted_at`) used instead of `db.delete()`
- [ ] Decimal arithmetic used for financial calculations

## Deployment Notes
<!-- Any special deployment considerations? -->
