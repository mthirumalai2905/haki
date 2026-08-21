# Haki Frontend

## Design Direction

Haki should feel like a premium AI native SaaS product.

Design inspiration:

- Notion
- Vercel
- Origami
- JoinReach

Do not copy these products.

Use them only as design references.

---

## Visual Style

The interface should be:

- Minimal
- Clean
- Premium
- Technical
- Calm
- Spacious
- Fast
- AI native

Prefer:

- Neutral colors
- Strong typography
- Subtle borders
- Small status indicators
- Lots of whitespace
- Minimal shadows
- Subtle animations

Avoid:

- Excessive gradients
- Generic purple AI designs
- Huge cards
- Excessive rounded containers
- Visually noisy dashboards
- Enterprise CRM aesthetics

---

# Application Shell

Persistent sidebar.

Navigation:

Haki AI
Universal (Beta)
Overview
Leads
Campaigns
Sequences
Analytics

`/hermes` redirects to Sequences. Do not add Hermes back to the sidebar.

Settings

The sidebar should be compact.

Top navigation:

- Page title
- Search
- Notifications
- Workspace
- User

Support a command palette.

---

# Haki Universal

Beta surface.

The operator describes a list. DeepSeek routes the brief to Wikidata or OpenStreetMap. The left panel shows the plan. The right panel is the live collection pass: a record counter, a progress bar, and each public hit as it lands.

Download the file or send it into Import.

Do not scrape Zillow, Redfin, LinkedIn, or Google. Do not invent emails. Mark it Beta.

---

# Overview

Header:

Good afternoon

Here's what's happening across your outreach.

Metrics:

- Active campaigns
- Total leads
- Messages sent
- Replies
- Meetings

Below:

Active campaigns

Recent activity

Performance

Keep this page minimal.

---

# Leads

The Leads screen is the primary data workspace.

Header:

Leads

Manage and organize the contacts entering your campaigns.

Primary action:

Import leads

Table:

Company
Contact
Email
Phone
LinkedIn
Industry
Status
Source

Features:

- Search
- Filters
- Sorting
- Column visibility
- Bulk selection

The table should feel closer to Notion/Airtable than a traditional CRM.

---

# Import

The import experience is one of the most important parts of the product.

Use a clear four step flow:

01 Upload
02 Map
03 Preview
04 Import

---

## Upload

Display:

Import your leads

Drop a CSV or XLSX file here
or choose a file

After upload:

filename
row count
column count
file size

Continue.

---

## Mapping

Display detected fields.

Example:

company_name → Company
email → Email
phone → Phone
linkedin_url → LinkedIn

Show confidence:

High
Medium
Low

Allow the user to manually change mappings.

Unknown columns should become custom fields.

---

## Preview

Display:

Preview

Showing 100 of 2,483 records

Metrics:

Rows
Columns
Valid emails
Valid phones
Duplicates
Missing fields

Show the first 100 rows.

The table should be highly polished.

---

## Import

Show progress.

Example:

Importing 2,483 leads...

After completion:

2,483 leads imported
2,401 valid emails
1,982 valid phones

CTA:

Create campaign

---

# Lead Drawer

Clicking a lead opens a right side drawer.

Show:

Person
Company
Contact information
Available channels
Qualification
Campaigns
Activity
AI summary
Next action

Do not navigate away from the lead table.

---

# Campaigns

Header:

Campaigns

Create and manage multi channel outreach.

Primary action:

Create campaign

Campaign list:

Campaign
Audience
Channels
Leads
Status
Reply rate
Meetings

Statuses:

Draft
Scheduled
Running
Paused
Completed

---

# Campaign Creation

Use:

01 Audience
02 Goal
03 Workflow
04 Messages
05 Review

Do not make this feel like a traditional multi page form.

It should feel like building a system.

---

# Audience

Allow:

All leads
Saved view
Filtered leads
Manual selection
Qualified leads

Show:

1,240 leads selected

---

# Goal

Ask:

What's the goal?

Options:

Book meetings
Generate replies
Start conversations
Drive website visits
Custom

Also provide an AI input:

Describe what you want to achieve...

---

# Workflow Builder

This is the most important UI in the product.

Use a visual node based editor.

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
└── No → LinkedIn
↓
Wait
↓
SMS

The workflow should visually feel like an AI operating system.

---

# Workflow Node

Node example:

[icon]

Send Email

Initial outreach

Email

...

Nodes should be compact.

Do not place configuration fields directly inside large nodes.

---

# Node Configuration

Selecting a node opens a side panel.

Example:

Send Email

Channel
Email

From

Subject

Message

Personalization

Timing

Keep the canvas clean.

---

# AI Workflow Builder

Inside the workflow editor provide:

Ask Haki

Example:

"Create a 5 touch campaign for SaaS founders using email, LinkedIn and SMS."

Haki generates the workflow.

Show the generated workflow.

Buttons:

Apply
Edit
Discard

Never silently modify the workflow.

---

# Message Editor

The message editor should feel like Notion.

Support:

{{first_name}}
{{company_name}}
{{industry}}
{{job_title}}

AI controls:

Generate
Improve
Shorten
Personalize
Change tone
Generate variations

---

# Campaign Review

Show:

Campaign ready

Audience
1,240 leads

Channels
Email
LinkedIn
SMS

Workflow
7 steps

Estimated duration
14 days

Show warnings.

Example:

84 leads do not have LinkedIn.

27 leads do not have phone numbers.

CTA:

Launch campaign

Secondary:

Save draft

---

# Campaign Details

Header:

SaaS Founder Outreach

Running

Metrics:

1,240 leads
3,421 actions
42% opened
8.2% replied
31 meetings

Tabs:

Overview
Sequence
Workflow
Leads
Activity
Analytics

Sequence is the primary authoring surface: ordered step cards plus Ask Haki chat. Click a card to edit channel-specific content. Email steps can paste subject/body and optionally toggle a per-lead AI video (simulated). Launch asks Send now vs Schedule.

Workflow (canvas) stays as a compiled fallback of the same spec.

---

# Activity Feed

Show real time style activity.

Example:

2m ago
Email sent to John Smith

5m ago
AI qualified Acme as qualified

8m ago
Reply received from Sarah

---

# Lead Journey

Show a chronological timeline.

Example:

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
Campaign stopped

Always show the next planned action.

---

# Analytics

Keep analytics simple.

Metrics:

Delivery
Open rate
Reply rate
Positive reply rate
Meetings
Conversion

Break down by:

Channel
Campaign
Industry
Workflow step

---

# Command Palette

Support Cmd/Ctrl + K.

Actions:

Create campaign
Import leads
Search leads
Search campaigns
Pause campaign
Resume campaign
Open analytics
Settings

---

# Empty States

Example:

No campaigns yet

Build your first multi channel outreach workflow.

Create campaign

Avoid generic empty states.

---

# Interaction Principles

Prioritize:

- Keyboard shortcuts
- Drag and drop
- Inline editing
- Side drawers
- Context menus
- Smooth transitions
- Undo
- Redo

Animations should be subtle.

---

# Responsive Design

Desktop first.

Optimize primarily for large desktop screens and laptops.

Mobile is not the primary experience for the MVP.

---

# Most Important Screens

Spend the most design effort on:

1. Import
2. Data preview
3. Leads
4. Campaign builder
5. Workflow builder
6. Campaign details

These define the Haki experience.