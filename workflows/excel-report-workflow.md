# Excel Report Workflow

Use this workflow when the user provides raw data and needs a clean workbook, report, dashboard, or analysis table.

## Input

Typical files:

- `.xlsx`
- `.csv`
- `.tsv`
- exported system reports
- screenshots or PDF tables when necessary

Place files under `inputs/`.

## Process

1. Inspect source data:
   - sheet names
   - headers
   - row counts
   - date, currency, percentage, and ID fields
   - missing values and duplicates
2. Clean data:
   - normalize column names
   - remove empty rows or obvious duplicates
   - convert typed values correctly
   - preserve IDs as text when needed
3. Build analysis:
   - summary tables
   - formulas
   - pivots or grouped tables
   - charts
   - KPI highlights
4. Create final workbook:
   - raw data sheet, if useful
   - cleaned data sheet
   - summary sheet
   - dashboard or report sheet
   - notes or assumptions sheet when needed
5. Verify:
   - formulas calculate
   - no `#REF!`, `#DIV/0!`, `#VALUE!`, `#NAME?`, or obvious error cells
   - key numbers reconcile to source data
   - charts and tables are readable
   - column widths and row heights are not clipped

## Default Output

Save final Excel files under `outputs/` with a clear name, for example:

```text
outputs/monthly_sales_report.xlsx
```

## Good User Prompt

```text
Use the Excel report workflow.
The data is in inputs/sales_june.xlsx.
Please create a monthly sales report with regional summary, product ranking, revenue trend, and a dashboard.
```

