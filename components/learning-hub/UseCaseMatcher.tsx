import React, { useState, useEffect } from 'react';

interface MatchResult {
  modelName: string;
  score: number;
  rationale: string;
}

interface UseCaseMatcherProps {
  tasks: { id: string; label: string }[];
}

export default function UseCaseMatcher({ tasks }: UseCaseMatcherProps) {
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTaskSelect = async (taskId: string) => {
    setSelectedTask(taskId);
    setIsLoading(true);
    setError(null);
    
    try {
      // Real API call to get model recommendations
      const response = await fetch(`/api/learning-hub/model-recommendations?taskId=${encodeURIComponent(taskId)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch model recommendations');
      }
      
      const data = await response.json();
      setResults(data.recommendations || []);
    } catch (err) {
      console.error('Error fetching model recommendations:', err);
      setError('Unable to load recommendations. Please try again later.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-sg-bright-green/20 p-6 mb-8">
      <h3 className="text-xl font-bold text-sg-dark-teal mb-4">AI Model Matcher</h3>
      <p className="text-sg-dark-teal/80 mb-4">Select your marketing task to see which AI models are best suited:</p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {tasks.map(task => (
          <button
            key={task.id}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedTask === task.id 
                ? 'bg-sg-bright-green text-white' 
                : 'bg-sg-light-mint text-sg-dark-teal hover:bg-sg-bright-green/30'
            }`}
            onClick={() => handleTaskSelect(task.id)}
          >
            {task.label}
          </button>
        ))}
      </div>
      
      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-block w-6 h-6 border-2 border-sg-bright-green/30 border-t-sg-bright-green rounded-full animate-spin"></div>
          <p className="text-sg-dark-teal/70 mt-2">Loading recommendations...</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {selectedTask && results.length > 0 && !isLoading && (
        <div className="space-y-4 mt-6">
          <h4 className="font-semibold text-sg-dark-teal">Recommended Models:</h4>
          {results.map((result, index) => (
            <div key={index} className="border-l-4 border-sg-bright-green pl-4 py-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sg-dark-teal">{result.modelName}</span>
                <span className="bg-sg-bright-green/10 text-sg-dark-teal px-2 py-1 rounded text-sm font-medium">
                  Score: {result.score}/10
                </span>
              </div>
              <p className="text-sm text-sg-dark-teal/70 mt-1">{result.rationale}</p>
            </div>
          ))}
        </div>
      )}
      
      {selectedTask && results.length === 0 && !isLoading && !error && (
        <div className="text-center py-8">
          <p className="text-sg-dark-teal/70">No recommendations available for this task yet.</p>
        </div>
      )}
    </div>
  );
}
