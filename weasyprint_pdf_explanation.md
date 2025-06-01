# Weasyprint PDF Customization Explanation

This document explains the modifications made to the codebase to generate a comprehensive Weasyprint PDF that includes all report data with proper formatting and layout.

## Objective

The goal was to ensure that the Weasyprint PDF output accurately reflects all the dynamic content from the online scorecard results page, including the full report markdown, strategic action plan, and question and answer history, with correct rendering and layout.

## Modifications Made

Two main files were modified to achieve this:

1.  **`app/api/generate-scorecard-weasyprint-report/download-pdf/route.ts`**: This file handles the API requests for generating and downloading the Weasyprint PDF.
    *   **Initial State:** This file was initially modified to return an empty HTML string to the PDF generator, resulting in a completely blank PDF.
    *   **Changes:** The code that set the `html` variable to an empty string was removed, and the original logic to call `generateScorecardHTML` with the fetched `reportData` was restored for both the `GET` and `POST` request handlers.
    *   **Further Refinement:** The `fetchReportData` function within this file was modified to improve the retrieval of user information (Name, Company, Email) from the Firestore document. Based on the structure observed in the `LeadCaptureForm.tsx`, the fetching logic was updated to prioritize common field names like `leadName`, `leadCompany`, and `leadEmail` from the top level of the Firestore document, while retaining fallbacks to other potential field names (`userName`, `companyName`, `email`) and a nested `UserInformation` object. This ensures that the real user data saved by the lead form is correctly fetched.

2.  **`app/api/generate-scorecard-weasyprint-report/html-generator.ts`**: This file is responsible for generating the HTML content that Weasyprint converts into a PDF.
    *   **Initial State:** This file contained the logic to generate the full HTML structure of the scorecard report, including all sections (Key Findings, Strategic Action Plan, etc.) and using placeholder-like data within the HTML template string for client and assessment information.
    *   **Changes (Including All Report Data):** The HTML structure was modified to include all the dynamic content from the report. This involved:
        *   Adding a section to display the **Assessment Q&A**, iterating through the `QuestionAnswerHistory` and formatting each question and answer.
        *   Dynamically generating the **Strategic Action Plan** section by extracting items from the `FullReportMarkdown` using the `extractStrategicPlan` function.
        *   Adding a section to include the **complete `FullReportMarkdown` content**.
    *   **Changes (Markdown Rendering):** To ensure the raw markdown content is displayed correctly as formatted text in the PDF, a basic **`renderMarkdown` function** was implemented within this file. This function converts common markdown syntax (like headings, bold, italic, and lists) into corresponding HTML tags. The `FullReportMarkdown` content is now processed by this `renderMarkdown` function before being inserted into the HTML template.
    *   **Changes (Layout and Page Breaks):** CSS rules were added and adjusted within the `<style>` block to improve the visual presentation of the rendered markdown content and control page breaks. This includes styling for markdown-generated HTML elements (like `h1` to `h6`, `p`, `ul`, `ol`, `li`, `strong`, `em`) and using `page-break-inside: avoid;` on relevant sections to prevent content from being split awkwardly across pages.
    *   **Data Usage:** The HTML template was updated to correctly use the `UserInformation`, `ScoreInformation`, `QuestionAnswerHistory`, and `FullReportMarkdown` objects passed in the `data` parameter to the `generateScorecardHTML` function, ensuring all sections are populated with real, fetched data.

## Result

By making these modifications, the Weasyprint PDF generation process now:
*   Fetches the complete report data, including user information, full markdown content, and question answer history, from Firestore.
*   Generates HTML that includes the specified brand color styling and a comprehensive layout.
*   Populates the client information, overall assessment, assessment results summary, full report details (rendered markdown), dynamic strategic action plan, and assessment Q&A sections with the real data fetched from Firestore.
*   Includes CSS rules to ensure proper markdown rendering, improve layout, and control page formatting and breaks.

This results in a PDF that has the desired visual design, accurate client/assessment details, and a complete, well-formatted representation of the online report content.
