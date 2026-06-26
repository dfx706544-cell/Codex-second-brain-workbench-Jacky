# Combined Office Workflow

Use this workflow when one input package should produce multiple Office deliverables.

## Common Scenario

Raw data and notes become:

- an Excel analysis workbook
- a PowerPoint management deck
- a Word brief or meeting memo

## Process

1. Read all source files in `inputs/`.
2. Build the Excel workbook first when structured data exists.
3. Use verified Excel outputs as the factual base for PPT and Word.
4. Create the PPT story from the key findings.
5. Create the Word brief for narrative detail, decisions, and action items.
6. Cross-check that numbers and claims match across all files.
7. Save final deliverables under `outputs/`.

## Default Output Set

```text
outputs/analysis_workbook.xlsx
outputs/management_deck.pptx
outputs/executive_brief.docx
```

## Good User Prompt

```text
Use the combined Office workflow.
Source files are in inputs/monthly_review_pack/.
Please produce an Excel analysis workbook, a 10-slide PPT, and a 2-page Word executive brief.
```

