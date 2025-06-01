interface Finding {
  strengths: string[];
  weaknesses: string[];
}

interface AnswerHistoryEntry {
  question: string;
  answer: string;
  phaseName?: string;
  answerType?: string;
  options?: string[];
  index?: number;
}

/**
 * Analyzes assessment responses to identify key strengths and weaknesses
 */
export function generateFindings(questionAnswerHistory: AnswerHistoryEntry[]): Finding {
  const findings: Finding = {
    strengths: [],
    weaknesses: []
  };

  if (!questionAnswerHistory || questionAnswerHistory.length === 0) {
    return findings;
  }

  // Group answers by phase for analysis
  const phaseGroups = questionAnswerHistory.reduce((acc, entry) => {
    const phase = entry.phaseName || 'General';
    if (!acc[phase]) {
      acc[phase] = [];
    }
    acc[phase].push(entry);
    return acc;
  }, {} as Record<string, AnswerHistoryEntry[]>);

  // Analyze Strategy & Goals
  if (phaseGroups['Strategy & Goals']) {
    const strategyAnswers = phaseGroups['Strategy & Goals'];
    const aiStrategyScore = getAverageScaleScore(strategyAnswers);
    
    if (aiStrategyScore >= 4) {
      findings.strengths.push('Strong AI strategy alignment with business goals');
    } else if (aiStrategyScore <= 2) {
      findings.weaknesses.push('Need for better alignment of AI initiatives with business strategy');
    }
  }

  // Analyze Data Readiness
  if (phaseGroups['Data Readiness']) {
    const dataAnswers = phaseGroups['Data Readiness'];
    const dataQualityScore = getAverageScaleScore(dataAnswers);
    
    if (dataQualityScore >= 4) {
      findings.strengths.push('High-quality data infrastructure supporting AI initiatives');
    } else if (dataQualityScore <= 2) {
      findings.weaknesses.push('Data quality and integration challenges need addressing');
    }
  }

  // Analyze Technology & Tools
  if (phaseGroups['Technology & Tools']) {
    const techAnswers = phaseGroups['Technology & Tools'];
    const techAdoptionScore = getAverageScaleScore(techAnswers);
    
    if (techAdoptionScore >= 4) {
      findings.strengths.push('Strong adoption of AI-powered technology tools');
    } else if (techAdoptionScore <= 2) {
      findings.weaknesses.push('Limited implementation of AI technologies across operations');
    }
  }

  // Analyze Team Skills & Process
  if (phaseGroups['Team Skills & Process']) {
    const skillsAnswers = phaseGroups['Team Skills & Process'];
    const skillsScore = getAverageScaleScore(skillsAnswers);
    
    if (skillsScore >= 4) {
      findings.strengths.push('Well-developed AI expertise and training programs');
    } else if (skillsScore <= 2) {
      findings.weaknesses.push('Need for enhanced AI training and skill development');
    }
  }

  // Analyze Governance & Measurement
  if (phaseGroups['Governance & Measurement']) {
    const govAnswers = phaseGroups['Governance & Measurement'];
    const govScore = getAverageScaleScore(govAnswers);
    
    if (govScore >= 4) {
      findings.strengths.push('Strong AI governance and performance measurement');
    } else if (govScore <= 2) {
      findings.weaknesses.push('Improved AI governance and metrics needed');
    }
  }

  // Ensure at least some findings are present
  if (findings.strengths.length === 0) {
    findings.strengths.push('Commitment to AI adoption and improvement');
  }
  if (findings.weaknesses.length === 0) {
    findings.weaknesses.push('Opportunity for enhanced AI strategy and implementation');
  }

  return findings;
}

/**
 * Calculates the average score from scale-type questions
 */
function getAverageScaleScore(answers: AnswerHistoryEntry[]): number {
  const scaleAnswers = answers.filter(a => a.answerType === 'scale' && !isNaN(Number(a.answer)));
  if (scaleAnswers.length === 0) return 3; // Default neutral score
  
  const sum = scaleAnswers.reduce((acc, curr) => acc + Number(curr.answer), 0);
  return sum / scaleAnswers.length;
}

/**
 * Inserts key findings into the report markdown
 */
export function insertKeyFindings(markdown: string, findings: Finding): string {
  const keyFindingsSection = `
## Key Findings

**Strengths:**
${findings.strengths.map(s => `- ${s}`).join('\n')}

**Weaknesses:**
${findings.weaknesses.map(w => `- ${w}`).join('\n')}
`;

  // Try to insert after Overall Assessment or at the start if not found
  const overallSection = markdown.match(/## Overall (Assessment|Tier)/i);
  if (overallSection) {
    const index = markdown.indexOf(overallSection[0]) + overallSection[0].length;
    return markdown.slice(0, index) + '\n\n' + keyFindingsSection + '\n\n' + markdown.slice(index);
  }

  // Fallback: insert at the beginning
  return keyFindingsSection + '\n\n' + markdown;
}
