/**
 * PDFShift HTML Generator for AI Efficiency Scorecard (V5)
 * This utility generates a complete HTML document with embedded styling
 * for conversion to PDF via the PDFShift API.
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
 * Converts markdown to HTML elements
 * This is a simplified parser for the specific markdown used in the scorecard
 */
function parseMarkdown(markdown: string): string {
  if (!markdown) return '';

  let html = markdown;

  // Headers (ensure # is consumed)
  html = html.replace(/^#\s+(.*$)/gim, '<h1>$1</h1>');
  html = html.replace(/^##\s+(.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^###\s+(.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^####\s+(.*$)/gim, '<h4>$1</h4>');

  // Bold text (two patterns)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

  // Italic text (two patterns)
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');

  // Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="report-link">$1</a>');

  // Convert list items to temporary placeholders
  html = html.replace(/^\s*[\*\-]\s+(.*$)/gim, '<!-- UL_ITEM --><li>$1</li>');
  html = html.replace(/^\s*(\d+)\.\s+(.*$)/gim, '<!-- OL_ITEM --><li value="$1">$2</li>');

  // Handle paragraphs - replace multiple newlines with paragraph breaks
  // This needs to be done carefully to not break list items or headers
  html = html.split('\n').map(line => {
      if (line.trim() === '' && !line.includes('<!-- UL_ITEM -->') && !line.includes('<!-- OL_ITEM -->') && !line.startsWith('<h')) {
          return '<p></p>'; // Replace empty lines with paragraph breaks
      }
      return line;
  }).join('\n');

  // Clean up consecutive paragraph breaks
  html = html.replace(/<\/p><p><\/p><p>/g, '</p><p>');
  html = html.replace(/<p><\/p>/g, ''); // Remove empty paragraphs

  // Wrap consecutive list items in ul or ol tags
  // This is a more robust approach than line-by-line iteration
  html = html.replace(/(<!-- UL_ITEM --><li>.*?<\/li>)+/gs, '<ul class="bullet-list">$1</ul>');
  html = html.replace(/(<!-- OL_ITEM --><li value=".*?">.*?<\/li>)+/gs, '<ol class="numbered-list">$1</ol>');

  // Remove temporary placeholders
  html = html.replace(/<!-- UL_ITEM -->/g, '');
  html = html.replace(/<!-- OL_ITEM -->/g, '');

  // Wrap remaining non-block content in paragraphs
  // This is a simplified approach; a full markdown parser would be more accurate
  // but this attempts to wrap lines that don't start with known block tags
  const blockTags = ['<h', '<ul', '<ol', '<div', '<table', '<p>'];
  html = html.split('\n').map(line => {
      if (line.trim() === '') return ''; // Skip empty lines created by previous steps
      if (blockTags.some(tag => line.trim().startsWith(tag))) {
          return line; // Already a block element
      }
      return `<p>${line}</p>`; // Wrap in paragraph
  }).join('\n');

  // Clean up potential empty paragraphs around block elements
   html = html.replace(/<p>\s*<\/p>/g, '');


  return html;
}

/**
 * Groups questions by their phase name
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
 * Extracts key sections from the markdown content
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
 * Main function to generate a complete HTML document for the scorecard
 */
export function generateScorecardHTMLv5(reportData: ScoreCardData): string {
  const { UserInformation, ScoreInformation, QuestionAnswerHistory, FullReportMarkdown } = reportData;
  
  // Extract important sections from the markdown
  const sections = extractSections(FullReportMarkdown);
  
  // Split the markdown into sections by h2 headers
  const allSections = FullReportMarkdown.split(/^## /gm);
  
  // First item is empty or intro text
  const introText = allSections.shift()?.trim() || '';
  
  // Process sections
  const htmlFormattedTitles = [
      'Strategic Action Plan',
      'Illustrative Benchmarks',
      'Assessment Responses',
      'Your Personalized AI Learning Path',
      'Q&A Assessment Breakdown' // Based on the Q&A section structure
  ];

  const processedSections = allSections.map((section, index) => {
    const sectionTitle = section.split('\n')[0].trim();
    const sectionContent = section.substring(section.indexOf('\n')).trim();

    // Determine background color based on section index (for alternating backgrounds)
    let bgColorClass = '';
    if (index % 3 === 0) bgColorClass = 'card-bg-mint';
    else if (index % 3 === 1) bgColorClass = 'card-bg-cream-1';
    else bgColorClass = 'card-bg-cream-2';

    // Apply special styling for specific sections
    let specialClass = '';
    if (sectionTitle.includes('Strengths') || sectionTitle.toLowerCase().includes('strengths')) {
      specialClass = 'strengths-section';
    } else if (sectionTitle.includes('Weaknesses') || sectionTitle.toLowerCase().includes('weaknesses')) {
      specialClass = 'weaknesses-section';
    } else if (sectionTitle.includes('Strategic') || sectionTitle.includes('Action Plan')) {
      specialClass = 'action-section';
    } else if (sectionTitle.includes('Resources') || sectionTitle.includes('Getting Started')) {
      specialClass = 'resources-section';
    }

    // Conditionally parse markdown based on content
    let contentHtml = sectionContent; // Default to raw content

    // Check if the section content appears to be primarily markdown
    // Look for common markdown indicators and absence of significant HTML
    const isLikelyMarkdown =
        (!sectionContent.includes('<div') &&
         !sectionContent.includes('<table') &&
         !sectionContent.includes('<ul') &&
         !sectionContent.includes('<ol')) &&
        (sectionContent.includes('**') || // Bold markdown
         sectionContent.includes('*') ||  // Italic markdown
         sectionContent.includes('- ') || // List item markdown
         sectionContent.match(/^\d+\.\s+/) || // Numbered list item markdown
         sectionContent.startsWith('# ')); // H1 markdown

    if (isLikelyMarkdown) {
        contentHtml = parseMarkdown(sectionContent);
    }

    // Remove the specific problematic <p>#</p> pattern if it exists
    contentHtml = contentHtml.replace(/<p>#<\/p>/g, '');


    return {
      title: sectionTitle,
      content: contentHtml, // Use the conditionally generated HTML
      bgColorClass,
      specialClass
    };
  });
  
  // Group Q&A items by phase
  const groupedQA = groupQuestionsByPhase(QuestionAnswerHistory);
  
  // Generate the HTML with enhanced styling
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Efficiency Scorecard - ${UserInformation.UserName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    
    /* Base Styles */
    :root {
      /* Color Palette */
      --primary-dark-teal: #103138;
      --accent-green: #20E28F;
      --light-mint-bg: #F3FDF5;
      --accent-blue: #01CEFE;
      --accent-orange: #FE7F01;
      --yellow-accent: #FEC401;
      --cream-bg-1: #FFF9F2;
      --cream-bg-2: #FFFCF2;
      --default-text: #1A2B3C;
      --secondary-text: #4A5568;
      --white: #FFFFFF;
      --pale-blue: #F0F7FA;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      color: var(--default-text);
      line-height: 1.6;
      background-color: var(--pale-blue);
      padding: 20px;
      margin: 0;
      font-size: 11pt;
    }
    
    /* Report Container */
    .report-container {
      max-width: 800px;
      margin: 20px auto;
      background-color: var(--white);
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
      border-radius: 10px;
      position: relative;
      overflow: hidden;
    }
    
    /* Top Gradient Bar */
    .top-gradient-bar {
      height: 8px;
      background: linear-gradient(90deg, var(--accent-green), var(--accent-blue));
      width: 100%;
    }
    
    /* Header Styles */
    .header {
      text-align: center;
      padding: 30px 20px;
      position: relative;
      background-color: var(--white);
    }
    
    .header::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 85%;
      height: 2px;
      background: linear-gradient(90deg, 
        rgba(32, 226, 143, 0),
        rgba(32, 226, 143, 0.5),
        rgba(32, 226, 143, 0)
      );
    }
    
    .header-logo {
      width: 60px;
      height: 60px;
      margin: 0 auto 16px;
      background: linear-gradient(135deg, var(--accent-green), var(--accent-blue));
      border-radius: 15px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--white);
      font-weight: 800;
      font-size: 24px;
      box-shadow: 0 4px 12px rgba(32, 226, 143, 0.25);
    }
    
    .report-title {
      font-size: 36px;
      font-weight: 800;
      color: var(--primary-dark-teal);
      margin-bottom: 8px;
      background: linear-gradient(90deg, var(--primary-dark-teal), #205e6a);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
    
    .report-subtitle {
      font-size: 16px;
      color: var(--secondary-text);
      margin-bottom: 24px;
      line-height: 1.4;
    }
    
    .header-info {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 20px;
      margin-top: 24px;
    }
    
    .info-card {
      flex: 1;
      min-width: 280px;
      max-width: 350px;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    }
    
    .user-info {
      background-color: var(--light-mint-bg);
      border-left: 4px solid var(--accent-green);
    }
    
    .score-info {
      background: var(--cream-bg-1);
      border-left: 4px solid var(--yellow-accent);
    }
    
    .info-card h3 {
      color: var(--primary-dark-teal);
      margin-bottom: 15px;
      font-size: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    }
    
    .info-item {
      margin-bottom: 10px;
      display: flex;
    }
    
    .info-label {
      font-weight: 700;
      color: var(--primary-dark-teal);
      min-width: 90px;
      padding-right: 10px;
    }
    
    .info-value {
      color: var(--default-text);
      font-weight: 500;
    }
    
    .tier-badge {
      display: inline-block;
      padding: 4px 12px;
      background-color: var(--primary-dark-teal);
      color: var(--white);
      font-weight: 600;
      border-radius: 20px;
      font-size: 12px;
      letter-spacing: 0.5px;
      margin-left: 8px;
    }
    
    .tier-enabler {
      background-color: var(--accent-green);
    }
    
    .tier-dabbler {
      background-color: var(--yellow-accent);
    }
    
    .tier-leader {
      background-color: var(--accent-blue);
    }
    
    /* Main Content Area */
    .main-content {
      padding: 30px;
      background-color: var(--pale-blue);
    }
    
    /* Banner Images */
    .banner-image {
      width: 100%;
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 15px 0;
      object-fit: cover;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(0, 0, 0, 0.05);
    }
    
    .action-banner {
      height: 200px;
      object-position: center;
    }
    
    .resources-banner {
      height: 180px;
      object-position: center 30%;
    }
    
    /* Section Cards */
    .section-card {
      margin-bottom: 20px;
      background-color: var(--white);
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.07);
    }
    
    .card-header {
      padding: 15px 20px;
      background-color: var(--primary-dark-teal);
      color: var(--white);
      position: relative;
    }
    
    .card-header h2 {
      font-size: 20px;
      font-weight: 700;
      margin: 0;
    }
    
    .card-header::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 4px;
      background: linear-gradient(90deg, var(--accent-green), var(--accent-blue));
    }
    
    .card-body {
      padding: 20px;
    }
    
    /* Color Classes */
    .card-bg-mint {
      background-color: var(--light-mint-bg);
    }
    
    .card-bg-cream-1 {
      background-color: var(--cream-bg-1);
    }
    
    .card-bg-cream-2 {
      background-color: var(--cream-bg-2);
    }
    
    /* Decorative Elements */
    .section-divider {
      height: 3px;
      background: linear-gradient(90deg, var(--accent-green), var(--accent-blue));
      margin: 20px 0;
      border-radius: 2px;
      opacity: 0.7;
    }
    
    .highlight-box {
      background: linear-gradient(135deg, rgba(32, 226, 143, 0.1), rgba(1, 206, 254, 0.1));
      border-radius: 8px;
      padding: 15px;
      margin: 15px 0;
    }
    
    .callout-box {
      background-color: var(--light-mint-bg);
      border-radius: 8px;
      padding: 15px;
      margin: 15px 0;
      border-left: 4px solid var(--accent-green);
    }
    
    .callout-title {
      color: var(--primary-dark-teal);
      font-weight: 700;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
    }
    
    .callout-title::before {
      content: '→';
      color: var(--accent-green);
      margin-right: 8px;
      font-size: 18px;
    }
    
    .callout-content {
      color: var(--secondary-text);
    }
    
    /* Key Findings Section */
    .key-findings-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      margin-top: 15px;
    }
    
    .findings-col {
      flex: 1;
      min-width: 280px;
    }
    
    .strengths-card {
      background-color: var(--light-mint-bg);
      border-radius: 8px;
      padding: 15px;
      border-left: 4px solid var(--accent-green);
      margin-bottom: 15px;
    }
    
    .weaknesses-card {
      background-color: #FEF5EB;
      border-radius: 8px;
      padding: 15px;
      border-left: 4px solid var(--accent-orange);
      margin-bottom: 15px;
    }
    
    .findings-title {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    }
    
    .strengths-title {
      color: var(--accent-green);
    }
    
    .weaknesses-title {
      color: var(--accent-orange);
    }
    
    /* Special Sections */
    .strengths-section h3 {
      color: var(--accent-green);
      border-bottom: 1px solid var(--accent-green);
      padding-bottom: 5px;
      margin-bottom: 10px;
    }
    
    .strengths-section strong {
      color: var(--accent-green);
    }
    
    .weaknesses-section h3 {
      color: var(--accent-orange);
      border-bottom: 1px solid var(--accent-orange);
      padding-bottom: 5px;
      margin-bottom: 10px;
    }
    
    .weaknesses-section strong {
      color: var(--accent-orange);
    }
    
    .action-section h3 {
      color: var(--primary-dark-teal);
      border-bottom: 1px solid var(--primary-dark-teal);
      padding-bottom: 5px;
      margin-bottom: 15px;
      font-size: 16px;
      font-weight: 600;
    }
    
    .resources-section h3 {
      color: var(--accent-blue);
      border-bottom: 1px solid var(--accent-blue);
      padding-bottom: 5px;
      margin-bottom: 15px;
      font-size: 16px;
      font-weight: 600;
    }
    
    /* Action Plan Styling */
    .action-step {
      background-color: var(--light-mint-bg);
      padding: 15px;
      margin-bottom: 15px;
      border-radius: 8px;
      border-left: 4px solid var(--accent-green);
    }
    
    .action-title {
      font-weight: 700;
      color: var(--primary-dark-teal);
      margin-bottom: 10px;
    }
    
    /* Q&A Section */
    .qa-section {
      background-color: var(--white);
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.07);
      margin-top: 30px;
    }
    
    .qa-header {
      background-color: var(--primary-dark-teal);
      color: var(--white);
      padding: 15px 20px;
      position: relative;
    }
    
    .qa-header h2 {
      font-size: 20px;
      font-weight: 700;
      margin: 0;
    }
    
    .qa-header::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 4px;
      background: linear-gradient(90deg, var(--accent-blue), var(--accent-green));
    }
    
    .qa-phase {
      margin: 20px 20px 15px;
    }
    
    .phase-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--primary-dark-teal);
      border-bottom: 2px solid var(--accent-blue);
      padding-bottom: 8px;
      margin-bottom: 15px;
    }
    
    .qa-card {
      background-color: var(--light-mint-bg);
      padding: 15px;
      margin: 0 20px 15px;
      border-radius: 8px;
      border-left: 4px solid var(--accent-blue);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
    }
    
    .qa-question {
      color: var(--primary-dark-teal);
      font-weight: 600;
      margin-bottom: 12px;
      padding-left: 25px;
      position: relative;
    }
    
    .qa-question::before {
      content: 'Q:';
      position: absolute;
      left: 0;
      font-weight: 700;
      color: var(--accent-green);
    }
    
    .qa-answer {
      margin-bottom: 12px;
      padding-left: 25px;
      position: relative;
    }
    
    .qa-answer::before {
      content: 'A:';
      position: absolute;
      left: 0;
      font-weight: 700;
      color: var(--accent-blue);
    }
    
    .qa-reasoning {
      color: var(--secondary-text);
      font-size: 0.9rem;
      font-style: italic;
      padding: 12px 0 0 25px;
      border-top: 1px solid rgba(0, 0, 0, 0.08);
      position: relative;
    }
    
    .qa-reasoning::before {
      content: 'R:';
      position: absolute;
      left: 0;
      font-weight: 700;
      color: var(--accent-orange);
    }
    
    .qa-meta {
      display: flex;
      flex-wrap: wrap;
      margin-top: 12px;
      font-size: 0.85rem;
      color: var(--secondary-text);
      background-color: rgba(255, 255, 255, 0.5);
      padding: 8px;
      border-radius: 6px;
    }
    
    .qa-meta-item {
      margin-right: 15px;
      padding-right: 15px;
      border-right: 1px solid rgba(0, 0, 0, 0.1);
    }
    
    .qa-meta-item:last-child {
      border-right: none;
    }
    
    /* Typography Enhancements */
    .card-body h3 {
      color: var(--primary-dark-teal);
      font-size: 16px;
      font-weight: 600;
      margin-top: 15px;
      margin-bottom: 8px;
    }
    
    .card-body h4 {
      color: var(--primary-dark-teal);
      font-size: 14px;
      font-weight: 600;
      margin-top: 12px;
      margin-bottom: 6px;
    }
    
    .card-body p {
      margin-bottom: 10px;
      line-height: 1.6;
      color: var(--secondary-text);
    }
    
    .card-body strong {
      font-weight: 700;
      color: var(--default-text);
    }
    
    /* Lists */
    .bullet-list, .numbered-list {
      list-style-position: outside;
      padding-left: 20px;
      margin-bottom: 10px;
    }
    
    .bullet-list li, .numbered-list li {
      margin-bottom: 5px;
      padding-left: 8px;
    }
    
    /* Links */
    .report-link {
      color: var(--accent-blue);
      text-decoration: none;
      font-weight: 500;
      border-bottom: 1px dotted var(--accent-blue);
    }
    
    .report-link:hover {
      color: var(--accent-green);
      border-bottom-color: var(--accent-green);
    }
    
    /* Images */
    img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin-top: 10px;
      margin-bottom: 15px;
      display: block;
      border: 1px solid rgba(0, 0, 0, 0.05);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    /* Footer */
    .footer {
      text-align: center;
      padding: 20px;
      background-color: var(--primary-dark-teal);
      color: var(--white);
      font-size: 12px;
      margin-top: 30px;
    }
    
    .footer p {
      margin-bottom: 8px;
    }
    
    .footer-logo {
      font-weight: 700;
      color: var(--white);
      margin-bottom: 8px;
      letter-spacing: 1px;
    }
    
    .copyright {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.6);
      margin-top: 10px;
    }

    /* Responsive adjustments */
    @media print {
      body {
        background-color: white;
        padding: 0;
      }

      .report-container {
        max-width: 100%;
        margin: 0;
        box-shadow: none;
        border-radius: 0;
      }
      
      .section-card {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      
      .findings-col {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      
      .qa-card {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      
      .footer {
        margin-top: 0;
      }
    }

    @media (max-width: 768px) {
      .report-container {
        margin: 10px auto;
      }

      .header-info {
        flex-direction: column;
        align-items: center;
      }

      .info-card {
        width: 100%;
        max-width: 100%;
      }

      .key-findings-grid {
        flex-direction: column;
      }
    }
  </style>
</head>
<body>
  <div class="report-container">
    <div class="top-gradient-bar"></div>
    
    <header class="header">
      <h1 class="report-title">AI Efficiency Scorecard</h1>
      <p class="report-subtitle">A comprehensive assessment of AI effectiveness and strategic opportunities</p>
      
      <div class="header-info">
        <div class="info-card user-info">
          <h3>Client Information</h3>
          <div class="info-item">
            <span class="info-label">Name:</span>
            <span class="info-value">${UserInformation.UserName}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Company:</span>
            <span class="info-value">${UserInformation.CompanyName}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Industry:</span>
            <span class="info-value">${UserInformation.Industry}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Email:</span>
            <span class="info-value">${UserInformation.Email}</span>
          </div>
        </div>
        
        <div class="info-card score-info">
          <h3>Assessment Results</h3>
          <div class="info-item">
            <span class="info-label">AI Tier:</span>
            <span class="info-value">
              ${ScoreInformation.AITier}
              <span class="tier-badge tier-${ScoreInformation.AITier.toLowerCase()}">${ScoreInformation.AITier}</span>
            </span>
          </div>
          ${ScoreInformation.FinalScore ? `
          <div class="info-item">
            <span class="info-label">Score:</span>
            <span class="info-value">${ScoreInformation.FinalScore}</span>
          </div>` : ''}
          <div class="info-item">
            <span class="info-label">Report ID:</span>
            <span class="info-value">${ScoreInformation.ReportID}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Date:</span>
            <span class="info-value">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
      </div>
    </header>
    
    <main class="main-content">
      ${introText ? `
      <div class="section-card">
        <div class="card-header">
          <h2>Executive Summary</h2>
        </div>
        <div class="card-body">
          ${parseMarkdown(introText)}
        </div>
      </div>` : ''}
      
      <!-- Key Findings Section with Two Columns -->
      ${sections.keyFindings ? `
      <div class="section-card">
        <div class="card-header">
          <h2>Key Findings</h2>
        </div>
        <div class="card-body">
          <div class="key-findings-grid">
            <div class="findings-col">
              <div class="strengths-card">
                <h3 class="findings-title strengths-title">Strengths</h3>
                ${parseMarkdown(sections.strengths)}
              </div>
            </div>
            <div class="findings-col">
              <div class="weaknesses-card">
                <h3 class="findings-title weaknesses-title">Weaknesses</h3>
                ${parseMarkdown(sections.weaknesses)}
              </div>
            </div>
          </div>
        </div>
      </div>` : ''}
      
      <div class="section-divider"></div>
      
      <!-- Action Plan Section -->
      ${sections.strategicPlan ? `
      <div class="section-card">
        <div class="card-header">
          <h2>Strategic Action Plan</h2>
        </div>
        <div class="card-body action-section">
          <div class="callout-box">
            <div class="callout-title">Why This Matters</div>
            <div class="callout-content">
              Implementing these strategic actions will help your organization maximize AI efficiency and achieve competitive advantages in your industry.
            </div>
          </div>
          ${parseMarkdown(sections.strategicPlan)}
        </div>
      </div>` : ''}
      
      <!-- Other sections from the markdown -->
      ${processedSections
        .filter(section => 
          !section.title.includes('Key Findings') && 
          !section.title.includes('Strategic Action Plan') &&
          !section.title.includes('Overall Tier'))
        .map((section, index) => `
        <div class="section-card ${section.bgColorClass}">
          <div class="card-header">
            <h2>${section.title}</h2>
          </div>
          <div class="card-body ${section.specialClass}">
            ${section.title.includes('Getting Started') || section.title.includes('Resources') ? 
              `` : ''}
            
            ${section.content}
            
            ${index % 2 === 0 ? `<div class="highlight-box">
              <strong>Pro Tip:</strong> Focus on implementing these strategies incrementally for best results.
            </div>` : ''}
          </div>
        </div>
      `).join('')}
      
      <div class="section-divider"></div>
      
      <!-- Q&A Assessment Section -->
      <div class="qa-section">
        <div class="qa-header">
          <h2>Q&A Assessment Breakdown</h2>
        </div>
        
        ${Object.entries(groupedQA).map(([phase, items]) => `
          <div class="qa-phase">
            <h3 class="phase-title">${phase}</h3>
            
            ${items.map((item, index) => `
              <div class="qa-card">
                <div class="qa-question">Q${item.index !== undefined ? item.index + 1 : index + 1}: ${item.question}</div>
                <div class="qa-answer">${formatAnswer(item)}</div>
                ${item.reasoningText ? `<div class="qa-reasoning">${item.reasoningText}</div>` : ''}
                <div class="qa-meta">
                  ${item.answerType ? `<div class="qa-meta-item"><strong>Type:</strong> ${item.answerType}</div>` : ''}
                  ${item.options && Array.isArray(item.options) && item.options.length > 0 ? 
                    `<div class="qa-meta-item"><strong>Options:</strong> ${item.options.join(', ')}</div>` : ''}
                  ${item.answerSource ? `<div class="qa-meta-item"><strong>Source:</strong> ${item.answerSource}</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        `).join('')}
      </div>
    </main>
    
    <footer class="footer">
      <div class="footer-logo">AI Efficiency Scorecard</div>
      <p>This report was generated using AI Efficiency Scorecard Tool</p>
      <p>Prepared for ${UserInformation.UserName} at ${UserInformation.CompanyName}</p>
      <div class="copyright">© ${new Date().getFullYear()} - All Rights Reserved</div>
    </footer>
  </div>
</body>
</html>`;
}
