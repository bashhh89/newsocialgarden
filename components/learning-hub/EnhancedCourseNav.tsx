'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Module {
  id: string;
  label: string;
  isCompleted?: boolean;
}

interface EnhancedCourseNavProps {
  courseName: string;
  courseId: string;
  modules: Module[];
  activeModuleId: string;
  onModuleChange: (id: string) => void;
  duration?: string;
  totalModules?: number;
  userTier?: string;
}

export default function EnhancedCourseNav({
  courseName,
  courseId,
  modules,
  activeModuleId,
  onModuleChange,
  duration,
  totalModules,
  userTier = 'Dabbler'
}: EnhancedCourseNavProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [progress, setProgress] = useState(0);
  
  // Calculate progress based on completed modules
  useEffect(() => {
    if (modules.length > 0) {
      const completedCount = modules.filter(m => m.isCompleted).length;
      const activeIndex = modules.findIndex(m => m.id === activeModuleId);
      
      // Consider current module as partially complete
      const progressValue = ((completedCount + (activeIndex > -1 ? 0.5 : 0)) / modules.length) * 100;
      setProgress(Math.min(100, Math.max(0, progressValue)));
    }
  }, [modules, activeModuleId]);

  return (
    <div className={`bg-white rounded-xl shadow-lg transition-all duration-300 overflow-hidden ${isExpanded ? 'w-full' : 'w-auto'}`}>
      {/* Header with toggle */}
      <div className="bg-sg-dark-teal text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-8 h-8 rounded-full bg-sg-bright-green/20 flex items-center justify-center hover:bg-sg-bright-green/30 transition-colors"
            aria-label={isExpanded ? "Collapse course navigation" : "Expand course navigation"}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          {isExpanded && (
            <div>
              <h3 className="font-bold text-lg leading-tight">{courseName}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-0.5 rounded-full bg-sg-bright-green/20 text-sg-bright-green font-medium">
                  {userTier}
                </span>
                {duration && (
                  <span className="text-xs text-white/70 flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    {duration}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
        
        {isExpanded && (
          <Link 
            href="/learning-hub"
            className="text-sm text-white/80 hover:text-white flex items-center gap-1 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            Exit
          </Link>
        )}
      </div>
      
      {/* Progress bar */}
      <div className="h-2 bg-gray-100 w-full">
        <motion.div 
          className="h-full bg-sg-bright-green"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      
      {/* Modules list */}
      {isExpanded && (
        <div className="p-4">
          <div className="mb-4 flex justify-between items-center">
            <h4 className="text-sm font-semibold text-sg-dark-teal">Course Modules</h4>
            <span className="text-xs text-sg-dark-teal/70">{Math.round(progress)}% complete</span>
          </div>
          
          <div className="space-y-2">
            {modules.map((module, index) => {
              const isActive = module.id === activeModuleId;
              const isCompleted = module.isCompleted;
              
              return (
                <button
                  key={module.id}
                  onClick={() => onModuleChange(module.id)}
                  className={`
                    w-full flex items-center p-3 rounded-lg transition-all
                    ${isActive 
                      ? 'bg-sg-bright-green/10 border-l-4 border-sg-bright-green' 
                      : isCompleted
                        ? 'bg-white hover:bg-gray-50 border-l-4 border-gray-200' 
                        : 'bg-white hover:bg-gray-50 border-l-4 border-transparent'
                    }
                  `}
                >
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mr-3
                    ${isCompleted
                      ? 'bg-sg-bright-green text-white'
                      : isActive
                        ? 'bg-white border-2 border-sg-bright-green text-sg-bright-green'
                        : 'bg-gray-100 text-gray-500'
                    }
                  `}>
                    {isCompleted ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </div>
                  
                  <div className="flex-1 text-left">
                    <div className={`text-sm ${isActive ? 'font-semibold text-sg-dark-teal' : 'text-gray-700'}`}>
                      {module.label}
                    </div>
                    
                    {isActive && (
                      <div className="text-xs text-sg-bright-green mt-1">
                        Currently viewing
                      </div>
                    )}
                    
                    {isCompleted && !isActive && (
                      <div className="text-xs text-gray-500 mt-1">
                        Completed
                      </div>
                    )}
                  </div>
                  
                  {isActive && (
                    <div className="ml-2 text-sg-bright-green">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Navigation buttons */}
          <div className="mt-6 flex flex-col gap-3">
            {activeModuleId && (
              <>
                {/* Find current module index */}
                {(() => {
                  const currentIndex = modules.findIndex(m => m.id === activeModuleId);
                  const prevModule = currentIndex > 0 ? modules[currentIndex - 1] : null;
                  const nextModule = currentIndex < modules.length - 1 ? modules[currentIndex + 1] : null;
                  
                  return (
                    <div className="flex gap-3">
                      <button
                        onClick={() => prevModule && onModuleChange(prevModule.id)}
                        disabled={!prevModule}
                        className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1 text-sm
                          ${prevModule 
                            ? 'bg-white border border-gray-200 text-sg-dark-teal hover:bg-gray-50' 
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }
                        `}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="19" y1="12" x2="5" y2="12"></line>
                          <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                        Previous
                      </button>
                      
                      <button
                        onClick={() => nextModule && onModuleChange(nextModule.id)}
                        disabled={!nextModule}
                        className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1 text-sm
                          ${nextModule 
                            ? 'bg-sg-bright-green text-white hover:bg-sg-bright-green/90' 
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }
                        `}
                      >
                        Next
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                          <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                      </button>
                    </div>
                  );
                })()}
                
                <Link
                  href="/learning-hub"
                  className="w-full py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-sm bg-white border border-gray-200 text-sg-dark-teal hover:bg-gray-50"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                  Back to Learning Hub
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 