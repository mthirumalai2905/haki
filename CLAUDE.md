# Haki

## Product Definition

Haki is an AI powered multi channel outbound infrastructure platform.

Haki does not source or scrape leads in the current version.

Lead sourcing happens externally.

Haki starts when a user uploads an existing dataset containing businesses, contacts and communication touchpoints.

The core product flow is:

Upload data
→ Preview
→ Map fields
→ Validate
→ Import
→ Qualify
→ Create campaign
→ Build workflow
→ Generate messages
→ Review
→ Launch
→ Monitor
→ Analyze

---

## Core Product Mental Model

Haki should not feel like an email marketing tool.

It should feel like an outreach operating system.

The core mental model is:

DATA
↓
LEADS
↓
AI
↓
GOAL
↓
WORKFLOW
↓
MULTI CHANNEL OUTREACH
↓
CONVERSATIONS
↓
OUTCOMES

Email is only one communication channel.

---

## Initial Data Sources

The user can upload:

- CSV
- XLSX
- JSON

The first priority is CSV and XLSX.

Haki should not care where the data originally came from.

For example:

Hermes → CSV → Haki

Later:

CRM → Haki
API → Haki
Other sourcing system → Haki

The internal lead model must remain independent of the original source format.

---

## Ingestion

The first screen of the product should revolve around ingestion.

User uploads a dataset.

Haki should:

1. Read the file
2. Detect columns
3. Infer likely field mappings
4. Validate the data
5. Generate a preview
6. Show the first 100 rows
7. Allow field mapping corrections
8. Allow the user to confirm the import
9. Normalize the data
10. Store the leads

The user should always understand:

- What was uploaded
- How many rows exist
- How many columns exist
- What fields were detected
- What is valid
- What is missing
- What needs attention

---

## Preview

The preview should show approximately 100 rows.

Example:

Company | Contact | Email | Phone | LinkedIn | Website | Industry

The user should be able to:

- Horizontally scroll
- Search
- Inspect columns
- See validation states
- Change mappings
- Continue importing

Do not force the user to inspect thousands of rows.

---

## Lead Model

Every row eventually becomes a normalized lead.

Common fields:

- Company
- Contact
- First name
- Last name
- Job title
- Email
- Phone
- LinkedIn
- WhatsApp
- Reddit
- X
- Instagram
- YouTube
- Website
- Country
- Industry
- Company size
- Source
- Custom fields

Not every field will exist.

Missing fields are normal.

Unknown fields should not be discarded.

Custom fields should be preserved.

---

## Company Model

Companies and contacts should be treated separately.

One company can have multiple contacts.

Example:

Company
→ Acme

Contacts
→ John
→ Sarah
→ Mike

The system should support company level and contact level information.

---

## AI

DeepSeek is the AI provider.

AI should be used for:

- Column interpretation
- Data understanding
- Lead qualification
- ICP matching
- Campaign strategy
- Workflow generation
- Message generation
- Message rewriting
- Personalization
- Reply classification
- Conversation analysis
- Next action recommendations

All AI functionality must be abstracted behind a single AI layer.

Do not scatter AI logic throughout the application.

---

## AI Philosophy

AI should recommend and reason.

The execution system should validate and execute.

Do not allow raw AI output to directly trigger irreversible actions.

The flow should be:

User request
→ AI
→ Structured result
→ Validation
→ User review where necessary
→ Execution

---

## Lead Qualification

The user should be able to define an ICP.

Example:

Industry:
SaaS

Company size:
50 to 500

Location:
United States

Job title:
Founder / CEO

Haki can then analyze leads.

Example output:

Score: 87
Status: Qualified

Reason:

Strong ICP match because the company operates in SaaS, is within the target company size and the contact is a founder.

The qualification result should be structured.

---

## Campaigns

A campaign is an outreach objective applied to a group of leads.

A campaign contains:

- Audience
- Goal
- Workflow
- Messages
- Timing
- Channels
- Conditions
- Execution state
- Analytics

---

## Campaign Goals

Initial goals:

- Book meetings
- Generate replies
- Start conversations
- Drive website visits
- Generate leads
- Custom goal

The user can also describe their goal naturally.

Example:

"Reach SaaS founders and book discovery calls."

Haki can use AI to convert this into a campaign strategy.

---

## Audience

A campaign can target:

- All leads
- Selected leads
- Saved segment
- Filtered leads
- Qualified leads
- Custom audience

Filters can include:

- Industry
- Country
- Company size
- Job title
- Qualification score
- Has email
- Has phone
- Has LinkedIn
- Custom fields

---

## Workflow Engine

The workflow engine is the core of Haki.

A workflow consists of:

Trigger
→ Action
→ Wait
→ Condition
→ Action
→ Outcome

Example:

Lead enters campaign
↓
AI qualification
↓
Send email
↓
Wait 24 hours
↓
Has replied?
├── Yes → Stop
└── No → LinkedIn message
↓
Wait
↓
SMS
↓
Stop

The workflow must not be hardcoded around email.

---

## Workflow Actions

Initial actions:

- Send email
- Send SMS
- Make phone call
- Send LinkedIn message
- Send WhatsApp message
- Send X message
- Send Reddit message

Future channels may include:

- Instagram
- YouTube
- Other communication channels

Channels that are not implemented should be clearly marked as unavailable or coming soon.

Never fake successful communication.

---

## Workflow Conditions

Examples:

- Email opened
- Email replied
- Link clicked
- SMS replied
- Call answered
- LinkedIn connected
- LinkedIn replied
- Meeting booked
- No response
- Positive response
- Negative response

---

## AI Decision Node

Haki should eventually support an AI decision node.

Example:

"Based on this lead's profile and previous conversation, determine the next best outreach channel."

Possible output:

Email
LinkedIn
SMS
Phone
Stop

The AI decision should always produce structured output.

---

## Workflow Builder

The workflow should be visually editable.

Users should be able to:

- Add nodes
- Delete nodes
- Move nodes
- Connect nodes
- Edit nodes
- Add conditions
- Add waits
- Duplicate nodes
- Rearrange workflow steps

The workflow should visually communicate:

What happens
→ When it happens
→ What condition is checked
→ What happens next

---

## AI Workflow Generation

The user should be able to say:

"Create a 7 touch campaign for SaaS founders. Start with email, then LinkedIn, then SMS. Stop if they reply."

Haki should generate a workflow.

The generated workflow must be shown to the user before saving or launching.

Never automatically launch an AI generated campaign.

---

## Messages

Messages should support personalization.

Variables:

- First name
- Last name
- Company
- Job title
- Industry
- Website
- Custom fields

Example:

Hi {{first_name}},

I noticed {{company_name}} is growing in {{industry}}.

...

AI actions:

- Generate
- Rewrite
- Shorten
- Make more personal
- Make more direct
- Change tone
- Generate variations

---

## Campaign Execution

Campaign execution must happen independently of the browser.

A user should not need to keep the application open.

Each enrolled lead should have:

- Current workflow step
- Current status
- Next action
- Next execution time
- Campaign
- Lead

The system must be resumable.

If something fails, the campaign should know where it stopped.

---

## Campaign Lead States

Possible states:

- Queued
- Active
- Waiting
- Paused
- Completed
- Failed
- Stopped
- Interested
- Not interested

---

## Activity System

Every important event should be recorded.

Examples:

- Lead imported
- Lead qualified
- Campaign started
- Email sent
- Email opened
- Email replied
- SMS sent
- SMS replied
- Call started
- Call answered
- LinkedIn message sent
- Positive reply detected
- Meeting booked
- Campaign stopped

This powers the timeline and analytics.

---

## Lead Journey

Every lead should have a chronological journey.

Example:

Lead imported
↓
AI qualified
↓
Email sent
↓
Email opened
↓
LinkedIn message sent
↓
Reply received
↓
Reply classified as positive
↓
Campaign stopped

The user should always understand:

What happened?

Why did it happen?

What happens next?

---

## Analytics

Initial metrics:

- Leads contacted
- Messages sent
- Open rate
- Reply rate
- Positive reply rate
- Meetings
- Conversion rate

Breakdowns:

- Campaign
- Channel
- Workflow step
- Industry
- Company size

Analytics should remain simple and actionable.

---

## Simulation Mode

Until communication providers are connected, Haki should support simulation mode.

Example:

Email action simulated
SMS action simulated
LinkedIn action simulated

Simulated actions must be clearly identified.

Never represent simulated activity as real outreach.

---

## Security

Never expose API keys to the frontend.

DeepSeek credentials must only exist server side.

The DeepSeek key should be supplied through environment configuration.

Never hardcode secrets.

Never commit secrets.

---

## Development Principle

Do not overbuild.

The MVP should focus on:

1. Ingestion
2. Leads
3. AI qualification
4. Campaigns
5. Workflow builder
6. AI workflow generation
7. Message generation
8. Campaign monitoring
9. Activity
10. Analytics

Do not build lead sourcing yet.

Do not build scraping yet.

Do not build every communication integration yet.

Build the infrastructure so those integrations can be added later.

---

## Final Product Principle

Haki should feel like:

"I give Haki my leads, tell Haki who I want to reach and what I want to achieve, and Haki builds and manages the outreach workflow."

The product is not:

CSV → Email campaign

The product is:

DATA
→ AI
→ WORKFLOW
→ MULTI CHANNEL OUTREACH
→ CONVERSATION
→ OUTCOME

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
