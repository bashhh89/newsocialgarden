import fs from 'fs';
import path from 'path';
import { ScorecardData, generateScorecardHTML } from './html-generator';

/**
 * Save the generated HTML to a file for browser preview
 * This is used for debugging purposes only
 */
export async function saveHTMLPreview(data: ScorecardData): Promise<string> {
  try {
    // Generate the HTML content
    const htmlContent = await generateScorecardHTML(data);
    
    // Modify font paths for local viewing
    const modifiedHtml = htmlContent.replace(
      /url\('\/public\/fonts\/([^']+)'\)/g, 
      "url('../../../public/fonts/$1')"
    );
    
    // Create a timestamp for unique filenames
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `scorecard-preview-${timestamp}.html`;
    
    // Save to the project root for easy access
    const filePath = path.join(process.cwd(), fileName);
    fs.writeFileSync(filePath, modifiedHtml, 'utf8');
    
    console.log(`HTML preview saved to: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error('Error saving HTML preview:', error);
    throw error;
  }
} 