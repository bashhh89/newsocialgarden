/**
 * Simplified HTML Generator for AI Efficiency Scorecard (WeasyPrint Version)
 * This utility generates a clean HTML document with minimal processing
 * to avoid markdown parsing issues.
 */

interface AnswerHistoryEntry {
  question: string;
  answer: string;
  phaseName?: string;
  reasoningText?: string;
  answerType?: string;
  options?: string[] | null;
  index?: number;
  answerSource?: string;
}

interface ScoreCardData {
  UserInformation: {
    Industry: string;
    UserName: string;
    CompanyName: string;
    Email: string;
  };
  ScoreInformation: {
    AITier: string;
    FinalScore: number | null;
    ReportID: string;
  };
  QuestionAnswerHistory: AnswerHistoryEntry[];
  FullReportMarkdown: string;
}

/**
 * Extracts key sections from the markdown content using a simplified approach
 */
function extractSections(markdownContent: string): Record<string, string> {
  const sections: Record<string, string> = {
    overall: '',
    keyFindings: '',
    strengths: '',
    weaknesses: '',
    strategicPlan: '',
    resources: ''
  };
  
  // Extract the overall tier section
  const overallMatch = markdownContent.match(/## Overall Tier:?([\s\S]*?)(?=##|$)/i);
  if (overallMatch) {
    sections.overall = overallMatch[1].trim();
  }
  
  // Extract key findings section
  const keyFindingsMatch = markdownContent.match(/## Key Findings([\s\S]*?)(?=##|$)/i);
  if (keyFindingsMatch) {
    sections.keyFindings = keyFindingsMatch[1].trim();
    
    // Extract strengths and weaknesses
    const strengthsMatch = keyFindingsMatch[1].match(/\*\*Strengths:\*\*([\s\S]*?)(?=\*\*Weaknesses|$)/i);
    if (strengthsMatch) {
      sections.strengths = strengthsMatch[1].trim();
    }
    
    const weaknessesMatch = keyFindingsMatch[1].match(/\*\*Weaknesses:\*\*([\s\S]*?)(?=##|$)/i);
    if (weaknessesMatch) {
      sections.weaknesses = weaknessesMatch[1].trim();
    }
  }
  
  // Extract strategic action plan
  const strategicPlanMatch = markdownContent.match(/## Strategic Action Plan([\s\S]*?)(?=##|$)/i);
  if (strategicPlanMatch) {
    sections.strategicPlan = strategicPlanMatch[1].trim();
  }
  
  // Extract resources section
  const resourcesMatch = markdownContent.match(/## Getting Started & Resources([\s\S]*?)(?=##|$)/i);
  if (resourcesMatch) {
    sections.resources = resourcesMatch[1].trim();
  }
  
  return sections;
}

/**
 * Formats the answer based on answer type
 */
function formatAnswer(item: AnswerHistoryEntry): string {
  if (item.answerType === 'checkbox' || item.answerType === 'radio') {
    if (typeof item.answer === 'string' && item.answer.includes('|')) {
      return item.answer.split('|').map(a => a.trim()).join(', ');
    }
  }
  
  return item.answer;
}

/**
 * Safely convert markdown text to HTML with minimal processing
 * This is a simplified version that avoids the problematic parsing issues
 */
function safeMarkdownToHTML(text: string): string {
  if (!text) return '';
  
  // Replace problematic characters
  let html = text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Remove any standalone # characters
  html = html.replace(/^#\s*$/gm, '');
  
  // Handle basic formatting
  html = html
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="report-link">$1</a>');
  
  // Handle line breaks - convert to paragraphs
  const paragraphs = html.split('\n\n').filter(p => p.trim() !== '');
  html = paragraphs.map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
  
  return html;
}

/**
 * Group questions by their phase name
 */
function groupQuestionsByPhase(questionAnswerHistory: AnswerHistoryEntry[]): Record<string, AnswerHistoryEntry[]> {
  const grouped: Record<string, AnswerHistoryEntry[]> = {};
  
  questionAnswerHistory.forEach((item, index) => {
    const phase = item.phaseName || 'Uncategorized';
    if (!grouped[phase]) {
      grouped[phase] = [];
    }
    // Add index for reference
    const itemWithIndex = { ...item, index };
    grouped[phase].push(itemWithIndex);
  });
  
  return grouped;
}

/**
 * Generate a simple HTML for the scorecard
 */
export function generateSimpleScorecardHTML(data: ScoreCardData): string {
  const { UserInformation, ScoreInformation, QuestionAnswerHistory, FullReportMarkdown } = data;
  
  // Extract sections from markdown
  const sections = extractSections(FullReportMarkdown);
  
  // Group Q&A items by phase
  const groupedQA = groupQuestionsByPhase(QuestionAnswerHistory);
  
  // Generate HTML
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Efficiency Scorecard - ${UserInformation.UserName}</title>
  <style>
    /* Base Styles */
    @page {
      size: A4;
      margin: 2cm;
    }
    
    body {
      font-family: 'Arial', sans-serif;
      color: #333;
      line-height: 1.5;
      margin: 0;
      padding: 0;
      font-size: 11pt;
    }
    
    h1, h2, h3, h4, h5, h6 {
      margin-top: 1em;
      margin-bottom: 0.5em;
      page-break-after: avoid;
      color: #103138;
    }
    
    h1 {
      font-size: 24pt;
      text-align: center;
      margin-top: 0;
    }
    
    h2 {
      font-size: 18pt;
      border-bottom: 1px solid #ddd;
      padding-bottom: 0.3em;
    }
    
    h3 {
      font-size: 14pt;
    }
    
    p {
      margin-bottom: 0.8em;
    }
    
    .header {
      text-align: center;
      margin-bottom: 2em;
      padding-bottom: 1em;
      border-bottom: 2px solid #103138;
    }
    
    .info-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2em;
      flex-wrap: wrap;
    }
    
    .info-card {
      border: 1px solid #ddd;
      padding: 1em;
      border-radius: 5px;
      width: 48%;
      box-sizing: border-box;
    }
    
    .section {
      margin-bottom: 2em;
      page-break-inside: avoid;
    }
    
    .section-title {
      background-color: #103138;
      color: white;
      padding: 0.5em;
      border-radius: 5px 5px 0 0;
    }
    
    .section-content {
      padding: 1em;
      border: 1px solid #ddd;
      border-top: none;
      border-radius: 0 0 5px 5px;
    }
    
    .qa-item {
      margin-bottom: 1em;
      padding-bottom: 1em;
      border-bottom: 1px solid #eee;
    }
    
    .qa-question {
      font-weight: bold;
    }
    
    .qa-answer {
      margin-top: 0.5em;
    }
    
    .footer {
      text-align: center;
      margin-top: 2em;
      padding-top: 1em;
      border-top: 1px solid #ddd;
      font-size: 9pt;
      color: #666;
    }
    
    .report-link {
      color: #0066cc;
      text-decoration: underline;
    }
    
    .tier-badge {
      display: inline-block;
      padding: 4px 12px;
      background-color: #103138;
      color: white;
      font-weight: bold;
      border-radius: 20px;
      font-size: 10pt;
    }
    
    .strengths-section {
      background-color: #f0fff0;
      padding: 1em;
      border-left: 4px solid #20E28F;
      margin-bottom: 1em;
    }
    
    .weaknesses-section {
      background-color: #fff0f0;
      padding: 1em;
      border-left: 4px solid #FE7F01;
      margin-bottom: 1em;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>AI Efficiency Scorecard</h1>
    <p>A comprehensive assessment of AI effectiveness and strategic opportunities</p>
  </div>
  
  <div class="info-section">
    <div class="info-card">
      <h3>Client Information</h3>
      <p><strong>Name:</strong> ${UserInformation.UserName}</p>
      <p><strong>Company:</strong> ${UserInformation.CompanyName}</p>
      <p><strong>Industry:</strong> ${UserInformation.Industry}</p>
      <p><strong>Email:</strong> ${UserInformation.Email}</p>
    </div>
    
    <div class="info-card">
      <h3>Assessment Results</h3>
      <p><strong>AI Tier:</strong> ${ScoreInformation.AITier} <span class="tier-badge">${ScoreInformation.AITier}</span></p>
      ${ScoreInformation.FinalScore ? `<p><strong>Score:</strong> ${ScoreInformation.FinalScore}</p>` : ''}
      <p><strong>Report ID:</strong> ${ScoreInformation.ReportID}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
  </div>
  
  <div class="section">
    <h2 class="section-title">Overall Assessment</h2>
    <div class="section-content">
      ${safeMarkdownToHTML(sections.overall)}
    </div>
  </div>
  
  <div class="section">
    <h2 class="section-title">Key Findings</h2>
    <div class="section-content">
      <div class="strengths-section">
        <h3>Strengths</h3>
        ${safeMarkdownToHTML(sections.strengths)}
      </div>
      
      <div class="weaknesses-section">
        <h3>Weaknesses</h3>
        ${safeMarkdownToHTML(sections.weaknesses)}
      </div>
    </div>
  </div>
  
  <div class="section">
    <h2 class="section-title">Strategic Action Plan</h2>
    <div class="section-content">
      ${safeMarkdownToHTML(sections.strategicPlan)}
    </div>
  </div>
  
  <div class="section">
    <h2 class="section-title">Assessment Responses</h2>
    <div class="section-content">
      ${Object.entries(groupedQA).map(([phase, items]) => `
        <div class="qa-phase">
          <h3>${phase}</h3>
          
          ${items.map((item, index) => `
            <div class="qa-item">
              <div class="qa-question">Q${item.index !== undefined ? item.index + 1 : index + 1}: ${item.question}</div>
              <div class="qa-answer">${formatAnswer(item)}</div>
              ${item.reasoningText ? `<div class="qa-reasoning"><em>${item.reasoningText}</em></div>` : ''}
            </div>
          `).join('')}
        </div>
      `).join('')}
    </div>
  </div>
  
  <div class="footer">
    <p>AI Efficiency Scorecard | Generated for ${UserInformation.UserName} at ${UserInformation.CompanyName}</p>
    <p>© ${new Date().getFullYear()} - All Rights Reserved</p>
  </div>
</body>
</html>`;
} 