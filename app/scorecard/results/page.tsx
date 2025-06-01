'use client';
import React, { Suspense, useEffect, useState } from 'react';
import NewResultsPage from './NewResultsPage';
import LeadCaptureForm from '@/components/scorecard/LeadCaptureForm';

// Loading fallback component
const ResultsLoading = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: '#F3FDF5'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: '60px',
        height: '60px',
        border: '4px solid rgba(32, 226, 143, 0.2)',
        borderTop: '4px solid #20E28F',
        borderRadius: '50%',
        animation: 'spin 1.5s linear infinite',
        margin: '0 auto 20px'
      }}></div>
      <div style={{ fontFamily: 'Arial, sans-serif', color: '#103138', fontWeight: 600 }}>
        Loading Scorecard...
      </div>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  </div>
);

export default function ResultsPage() {
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    // Debug any issues with accessing the results
    console.log('RESULTS PAGE WRAPPER: Component mounted');
    
    if (typeof window !== 'undefined') {
      // Check for lead information first
      const leadEmail = sessionStorage.getItem('scorecardLeadEmail') || localStorage.getItem('scorecardLeadEmail');
      const leadName = sessionStorage.getItem('scorecardLeadName') || 
                       sessionStorage.getItem('scorecardUserName') || 
                       localStorage.getItem('scorecardLeadName') || 
                       localStorage.getItem('scorecardUserName');
      
      // Log storage state to debug
      const sessionReportId = sessionStorage.getItem('currentReportID') || sessionStorage.getItem('reportId');
      const localReportId = localStorage.getItem('currentReportID') || localStorage.getItem('reportId');
      
      console.log('RESULTS PAGE WRAPPER: Session report ID:', sessionReportId);
      console.log('RESULTS PAGE WRAPPER: Local report ID:', localReportId);
      console.log('RESULTS PAGE WRAPPER: Lead name found:', leadName);
      
      // Store userName in state for passing to child components
      if (leadName && leadName !== 'User') {
        setUserName(leadName);
      }
      
      // Log session/local markdown
      const sessionMarkdown = sessionStorage.getItem('reportMarkdown');
      const localMarkdown = localStorage.getItem('reportMarkdown');
      
      console.log('RESULTS PAGE WRAPPER: Session markdown exists:', !!sessionMarkdown);
      console.log('RESULTS PAGE WRAPPER: Local markdown exists:', !!localMarkdown);
      
      if (sessionMarkdown) {
        console.log('RESULTS PAGE WRAPPER: Session markdown preview:', 
          sessionMarkdown.substring(0, 100) + '...');
      }
      
      // Check for user tier
      const tier = sessionStorage.getItem('tier') || 
                  sessionStorage.getItem('userAITier') || 
                  sessionStorage.getItem('aiTier') ||
                  localStorage.getItem('tier') || 
                  localStorage.getItem('userAITier') || 
                  localStorage.getItem('aiTier');
                  
      console.log('RESULTS PAGE WRAPPER: Stored tier value:', tier);

      // If we have report data but no lead info, show the lead form
      if (sessionMarkdown && (!leadEmail || !leadName)) {
        console.log('RESULTS PAGE WRAPPER: Report exists but no lead info found, showing lead form');
        setShowLeadForm(true);
        
        // Collect report data for the lead form
        setReportData({
          reportMarkdown: sessionMarkdown,
          questionAnswerHistory: JSON.parse(sessionStorage.getItem('questionAnswerHistory') || localStorage.getItem('questionAnswerHistory') || '[]'),
          tier: tier,
          industry: sessionStorage.getItem('industry') || localStorage.getItem('industry') || ''
        });
      } else {
        setLeadCaptured(true);
      }
    }
  }, []);
  
  const handleLeadCaptureSuccess = (capturedName: string) => {
    console.log("RESULTS PAGE WRAPPER: Lead capture successful. Captured name:", capturedName);
    
    // Validate the name
    if (capturedName && capturedName.trim() !== '' && capturedName.toLowerCase() !== 'user') {
      const formattedName = capturedName.trim();
      setUserName(formattedName);
      setLeadCaptured(true);
      setShowLeadForm(false);
      
      // Store the name in multiple places for redundancy
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('scorecardUserName', formattedName);
        localStorage.setItem('scorecardUserName', formattedName);
      }
    } else {
      console.warn("RESULTS PAGE WRAPPER: Invalid name captured from lead form, using default");
      setUserName("Customer");
      setLeadCaptured(true);
      setShowLeadForm(false);
    }
  };
  
  if (showLeadForm && reportData) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <LeadCaptureForm
          aiTier={reportData.tier}
          onSubmitSuccess={handleLeadCaptureSuccess}
          reportMarkdown={reportData.reportMarkdown}
          questionAnswerHistory={reportData.questionAnswerHistory}
          industry={reportData.industry || ''}
        />
      </div>
    );
  }
  
  return (
    <Suspense fallback={<ResultsLoading />}>
      <NewResultsPage initialUserName={userName} />
    </Suspense>
  );
}
