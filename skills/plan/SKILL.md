# Skill: Spec-Driven Development

## Description
Create comprehensive technical specifications before writing any code. This skill ensures every feature has clear requirements, acceptance criteria, and implementation plan before development begins.

## Trigger
Use when:
- Starting a new feature or module
- User requests a vague requirement (e.g., "add quotation system")
- Before spawning implementation agents
- When requirements are unclear or ambiguous

## Assigned Model
`opencode-go/kimi-k2.6` (planning + business context understanding)

## Detailed Instruction / SOP

### Step 1: Requirement Gathering
1. Ask clarifying questions to the user:
   - What is the business goal?
   - Who are the users?
   - What are the must-have vs nice-to-have features?
   - Are there any Thai accounting compliance requirements?
   - Any integrations needed (e-Tax, bank APIs)?

### Step 2: Scope Definition
Create a scope document with:
- **Feature Name**
- **Business Objective** (1-2 sentences)
- **User Stories** (As a [role], I want [action], so that [benefit])
- **In-Scope** (bullet list)
- **Out-of-Scope** (bullet list)
- **Dependencies** (other features/modules needed)

### Step 3: Acceptance Criteria
For each user story, define acceptance criteria using Gherkin syntax:
```gherkin
Given [context]
When [action]
Then [expected result]
```

### Step 4: Technical Constraints
- Database tables needed
- API endpoints required
- Frontend components needed
- Thai accounting rules to follow
- Performance requirements

### Step 5: Definition of Done
- [ ] All acceptance criteria pass
- [ ] Code reviewed and approved
- [ ] Tests written and passing (>= 80% coverage)
- [ ] Thai localization complete
- [ ] Documentation updated

## Example Usage

```
User: "I want to add a quotation system"

Planner (using this skill):
1. "Before we start, let me clarify:
   - Should quotations be convertible to invoices?
   - Do we need PDF export?
   - What quotation statuses do you need? (Draft, Sent, Accepted, Expired?)
   - Any approval workflow?"

2. Creates /docs/plans/quotation-system-spec.md:
   - 4 user stories
   - 12 acceptance criteria
   - 3 DB tables, 5 API endpoints, 4 frontend components
   - DoD checklist
```

## Output Format
Save to: `/docs/plans/{feature-name}-spec.md`
