'use client';

import { useState, useEffect } from 'react';
import { ArxivPaper } from '@/types/arxiv';
import { generatePaperInsights } from '@/services/gemini';
import PaperViewer from './PaperViewer';
import TopicMap from './TopicMap';

type Tab = 'table' | 'stories' | 'tree' | 'topic-map';

interface PaperTabsProps {
  papers: ArxivPaper[];
  loading: boolean;
}

interface PaperInsights {
  quickSummary: string;
  targetAudience: string;
  keyComponents: string;
  structureAnalysis: string;
  impactApplications: string;
  technicalComplexity: string;
}

const rotatingIconStyle = {
  animation: 'spin 2s infinite linear',
  transformOrigin: 'center',
  transform: 'scale(5)'
} as const;

const rotatingKeyframes = `
@keyframes spin {
  from {
    transform: scale(5) rotateY(0deg);
  }
  to {
    transform: scale(5) rotateY(360deg);
  }
}
`;

const TreeNode = ({ title, content, children }: { 
  title: string; 
  content?: string;
  children?: React.ReactNode 
}) => (
  <div className="ml-8 relative transition-all duration-200 hover:transform hover:translate-x-1">
    <div className="absolute left-0 top-0 h-full w-8 border-l-2 border-b-2 border-black -ml-8"></div>
    <div className="nes-container is-rounded mb-4 hover:shadow-lg transition-shadow">
      <h4 className="text-md font-bold mb-2">{title}</h4>
      {content && <p className="text-sm mb-4 text-gray-700">{content}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  </div>
);

export default function PaperTabs({ papers, loading }: PaperTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('table');
  const [selectedPaper, setSelectedPaper] = useState<ArxivPaper | null>(null);
  const [currentPaperIndex, setCurrentPaperIndex] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [paperInsights, setPaperInsights] = useState<Record<string, PaperInsights>>({});
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [insightErrors, setInsightErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadInsights = async () => {
      if (!papers[currentPaperIndex]) return;
      const paper = papers[currentPaperIndex];
      
      if (!paperInsights[paper.id] && !insightErrors[paper.id]) {
        setLoadingInsights(true);
        try {
          const retryWithBackoff = async (retries = 3, delay = 2000) => {
            try {
              const insights = await generatePaperInsights(paper);
              setPaperInsights(prev => ({
                ...prev,
                [paper.id]: insights
              }));
              setInsightErrors(prev => ({
                ...prev,
                [paper.id]: false
              }));
            } catch (error) {
              const err = error as Error;
              if (retries > 0 && err.message?.includes('429')) {
                await new Promise(resolve => setTimeout(resolve, delay));
                return retryWithBackoff(retries - 1, delay * 2);
              }
              throw error;
            }
          };

          await retryWithBackoff();
        } catch (error) {
          console.error('Error generating insights:', error);
          setInsightErrors(prev => ({
            ...prev,
            [paper.id]: true
          }));
        }
        setLoadingInsights(false);
      }
    };

    if (activeTab === 'stories' || activeTab === 'tree') {
      loadInsights();
    }
  }, [currentPaperIndex, papers, activeTab, paperInsights, insightErrors]);

  const getCurrentPaperSlides = () => {
    if (!papers[currentPaperIndex]) return [];
    const paper = papers[currentPaperIndex];
    const insights = paperInsights[paper.id];

    if (!insights) {
      return [{ type: 'loading', content: 'Generating insights...' }];
    }

    return [
      { type: 'Quick Summary', content: insights.quickSummary },
      { type: 'Target Audience', content: insights.targetAudience },
      { type: 'Key Components', content: insights.keyComponents },
      { type: 'Structure Analysis', content: insights.structureAnalysis },
      { type: 'Impact & Applications', content: insights.impactApplications },
      { type: 'Technical Complexity', content: insights.technicalComplexity }
    ];
  };

  const handleNextPaper = () => {
    if (currentPaperIndex < papers.length - 1) {
      setCurrentPaperIndex(prev => prev + 1);
      setCurrentSlide(0);
    }
  };

  const handlePrevPaper = () => {
    if (currentPaperIndex > 0) {
      setCurrentPaperIndex(prev => prev - 1);
      setCurrentSlide(0);
    }
  };

  const slides = getCurrentPaperSlides();

  return (
    <>
      <style>{rotatingKeyframes}</style>
      <div className="nes-container with-title min-h-screen p-0" style={{ transform: 'scale(0.9)', transformOrigin: 'center top', padding: '1rem' }}>
        <h3 className="title" style={{ fontSize: '1.5rem' }}>Papers View</h3>
        
        <div className="flex gap-4 mb-8">
          <button 
            className={`nes-btn ${activeTab === 'table' ? 'is-primary' : ''}`}
            onClick={() => setActiveTab('table')}
          >
            Table View
          </button>
          <button 
            className={`nes-btn ${activeTab === 'stories' ? 'is-primary' : ''}`}
            onClick={() => setActiveTab('stories')}
          >
            Stories View
          </button>
          <button 
            className={`nes-btn ${activeTab === 'tree' ? 'is-primary' : ''}`}
            onClick={() => setActiveTab('tree')}
          >
            Summary Tree
          </button>
          <button 
            className={`nes-btn ${activeTab === 'topic-map' ? 'is-primary' : ''}`}
            onClick={() => setActiveTab('topic-map')}
          >
            Topic Map
          </button>
        </div>

        {loading ? (
          <progress className="nes-progress is-primary" value="70" max="100" />
        ) : (
          <div className="mt-8">
            {activeTab === 'table' ? (
              <div 
                className="overflow-x-auto" 
                style={{ 
                  height: 'calc(100vh - 200px)', 
                  overflowY: 'auto', 
                  border: '1px solid #ccc', 
                  borderRadius: '4px' 
                }}
              >
                <table className="nes-table is-bordered is-centered w-full">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Authors</th>
                      <th>Published</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {papers.map((paper) => (
                      <tr key={paper.id}>
                        <td className="max-w-md">
                          <p className="truncate" title={paper.title}>
                            {paper.title}
                          </p>
                        </td>
                        <td className="max-w-xs">
                          <p className="truncate" title={paper.authors.join(', ')}>
                            {paper.authors.join(', ')}
                          </p>
                        </td>
                        <td>{new Date(paper.published).toLocaleDateString()}</td>
                        <td>
                          <button 
                            onClick={() => setSelectedPaper(paper)}
                            className="nes-btn is-primary is-small"
                          >
                            Preview
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : activeTab === 'tree' ? (
              <div className="nes-container with-title">
                <p className="title">Summary Tree</p>
                <div className="overflow-auto h-[700px] p-8">
                  {papers[currentPaperIndex] && (
                    <div>
                      <div className="nes-container is-rounded mb-4">
                        <h3 className="text-xl font-bold mb-4">{papers[currentPaperIndex].title}</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          by {papers[currentPaperIndex].authors.join(', ')}
                        </p>
                      </div>

                      {paperInsights[papers[currentPaperIndex].id] ? (
                        <div className="ml-4">
                          <TreeNode 
                            title="Quick Summary" 
                            content={paperInsights[papers[currentPaperIndex].id].quickSummary}
                          >
                            <TreeNode title="Key Points" content="Main takeaways and core findings" />
                            <TreeNode title="Significance" content="Why this research matters" />
                          </TreeNode>
                          
                          <TreeNode 
                            title="Target Audience" 
                            content={paperInsights[papers[currentPaperIndex].id].targetAudience}
                          >
                            <TreeNode title="Required Background" content="Prerequisites and assumed knowledge" />
                            <TreeNode title="Interest Groups" content="Who would benefit most from this research" />
                          </TreeNode>
                          
                          <TreeNode 
                            title="Key Components" 
                            content={paperInsights[papers[currentPaperIndex].id].keyComponents}
                          >
                            <TreeNode title="Research Questions" content="Main problems addressed" />
                            <TreeNode title="Methodology" content="Approach and methods used" />
                            <TreeNode title="Findings" content="Key results and discoveries" />
                          </TreeNode>
                          
                          <TreeNode 
                            title="Structure Analysis" 
                            content={paperInsights[papers[currentPaperIndex].id].structureAnalysis}
                          >
                            <TreeNode title="Paper Organization" content="How the paper is structured" />
                            <TreeNode title="Key Sections" content="Important parts of the paper" />
                          </TreeNode>
                          
                          <TreeNode 
                            title="Impact & Applications" 
                            content={paperInsights[papers[currentPaperIndex].id].impactApplications}
                          >
                            <TreeNode title="Practical Uses" content="Real-world applications" />
                            <TreeNode title="Future Work" content="Potential future developments" />
                          </TreeNode>
                          
                          <TreeNode 
                            title="Technical Complexity" 
                            content={paperInsights[papers[currentPaperIndex].id].technicalComplexity}
                          >
                            <TreeNode title="Difficulty Level" content="Overall complexity assessment" />
                            <TreeNode title="Core Concepts" content="Fundamental ideas needed" />
                          </TreeNode>
                        </div>
                      ) : insightErrors[papers[currentPaperIndex].id] ? (
                        <div className="p-4 text-center">
                          <i className="nes-icon close is-large"></i>
                          <p className="mt-4 text-red-600">Failed to generate insights. Please try again later.</p>
                          <button 
                            className="nes-btn is-error mt-4"
                            onClick={() => {
                              setInsightErrors(prev => ({
                                ...prev,
                                [papers[currentPaperIndex].id]: false
                              }));
                            }}
                          >
                            Retry
                          </button>
                        </div>
                      ) : (
                        <div className="p-4 text-center">
                          <i className="nes-icon coin is-large" style={rotatingIconStyle}></i>
                          <p>Generating insights...</p>
                        </div>
                      )}

                      {/* Paper Navigation */}
                      <div className="flex justify-between mt-6">
                        <button 
                          className="nes-btn hover:opacity-80 transition-opacity"
                          onClick={handlePrevPaper}
                          disabled={currentPaperIndex === 0}
                        >
                          Previous Paper
                        </button>
                        <button 
                          className="nes-btn"
                          onClick={handleNextPaper}
                          disabled={currentPaperIndex === papers.length - 1}
                        >
                          Next Paper
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : activeTab === 'topic-map' ? (
              <TopicMap 
                papers={papers}
                insights={paperInsights}
                currentPaperIndex={currentPaperIndex}
              />
            ) : (
              <div className="relative min-h-[calc(100vh-200px)] bg-white">
                {/* Paper Navigation */}
                <div className="absolute inset-x-0 top-1/2 flex justify-between px-4 -translate-y-1/2 z-10">
                  <button 
                    className="nes-btn"
                    onClick={handlePrevPaper}
                    disabled={currentPaperIndex === 0}
                  >
                    ←
                  </button>
                  <button 
                    className="nes-btn"
                    onClick={handleNextPaper}
                    disabled={currentPaperIndex === papers.length - 1}
                  >
                    →
                  </button>
                </div>

                {/* Story Content */}
                <div className="nes-container is-rounded h-full flex flex-col">
                  {/* Progress Indicators */}
                  <div className="flex gap-2 mb-4">
                    {slides.map((_, index) => (
                      <div
                        key={index}
                        className={`h-2 flex-1 transition-all duration-500 ease-in-out ${
                          index === currentSlide 
                            ? 'bg-blue-500 scale-y-110' 
                            : index < currentSlide 
                              ? 'bg-green-500' 
                              : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Paper Header */}
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg transition-colors hover:bg-gray-100">
                    <h3 className="text-xl mb-2 font-bold">{papers[currentPaperIndex]?.title}</h3>
                    <p className="text-sm text-gray-600">
                      Authors: {papers[currentPaperIndex]?.authors.join(', ')}
                    </p>
                  </div>
                  
                  {/* Slide Navigation - Separate from header */}
                  <div className="flex justify-between mb-6">
                    <button
                      className="nes-btn"
                      onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
                      disabled={currentSlide === 0}
                    >
                      Previous
                    </button>
                    <button
                      className="nes-btn is-primary"
                      onClick={() => setCurrentSlide(prev => Math.min(slides.length - 1, prev + 1))}
                      disabled={currentSlide === slides.length - 1}
                    >
                      {currentSlide === slides.length - 1 ? 'Read Full Paper' : 'Next'}
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col">
                    <div className="nes-container with-title flex-1">
                      <p className="title">
                        {loadingInsights ? 'Analyzing Paper...' : slides[currentSlide]?.type}
                      </p>
                      <div className="p-4 text-lg h-full flex items-center justify-center">
                        {loadingInsights ? (
                          <i className="nes-icon coin is-large" style={rotatingIconStyle}></i>
                        ) : (
                          <div className="max-h-[400px] overflow-y-auto w-full">
                            <p className="whitespace-pre-wrap">{slides[currentSlide]?.content}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {selectedPaper && (
          <PaperViewer 
            paper={selectedPaper} 
            onClose={() => setSelectedPaper(null)} 
          />
        )}
      </div>
    </>
  );
}