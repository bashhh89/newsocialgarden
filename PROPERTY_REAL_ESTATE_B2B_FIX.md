# Property/Real Estate Industry B2B Question Fix

## Issue Summary
Client (George) feedback indicated that some questions for the "Property/Real Estate" industry were too consumer-oriented rather than B2B focused. Questions were referencing "your real estate portfolio" which implied the user was a property owner/investor instead of focusing on the user's business operations within their real estate company/agency.

## Solution Implemented
Modified the system prompt in `app/api/scorecard-ai/route.ts` to include special handling for the Property/Real Estate industry. The updated prompt explicitly instructs the AI to:

1. Generate B2B-focused questions addressing business operations and AI use within real estate companies/agencies
2. Avoid consumer-focused questions that reference "your real estate portfolio" or imply the user is a property owner/investor
3. Frame questions around business areas like:
   - Property management operations
   - Agent productivity and training
   - Marketing and lead generation
   - Business analytics and market research
   - Back-office automation and efficiency
   - Client relationship management

## Validation
Created a test script (`test-property-real-estate-questions.js`) that uses OpenAI's API with George's key to generate sample B2B-focused questions for the Property/Real Estate industry. The script generated 20 questions across all five assessment phases, all properly focused on business operations rather than consumer concerns.

### Sample B2B-Focused Questions
Here are examples of revised B2B-focused questions:

1. "How is your real estate agency currently utilizing AI tools to enhance agent productivity and training?"
2. "What AI-powered tools has your property management firm implemented to improve operational efficiency?"
3. "To what extent does your brokerage integrate AI to analyze market trends and support strategic decision-making?"
4. "Which AI technologies does your real estate business utilize for enhanced business analytics and market research?"

### Implementation Details
- The fix required only modifying the system prompt used to generate questions in the `handleAssessmentRequest` function
- No data structure changes were needed
- The prompt enhancement ensures all future questions will be B2B-focused for this industry

## Next Steps
1. Test the changes in a development environment to ensure question generation works as expected
2. Monitor initial questions to confirm they maintain a B2B focus
3. Await Ahmad's confirmation before pushing the change to GitHub 