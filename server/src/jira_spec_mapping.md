# READY Jira Build Spec mapping (Bridge Mode)

This file maps the Jira build spec fields to Bridge Mode DB fields.
Bridge Mode lets the DRI Board function locally *before* Jira integration exists.
When Jira is ready, these fields map 1:1 to Jira custom fields.

## Project
- Project Key: `READY`
- Issue types:
  - Readiness Epic
  - Intervention
  - Recovery
  - Subtasks used on Readiness Epics (and optionally others)

## Shared fields (all issue types)
From spec section **3.1 Shared Fields**:
- `P-Level` → `initiatives.p_level` (P0/P1/P2/P3)
- `Readiness Mode` → `initiatives.readiness_mode` (Launch Readiness, Operational Change, Performance Intervention, Regulatory/Policy, Reactive)

## Readiness Epic fields (spec section 3.2)
Examples captured in PDF extract:
- `Overall Readiness Status` → `initiatives.overall_readiness_status`
  - Not Started, Discovery, Planning, Implementation, Ready, Conditional, Blocked, Launched, Closed
- `Readiness Decision` → `initiatives.readiness_decision` (Go, No-Go, Conditional)
- `Risk Summary` → `initiatives.risk_summary`
- `Success Criteria` → `initiatives.success_criteria`
- `Readiness Owner` → `initiatives.owner`
- `Executive Sponsor` → `initiatives.executive_sponsor`

## Intake / Context fields (spec section 9)
From extract:
- `What is changing?` → `initiatives.title` (or a separate `change_summary` field if needed)
- `Who is impacted?` → `initiatives.impacted` (Advocates, BPO, Specific LOB, Customers)
- `Channel` → `initiatives.channel` (Voice, Messaging, Email)
- `LOB` → `initiatives.lob` (CashCards, MoneyMovements, Accounts + Settings, Scams + Disputes, General, Priority)

## Readiness Subtask fields (spec section 4)
Subtasks represent readiness elements.
- `Readiness Element` → `readiness_elements.readiness_element`
  - Knowledge (Content)
  - Training (L&D)
  - Tooling
  - Quality
  - Workforce
  - Vendor Management / BPO
  - Operations
  - Communications (Content)
  - Operational Readiness
  - Compliance / Regulatory
  - Data / Measurement
- `Functional DRI` → `readiness_elements.functional_dri`
- `What needs to happen` → `readiness_elements.what_needs_to_happen`
- `Dependencies` → `readiness_elements.dependencies`
- `Risk if not completed` → `readiness_elements.risk_if_not_completed`
- `Linked Partner Ticket` → `readiness_elements.linked_partner_ticket`
- `Due Date` → `readiness_elements.due_date`
- `Status` → `readiness_elements.status` (Not Started, In Progress, Complete, Blocked, N/A)

## Lifecycle mapping
Board lifecycle is:
- Active
- In Measurement
- Closed
- Paused

Jira spec includes separate workflows per issue type. Bridge Mode stores `initiatives.lifecycle` and you can later map:
- Active ← Jira statuses like Discovery/Planning/Implementation/In Progress
- In Measurement ← Jira status Measuring (or similar)
- Closed ← Closed
- Paused ← Cancelled/On Hold/Paused (if added)

## Note on swimlanes
User will not use swimlanes. This does not affect the data model.
