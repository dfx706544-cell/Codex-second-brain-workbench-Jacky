# Office Automation Workflow

This workspace is the fixed entry point for Office automation tasks handled by Codex.

## Folder Roles

- `inputs/`: Put raw data, source documents, notes, exports, screenshots, and reference files here.
- `templates/`: Put reusable Excel, PowerPoint, and Word templates here.
- `work/`: Codex uses this for intermediate files, scripts, analysis, and temporary renders.
- `outputs/`: Final deliverables go here.
- `workflows/`: Reusable workflow instructions and task cards live here.
- `archive/`: Completed source packs or old runs can be stored here.

## Standard Request Format

When you want Codex to process a job, use this short format:

```text
Workflow:
Input files:
Output needed:
Audience:
Style:
Must include:
Deadline or constraints:
```

Example:

```text
Workflow: Excel monthly report
Input files: inputs/sales_june.xlsx
Output needed: Excel summary report and management PPT
Audience: department manager
Style: clean business style
Must include: revenue, gross margin, top regions, risk points, next actions
Deadline or constraints: 10 slides max
```

## Default Delivery Standard

Codex should:

1. Inspect the input files.
2. Confirm the intended output if the request is ambiguous.
3. Clean and structure the data.
4. Build the requested Office file.
5. Check formulas, layout, charts, and visual rendering when relevant.
6. Save the final result under `outputs/`.
7. Summarize what was created and link only the final deliverable.

