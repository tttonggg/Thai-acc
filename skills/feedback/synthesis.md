# Skill: Feedback Synthesis

## Description
Analyze production metrics, user feedback, and system logs to generate actionable insights and a prioritized backlog for the next development cycle.

## Trigger
Use when:
- A deployment cycle is complete
- User feedback is collected
- Production issues are reported
- Before planning the next sprint/cycle
- Monthly/quarterly retrospectives

## Assigned Model
`opencode-go/kimi-k2.6` (pattern analysis, planning, coordination)

## Detailed Instruction / SOP

### Step 1: Data Collection
Gather from multiple sources:
- **Production logs**: /root/thai-acc/logs/production.log
- **Error tracking**: Sentry, LogRocket
- **User feedback**: Support tickets, NPS surveys
- **Usage analytics**: Feature adoption, page views
- **Performance metrics**: Response times, error rates
- **Financial metrics**: Revenue, churn, conversion

### Step 2: Log Analysis
```python
def analyze_logs(log_file: str, days: int = 7):
    """Analyze production logs for patterns."""
    errors = defaultdict(int)
    slow_queries = []
    
    for line in parse_logs(log_file, days):
        if line.level == "ERROR":
            errors[line.error_type] += 1
        if line.duration > 1000:  # > 1 second
            slow_queries.append(line)
    
    return {
        "top_errors": sorted(errors.items(), key=lambda x: -x[1])[:10],
        "slow_queries": slow_queries[:20],
        "error_rate": sum(errors.values()) / total_requests
    }
```

### Step 3: User Feedback Categorization
```
Category          | Count | Priority | Examples
------------------|-------|----------|---------------------------
Bug Reports       | 15    | P0       "Invoice PDF broken"
Feature Requests  | 23    | P1       "Want recurring invoices"
UX Issues         | 8     | P1       "Can't find save button"
Performance       | 5     | P2       "Slow on mobile"
Documentation     | 3     | P3       "Need API docs"
```

### Step 4: Insight Generation
Identify patterns:
- **Recurring issues**: What fails most often?
- **Feature gaps**: What do users ask for repeatedly?
- **Performance bottlenecks**: What's slow?
- **Adoption gaps**: Which features are underused?

### Step 5: Backlog Prioritization
Use ICE scoring:
```
Impact (1-10) + Confidence (1-10) + Ease (1-10) = ICE Score

Example:
- Fix invoice PDF: I=9, C=9, E=3 → ICE=21
- Add recurring invoices: I=8, C=7, E=5 → ICE=20
- Mobile optimization: I=7, C=8, E=4 → ICE=19
```

### Step 6: Cycle Summary Report
```markdown
# Cycle 001 Retrospective

## What Went Well
- Quotation module deployed on time
- 95% test coverage achieved
- Zero critical bugs in production

## What Went Wrong
- Invoice PDF generation slow (>3s)
- 3 users reported confusion with status transitions
- Mobile layout breaks on small screens

## Action Items for Next Cycle
1. [P0] Optimize invoice PDF generation (target <1s)
2. [P1] Add status transition tooltips
3. [P1] Fix mobile responsive issues
4. [P2] Add keyboard shortcuts for power users

## Metrics
- Features delivered: 3
- Bugs fixed: 8
- Test coverage: 95%
- Uptime: 99.9%
- Avg response time: 245ms
```

### Step 7: Loop Back to Planning
Send summary to Orchestrator → Orchestrator updates state board → Next cycle begins

## Output Format
Save to: `/docs/feedback/cycle-{n}-retrospective.md`
