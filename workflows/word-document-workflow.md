# Word Document Workflow

Use this workflow when the user provides notes, meeting transcripts, outlines, reports, or source documents and needs a polished Word document.

## Input

Typical files:

- meeting notes
- transcript text
- research notes
- old Word files
- policy drafts
- project materials
- Excel tables to embed or summarize

Place source files under `inputs/` and reusable Word templates under `templates/word/`.

## Process

1. Identify document type:
   - meeting minutes
   - proposal
   - SOP
   - report
   - memo
   - policy
   - checklist
2. Build structure:
   - title
   - summary
   - background
   - main content
   - tables or checklists
   - action items
   - appendix when needed
3. Draft or edit content:
   - preserve key facts
   - remove repetition
   - make responsibilities and dates explicit
   - keep language appropriate for the audience
4. Format:
   - consistent heading levels
   - readable body text
   - clean tables
   - page headers or footers if requested
5. Verify:
   - no broken tables
   - no clipped text
   - headings are consistent
   - page layout is clean
   - comments or tracked changes are handled as requested

## Default Output

Save final Word files under `outputs/`, for example:

```text
outputs/project_meeting_minutes.docx
```

## Good User Prompt

```text
Use the Word document workflow.
The notes are in inputs/meeting_notes.txt.
Please create formal meeting minutes with decisions, risks, owners, and next actions.
```

