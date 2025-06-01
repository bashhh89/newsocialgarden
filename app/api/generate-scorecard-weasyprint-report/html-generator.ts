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
  if (!markdownContent) {
    console.log('No markdown content provided to extractStrategicPlan');
    return [];
  }
  
  console.log('Extracting strategic plan from markdown content...');
  
  // Find the strategic plan section
  const strategicPlanRegex = /## Strategic Action Plan\s*([\s\S]*?)(?=##|$)/i;
  const match = markdownContent.match(strategicPlanRegex);
  
  if (!match || !match[1]) {
    console.log('No Strategic Action Plan section found');
    
    // Try alternative headings
    const recommendationsRegex = /## Recommendations\s*([\s\S]*?)(?=##|$)/i;
    const recMatch = markdownContent.match(recommendationsRegex);
    
    if (recMatch && recMatch[1]) {
      console.log('Found Recommendations section instead');
      const recContent = recMatch[1].trim();
      console.log('Recommendations content length:', recContent.length);
      
      // Process recommendations as action items
      const items: string[] = [];
      const lines = recContent.split('\n');
      
      let currentItem = '';
      let collectingItem = false;
      
      for (const line of lines) {
        // Check if this line starts a new numbered or bullet item
        if (/^\d+\./.test(line.trim()) || /^[•\-]/.test(line.trim())) {
          // If we were collecting a previous item, save it
          if (collectingItem && currentItem.trim()) {
            items.push(currentItem.trim());
          }
          
          // Start collecting a new item
          currentItem = line.trim();
          collectingItem = true;
        } 
        // If we're collecting an item and this is a continuation line
        else if (collectingItem && line.trim()) {
          currentItem += ' ' + line.trim();
        }
      }
      
      // Don't forget to add the last item
      if (collectingItem && currentItem.trim()) {
        items.push(currentItem.trim());
      }
      
      console.log(`Found ${items.length} recommendation items`);
      
      // Format the items for better display
      return items.map(item => {
        // Handle bullet points
        if (item.startsWith('•') || item.startsWith('-')) {
          const content = item.replace(/^[•\-]\s*/, '').trim();
          
          // Try to extract the title if it's in bold format
          const boldTitleMatch = content.match(/\*\*([^:]+):\*\*\s*(.*)/);
          if (boldTitleMatch) {
            return `<strong>${boldTitleMatch[1]}</strong>: ${boldTitleMatch[2]}`;
          }
          
          // Try to extract the title if it's in regular format
          const regularTitleMatch = content.match(/([^:]+):\s*(.*)/);
          if (regularTitleMatch) {
            return `<strong>${regularTitleMatch[1]}</strong>: ${regularTitleMatch[2]}`;
          }
          
          return content;
        }
        
        // Handle numbered items
        if (/^\d+\./.test(item)) {
          const content = item.replace(/^\d+\.\s*/, '').trim();
          
          // Try to extract the title if it's in bold format
          const boldTitleMatch = content.match(/\*\*([^:]+):\*\*\s*(.*)/);
          if (boldTitleMatch) {
            return `<strong>${boldTitleMatch[1]}</strong>: ${boldTitleMatch[2]}`;
          }
          
          // Try to extract the title if it's in regular format
          const regularTitleMatch = content.match(/([^:]+):\s*(.*)/);
          if (regularTitleMatch) {
            return `<strong>${regularTitleMatch[1]}</strong>: ${regularTitleMatch[2]}`;
          }
          
          return content;
        }
        
        return item;
      });
    }
    
    return [];
  }
  
  const planContent = match[1].trim();
  console.log('Found Strategic Action Plan section with content length:', planContent.length);
  
  // Split the content by numbered items (1., 2., etc.) or bullet points
  const items: string[] = [];
  const lines = planContent.split('\n');
  
  let currentItem = '';
  let collectingItem = false;
  
  for (const line of lines) {
    // Check if this line starts a new numbered or bullet item
    if (/^\d+\./.test(line.trim()) || /^[•\-]/.test(line.trim())) {
      // If we were collecting a previous item, save it
      if (collectingItem && currentItem.trim()) {
        items.push(currentItem.trim());
      }
      
      // Start collecting a new item
      currentItem = line.trim();
      collectingItem = true;
    } 
    // If we're collecting an item and this is a continuation line
    else if (collectingItem && line.trim()) {
      currentItem += ' ' + line.trim();
    }
  }
  
  // Don't forget to add the last item
  if (collectingItem && currentItem.trim()) {
    items.push(currentItem.trim());
  }
  
  console.log(`Found ${items.length} strategic plan items`);
  
  // Format the items for better display
  return items.map(item => {
    // Handle bullet points
    if (item.startsWith('•') || item.startsWith('-')) {
      const content = item.replace(/^[•\-]\s*/, '').trim();
      
      // Try to extract the title if it's in bold format
      const boldTitleMatch = content.match(/\*\*([^:]+):\*\*\s*(.*)/);
      if (boldTitleMatch) {
        return `<strong>${boldTitleMatch[1]}</strong>: ${boldTitleMatch[2]}`;
      }
      
      // Try to extract the title if it's in regular format
      const regularTitleMatch = content.match(/([^:]+):\s*(.*)/);
      if (regularTitleMatch) {
        return `<strong>${regularTitleMatch[1]}</strong>: ${regularTitleMatch[2]}`;
      }
      
      return content;
    }
    
    // Try to extract the title if it's in bold format: "1. **Title:** Description"
    const boldTitleMatch = item.match(/^\d+\.\s+\*\*([^:]+):\*\*\s*(.*)/);
    if (boldTitleMatch) {
      return `<strong>${boldTitleMatch[1]}</strong>: ${boldTitleMatch[2]}`;
    }
    
    // Try to extract the title if it's in regular format: "1. Title: Description"
    const regularTitleMatch = item.match(/^\d+\.\s+([^:]+):\s*(.*)/);
    if (regularTitleMatch) {
      return `<strong>${regularTitleMatch[1]}</strong>: ${regularTitleMatch[2]}`;
    }
    
    // Otherwise just return the item as is
    return item;
  });
}

/**
 * Extract strengths from markdown content
 */
function extractStrengths(markdownContent: string): string[] {
  if (!markdownContent) {
    console.log('No markdown content provided to extractStrengths');
    return [];
  }
  
  console.log('Extracting strengths from markdown content...');
  
  // Look for "Your Strengths" heading followed by a list (handles both • and - bullet points and variations in spacing)
  const strengthsMatch = markdownContent.match(/Your Strengths\s*[\r\n]+([\s\S]*?)(?=Focus Areas|Areas for Improvement|##|$)/i);
  if (strengthsMatch && strengthsMatch[1]) {
    const strengthContent = strengthsMatch[1].trim();
    console.log('Found Your Strengths section with content:', strengthContent.substring(0, 100) + '...');
    // Extract bullet points (handles both • and - and leading/trailing whitespace)
    const bulletPoints = strengthContent.split(/[\r\n]+/).filter(line => line.trim().startsWith('•') || line.trim().startsWith('-'));
    return bulletPoints.map(point => renderMarkdown(point.trim().replace(/^[•-]\s*/, '').trim()));
  }

  // Fallback to previous logic if new pattern not found
  const keyFindingsMatch = markdownContent.match(/## Key Findings([\s\S]*?)(?=##|$)/i);
  if (keyFindingsMatch) {
    const strengthsMatchFallback = keyFindingsMatch[1].match(/\*\*Strengths:\*\*([\s\S]*?)(?=\*\*Weaknesses|$)/i);
    if (strengthsMatchFallback) {
      const strengthContent = strengthsMatchFallback[1].trim();
      console.log('Found Strengths section with content:', strengthContent.substring(0, 100) + '...');
      const bulletPoints = strengthContent.split('\n').filter(line => line.trim().startsWith('-'));
      return bulletPoints.map(point => point.replace(/^-\s*/, '').trim());
    }
  }
  
  console.log('No strengths found in markdown content');
  return [];
}

/**
 * Extract weaknesses (Focus Areas) from markdown content
 */
function extractWeaknesses(markdownContent: string): string[] {
  if (!markdownContent) {
    console.log('No markdown content provided to extractWeaknesses');
    return [];
  }
  
  console.log('Extracting weaknesses/focus areas from markdown content...');
  
  // Look for "Focus Areas" heading followed by a list (handles both • and - bullet points and variations in spacing)
  const focusAreasMatch = markdownContent.match(/Focus Areas\s*[\r\n]+([\s\S]*?)(?=Next Steps|##|$)/i);
  if (focusAreasMatch && focusAreasMatch[1]) {
    const focusAreasContent = focusAreasMatch[1].trim();
    console.log('Found Focus Areas section with content:', focusAreasContent.substring(0, 100) + '...');
    // Extract bullet points (handles both • and - and leading/trailing whitespace)
    const bulletPoints = focusAreasContent.split(/[\r\n]+/).filter(line => line.trim().startsWith('•') || line.trim().startsWith('-'));
    return bulletPoints.map(point => renderMarkdown(point.trim().replace(/^[•-]\s*/, '').trim()));
  }

  // Fallback to previous logic if new pattern not found
  const keyFindingsMatch = markdownContent.match(/## Key Findings([\s\S]*?)(?=##|$)/i);
  if (keyFindingsMatch) {
    const weaknessesMatchFallback = keyFindingsMatch[1].match(/\*\*Weaknesses:\*\*([\s\S]*?)(?=##|$)/i);
    if (weaknessesMatchFallback) {
      const weaknessContent = weaknessesMatchFallback[1].trim();
      console.log('Found Weaknesses section with content:', weaknessContent.substring(0, 100) + '...');
      const bulletPoints = weaknessContent.split('\n').filter(line => line.trim().startsWith('-'));
      return bulletPoints.map(point => point.replace(/^-\s*/, '').trim());
    }
  }
  
  // Additional fallback for "Areas for Improvement" terminology
  const areasForImprovementMatch = markdownContent.match(/Areas for Improvement\s*[\r\n]+([\s\S]*?)(?=Next Steps|##|$)/i);
  if (areasForImprovementMatch && areasForImprovementMatch[1]) {
    const improvementContent = areasForImprovementMatch[1].trim();
    console.log('Found Areas for Improvement section with content:', improvementContent.substring(0, 100) + '...');
    const bulletPoints = improvementContent.split(/[\r\n]+/).filter(line => line.trim().startsWith('•') || line.trim().startsWith('-'));
    return bulletPoints.map(point => renderMarkdown(point.trim().replace(/^[•-]\s*/, '').trim()));
  }
  
  console.log('No weaknesses/focus areas found in markdown content');
  return [];
}

/**
 * Format answers based on answerType
 */
function formatAnswer(item: AnswerHistoryEntry): string {
  if (item.answer === undefined || item.answer === null || item.answer === '') return 'No answer provided';
  
  // Handle different answer types
  if (item.answerType === 'scale' && !isNaN(Number(item.answer))) {
    return `<span class="scale-value">${item.answer}</span>`;
  }
  
  if (item.answerType === 'checkbox' || item.answerType === 'radio') {
    // Handle array answers
    if (Array.isArray(item.answer)) {
      return item.answer.join(', ');
    }
    
    // Handle pipe-delimited string answers
    if (typeof item.answer === 'string' && item.answer.includes('|')) {
      return item.answer.split('|').map(a => a.trim()).join(', ');
    }
    
    // Handle newline-delimited string answers (common in checkbox responses)
    if (typeof item.answer === 'string' && item.answer.includes('\n')) {
      return item.answer.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => line.startsWith('-') ? line.substring(1).trim() : line)
        .join(', ');
    }
  }
  
  // For text answers, ensure we're returning a string
  return String(item.answer);
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
 * Helper function to get tier description
 */
const getTierDescription = (tier: string | null): string => {
  if (!tier) return "";
  
  switch(tier.toLowerCase()) {
    case 'leader':
      return "This means your organization has developed mature AI capabilities, with well-established processes for developing, deploying, and managing AI solutions. You have a strong foundation of data infrastructure, AI talent, governance frameworks, and strategic alignment.";
    case 'enabler':
      return "This means your organization has begun to develop significant AI capabilities with some successful implementations. You have established basic data infrastructure and are working toward more systematized approaches to AI development and deployment.";
    case 'dabbler':
      return "This means your organization is in the early stages of AI adoption, with limited formal processes and capabilities. You may have experimented with some AI applications but lack a comprehensive strategy and infrastructure for AI implementation.";
    default:
      return "Your assessment results indicate you're at an early stage of AI adoption. The recommendations in this report will help you establish a solid foundation for AI implementation.";
  }
};

/**
 * Basic Markdown to HTML converter
 */
function renderMarkdown(markdown: string): string {
  if (!markdown) return '';

  // Basic replacements for common markdown elements - FIX BOLD RENDERING FIRST
  let html = markdown
    // Replace bold - improved regex to ensure complete capture
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Replace italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/_(.*?)_/g, '<em>$1</em>');

  // Handle headings (H1 to H6) - process from smallest to largest to avoid issues
  for (let i = 6; i >= 1; i--) {
    const regex = new RegExp(`^#{${i}}\\s+(.*)$`, 'gm');
    html = html.replace(regex, `<h${i}>$1</h${i}>`);
  }

  // Completely rewritten list handling to properly process lists and paragraphs
  const lines = html.split('\n');
  let processedLines = [];
  let inList = false;
  let listType = '';
  let inParagraph = false;
  let paragraphContent = '';
  let inKeyFindings = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if we're entering or leaving the Key Findings section
    if (line.match(/^<h2>Key Findings<\/h2>$/)) {
      inKeyFindings = true;
    } else if (line.match(/^<h2>/)) {
      inKeyFindings = false;
    }
    
    // Skip empty lines
    if (!line) {
      if (inParagraph) {
        // End current paragraph
        processedLines.push(`<p>${paragraphContent}</p>`);
        inParagraph = false;
        paragraphContent = '';
      }
      continue;
    }

    // Check if line is a heading
    if (line.match(/^<h[1-6]>.*<\/h[1-6]>$/)) {
      // Close any open paragraph
      if (inParagraph) {
        processedLines.push(`<p>${paragraphContent}</p>`);
        inParagraph = false;
        paragraphContent = '';
      }
      
      // Close any open list
      if (inList) {
        processedLines.push(`</${listType}>`);
        inList = false;
      }
      
      // Add the heading
      processedLines.push(line);
      continue;
    }

    // Check if line is a list item
    const isUnorderedListItem = line.startsWith('- ') || line.startsWith('* ') || line.startsWith('+ ');
    const isOrderedListItem = /^\d+\.\s/.test(line);
    
    if (isUnorderedListItem || isOrderedListItem) {
      // Close any open paragraph
      if (inParagraph) {
        processedLines.push(`<p>${paragraphContent}</p>`);
        inParagraph = false;
        paragraphContent = '';
      }
      
      const newListType = isUnorderedListItem ? 'ul' : 'ol';
      
      // If we're changing list types or starting a new list
      if (!inList || listType !== newListType) {
        if (inList) {
          processedLines.push(`</${listType}>`);
        }
        processedLines.push(`<${newListType}>`);
        inList = true;
        listType = newListType;
      }
      
      // Extract the content after the list marker
      const content = isUnorderedListItem 
        ? line.replace(/^[*+-]\s+/, '') 
        : line.replace(/^\d+\.\s+/, '');
      
      // Apply special styling for Key Findings section
      if (inKeyFindings) {
        processedLines.push(`<li class="finding-item-card">${content}</li>`);
      } else {
        processedLines.push(`<li class="list-item-block">${content}</li>`);
      }
    } else {
      // Close any open list
      if (inList) {
        processedLines.push(`</${listType}>`);
        inList = false;
      }
      
      // Handle regular paragraph content
      if (!inParagraph) {
        inParagraph = true;
        paragraphContent = line;
      } else {
        paragraphContent += ' ' + line;
      }
    }
  }
  
  // Close any open elements at the end
  if (inParagraph) {
    processedLines.push(`<p>${paragraphContent}</p>`);
  }
  
  if (inList) {
    processedLines.push(`</${listType}>`);
  }

  return processedLines.join('\n');
}

/**
 * Debug function to log the structure of the report data
 */
function debugReportData(data: ScorecardData): void {
  console.log('=== DEBUG REPORT DATA STRUCTURE ===');
  console.log('User Information:', JSON.stringify(data.UserInformation, null, 2));
  console.log('Score Information:', JSON.stringify(data.ScoreInformation, null, 2));
  
  console.log('Question Answer History length:', data.QuestionAnswerHistory?.length || 0);
  if (data.QuestionAnswerHistory && data.QuestionAnswerHistory.length > 0) {
    console.log('First question sample:', JSON.stringify(data.QuestionAnswerHistory[0], null, 2));
    
    // Check for required fields in all Q&A items
    const missingFields = data.QuestionAnswerHistory.map((item, index) => {
      const missing = [];
      if (!item.question) missing.push('question');
      if (item.answer === undefined || item.answer === null) missing.push('answer');
      return { index, missing };
    }).filter(item => item.missing.length > 0);
    
    if (missingFields.length > 0) {
      console.log('WARNING: Some Q&A items are missing required fields:', missingFields);
    }
    
    // Group by phase to check what phases are available
    const phases = data.QuestionAnswerHistory.reduce((acc, item) => {
      const phase = item.phaseName || 'Uncategorized';
      if (!acc[phase]) acc[phase] = 0;
      acc[phase]++;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('Questions by phase:', phases);
  } else {
    console.log('WARNING: No QuestionAnswerHistory data available!');
  }
  
  // Check if markdown content exists and log its structure
  if (data.FullReportMarkdown) {
    console.log('Full Report Markdown length:', data.FullReportMarkdown.length);
    
    // Log section headings to understand structure
    const headings = data.FullReportMarkdown.match(/##\s+(.*?)$/gm);
    if (headings) {
      console.log('Markdown sections found:', headings);
    }
    
    // Check for specific sections
    const hasKeyFindings = data.FullReportMarkdown.includes('## Key Findings');
    const hasStrengths = data.FullReportMarkdown.includes('Your Strengths') || 
                        data.FullReportMarkdown.includes('**Strengths:**');
    const hasWeaknesses = data.FullReportMarkdown.includes('Focus Areas') || 
                         data.FullReportMarkdown.includes('Areas for Improvement') ||
                         data.FullReportMarkdown.includes('**Weaknesses:**');
    const hasDetailedAnalysis = data.FullReportMarkdown.includes('## Detailed Analysis');
    const hasRecommendations = data.FullReportMarkdown.includes('## Recommendations');
    const hasIllustrativeBenchmarks = data.FullReportMarkdown.includes('### Illustrative Benchmarks');
    const hasLearningPath = data.FullReportMarkdown.includes('### Your Personalized AI Learning Path') ||
                           data.FullReportMarkdown.includes('### Getting Started & Resources');
    
    console.log('Section presence check:', {
      hasKeyFindings,
      hasStrengths,
      hasWeaknesses,
      hasDetailedAnalysis, 
      hasRecommendations,
      hasIllustrativeBenchmarks,
      hasLearningPath
    });
  }
  
  console.log('=== END DEBUG REPORT DATA STRUCTURE ===');
}

/**
 * Ensure all sections from the markdown are included in the HTML
 */
function renderFullReportMarkdown(markdownContent: string): string {
  if (!markdownContent) {
    console.log('No markdown content provided to renderFullReportMarkdown');
    return '';
  }
  
  console.log('Rendering full report markdown...');
  
  // First, render the entire markdown to HTML
  const fullHtml = renderMarkdown(markdownContent);
  
  // Replace the Final Score section with a styled version
  const withStyledFinalScore = fullHtml.replace(
    /## Final Score: \d+\/100/g, 
    match => `<div class="final-score">${match}</div>`
  );
  
  // Process Key Findings section
  const withStyledKeyFindings = withStyledFinalScore.replace(
    /## Key Findings([\s\S]*?)(?=##|$)/g, 
    match => {
      console.log('Found and styling Key Findings section');
      
      // Extract the content after "## Key Findings"
      const content = match.replace(/## Key Findings/, '').trim();
      
      // Check if we have both strengths and weaknesses sections
      const hasStrengths = content.includes('<h4>Your Strengths</h4>') || 
                          content.includes('<strong>Strengths:</strong>');
      const hasWeaknesses = content.includes('<h4>Focus Areas</h4>') || 
                           content.includes('<h4>Areas for Improvement</h4>') ||
                           content.includes('<strong>Weaknesses:</strong>');
      
      if (hasStrengths && hasWeaknesses) {
        // Split content into strengths and weaknesses
        let strengthsContent = '';
        let weaknessesContent = '';
        
        if (content.includes('<h4>Your Strengths</h4>')) {
          const strengthsMatch = content.match(/<h4>Your Strengths<\/h4>([\s\S]*?)(?=<h4>|$)/);
          if (strengthsMatch && strengthsMatch[1]) {
            strengthsContent = strengthsMatch[1].trim();
          }
        } else if (content.includes('<strong>Strengths:</strong>')) {
          const strengthsMatch = content.match(/<strong>Strengths:<\/strong>([\s\S]*?)(?=<strong>Weaknesses:|$)/);
          if (strengthsMatch && strengthsMatch[1]) {
            strengthsContent = `<h4>Your Strengths</h4>${strengthsMatch[1].trim()}`;
          }
        }
        
        if (content.includes('<h4>Focus Areas</h4>')) {
          const weaknessesMatch = content.match(/<h4>Focus Areas<\/h4>([\s\S]*?)(?=<h4>|$)/);
          if (weaknessesMatch && weaknessesMatch[1]) {
            weaknessesContent = weaknessesMatch[1].trim();
          }
        } else if (content.includes('<h4>Areas for Improvement</h4>')) {
          const weaknessesMatch = content.match(/<h4>Areas for Improvement<\/h4>([\s\S]*?)(?=<h4>|$)/);
          if (weaknessesMatch && weaknessesMatch[1]) {
            weaknessesContent = weaknessesMatch[1].trim();
          }
        } else if (content.includes('<strong>Weaknesses:</strong>')) {
          const weaknessesMatch = content.match(/<strong>Weaknesses:<\/strong>([\s\S]*?)(?=<strong>|$)/);
          if (weaknessesMatch && weaknessesMatch[1]) {
            weaknessesContent = `<h4>Focus Areas</h4>${weaknessesMatch[1].trim()}`;
          }
        }
        
        // Create two-column layout
        if (strengthsContent && weaknessesContent) {
          return `<div class="key-findings-section">
            <h3>Key Findings</h3>
            <div class="key-findings-columns">
              <div class="key-findings-column">
                <h4>Your Strengths</h4>
                ${strengthsContent.replace(/<h4>Your Strengths<\/h4>/, '')}
              </div>
              <div class="key-findings-column">
                <h4>Focus Areas</h4>
                ${weaknessesContent.replace(/<h4>Focus Areas<\/h4>|<h4>Areas for Improvement<\/h4>/, '')}
              </div>
            </div>
          </div>`;
        }
      }
      
      // Default to original processing if we couldn't extract both sections
      return `<div class="key-findings-section"><h3>Key Findings</h3>${content}</div>`;
    }
  );
  
  // Process Strengths and Focus Areas headings
  const withStyledHeadings = withStyledKeyFindings
    .replace(/### Your Strengths/g, '<h4>Your Strengths</h4>')
    .replace(/### Focus Areas/g, '<h4>Focus Areas</h4>')
    .replace(/### Areas for Improvement/g, '<h4>Areas for Improvement</h4>');
  
  // Process all list items to use the list-item-block class
  const withStyledListItems = withStyledHeadings.replace(
    /<li>([^<]+)<\/li>/g, 
    match => {
      const content = match.replace(/<\/?li>/g, '');
      return `<li class="list-item-block">${content}</li>`;
    }
  );
  
  // Process special sections like Illustrative Benchmarks, Example Prompts, etc.
  const specialSections = [
    'Sample AI Goal-Setting Meeting Agenda',
    'Example Prompts for Your Team',
    'Illustrative Benchmarks',
    'Recommendations',
    'Detailed Analysis'
  ];
  
  let processedHtml = withStyledListItems;
  
  // Process standard sections
  specialSections.forEach(section => {
    const sectionRegex = new RegExp(`### ${section}([\\s\\S]*?)(?=###|##|$)`, 'g');
    processedHtml = processedHtml.replace(
      sectionRegex,
      match => {
        console.log(`Found and styling section: ${section}`);
        return `<div class="key-findings-section"><h3>${section}</h3>${match.replace(`### ${section}`, '')}</div>`;
      }
    );
  });
  
  // Process Learning Path and Resources sections with potential two-column layout
  const learningPathSections = [
    'Personalized AI Learning Path',
    'Getting Started & Resources',
    'Your Learning Path & Resources'
  ];
  
  learningPathSections.forEach(section => {
    const sectionRegex = new RegExp(`### ${section}([\\s\\S]*?)(?=###|##|$)`, 'g');
    processedHtml = processedHtml.replace(
      sectionRegex,
      match => {
        console.log(`Found and styling learning path section: ${section}`);
        
        const content = match.replace(`### ${section}`, '').trim();
        
        // Check if we can identify distinct subsections for a two-column layout
        // Look for common patterns like "Learning Path" and "Recommended Resources" subsections
        const hasLearningPath = content.includes('<h4>Your Learning Path</h4>') || 
                               content.includes('<strong>Learning Path:</strong>') ||
                               content.includes('<h4>Personalized Learning Path</h4>');
        
        const hasResources = content.includes('<h4>Recommended Resources</h4>') || 
                            content.includes('<strong>Resources:</strong>') ||
                            content.includes('<h4>Key Resources</h4>');
        
        if (hasLearningPath && hasResources) {
          // Extract learning path content
          let learningPathContent = '';
          if (content.includes('<h4>Your Learning Path</h4>')) {
            const match = content.match(/<h4>Your Learning Path<\/h4>([\s\S]*?)(?=<h4>|$)/);
            if (match && match[1]) learningPathContent = match[1].trim();
          } else if (content.includes('<h4>Personalized Learning Path</h4>')) {
            const match = content.match(/<h4>Personalized Learning Path<\/h4>([\s\S]*?)(?=<h4>|$)/);
            if (match && match[1]) learningPathContent = match[1].trim();
          } else if (content.includes('<strong>Learning Path:</strong>')) {
            const match = content.match(/<strong>Learning Path:<\/strong>([\s\S]*?)(?=<strong>Resources:|$)/);
            if (match && match[1]) learningPathContent = match[1].trim();
          }
          
          // Extract resources content
          let resourcesContent = '';
          if (content.includes('<h4>Recommended Resources</h4>')) {
            const match = content.match(/<h4>Recommended Resources<\/h4>([\s\S]*?)(?=<h4>|$)/);
            if (match && match[1]) resourcesContent = match[1].trim();
          } else if (content.includes('<h4>Key Resources</h4>')) {
            const match = content.match(/<h4>Key Resources<\/h4>([\s\S]*?)(?=<h4>|$)/);
            if (match && match[1]) resourcesContent = match[1].trim();
          } else if (content.includes('<strong>Resources:</strong>')) {
            const match = content.match(/<strong>Resources:<\/strong>([\s\S]*?)(?=<strong>|$)/);
            if (match && match[1]) resourcesContent = match[1].trim();
          }
          
          // If we have both sections, create a two-column layout
          if (learningPathContent && resourcesContent) {
            return `<div class="key-findings-section learning-path-section">
              <h3>${section}</h3>
              <div class="learning-path-columns">
                <div class="learning-path-column">
                  <h4>Your Learning Path</h4>
                  ${learningPathContent}
                </div>
                <div class="learning-path-column">
                  <h4>Recommended Resources</h4>
                  ${resourcesContent}
                </div>
              </div>
            </div>`;
          }
        }
        
        // Default to single column if we couldn't identify subsections
        return `<div class="key-findings-section"><h3>${section}</h3>${content}</div>`;
      }
    );
  });
  
  // Close any open sections
  const finalHtml = processedHtml.replace(
    /### ([^#]+?)(?=###|##|$)/g, 
    match => `${match}</div>`
  );
  
  return finalHtml;
}

/**
 * Generate the complete HTML for the scorecard PDF
 */
export async function generateScorecardHTML(data: ScorecardData): Promise<string> {
  const { UserInformation, ScoreInformation, FullReportMarkdown, QuestionAnswerHistory } = data;

  // Debug the report data structure
  debugReportData(data);

  // Define brand colors
  const colors = {
    brightGreen: '#20E28F',
    darkGreen: '#28a745',
    darkTeal: '#103138',
    white: '#FFFFFF',
    lightMint: '#F3FDF5',
    lightGrey: '#f8f9fa',
    borderGrey: '#dee2e6',
    textDark: '#343a40',
    textMuted: '#6c757d',
    textBody: '#495057',
    cardBorder: '#e9ecef',
    scoreBg: '#f1f3f5'
  };

  // Extract strengths and weaknesses (used for Focus Areas) from markdown
  const strengths = extractStrengths(FullReportMarkdown);
  const weaknesses = extractWeaknesses(FullReportMarkdown); // Using weaknesses for Focus Areas as per user feedback example

  // Determine tier description
  const tierDescription = getTierDescription(ScoreInformation.AITier);
  
  // Process the full markdown content for the details section
  // We'll keep the Strategic Action Plan section in the markdown for now
  const fullReportHtml = renderFullReportMarkdown(FullReportMarkdown);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Efficiency Scorecard - ${UserInformation.UserName}</title>
  <style>
    @font-face {
      font-family: 'Inter';
      src: url('/public/fonts/Inter-Regular.ttf') format('truetype');
      font-weight: normal;
      font-style: normal;
    }

    @font-face {
      font-family: 'Inter';
      src: url('/public/fonts/Inter-Bold.ttf') format('truetype');
      font-weight: bold;
      font-style: normal;
    }

    @page {
      size: A4 portrait;
      margin: 2cm 1.5cm;
      @bottom-center {
        content: "Page " counter(page) " of " counter(pages);
        font-family: 'Inter', sans-serif;
        font-size: 9pt;
        color: ${colors.textMuted};
        padding-top: 0.5cm;
        border-top: 1pt solid ${colors.lightMint};
      }
    }

    #document-footer-content {
      position: running(documentFooter);
      text-align: center;
      font-size: 8pt;
      color: ${colors.textMuted};
      font-family: 'Inter', sans-serif;
    }

    @page {
      @bottom-left {
        content: element(documentFooter);
        padding-top: 0.5cm;
      }
    }

    body {
      font-family: 'Inter', sans-serif;
      line-height: 1.6;
      font-size: 10pt;
      color: ${colors.textBody};
      background-color: #f8f8f8;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      margin: 0;
      padding: 0;
    }

    .container {
      max-width: 21cm;
      margin: 0 auto;
      background-color: ${colors.white};
      padding: 2cm;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }

    /* Global Typography - Enhanced for better hierarchy */
    h1, h2, h3, h4, h5, h6 {
      font-family: 'Inter', sans-serif;
      color: ${colors.textDark};
      font-weight: bold;
      line-height: 1.3;
      margin-top: 1.5em;
      margin-bottom: 0.8em;
      page-break-after: avoid;
    }

    h1 {
      font-size: 28px;
      margin-top: 0;
      margin-bottom: 8px;
      line-height: 1.2;
      color: ${colors.textDark};
      border-bottom: none;
      padding-bottom: 0;
    }

    h2 {
      font-size: 22px;
      font-weight: 600;
      color: ${colors.textDark};
      margin-top: 30px;
      margin-bottom: 15px;
      padding-bottom: 5px;
      border-bottom: 2px solid ${colors.darkGreen};
    }

    h3 {
      font-size: 16pt;
      margin-top: 1.5em;
      margin-bottom: 0.8em;
      color: ${colors.textDark};
    }

    h4 {
      font-size: 14pt;
      color: ${colors.textDark};
      margin-top: 15px;
      margin-bottom: 8px;
    }

    h5 {
      font-size: 12pt;
      color: ${colors.textDark};
      margin-top: 15px;
      margin-bottom: 8px;
    }

    h6 {
      font-size: 11pt;
      color: ${colors.textDark};
      margin-top: 0.8em;
      margin-bottom: 0.5em;
    }

    p {
      margin-bottom: 1em;
      line-height: 1.6;
      font-family: 'Inter', sans-serif;
    }

    strong {
      font-weight: bold;
    }

    em {
      font-style: italic;
    }

    /* Standardized Card Style */
    .card {
      background-color: ${colors.white};
      border: 1px solid ${colors.cardBorder};
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
      padding: 20px;
      margin-bottom: 20px;
      page-break-inside: avoid;
    }

    .card-accent {
      border-left: 5px solid ${colors.darkGreen};
    }

    .card h3, .card h4 {
      margin-top: 0;
      border-bottom: 1px solid ${colors.lightMint};
      padding-bottom: 10px;
      margin-bottom: 15px;
    }

    /* List Styles with Item Block Design */
    ul, ol {
      margin-bottom: 1em;
      padding-left: 0;
      list-style-type: none;
    }

    li {
      margin-bottom: 10px;
      line-height: 1.6;
      font-family: 'Inter', sans-serif;
      color: ${colors.textBody};
      list-style-type: none;
    }

    /* Universal Item Block Styling */
    .list-item-block {
      background-color: #f8f9fa;
      border: 1px solid #e9ecef;
      border-left: 4px solid ${colors.darkGreen};
      padding: 12px 15px;
      margin-bottom: 10px;
      border-radius: 4px;
      page-break-inside: avoid !important;
      line-height: 1.6;
      position: relative;
      display: block;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }

    /* Finding Item Card - Same as list-item-block for consistency */
    .finding-item-card {
      background-color: #f8f9fa;
      border: 1px solid #e9ecef;
      border-left: 4px solid ${colors.darkGreen};
      padding: 12px 15px;
      margin-bottom: 10px;
      border-radius: 4px;
      page-break-inside: avoid !important;
      line-height: 1.6;
      font-family: 'Inter', sans-serif;
      position: relative;
      display: block;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }

    /* Green bullet styling for lists */
    ul li::before {
      content: '•';
      color: ${colors.darkGreen};
      font-weight: bold;
      position: absolute;
      left: 4px;
    }

    /* Assessment Results Section - Findings */
    .assessment-results-section .findings-container {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      margin-top: 20px;
      page-break-inside: avoid;
    }

    .assessment-results-section .strengths-section,
    .assessment-results-section .focus-areas-section {
      flex: 1;
      padding: 15px;
      border-radius: 6px;
      background-color: ${colors.white};
      border: 1px solid ${colors.cardBorder};
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
      page-break-inside: avoid;
    }

    .assessment-results-section .strengths-section h4,
    .assessment-results-section .focus-areas-section h4 {
      color: ${colors.textDark};
      font-size: 14px;
      margin-top: 0;
      margin-bottom: 15px;
      font-weight: bold;
      text-align: center;
      padding-bottom: 8px;
      border-bottom: 1px solid ${colors.lightMint};
    }

    .assessment-results-section ul {
      padding-left: 0;
      margin: 0;
    }

    .assessment-results-section li {
      margin-bottom: 8px;
      line-height: 1.6;
      font-family: 'Inter', sans-serif;
      color: ${colors.textBody};
      position: relative;
      list-style-type: none;
    }

    /* Next Steps Summary - Green callout banner */
    .assessment-results-section .next-steps-summary {
      margin-top: 20px;
      padding: 12px 15px;
      background-color: ${colors.lightMint};
      border-radius: 6px;
      border-left: 4px solid ${colors.darkGreen};
      font-style: italic;
      color: ${colors.textDark};
      font-size: 10pt;
      page-break-inside: avoid;
    }
    
    .assessment-results-section .next-steps-summary p {
      margin: 0;
    }

    /* Header */
    .main-header {
      background-color: ${colors.lightGrey};
      border: 1px solid ${colors.borderGrey};
      border-left: 5px solid ${colors.darkGreen};
      padding: 20px 25px;
      margin-bottom: 30px;
      border-radius: 6px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
      text-align: center;
      page-break-inside: avoid;
    }

    .main-header h1 {
      font-size: 28px;
      font-weight: bold;
      margin: 0 0 8px 0;
      color: ${colors.textDark};
    }

    .main-header p {
      font-size: 14px;
      color: ${colors.textMuted};
      margin: 0;
      line-height: 1.4;
    }

    /* Client Info Section */
    .info-section {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 30px;
      page-break-inside: avoid;
    }

    .info-card {
      flex: 1;
      background-color: ${colors.white};
      border: 1px solid ${colors.cardBorder};
      border-radius: 6px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
      page-break-inside: avoid;
    }

    .info-card h3 {
      font-size: 16px;
      font-weight: bold;
      margin-top: 0;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid ${colors.lightMint};
      color: ${colors.textDark};
    }

    .info-card p {
      margin-bottom: 10px;
      line-height: 1.5;
      font-size: 11pt;
    }

    .info-card p:last-child {
      margin-bottom: 0;
    }

    .info-card p strong {
      display: inline-block;
      min-width: 80px;
      color: ${colors.textDark};
    }

    /* Overall Tier Card Container */
    .tier-card-container {
      background-color: ${colors.white};
      border: 1px solid ${colors.cardBorder};
      border-radius: 6px;
      padding: 25px;
      margin-bottom: 30px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
      text-align: center;
      page-break-inside: avoid;
    }

    .tier-card-container h3 {
      font-size: 16px;
      font-weight: bold;
      margin-top: 0;
      margin-bottom: 20px;
      color: ${colors.textDark};
      border-bottom: none;
    }

    .overall-tier-section {
      margin-bottom: 0;
    }

    .overall-tier-section .tier-value {
      font-size: 24pt;
      font-weight: bold;
      color: ${colors.darkGreen};
      background-color: #e6f7ee;
      padding: 8px 15px;
      border-radius: 4px;
      display: inline-block;
      min-width: 150px;
      margin: 0 auto 10px;
    }

    .overall-tier-section .tier-label {
      font-size: 11pt;
      color: ${colors.textMuted};
      margin-top: 10px;
      font-weight: normal;
    }

    /* Assessment Results Section */
    .assessment-results-section {
      background-color: ${colors.white};
      border: 1px solid ${colors.cardBorder};
      border-radius: 6px;
      padding: 25px;
      margin-bottom: 30px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
      page-break-inside: avoid;
    }

    .assessment-results-section h3 {
      font-size: 16px;
      font-weight: bold;
      margin-top: 0;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid ${colors.lightMint};
      color: ${colors.textDark};
    }

    .assessment-results-section .intro-text {
      margin-bottom: 20px;
      line-height: 1.6;
      font-size: 11pt;
      color: ${colors.textBody};
      padding: 0;
      background-color: transparent;
      border: none;
      box-shadow: none;
    }

    /* Strategic Action Plan Section */
    .action-plan-section {
      margin-bottom: 2em;
      padding: 25px;
      background-color: ${colors.white};
      border: 1px solid #e9ecef;
      border-radius: 6px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
      page-break-inside: avoid;
    }

    .action-plan-section h2 {
      margin-top: 0;
      color: ${colors.textDark};
      font-size: 22px;
      font-weight: 600;
      margin-bottom: 15px;
      padding-bottom: 5px;
      border-bottom: 2px solid ${colors.darkGreen};
    }

    .section-intro {
      margin-bottom: 15px;
      line-height: 1.6;
      color: ${colors.textDark};
      font-size: 10pt;
    }

    .action-plan-list {
      list-style-type: none;
      padding: 0;
      margin: 0;
    }

    .action-item {
      margin-bottom: 12px;
      padding: 12px;
      background-color: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      border-left: 4px solid ${colors.darkGreen};
      display: flex;
      align-items: flex-start;
      page-break-inside: avoid !important;
    }

    .action-number {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      background-color: ${colors.darkGreen};
      color: ${colors.white};
      border-radius: 50%;
      font-weight: bold;
      font-size: 10pt;
      margin-right: 10px;
      flex-shrink: 0;
    }

    .action-text {
      flex: 1;
      line-height: 1.5;
      font-size: 10pt;
    }

    /* Assessment Q&A Section Styling */
    .qa-section {
      margin-bottom: 2em;
      padding: 25px;
      background-color: ${colors.white};
      border: 1px solid ${colors.cardBorder};
      border-radius: 6px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
      page-break-inside: avoid;
      font-family: 'Inter', sans-serif;
    }

    .qa-section h2 {
      margin-top: 0;
      color: ${colors.textDark};
      font-size: 22px;
      font-weight: 600;
      margin-bottom: 15px;
      padding-bottom: 5px;
      border-bottom: 2px solid ${colors.darkGreen};
    }

    .qa-phase h3 {
      color: ${colors.textDark};
      font-size: 14pt;
      margin-top: 1.5em;
      margin-bottom: 0.8em;
      border-bottom: 1px solid ${colors.lightMint};
      padding-bottom: 5px;
    }
    
    /* Multi-column layout for Q&A items */
    .qa-items-container {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      justify-content: space-between;
    }
    
    .qa-item-wrapper {
      width: calc(50% - 8px);
      page-break-inside: avoid;
    }

    .qa-item {
      margin-bottom: 10px;
      line-height: 1.6;
      font-size: 10pt;
    }

    .qa-item p {
      margin: 0;
      line-height: 1.6;
    }

    .qa-item .question {
      font-weight: bold;
      color: ${colors.textDark};
      margin-bottom: 5px;
      display: block;
    }

    .qa-item .answer {
      color: ${colors.textBody};
      display: block;
    }

    /* Full Report Markdown Section */
    .full-report-markdown-section {
      margin-bottom: 2em;
      padding: 25px;
      background-color: ${colors.white};
      border: 1px solid #e9ecef;
      border-radius: 6px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
      page-break-inside: avoid;
    }

    .full-report-markdown-section h2 {
      margin-top: 0;
      color: ${colors.textDark};
      font-size: 22px;
      font-weight: 600;
      margin-bottom: 15px;
      padding-bottom: 5px;
      border-bottom: 2px solid ${colors.darkGreen};
    }

    /* Final Score Styling - Make it stand out */
    .final-score {
      background-color: #f1f3f5;
      padding: 8px 12px;
      border-radius: 4px;
      font-weight: bold;
      display: inline-block;
      margin-top: 5px;
      margin-bottom: 15px;
      color: ${colors.textDark};
    }

    /* Key Findings section styling */
    .key-findings-section {
      background-color: ${colors.white};
      border: 1px solid ${colors.cardBorder};
      padding: 20px;
      border-radius: 6px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
      margin-bottom: 20px;
      page-break-inside: avoid;
    }

    .key-findings-section h3 {
      color: ${colors.textDark};
      margin-top: 0;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid ${colors.darkGreen};
      font-size: 18pt;
      font-weight: bold;
      page-break-after: avoid;
    }

    .key-findings-section h4 {
      color: ${colors.textDark};
      margin-top: 15px;
      margin-bottom: 12px;
      font-weight: bold;
      font-size: 14pt;
      page-break-after: avoid;
    }

    /* Updated list styles for Key Findings */
    .key-findings-section ul,
    .key-findings-section ol {
      list-style-type: none;
      padding-left: 0;
      margin-top: 10px;
      margin-bottom: 15px;
    }

    .key-findings-section ul li,
    .key-findings-section ol li {
      margin-bottom: 12px;
      page-break-inside: avoid !important;
    }

    .key-findings-section ul li::before {
      content: none;
    }
    
    /* New two-column layout for strengths and weaknesses */
    .key-findings-columns {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      margin-top: 20px;
      page-break-inside: avoid;
    }
    
    .key-findings-column {
      flex: 1;
      page-break-inside: avoid;
    }

    /* Print-Specific Styles */
    @media print {
      body {
        margin: 0;
        padding: 0;
      }

      .no-break {
        page-break-inside: avoid !important;
      }

      h1, h2, h3, h4 {
        page-break-after: avoid;
        page-break-inside: avoid;
      }

      p {
        orphans: 3;
        widows: 3;
      }
    }

    /* Empty plan message styling */
    .empty-plan-message {
      padding: 15px;
      background-color: ${colors.lightMint};
      border-radius: 6px;
      border-left: 4px solid ${colors.darkGreen};
      margin: 15px 0;
      font-size: 10pt;
    }

    .empty-plan-message p {
      margin: 0;
      color: ${colors.textDark};
      font-style: italic;
    }

    /* Footer */
    .footer {
      text-align: center;
      margin-top: 2em;
      padding-top: 1em;
      border-top: 1px solid ${colors.lightMint};
      font-size: 8pt;
      color: ${colors.textDark};
      font-family: 'Inter', sans-serif;
    }
    
    /* Markdown content styling */
    .section-intro {
      margin-bottom: 15px;
      line-height: 1.6;
      color: ${colors.textDark};
      font-size: 10pt;
    }

    .markdown-content {
      margin-bottom: 1.5em;
    }

    .markdown-content h2,
    .markdown-content h3 {
      font-size: 18px;
      font-weight: 600;
      color: ${colors.textDark};
      margin-top: 25px;
      margin-bottom: 12px;
      padding-bottom: 5px;
      border-bottom: 1px solid ${colors.lightMint};
    }

    .markdown-content h4,
    .markdown-content h5,
    .markdown-content h6 {
      margin-top: 15px;
      margin-bottom: 8px;
      color: ${colors.textDark};
      font-weight: 600;
    }

    .markdown-content p {
      margin-bottom: 12px;
      line-height: 1.6;
      font-size: 10pt;
      color: ${colors.textBody};
    }

    .markdown-content ul,
    .markdown-content ol {
      margin-bottom: 1em;
      padding-left: 0;
      list-style-type: none;
    }

    .markdown-content ul li {
      position: relative;
      padding: 12px 12px 12px 30px;
      list-style-type: none;
      margin-bottom: 10px;
      line-height: 1.6;
      background-color: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      page-break-inside: avoid !important;
    }

    .markdown-content ul li::before {
      content: '•';
      color: ${colors.darkGreen};
      font-weight: bold;
      position: absolute;
      left: 12px;
    }

    .markdown-content ol li {
      list-style-position: outside;
      margin-bottom: 10px;
      line-height: 1.6;
      padding: 12px 12px 12px 12px;
      background-color: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      margin-left: 20px;
      page-break-inside: avoid !important;
    }

    /* Learning Path and Resources section styling */
    .learning-path-section {
      margin-bottom: 2em;
    }
    
    .learning-path-columns {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      margin-top: 20px;
      page-break-inside: avoid;
    }
    
    .learning-path-column {
      flex: 1;
      page-break-inside: avoid;
    }
    
    .learning-path-column h4 {
      color: ${colors.textDark};
      margin-top: 0;
      margin-bottom: 12px;
      font-weight: bold;
      font-size: 14pt;
      page-break-after: avoid;
      text-align: center;
      padding-bottom: 8px;
      border-bottom: 1px solid ${colors.lightMint};
    }
  </style>
</head>
<body>
  <div class="container">
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
      ${ScoreInformation.FinalScore !== null ? `<p><strong>Final Score:</strong> ${ScoreInformation.FinalScore}/100</p>` : ''}
      <p><strong>Report ID:</strong> ${ScoreInformation.ReportID}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
  </div>

  <!-- Overall Tier Section -->
  <div class="tier-card-container">
    <h3>Your AI Maturity Tier</h3>
    <div class="overall-tier-section">
      <div class="tier-value">${ScoreInformation.AITier}</div>
      <div class="tier-label">Overall Assessment Result</div>
    </div>
  </div>

  <!-- Assessment Results Section -->
  <div class="assessment-results-section">
    <h3>Your Assessment Results</h3>
    <div class="intro-text">
      ${UserInformation.UserName}, your organization is at the <strong>${ScoreInformation.AITier}</strong> tier of AI maturity. ${tierDescription}
    </div>

    <div class="findings-container">
      <div class="strengths-section">
        <h4>Your Strengths</h4>
        ${strengths.length > 0 ? `<ul>
          ${strengths.map(strength => `<li class="list-item-block">${strength}</li>`).join('\n')}
        </ul>` : '<p>No specific strengths were identified in the assessment.</p>'}
      </div>
      
      <div class="focus-areas-section">
        <h4>Focus Areas</h4>
        ${weaknesses.length > 0 ? `<ul>
          ${weaknesses.map(weakness => `<li class="list-item-block">${weakness}</li>`).join('\n')}
        </ul>` : '<p>No specific focus areas were identified in the assessment.</p>'}
      </div>
    </div>

    <div class="next-steps-summary">
      <p>
        Explore your detailed results and recommendations in the sections of this report. We've created a personalized action plan to help advance your AI maturity.
      </p>
    </div>
  </div>

  <!-- Full Report Markdown Section -->
  <div class="full-report-markdown-section">
    <h2>Full Report Details</h2>
    <p class="section-intro">
      Below is the complete content of your AI Efficiency Scorecard report:
    </p>
    <div class="markdown-content">
      ${fullReportHtml}
    </div>
  </div>

  <!-- Strategic Action Plan Section -->
  <div class="action-plan-section">
    <h2>Strategic Action Plan</h2>
    <p class="section-intro">
      Based on your assessment results, we recommend the following strategic actions to improve your AI maturity:
    </p>
    
    <!-- Dynamic Strategic Action Plan -->
    ${(() => {
      const actionItems = extractStrategicPlan(FullReportMarkdown);
      console.log(`Rendering Strategic Action Plan with ${actionItems.length} items`);
      
      if (actionItems.length > 0) {
        return `
        <ul class="action-plan-list">
          ${actionItems.map((action, index) => `
            <li class="action-item">
              <span class="action-number">${index + 1}</span>
              <span class="action-text">${action}</span>
            </li>
          `).join('\n')}
        </ul>`;
      } else {
        return `
        <div class="empty-plan-message">
          <p>No strategic action plan items were found in the report markdown.</p>
        </div>`;
      }
    })()}
  </div>

  <!-- Assessment Q&A Section -->
  <div class="qa-section">
    <h2>Assessment Q&A</h2>
    <p class="section-intro">
      Here are the questions you were asked and your responses during the AI Efficiency Scorecard assessment:
    </p>
    ${(() => {
      if (!QuestionAnswerHistory || QuestionAnswerHistory.length === 0) {
        console.log('No QuestionAnswerHistory data available for rendering Q&A section');
        return `
        <div class="empty-plan-message">
          <p>No question and answer history available for this report.</p>
        </div>`;
      }
      
      console.log(`Rendering Q&A section with ${QuestionAnswerHistory.length} items`);
      const groupedByPhase = groupByPhase(QuestionAnswerHistory);
      
      if (Object.keys(groupedByPhase).length === 0) {
        console.log('No phases found in QuestionAnswerHistory');
        return `
        <div class="empty-plan-message">
          <p>Question and answer data is available but could not be organized by assessment phase.</p>
        </div>`;
      }
      
      return Object.entries(groupedByPhase).map(([phase, questions]) => {
        console.log(`Rendering phase: ${phase} with ${questions.length} questions`);
        return `
          <div class="qa-phase">
            <h3>${phase}</h3>
            <div class="qa-items-container">
              ${questions.map(item => {
                try {
                  console.log(`Rendering Q&A item: ${item.question?.substring(0, 30) || 'No question'}...`);
                  return `
                    <div class="qa-item-wrapper">
                      <div class="qa-item list-item-block">
                        <p class="question"><strong>Q:</strong> ${item.question || 'Question not available'}</p>
                        <p class="answer"><strong>A:</strong> ${formatAnswer(item)}</p>
                      </div>
                    </div>
                  `;
                } catch (error) {
                  console.error(`Error rendering Q&A item:`, error);
                  return `
                    <div class="qa-item-wrapper">
                      <div class="qa-item list-item-block">
                        <p class="question"><strong>Error:</strong> Failed to render this Q&A item</p>
                      </div>
                    </div>
                  `;
                }
              }).join('\n')}
            </div>
          </div>
        `;
      }).join('\n');
    })()}
  </div>
  
  <!-- Footer -->
  <div class="footer">
    <div id="document-footer-content">
      Generated by Social Garden for ${UserInformation.UserName} at ${UserInformation.CompanyName}
      <br/>© ${new Date().getFullYear()} Social Garden - All Rights Reserved
    </div>
  </div>
  </div> <!-- Close container -->
</body>
</html>`;
}
