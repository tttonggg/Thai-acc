# Skill: Code Review and Quality

## Description
Review code for quality, maintainability, performance, and adherence to project standards. Uses a two-pass approach: fast scan + deep review.

## Trigger
Use when:
- Agent completes implementation
- Before merging to main branch
- During quality gate phase
- When suspicious code is detected

## Assigned Model
`opencode-go/deepseek-4-pro` (fast scan) + `opencode-go/glm-5.1` (deep review)

## Detailed Instruction / SOP

### Pass 1: Fast Scan (DeepSeek 4 Pro)
Check for obvious issues:
- Syntax errors
- Missing imports
- Unused variables
- Obvious security issues (SQL injection, XSS)
- Hardcoded secrets
- Missing error handling

### Pass 2: Deep Review (GLM 5.1)
Analyze for:
- Architecture alignment
- Business logic correctness
- API contract compliance
- Database query efficiency
- Test coverage adequacy

### Review Checklist

#### Code Quality
- [ ] Functions are small (< 30 lines ideally)
- [ ] Variable names are descriptive
- [ ] No magic numbers (use constants)
- [ ] Type hints are present
- [ ] Docstrings for public functions
- [ ] No code duplication (DRY)

#### Performance
- [ ] No N+1 queries
- [ ] Database indexes are used
- [ ] Large datasets use pagination
- [ ] No unnecessary re-renders (frontend)
- [ ] Images are optimized

#### Security
- [ ] Input validation on all endpoints
- [ ] Authentication on protected routes
- [ ] Authorization checks (RBAC)
- [ ] No SQL injection vectors
- [ ] No XSS vulnerabilities
- [ ] Secrets not in code

#### Testing
- [ ] Unit tests for business logic
- [ ] Integration tests for APIs
- [ ] Edge cases covered
- [ ] Test names describe behavior
- [ ] Coverage >= 80%

#### Thai Accounting Specific
- [ ] VAT calculation is correct (7%)
- [ ] Document numbering follows convention
- [ ] GL entries are balanced
- [ ] FIFO costing is implemented correctly
- [ ] Dates use correct calendar

### Review Comment Format
```
[SEVERITY] [CATEGORY] File:Line - Message

Examples:
[CRITICAL] [SECURITY] router.py:45 - SQL injection risk in raw query
[MAJOR] [QUALITY] service.py:120 - Function too long (80 lines), split into smaller functions
[MINOR] [STYLE] models.py:23 - Variable 'x' is not descriptive, use 'unit_price'
[INFO] [PERF] repository.py:67 - Consider adding index on contact_id for this query
```

### Decision Matrix
| Critical Issues | Major Issues | Minor Issues | Decision |
|----------------|--------------|--------------|----------|
| 0 | 0 | Any | APPROVE |
| 0 | 1-2 | Any | APPROVE with comments |
| 0 | 3+ | Any | REQUEST CHANGES |
| 1+ | Any | Any | REJECT |

## Output Format
Review report: `/docs/reviews/{feature}-review-{date}.md`
