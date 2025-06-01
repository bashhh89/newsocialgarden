// File: lib/pdf-generation/scorecard-pdf-v2.js
// Purpose: Defines the document structure and styles for pdfmake.
// This module is agnostic of client-side or server-side pdfmake instantiation.

import { toPdfMakeObject } from 'md-to-pdfmake'; // Ensure 'md-to-pdfmake' is installed

// Design Guideline Colors (as per user's project plan)
const colors = {
    primaryDarkTeal: '#103138',
    accentGreen: '#20E28F',
    lightMintBg: '#F3FDF5',
    accentBlue: '#01CEFE',
    accentOrange: '#FE7F01',
    yellowAccent: '#FEC401',
    creamBg1: '#FFF9F2',
    creamBg2: '#FFFCF2',
    white: '#FFFFFF',
    black: '#000000',
    gray: '#555555',
    lightGray: '#DDDDDD',
    textPrimary: '#1A202C',
    textSecondary: '#4A5568',
};

// PDF Styles (ensure 'PlusJakartaSans' is the primary font name used here)
const pdfStyles = {
    mainTitle: { fontSize: 30, bold: true, color: colors.primaryDarkTeal, margin: [0, 0, 0, 8], alignment: 'center' },
    subTitle: { fontSize: 14, color: colors.textSecondary, margin: [0,0,0,15], alignment: 'center' },
    h1: { fontSize: 20, bold: true, color: colors.primaryDarkTeal, margin: [0, 20, 0, 10] },
    h2: { fontSize: 16, bold: true, color: colors.primaryDarkTeal, margin: [0, 15, 0, 8] },
    h3: { fontSize: 14, bold: true, color: colors.textPrimary, margin: [0, 10, 0, 5] },
    paragraph: { margin: [0, 0, 0, 10], color: colors.textSecondary, lineHeight: 1.5 },
    boldText: { bold: true, color: colors.textPrimary },
    listItem: { margin: [0, 0, 0, 5], color: colors.textSecondary, lineHeight: 1.5 },
    headerFooter: { fontSize: 9, color: colors.gray }, // For page header/footer text
    footerText: { fontSize: 8, color: colors.gray, italics: true }, // For main document footer
    qnaPhase: { fontSize: 9, bold: true, color: colors.primaryDarkTeal, margin: [0,0,0,3] },
    qnaQuestion: { fontSize: 11, bold: true, color: colors.textPrimary, margin: [0,0,0,3] },
    qnaAnswer: { fontSize: 10, color: colors.textSecondary, margin: [0,0,0,3] },
    qnaOptions: { fontSize: 9, italics: true, color: colors.gray, margin: [0,0,0,3] },
    error: { color: 'red', fontSize: 16, bold: true, alignment: 'center' },
    card: { margin: [0, 10, 0, 15] }, // General margin for card-like table structures
    // Styles for md-to-pdfmake mapping (it will use these if elements are tagged)
    // If md-to-pdfmake supports passing a styles object directly, that's even better.
    // For now, ensure these style names are available if md-to-pdfmake outputs them.
    H1: { fontSize: 20, bold: true, color: colors.primaryDarkTeal, margin: [0, 15, 0, 8] },
    H2: { fontSize: 16, bold: true, color: colors.primaryDarkTeal, margin: [0, 10, 0, 6] },
    H3: { fontSize: 14, bold: true, color: colors.textPrimary, margin: [0, 8, 0, 4] },
    P: { margin: [0, 0, 0, 8], color: colors.textSecondary, lineHeight: 1.4 },
    STRONG: { bold: true, color: colors.textPrimary },
    EM: { italics: true },
    UL: { margin: [10, 5, 0, 10] },
    OL: { margin: [10, 5, 0, 10] },
    LI: { margin: [0, 0, 0, 5], color: colors.textSecondary, lineHeight: 1.4 },
};

function extractSectionContent(fullMarkdown, sectionTitleRegex, endMarkerRegexOrString) {
    if (!fullMarkdown || typeof fullMarkdown !== 'string') return '';
    const lines = fullMarkdown.split('\n');
    let content = '';
    let capture = false;
    for (const line of lines) {
        if (capture) {
            if ( (typeof endMarkerRegexOrString === 'string' && line.startsWith(endMarkerRegexOrString)) ||
                 (endMarkerRegexOrString instanceof RegExp && endMarkerRegexOrString.test(line)) ) {
                break;
            }
            content += line + '\n';
        }
        if (sectionTitleRegex.test(line)) {
            capture = true;
        }
    }
    return content.trim();
}

function markdownToPdfmakeObjects(markdownText) {
    if (!markdownText || typeof markdownText !== 'string' || markdownText.trim() === '') {
        return [{ text: '(This section is not available in the report data.)', style: 'paragraph', italics: true, margin: [0,5,0,5] }];
    }
    try {
        // Pass styles directly to toPdfMakeObject if the library version supports it,
        // or ensure the output uses style names defined in the main `pdfStyles` object.
        return toPdfMakeObject(markdownText, {
             // Example for custom tag styling if needed:
             // customTags: {
             //   strengthItem: { ul: true, style: 'listItem', markerColor: colors.accentGreen },
             //   weaknessItem: { ul: true, style: 'listItem', markerColor: colors.accentOrange }
             // }
        });
    } catch (error) {
        console.warn('Error converting markdown with md-to-pdfmake:', error, 'Returning raw text as fallback.');
        return [{ text: markdownText, style: 'paragraph' }];
    }
}

export function generateScorecardDocumentDefinition(SCORECARD_DEBUG_DATA) {
    if (!SCORECARD_DEBUG_DATA || !SCORECARD_DEBUG_DATA.UserInformation || !SCORECARD_DEBUG_DATA.ScoreInformation || !SCORECARD_DEBUG_DATA.FullReportMarkdown) {
        return {
            content: [{ text: 'Error: Critical Scorecard data is missing.', style: 'error' }],
            styles: { error: { color: 'red', fontSize: 20, bold: true, alignment: 'center', margin: [0, 200, 0, 0] } },
            defaultStyle: { font: 'Roboto' } // Fallback font if PlusJakartaSans isn't configured by PdfPrinter
        };
    }

    const { UserInformation, ScoreInformation, FullReportMarkdown, QuestionAnswerHistory } = SCORECARD_DEBUG_DATA;

    const keyFindingsSectionMd = extractSectionContent(FullReportMarkdown, /^## Key Findings/m, /^## Strategic Action Plan/m);
    const strengthsMd = extractSectionContent(keyFindingsSectionMd, /^\*\*Strengths:\*\*(.*?)(\n\*\*Weaknesses:\*\*|$)/ms, /^\*\*Weaknesses:\*\*/m);
    const weaknessesMd = extractSectionContent(keyFindingsSectionMd, /^\*\*Weaknesses:\*\*/m, /(?=##|$)/m);

    const strengthsPdfMake = markdownToPdfmakeObjects(strengthsMd ? `**Strengths:**\n${strengthsMd}` : '**Strengths:**\n- Not specified.');
    const weaknessesPdfMake = markdownToPdfmakeObjects(weaknessesMd ? `**Weaknesses:**\n${weaknessesMd}` : '**Weaknesses:**\n- Not specified.');

    const strategicActionPlanMd = extractSectionContent(FullReportMarkdown, /^## Strategic Action Plan/m, /^## Getting Started & Resources/m);
    const actionPlanPdfMake = markdownToPdfmakeObjects(strategicActionPlanMd);

    const gettingStartedResourcesMd = extractSectionContent(FullReportMarkdown, /^## Getting Started & Resources/m, /^## Illustrative Benchmarks/m);
    const resourcesPdfMake = markdownToPdfmakeObjects(gettingStartedResourcesMd);

    const illustrativeBenchmarksMd = extractSectionContent(FullReportMarkdown, /^## Illustrative Benchmarks/m, /^## Your Personalized AI Learning Path/m);
    const benchmarksPdfMake = markdownToPdfmakeObjects(illustrativeBenchmarksMd);

    const personalizedLearningPathMd = extractSectionContent(FullReportMarkdown, /^## Your Personalized AI Learning Path/m, /This report concludes here./m);
    const learningPathPdfMake = markdownToPdfmakeObjects(personalizedLearningPathMd);

    const docDefinition = {
        pageSize: 'A4',
        pageMargins: [40, 90, 40, 80],
        header: (currentPage) => {
            if (currentPage === 1) return null;
            return {
                columns: [
                    { text: `${UserInformation.CompanyName || 'Report'} - AI Efficiency Scorecard`, alignment: 'left', style: 'headerFooter', margin: [40, 30, 0, 0] },
                    { text: `Page ${currentPage}`, alignment: 'right', style: 'headerFooter', margin: [0, 30, 40, 0] }
                ],
            };
        },
        footer: (currentPage, pageCount) => {
            // Ensure the returned object is a valid Content type for pdfmake,
            // applying margin to a stack is a robust way.
            return {
                stack: [
                    {
                        columns: [
                            { text: `Report ID: ${ScoreInformation.ReportID || 'N/A'}`, alignment: 'left', style: 'footerText' },
                            { text: `© ${new Date().getFullYear()} ${UserInformation.CompanyName || ''}`, alignment: 'right', style: 'footerText' }
                        ]
                    }
                ],
                margin: [40, 20, 40, 0] // Margin for the stack itself
            };
        },
        content: [
            { text: 'AI Efficiency Scorecard', style: 'mainTitle', alignment: 'center', margin: [0, 150, 0, 10] },
            { text: `Report for: ${UserInformation.UserName || 'Valued User'}`, style: 'subTitle', alignment: 'center' },
            { text: `Organization: ${UserInformation.CompanyName || 'Your Company'}`, style: 'subTitle', alignment: 'center', margin: [0,0,0,20]},
            { text: `Date: ${new Date().toLocaleDateString()}`, style: 'subTitle', alignment: 'center', margin: [0,0,0,50]},
            {
                pageBreak: 'before', style: 'card',
                table: { widths: ['*'], body: [[{ stack: [
                    { text: 'User & Score Summary', style: 'h1', alignment: 'left', margin: [0,0,0,15] },
                    { columns: [
                        { width: '50%', stack: [
                            { text: 'User Information', style: 'h2'},
                            { text: [{text: 'Name: ', style: 'boldText'}, UserInformation.UserName || 'N/A'], style: 'paragraph' },
                            { text: [{text: 'Company: ', style: 'boldText'}, UserInformation.CompanyName || 'N/A'], style: 'paragraph' },
                            { text: [{text: 'Email: ', style: 'boldText'}, UserInformation.Email || 'N/A'], style: 'paragraph' },
                            { text: [{text: 'Industry: ', style: 'boldText'}, UserInformation.Industry || 'N/A'], style: 'paragraph' },
                        ]},
                        { width: '50%', stack: [
                            { text: 'Score Information', style: 'h2'},
                            { text: [{text: 'AI Tier: ', style: 'boldText'}, {text: ScoreInformation.AITier || 'N/A', color: colors.accentGreen, bold: true}], style: 'paragraph' },
                            { text: [{text: 'Final Score: ', style: 'boldText'}, `${ScoreInformation.FinalScore !== undefined && ScoreInformation.FinalScore !== null ? ScoreInformation.FinalScore : 'N/A'} / 100`], style: 'paragraph' },
                        ]}
                    ], columnGap: 20 }
                ], margin: [15,15,15,15] }]]}, layout: { fillColor: colors.creamBg1, defaultBorder: false },
            },
            {
                style: 'card', pageBreak: 'before',
                table: { widths: ['*'], body: [[{ stack: [
                    { text: 'Key Findings', style: 'h1', margin:[0,0,0,10] },
                    { columns: [
                        { stack: [/*{text: 'Strengths:', style: 'h2', color: colors.accentGreen},*/ ...strengthsPdfMake], width: '50%', margin: [0,0,10,0] },
                        { stack: [/*{text: 'Weaknesses:', style: 'h2', color: colors.accentOrange},*/ ...weaknessesPdfMake], width: '50%', margin: [10,0,0,0] }
                    ], columnGap: 20 }
                ], margin: [15,15,15,15] }]]}, layout: { fillColor: colors.white, defaultBorder: false },
            },
            {
                style: 'card', pageBreak: 'before',
                table: { widths: ['*'], body: [[{ stack: [ { text: 'Strategic Action Plan', style: 'h1', margin:[0,0,0,10] }, ...actionPlanPdfMake ], margin: [15,15,15,15] }]]}, layout: { fillColor: colors.creamBg2, defaultBorder: false },
            },
            {
                style: 'card', pageBreak: 'before',
                table: { widths: ['*'], body: [[{ stack: [ { text: 'Getting Started & Resources', style: 'h1', margin:[0,0,0,10] }, ...resourcesPdfMake ], margin: [15,15,15,15] }]]}, layout: { fillColor: colors.white, defaultBorder: false },
            },
            {
                style: 'card', pageBreak: 'before',
                table: { widths: ['*'], body: [[{ stack: [ { text: 'Illustrative Benchmarks', style: 'h1', margin:[0,0,0,10] }, ...benchmarksPdfMake ], margin: [15,15,15,15] }]]}, layout: { fillColor: colors.creamBg2, defaultBorder: false },
            },
            {
                style: 'card', pageBreak: 'before',
                table: { widths: ['*'], body: [[{ stack: [ { text: 'Your Personalized AI Learning Path', style: 'h1', margin:[0,0,0,10] }, ...learningPathPdfMake ], margin: [15,15,15,15] }]]}, layout: { fillColor: colors.white, defaultBorder: false },
            },
            { text: 'Question & Answer History', style: 'h1', pageBreak: 'before', margin: [0,0,0,10] },
            ...(QuestionAnswerHistory || []).map(item => ({
                style: 'card', // Using card style for background and margin
                table: { widths: ['*'], body: [[{
                    stack: [
                        { text: `Phase: ${item.phaseName}`, style: 'qnaPhase' },
                        { text: `Q: ${item.question}`, style: 'qnaQuestion' },
                        { text: `A: ${item.answerType === 'checkbox' || item.answerType === 'radio' ? (item.answer || '').split('|').map(s => s.trim()).join(', ') : (item.answer || 'N/A')}`, style: 'qnaAnswer' },
                        (item.options && Array.isArray(item.options) && item.options.length > 0) ? { text: `Options: ${item.options.join(', ')}`, style: 'qnaOptions' } : null,
                    ].filter(Boolean), margin: [15,15,15,15] // Inner padding
                }]]}, layout: { fillColor: colors.lightMintBg, defaultBorder: false },
            })),
        ],
        defaultStyle: pdfStyles.defaultStyle,
        styles: pdfStyles,
    };
    return docDefinition;
}