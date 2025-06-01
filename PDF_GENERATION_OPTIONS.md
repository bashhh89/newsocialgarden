# AI Efficiency Scorecard PDF Generation Options

This document outlines the different PDF generation methods available in the AI Efficiency Scorecard project.

## Available PDF Generation Methods

The scorecard preview page (`app/scorecard-preview-v6/page.tsx`) provides four different options for generating PDFs:

1. **PDFShift** - The original implementation using the PDFShift API
2. **Gamma WeasyPrint** - A WeasyPrint-based implementation with basic styling
3. **Standard WeasyPrint** - A standard WeasyPrint implementation with improved styling
4. **Presentation PDF** - A presentation-style PDF with enhanced formatting for slides

## Technical Implementation

### 1. PDFShift Implementation

- **API Route**: `/api/generate-scorecard-report-v6/download-pdf`
- **Technology**: Uses PDFShift's API for HTML-to-PDF conversion
- **Features**: Basic PDF conversion with minimal styling adjustments
- **Note**: Requires PDFShift API key in environment variables

### 2. Gamma WeasyPrint Implementation

- **API Route**: `/api/generate-gamma-weasyprint-report`
- **Technology**: Uses self-hosted WeasyPrint service
- **Service URL**: `http://168.231.86.114:5001/generate-pdf`
- **Features**: Basic PDF styling with landscape orientation

### 3. Standard WeasyPrint Implementation

- **API Route**: `/api/generate-weasyprint-report`
- **Technology**: Uses self-hosted WeasyPrint service
- **Service URL**: `http://168.231.86.114:5001/generate-pdf`
- **Features**: Improved styling and filename generation

### 4. Presentation-Style PDF Implementation

- **API Route**: `/api/generate-presentation-weasyprint-report`
- **Technology**: Uses self-hosted WeasyPrint service
- **Service URL**: `http://168.231.86.114:5001/generate-pdf`
- **Features**:
  - Custom cover page with company information
  - Section-based slide layout with one section per page
  - Enhanced styling for better readability
  - Page numbers and progress indicator
  - Improved action items and card styling
  - Optimized for presentation format

## Usage

To use any of these PDF generation methods:

1. Navigate to the scorecard preview page at `/scorecard-preview-v6`
2. Wait for the HTML preview to load
3. Click on the desired PDF generation button
4. The PDF will be generated and downloaded automatically

## Implementation Details

### WeasyPrint Service

The WeasyPrint service accepts POST requests with the following JSON structure:

```json
{
  "html_content": "HTML content to convert",
  "pdf_options": {
    "presentational_hints": true,
    "optimize_size": ["fonts", "images"],
    "full_page": true,
    "pdf_format": {
      "page_size": "A4",
      "orientation": "landscape",
      "margin": {
        "top": "0.5cm",
        "right": "0.5cm",
        "bottom": "0.5cm",
        "left": "0.5cm"
      }
    }
  }
}
```

### Presentation-Style PDF

The presentation-style PDF includes:

1. A custom cover page with:
   - Report title
   - Company name
   - Industry information
   - AI Tier and score
   - Report ID and date

2. Enhanced styling:
   - Section-based slides with page breaks
   - Improved typography for better readability
   - Enhanced action items with numbered steps
   - Color-coded sections for strengths and weaknesses
   - Page numbers and progress indicator

## Troubleshooting

If you encounter issues with PDF generation:

1. Check console logs for error messages
2. Verify the WeasyPrint service is running and accessible
3. Ensure HTML content is valid and properly formatted
4. Check for any CORS or network connectivity issues

For PDFShift-specific issues, verify your API key is properly configured in the environment variables. 