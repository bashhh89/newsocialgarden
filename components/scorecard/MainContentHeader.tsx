'use client';

import React, { useState } from 'react';

interface MainContentHeaderProps {
  activeTabTitle: string;
  reportMarkdown: string; 
  reportId?: string;
  onPdfDownload?: () => void;
}

const MainContentHeader: React.FC<MainContentHeaderProps> = ({ 
  activeTabTitle, 
  reportMarkdown,
  reportId,
  onPdfDownload
}) => {
  const [linkGenerated, setLinkGenerated] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyJSON = () => {
    if (navigator.clipboard && reportMarkdown) {
      navigator.clipboard.writeText(reportMarkdown)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(err => {
          console.error('Failed to copy text: ', err);
        });
    } else {
      console.warn('Clipboard API not available or no report markdown to copy.');
    }
  };

  const handleDownloadPDF = () => {
    if (onPdfDownload) {
      onPdfDownload();
    } else if (reportId) {
      // Fallback if no handler provided but we have a reportId
      window.open(`/api/generate-presentation-weasyprint-report?reportId=${reportId}`, '_blank');
    }
  };

  const handleGenerateLink = () => {
    if (!reportId) {
      console.error('Cannot generate link: No report ID available');
      return;
    }
    
    // Create a shareable URL with the reportId
    const shareUrl = `${window.location.origin}/scorecard/results?reportId=${reportId}`;
    
    // Copy the URL to clipboard
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setLinkGenerated(true);
        setTimeout(() => setLinkGenerated(false), 3000);
        console.log('Shareable link copied:', shareUrl);
      })
      .catch(err => {
        console.error('Failed to copy shareable link', err);
      });
  };

  return (
    <div className="flex justify-between items-center mb-12">
      <div>
        <h2 className="text-5xl font-black text-[#004851] mb-2 tracking-tight">
          {activeTabTitle}
          <span className="ml-2 text-[#68F6C8]">.</span>
        </h2>
        <div className="h-1 w-24 bg-gradient-to-r from-[#68F6C8] to-[#004851] rounded-full"></div>
      </div>
      
      <div className="flex gap-3">
        <button 
          onClick={handleDownloadPDF}
          className="bg-white hover:bg-gray-50 text-[#004851] px-5 py-3 rounded-xl transition-all border border-gray-200 flex items-center gap-2 shadow-sm hover:shadow-md"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download PDF
        </button>
        <button 
          onClick={handleGenerateLink}
          className={`bg-white hover:bg-gray-50 text-[#004851] px-5 py-3 rounded-xl transition-all border border-gray-200 flex items-center gap-2 shadow-sm hover:shadow-md ${linkGenerated ? 'border-[#68F6C8]' : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          {linkGenerated ? 'Link Copied!' : 'Generate Link'}
        </button>
        <button 
          onClick={handleCopyJSON}
          className="bg-[#68F6C8] hover:bg-[#68F6C8]/90 text-[#004851] px-5 py-3 rounded-xl transition-all font-medium shadow-sm hover:shadow-md flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
          </svg>
          {copied ? 'Copied!' : 'Copy JSON'}
        </button>
      </div>
    </div>
  );
};

export default MainContentHeader; 