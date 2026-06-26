# Second Brain Workbench v4 Data Hub Design

Date: 2026-06-25

## Goal

Upgrade the automation workbench from a task launcher into a personal second brain: a persistent system that records work, grows a traceable knowledge library, produces daily deliverables, and gradually learns the user's preferences and goals.

The chosen route is data-hub-first. Pages and assistants should read from structured data, not from scattered ad hoc files.

## Scope For v4

v4 will focus on the local data hub and visible retrieval surfaces:

- Knowledge library and database page.
- Task history page with categories.
- Daily two-email workflow:
  - Information brief.
  - Business feedback and account review.
- New assistants:
  - Personal Growth Assistant.
  - Health Assistant.
  - Personal Profile Assistant.
- Data files and workflows that let Codex update the system consistently.

Cloud or always-on execution while the computer is powered off is not in v4. That requires a future hosted environment with explicit security design.

## Data Model

Create a local data directory:

```text
automation-workbench/data/
```

Recommended files:

- `knowledge-items.json`: source-backed knowledge records.
- `task-history.json`: completed and pending workbench tasks.
- `daily-briefs.json`: information brief metadata and output file links.
- `business-feedback.json`: account review, outreach review, ecommerce opportunities, creator recommendations.
- `personal-profile.json`: user goals, preferences, constraints, working style, long-term interests.
- `health-log.json`: training, sleep, food, body metrics, health goals.
- `growth-library.json`: books, papers, mental models, psychology, logic, economics, finance, social/public-relations notes.

Each knowledge item should include:

- `id`
- `createdAt`
- `publishedAt`
- `title`
- `summaryZh`
- `sourceUrl`
- `sourceName`
- `domain`
- `tags`
- `credibility`
- `relatedAssistants`
- `impact`
- `nextAction`

Each task history record should include:

- `id`
- `createdAt`
- `completedAt`
- `category`
- `userText`
- `primaryAssistant`
- `secondaryAssistants`
- `skills`
- `sources`
- `status`
- `outputs`
- `summary`
- `nextAction`

## UI Design

Add a navigation layer to the workbench:

- Task Hub
- Knowledge Library
- Database
- History
- Daily Delivery
- Assistants
- Personal Profile

Knowledge Library:

- Library-style browsing.
- Filters: domain, assistant, source type, date, credibility, tags.
- Columns or cards: title, summary, collected time, published time, source URL, related action.

History:

- Searchable task ledger.
- Filters: ecommerce, finance, Office, social, creator, growth, health, system.
- Each row opens output links and a reusable prompt.

Daily Delivery:

- Shows latest information brief and business feedback.
- Contains email draft status.
- Does not send email automatically without configured safe sender and user confirmation.

Personal Profile:

- Shows remembered preferences and long-term goals.
- Allows the user to edit or delete entries.
- Sensitive data should not be displayed in broad dashboards.

## Assistant Design

Existing assistants remain, but their outputs should update the data hub:

- News Assistant writes `knowledge-items` and `daily-briefs`.
- Ecommerce/Account Analytics writes `business-feedback` and `task-history`.
- Finance Assistant writes source-backed research notes and risk watchlists.
- Creator/IP Assistant writes content hypotheses, scripts, and performance lessons.
- Skill Scout writes skill candidates, install logs, and system improvement suggestions.

New assistants:

Personal Growth Assistant:

- Covers psychology, logic, economics, finance, communication, social science, public relations, and learning systems.
- Outputs reading lists, concept cards, practice plans, and weekly themes.
- Uses source-backed materials where possible.

Health Assistant:

- Covers training, diet, sleep, body management, and habit tracking.
- Does not diagnose disease.
- Height-related plans must state biological limits and recommend medical consultation when age, pain, endocrine concerns, or abnormal development are involved.

Personal Profile Assistant:

- Learns from user-approved data.
- Stores preferences, goals, constraints, and working style.
- Must allow review, correction, and deletion.

## Daily Emails

Two separate email drafts should be produced:

1. Information Brief
   - Finance, macro, politics, social hotspots, AI, creator platforms, ecommerce, academic signals.
   - Must include source links.
   - Chinese explanation regardless of source language.

2. Business Feedback
   - Account review.
   - Outreach performance.
   - Creator/ecommerce opportunities.
   - Tomorrow's action plan.

Both drafts should be saved to `outputs/` and recorded in the data hub. Sending requires user confirmation or a separately configured safe mail sender.

## Automation Boundaries

Local v4 can run when the computer and Codex/workbench environment are available.

It cannot keep running after the computer is powered off. A future v5 can add cloud execution using one of:

- VPS.
- NAS.
- Cloud function.
- Hosted automation platform.

That future version needs:

- Encrypted credentials.
- Explicit permission scopes.
- Email sending controls.
- Audit logs.
- Remote backup and restore.

## Safety

- Never store passwords, OTPs, payment codes, or trading passwords in the data hub.
- Do not execute real trades.
- Do not send emails, social messages, forms, uploads, or app actions without user confirmation.
- `connect` remains available but is not default-enabled for any assistant.
- Health advice remains general wellness support, not medical diagnosis.

## Implementation Phases

Phase 1:

- Add `automation-workbench/data/` JSON stores.
- Add history writer to the queue bridge.
- Add sample data and read APIs.

Phase 2:

- Add Knowledge Library and History views.
- Add filters and source links.
- Add records for existing completed tasks.

Phase 3:

- Add Daily Delivery view and two-email workflow outputs.
- Add business feedback templates.

Phase 4:

- Add Personal Growth, Health, and Personal Profile assistants.
- Add workflows and prompt templates.

Phase 5:

- Add system improvement log and controlled self-evolution queue.
- Later evaluate cloud always-on v5.

## Acceptance Criteria

- The user can open the workbench and click Knowledge Library to browse records.
- The user can open History and see completed workbench tasks by category.
- A new queue task writes a history record when completed.
- Daily brief and business feedback are represented as separate draft outputs.
- The workbench can show source URLs and timestamps for knowledge items.
- Personal profile data is visible and editable.
- No sensitive credential is stored.
- Browser and Node checks pass.
