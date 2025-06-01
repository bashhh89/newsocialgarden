# SG Ready - PDF Generation Project

This repository contains the essential files for implementing PDF generation using multiple methods in a Next.js application.

## Project Structure

* `app/api/generate-scorecard-report-v6/` - Contains the main HTML generation logic
* `app/api/generate-gamma-weasyprint-report/` - WeasyPrint-based PDF generation
* `app/api/generate-weasyprint-report/` - Standard WeasyPrint implementation
* `app/api/generate-presentation-weasyprint-report/` - Presentation-style PDF generation
* `app/scorecard-preview-v6/` - Preview page with PDF generation options
* `components/ui/pdf-download/` - Contains the components for PDF generation and download
  * `ScorecardPDFDocument.tsx` - The main component for rendering the PDF
  * `ScorecardPDFDownloadButton.tsx` - Button component for triggering PDF download
  * `markdownRenderer.tsx` - Utility for rendering markdown in PDFs
  * `pdfStyles.ts` - Styling definitions for PDFs

## PDF Generation Options

This project supports multiple PDF generation methods:

1. **PDFShift** - HTML-to-PDF conversion using PDFShift API
2. **WeasyPrint** - Self-hosted WeasyPrint service for PDF generation
3. **Presentation-style PDF** - Enhanced WeasyPrint implementation with slide-like formatting

For detailed information about the PDF generation options, see [PDF_GENERATION_OPTIONS.md](./PDF_GENERATION_OPTIONS.md).

## Getting Started

1. Install dependencies:
```bash
npm install
# or
pnpm install
```

2. Run the development server:
```bash
npm run dev
# or
pnpm dev
```

3. Navigate to the scorecard preview page:
```
http://localhost:3000/scorecard-preview-v6
```

4. Use the buttons at the top of the preview page to generate PDFs using different methods.

## Next Steps

* Further enhance the presentation-style PDF with additional visual elements
* Implement PDF bookmarks/outline for better navigation
* Add more customization options for PDF generation
* Create a unified API for all PDF generation methods

## Documentation

* [PDF Generation Options](./PDF_GENERATION_OPTIONS.md) - Detailed information about PDF generation methods
* [Project Handover](./PROJECT_HANDOVER.md) - Project handover documentation
