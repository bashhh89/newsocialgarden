"use client";

import React, { useState } from 'react';
// import { ScorecardPDFGenerator } from './ScorecardPDFDocument'; // No longer needed

interface PDFDownloadButtonProps {
  // reportData: any; // No longer needed if server fetches/has data
  fileName?: string; // Still relevant for the downloaded file name, but server sets it now.
  buttonText?: string;
  className?: string;
  reportId?: string; // Optional: to pass to the API route if needed later
}

export const ScorecardPDFDownloadButton: React.FC<PDFDownloadButtonProps> = ({
  // reportData, // Removed
  buttonText = 'Download PDF Report',
  className = '',
  reportId, // Optional
}) => {
  const [isGenerating, setIsGenerating] = useState(false); // Keep for UI feedback

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      let apiUrl = '/api/generate-scorecard-report';
      if (reportId) {
        apiUrl += `?reportId=${encodeURIComponent(reportId)}`;
      }
      window.location.href = apiUrl;
      // The download is now handled by the browser navigating to the API endpoint.
      // We might not know exactly when the download starts or finishes from here.
      // For a better UX, one might want to poll or use a different mechanism,
      // but for now, this directly triggers the download.
      // Setting isGenerating to false might be premature or can be done after a timeout.
      // However, since window.location.href navigates, this component might unmount or lose state.
      // For simplicity, we'll assume the navigation is quick and the user sees the browser's download starting.
      // Consider keeping isGenerating true until navigation or having a different feedback mechanism.
      // For this step, we'll set it to false after a short delay to re-enable the button if navigation fails silently.
      setTimeout(() => setIsGenerating(false), 3000); // Re-enable button after 3s as a fallback

    } catch (error) {
      console.error('Failed to initiate PDF download:', error);
      setIsGenerating(false);
      alert('Failed to initiate PDF report download. Please try again.');
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isGenerating}
      className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors 
                 disabled:bg-gray-400 disabled:cursor-not-allowed ${className}`}
    >
      {isGenerating ? 'Downloading PDF...' : buttonText} 
    </button>
  );
};

export default ScorecardPDFDownloadButton; 