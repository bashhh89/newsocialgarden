# How the User Name is Displayed in the Results Page Instead of a Placeholder

This document explains the key steps and code changes made to ensure the user's name appears throughout the results page, replacing the previous placeholder text.

---

## Background

Previously, the results page component (`NewResultsPage.tsx`) only rendered a placeholder message ("Results page component rendering") after the questions were completed. The user name and other dynamic data were not displayed.

The goal was to update the component so that the user's name and other report data appear correctly in all relevant sections of the results page.

---

## Key Changes Made

### 1. Fetching User and Report Data

- The component uses the `useSearchParams` hook from Next.js to get the `reportId` from the URL query parameters.
- Using Firebase Firestore, the report document is fetched by `reportId`.
- The report data includes:
  - `reportMarkdown`: The markdown content of the report.
  - `questionAnswerHistory`: The history of questions and answers.
- The user's tier, industry, strengths, weaknesses, and action items are extracted from the markdown content using helper functions.
- The user's name is retrieved from lead capture form submission or session storage.

### 2. State Management

- React `useState` hooks manage the following:
  - `userName`, `userTier`, `userIndustry`
  - `strengths`, `weaknesses`, `actionItems`
  - Loading and error states
  - Active tab for the tabbed interface

### 3. Rendering the Results Page UI

- The placeholder div was replaced with a full tabbed interface.
- Tabs include: Overall Tier, Key Findings, Recommendations, Strategic Action Plan, Detailed Analysis, Benchmarks, Assessment Q&A, Learning Path.
- The user's name (`userName`) is displayed prominently in the "Overall Tier" tab and used in other sections as needed.
- Each tab renders a dedicated section component, passing the relevant data as props.
- Loading and error states are handled gracefully with a loader or error message.
- Share and download PDF buttons are included.
- Lead capture form is shown if user info is missing.

### 4. Passing Correct Props to Components

- The section components receive the correct props with expected types, including user-related data.
- This ensures the components can display user-specific information properly.

---

## Summary

To make the user appear everywhere instead of a placeholder:

- Fetch and store user and report data in component state.
- Extract user name and other insights from the report markdown and lead capture.
- Replace placeholder UI with a full results page UI that uses the user data.
- Pass user data as props to all relevant child components.
- Handle loading, error, and lead capture states properly.

---

## Additional Notes

- The user name is stored in session storage after lead capture to persist across page reloads.
- The tabbed interface improves navigation and user experience.
- Toast notifications provide feedback for sharing and downloading actions.

---

This approach ensures a dynamic, data-driven results page that reflects the actual user and report data instead of static placeholders.
