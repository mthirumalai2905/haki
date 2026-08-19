# Haki Backend Requirements

## Purpose

The backend powers the Haki outreach infrastructure.

It should support:

Data ingestion
Lead normalization
AI processing
Campaigns
Workflows
Execution
Activities
Analytics

The implementation technology is intentionally unspecified.

Choose the appropriate architecture based on the project.

---

# Core Data Flow

Upload
↓
Import
↓
Parse
↓
Normalize
↓
Validate
↓
Store leads
↓
AI qualification
↓
Campaign
↓
Workflow
↓
Execution
↓
Activity
↓
Analytics

---

# Import

An import represents a dataset uploaded by a user.

Import should track:

- File name
- File type
- File size
- Row count
- Column count
- Status
- Created time
- Completion time
- Error information

Statuses:

uploaded
processing
mapping
preview_ready
importing
completed
failed

---

# Parsing

The backend should parse CSV/XLSX files.

It should:

- Detect headers
- Detect row count
- Detect column count
- Infer data types
- Detect likely mappings
- Detect duplicates
- Validate common fields
- Generate the first 100 row preview

Do not load massive datasets entirely into browser memory.

---

# Field Mapping

Common mappings:

company_name
company
business
organization

→ company

email
email_address
business_email
work_email

→ email

phone
phone_number
mobile

→ phone

linkedin
linkedin_url

→ LinkedIn

Unknown fields must be preserved.

---

# Lead

A lead represents a person/contact.

Possible fields:

id
company_id
first_name
last_name
full_name
job_title
email
phone
linkedin
whatsapp
reddit
x
instagram
youtube
website
country
industry
company_size
source
custom_fields
status

---

# Company

Company fields:

id
name
domain
website
industry
company_size
country
state
city
linkedin
x
description
metadata

One company may contain many leads.

---

# Qualification

A lead qualification request contains:

- Lead
- Company
- ICP
- Campaign context

AI should return structured data.

Example:

{
  "score": 87,
  "status": "qualified",
  "reason": "Strong ICP match"
}

Validate before saving.

---

# Campaign

Campaign fields:

id
name
description
goal
audience
workflow
status
created_at
updated_at
started_at
completed_at

Statuses:

draft
scheduled
running
paused
completed
archived

---

# Campaign Lead

Tracks a lead's state inside a campaign.

Fields:

campaign_id
lead_id
status
current_node
next_execution_at
started_at
completed_at

Statuses:

queued
active
waiting
paused
completed
failed
stopped
interested
not_interested

---

# Workflow

A workflow contains nodes and transitions.

Node types:

trigger
action
condition
wait
ai_decision
end

Action examples:

send_email
send_sms
make_call
send_linkedin
send_whatsapp
send_x
send_reddit

---

# Workflow Conditions

Examples:

email_opened
email_replied
link_clicked
sms_replied
call_answered
linkedin_connected
linkedin_replied
meeting_booked
positive_reply
negative_reply
no_response

---

# Workflow Versioning

Workflows should be versioned.

Once a campaign is running, do not mutate its active workflow in place.

Create a new workflow version.

This ensures existing campaign leads remain deterministic.

---

# AI Layer

Create a centralized AI abstraction.

Capabilities:

qualifyLead
generateWorkflow
generateMessage
rewriteMessage
classifyReply
summarizeLead
recommendNextAction

The rest of the application should not need to know how DeepSeek works.

---

# DeepSeek

DeepSeek is the AI provider.

Use environment variables:

DEEPSEEK_API_KEY
DEEPSEEK_BASE_URL
DEEPSEEK_MODEL

The API key must remain server side.

Never expose it to frontend code.

Never commit it.

---

# AI Workflow Generation

Input:

User request
Campaign goal
Audience
Available channels
Lead fields

Output:

Structured workflow.

Example:

{
  "name": "SaaS Founder Outreach",
  "nodes": [],
  "edges": []
}

The output must be validated before persistence.

---

# AI Message Generation

Input:

Lead
Company
Campaign goal
Channel
Tone
Custom fields

Output:

Message.

Support personalization variables.

---

# Reply Classification

When a reply is received, AI should classify it.

Possible categories:

positive
negative
neutral
question
meeting_request
unsubscribe
out_of_office

The classification can determine the next workflow action.

---

# Execution Engine

Execution must be backend driven.

The browser must not be responsible for campaign execution.

Conceptually:

Campaign
↓
Campaign Lead
↓
Current Node
↓
Execute
↓
Record Activity
↓
Determine Next Node
↓
Schedule Next Action

---

# Idempotency

Actions must not accidentally execute twice.

Every execution should have a unique execution identity.

Before executing an action, verify whether it has already been executed.

---

# Rate Limiting

The execution system must eventually support:

- Per channel limits
- Per campaign limits
- Per provider limits
- Per account limits

Do not assume unlimited sending.

---

# Channel Abstraction

Communication channels should be pluggable.

Concept:

Channel
↓
Action
↓
Provider

Each provider should eventually support:

send
validate
status
webhook/event handling

The campaign engine should not be tightly coupled to individual providers.

---

# Initial Channel Registry

Email
SMS
Phone
LinkedIn
WhatsApp
X
Reddit
Instagram
YouTube

Some channels may initially operate in simulation mode.

---

# Simulation

Before real communication providers are connected:

Actions can be simulated.

Simulation must create activity records with:

simulated = true

The UI must clearly indicate simulation mode.

---

# Activities

Every major event creates an activity.

Examples:

lead_imported
lead_qualified
campaign_started
email_sent
email_opened
email_replied
sms_sent
sms_replied
call_started
call_answered
linkedin_message_sent
positive_reply
meeting_booked
campaign_paused
campaign_completed

Activity should include:

lead
campaign
workflow node
channel
action
status
metadata
timestamp

---

# Lead Timeline

Activities should be queryable by lead.

The backend should return chronological activity history.

---

# Analytics

Analytics should be derived from activity data.

Metrics:

leads_contacted
messages_sent
opens
replies
positive_replies
meetings
conversions

Breakdowns:

campaign
channel
workflow_step
industry
company_size

---

# Workspace Isolation

Every major object should belong to a workspace.

Users must only access data belonging to their workspace.

Authorization must be enforced server side.

Do not rely only on frontend filtering.

---

# Audit Log

Important actions should be auditable.

Track:

user
action
object
timestamp
metadata

Examples:

lead_imported
campaign_created
campaign_launched
campaign_paused
workflow_changed
settings_changed

---

# Error Handling

Backend errors should be structured.

Example:

{
  "success": false,
  "error": {
    "code": "IMPORT_FAILED",
    "message": "The uploaded file could not be processed."
  }
}

Never expose internal stack traces to users.

---

# Performance

The system should be designed for large datasets.

Do not send thousands of rows to the browser unnecessarily.

Use:

- Pagination
- Server-side filtering
- Server-side sorting
- Search
- Background processing for large imports

The 100 row preview is only a preview.

---

# Large Dataset Requirement

The architecture should eventually support:

10K leads
50K leads
100K+ leads

Do not build the ingestion system assuming a dataset will always be small.

---

# Data Integrity

Use validation for:

- Emails
- Phones
- URLs
- Required fields
- Duplicate records
- Workflow structure
- AI output

Never silently discard uploaded data.

---

# Campaign Safety

Before executing an action verify:

- Campaign is active
- Lead is eligible
- Lead is not opted out
- Channel exists
- Required contact information exists
- Action has not already executed
- Workflow state is valid

---

# Do Not Build Yet

Do not implement:

- Lead scraping
- Lead sourcing
- Hermes integration
- Real LinkedIn automation
- Real Reddit automation
- Real X automation
- Real Instagram automation
- Real YouTube automation
- Full voice infrastructure

Create the abstractions required for these future integrations.

---

# MVP Definition

The backend MVP is complete when:

1. User can upload CSV/XLSX
2. File is parsed
3. Columns are detected
4. Fields can be mapped
5. 100 row preview is generated
6. Data is validated
7. Leads are normalized
8. Leads can be searched
9. AI can qualify leads
10. Campaign can be created
11. Audience can be selected
12. Workflow can be generated
13. Workflow can be edited
14. Messages can be generated
15. Campaign can be launched in simulation mode
16. Execution state is tracked
17. Activities are recorded
18. Lead timelines work
19. Campaign analytics work

The system should be architected so real outreach providers can be plugged in later.