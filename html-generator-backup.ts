/**
 * HTML Generator for AI Efficiency Scorecard (WeasyPrint Version)
 * Simplified approach that builds the HTML template block by block
 */

export interface AnswerHistoryEntry {
  question: string;
  answer: string;
  phaseName?: string;
  reasoningText?: string;
  answerType?: string;
  options?: string[] | null;
  index?: number;
  answerSource?: string;
}

export interface ScorecardData {
  UserInformation: {
    UserName: string;
    CompanyName: string;
    Industry: string;
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
 * Process markdown to extract strategic action plan items
 */
function extractStrategicPlan(markdownContent: string): string[] {
  const planItems: string[] = [];
  
  // Find the strategic plan section
  const strategicPlanMatch = markdownContent.match(/## Strategic Action Plan([\s\S]*?)(?=##|$)/i);
  if (!strategicPlanMatch) return planItems;
  
  const planContent = strategicPlanMatch[1].trim();
  
  // Extract numbered items
  const planItemRegex = /\d+\.\s+(.*?)(?=\d+\.|$)/gs;
  let match;
  
  while ((match = planItemRegex.exec(planContent)) !== null) {
    planItems.push(match[1].trim());
  }
  
  return planItems;
}

/**
 * Extract strengths from markdown content
 */
function extractStrengths(markdownContent: string): string[] {
  const strengths: string[] = [];
  
  const keyFindingsMatch = markdownContent.match(/## Key Findings([\s\S]*?)(?=##|$)/i);
  if (!keyFindingsMatch) return strengths;
  
  const strengthsMatch = keyFindingsMatch[1].match(/\*\*Strengths:\*\*([\s\S]*?)(?=\*\*Weaknesses|$)/i);
  if (!strengthsMatch) return strengths;
  
  // Extract bullet points
  const strengthContent = strengthsMatch[1].trim();
  const bulletPoints = strengthContent.split('\n').filter(line => line.trim().startsWith('-'));
  
  return bulletPoints.map(point => point.replace(/^-\s*/, '').trim());
}

/**
 * Extract weaknesses from markdown content
 */
function extractWeaknesses(markdownContent: string): string[] {
  const weaknesses: string[] = [];
  
  const keyFindingsMatch = markdownContent.match(/## Key Findings([\s\S]*?)(?=##|$)/i);
  if (!keyFindingsMatch) return weaknesses;
  
  const weaknessesMatch = keyFindingsMatch[1].match(/\*\*Weaknesses:\*\*([\s\S]*?)(?=##|$)/i);
  if (!weaknessesMatch) return weaknesses;
  
  // Extract bullet points
  const weaknessContent = weaknessesMatch[1].trim();
  const bulletPoints = weaknessContent.split('\n').filter(line => line.trim().startsWith('-'));
  
  return bulletPoints.map(point => point.replace(/^-\s*/, '').trim());
}

/**
 * Format answers based on answerType
 */
function formatAnswer(item: AnswerHistoryEntry): string {
  if (!item.answer) return '';
  
  if (item.answerType === 'scale' && !isNaN(Number(item.answer))) {
    return `<span class="scale-value">${item.answer}</span>`;
  }
  
  if (item.answerType === 'checkbox' || item.answerType === 'radio') {
    if (typeof item.answer === 'string' && item.answer.includes('|')) {
      return item.answer.split('|').map(a => a.trim()).join(', ');
    }
  }
  
  return item.answer;
}

/**
 * Group questions and answers by phase
 */
function groupByPhase(questionAnswerHistory: AnswerHistoryEntry[]): Record<string, AnswerHistoryEntry[]> {
  const grouped: Record<string, AnswerHistoryEntry[]> = {};
  
  questionAnswerHistory.forEach((item, index) => {
    const phase = item.phaseName || 'Uncategorized';
    if (!grouped[phase]) {
      grouped[phase] = [];
    }
    grouped[phase].push({...item, index});
  });
  
  return grouped;
}

/**
 * Generate the complete HTML for the scorecard PDF
 */
export async function generateScorecardHTML(data: ScorecardData): Promise<string> {
  const { UserInformation, ScoreInformation } = data;

  // Return HTML with only header and client information for testing
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Efficiency Scorecard - Lead Capture</title>
  <style>
    @page {
      size: A4;
      margin: 1.5cm;
    }

    body {
      font-family: Arial, sans-serif;
      line-height: 1.5;
      font-size: 11pt;
      color: #333333;
    }

    /* Header */
    .main-header {
      text-align: center;
      margin-bottom: 2em;
      padding-bottom: 0.5em;
      border-bottom: 2px solid #103138;
    }

    .main-header h1 {
      font-size: 24pt;
      color: #103138;
      margin-bottom: 0.5em;
    }

    .main-header p {
      font-size: 14pt;
    }

    /* Client Info Section */
    .info-section {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 2em;
    }

    .info-card {
      flex: 1;
      border: 1px solid #dddddd;
      border-radius: 5px;
      padding: 15px;
    }

    .info-card h3 {
      margin-top: 0;
      color: #103138;
      border-bottom: 1px solid #eeeeee;
      padding-bottom: 5px;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="main-header">
    <h1>AI Efficiency Scorecard</h1>
    <p>A comprehensive assessment of AI effectiveness and strategic opportunities</p>
  </div>

  <!-- Client Information -->
  <div class="info-section">
    <div class="info-card">
      <h3>Client Information</h3>
      <p><strong>Name:</strong> ${UserInformation.UserName}</p>
      <p><strong>Company:</strong> ${UserInformation.CompanyName}</p>
      <p><strong>Industry:</strong> ${UserInformation.Industry}</p>
      <p><strong>Email:</strong> ${UserInformation.Email}</p>
    </div>

    <div class="info-card">
      <h3>Overall Assessment</h3>
      <p><strong>AI Tier:</strong> ${ScoreInformation.AITier}</p>
      ${ScoreInformation.FinalScore !== null ? `<p><strong>Final Score:</strong> ${ScoreInformation.FinalScore}/100</p>` : ''}
      <p><strong>Report ID:</strong> ${ScoreInformation.ReportID}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
  </div>

</body>
</html>`;
}
