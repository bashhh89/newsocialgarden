# AI Efficiency Scorecard WeasyPrint Report Generator

This module generates PDF reports for the AI Efficiency Scorecard using WeasyPrint. It creates a professionally formatted 17-page report with consistent styling, proper page breaks, and all required sections as specified in the requirements.

## Features

- **Complete HTML Template**: Professionally designed HTML template with embedded CSS for WeasyPrint
- **Markdown Parsing**: Converts markdown content to properly formatted HTML
- **Section Extraction**: Extracts specific sections from the full report markdown
- **Custom Styling**: Applies custom styling for different sections (strengths, challenges, action plan, etc.)
- **Dynamic Content**: Generates dynamic content based on the scorecard data
- **WeasyPrint Optimization**: Specifically optimized for WeasyPrint rendering

## API Endpoints

### 1. POST /api/generate-scorecard-weasyprint-report

Generates a PDF report from the provided scorecard data.

**Request Body:**
```json
{
  "UserInformation": {
    "Industry": "Property/Real Estate",
    "UserName": "User",
    "CompanyName": "test",
    "Email": "saleem@home.qandu.io"
  },
  "ScoreInformation": {
    "AITier": "Dabbler",
    "FinalScore": 2,
    "ReportID": "RrlkORTVBVeY4gTShGOW"
  },
  "QuestionAnswerHistory": [
    {
      "question": "How would you describe your organization's current use of AI tools?",
      "answer": "We are just beginning to explore AI tools",
      "phaseName": "Current AI Usage",
      "answerType": "radio"
    },
    // Additional questions...
  ],
  "FullReportMarkdown": "## Overall Tier: Dabbler\n\nAs a Dabbler, your organization is..."
}
```

**Response:**
- Content-Type: application/pdf
- Content-Disposition: attachment; filename="ai-scorecard-report.pdf"

### 2. GET /api/generate-scorecard-weasyprint-report/download-pdf?reportId=REPORT_ID

Downloads a PDF report for the specified report ID.

**Query Parameters:**
- `reportId`: The ID of the report to generate (e.g., "RrlkORTVBVeY4gTShGOW")

**Response:**
- Content-Type: application/pdf
- Content-Disposition: attachment; filename="ai-scorecard-REPORT_ID.pdf"

## Implementation Details

### HTML Template

The HTML template (`template.html`) is designed specifically for WeasyPrint with:
- Proper page size and margins
- Dynamic page numbering in footer
- Consistent typography and styling
- Appropriate page breaks
- Responsive tables and layouts

### HTML Generation

The HTML generator (`html-generator.ts`) processes the scorecard data:
1. Extracts sections from the full report markdown
2. Converts markdown to HTML
3. Applies custom styling to different sections
4. Populates the HTML template with the processed content

### PDF Generation

The PDF generator (`pdf-generator.ts`) converts the HTML to PDF using WeasyPrint:
1. Sends the HTML to the WeasyPrint service
2. Handles timeouts and errors
3. Returns the PDF as a buffer

## Usage Example

```typescript
// Example: Generate PDF from scorecard data
const response = await fetch('/api/generate-scorecard-weasyprint-report', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(scorecardData),
});

if (response.ok) {
  // Get PDF blob
  const pdfBlob = await response.blob();
  
  // Create download link
  const url = window.URL.createObjectURL(pdfBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ai-scorecard-report.pdf';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
}
```

## Requirements

- WeasyPrint service running at the URL specified in the environment variable `WEASYPRINT_SERVICE_URL` or the default URL
- Node.js environment with fetch API support
- File system access for reading the HTML template 