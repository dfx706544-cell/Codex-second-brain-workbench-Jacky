# PPT Generation Workflow

Use this workflow when the user provides data, documents, notes, or an Excel report and needs a presentation.

## Input

Typical files:

- Excel report or dashboard
- Word notes or meeting materials
- old PPT template
- brand reference
- text outline
- screenshots or charts

Place source files under `inputs/` and reusable templates under `templates/ppt/`.

## Process

1. Understand the story:
   - audience
   - decision or communication goal
   - key message
   - required length
2. Build a slide outline:
   - title
   - context
   - key findings
   - analysis
   - risks
   - recommendations
   - next steps
3. Draft each slide:
   - one clear point per slide
   - concise titles
   - readable body text
   - charts where they improve understanding
4. Apply template or visual style:
   - follow user-provided PPT if available
   - keep typography and spacing consistent
   - avoid overloaded slides
5. Verify:
   - no text overlap
   - no broken charts
   - no unresolved placeholders
   - titles do not wrap awkwardly
   - visuals are legible

## Default Output

Save final PPT files under `outputs/`, for example:

```text
outputs/monthly_business_review.pptx
```

## Good User Prompt

```text
Use the PPT generation workflow.
Use inputs/monthly_sales_report.xlsx and templates/ppt/company_template.pptx.
Create a 10-slide management review deck.
Focus on revenue, margin, regional performance, problems, and next actions.
```

