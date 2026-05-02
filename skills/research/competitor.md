# Skill: Competitor Profiling

## Description
Research and analyze competitor products from URLs, screenshots, or documentation. Extract feature lists, UI patterns, pricing models, and UX flows.

## Trigger
Use when:
- Building an alternative to existing software
- Need to understand market standards
- User provides competitor URLs or screenshots
- Designing features that must match industry norms

## Assigned Model
`opencode-go/qwen-3.6` (large context for analyzing multiple sources)

## Detailed Instruction / SOP

### Step 1: Source Collection
Gather all available sources:
- Website URLs (pricing, features, documentation)
- Screenshots (UI flows, components)
- User manuals or PDFs
- API documentation (if public)
- Review sites (G2, Capterra)

### Step 2: Feature Extraction
For each source, extract:
- **Core Features**: What does the product do?
- **UI Patterns**: Navigation, layout, components, colors
- **Workflows**: User journeys (e.g., Create Invoice → Send → Track Payment)
- **Pricing Tiers**: Plans, limits, feature gates
- **Integrations**: Third-party connections

### Step 3: Gap Analysis
Compare against project requirements:
- What features must we match?
- What features can we improve?
- What features can we skip (MVP)?
- What Thai-specific features are missing from competitors?

### Step 4: UX Pattern Library
Document reusable patterns:
- Navigation structure
- Form layouts
- Table designs
- Dashboard widgets
- Empty states
- Action menus

## Example Usage

```
Input: 32 screenshots of PEAK accounting system

Output: /docs/research/peak-competitor-profile.md
- Feature matrix (9 modules)
- UI pattern library (cards, tabs, dropdowns)
- Color palette & typography
- Document workflow: Quotation → Invoice → Receipt → Tax Invoice
- Pricing tiers: e-Document / Basic / Pro / Pro Plus / Premium
- Thai tax compliance features
- Gaps: Our system can improve on mobile responsiveness
```

## Output Format
Save to: `/docs/research/{competitor-name}-profile.md`
