'use client';

import { useState } from 'react';
import { ArxivPaper } from '@/types/arxiv';

interface PaperViewerProps {
  paper: ArxivPaper;
  onClose: () => void;
}

export default function PaperViewer({ paper, onClose }: PaperViewerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Split paper summary into digestible chunks
  const highlights = [
    { title: "Title", content: paper.title },
    { title: "Authors", content: paper.authors.join(", ") },
    // Split summary into ~200 char chunks for readability
    ...paper.summary
      .match(/.{1,200}(?:\s|$)/g)!
      .map((chunk, i) => ({ 
        title: `Summary ${i + 1}`, 
        content: chunk.trim() 
      }))
  ];

  const nextSlide = () => {
    if (currentSlide < highlights.length - 1) {
      setCurrentSlide(curr => curr + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(curr => curr - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="nes-container is-rounded bg-white w-full max-w-2xl mx-4">
        <div className="flex justify-between mb-4">
          <div className="flex gap-2">
            {highlights.map((_, i) => (
              <div 
                key={i} 
                className={`h-1 w-8 ${i === currentSlide ? 'nes-progress is-primary' : 'nes-progress'}`}
              />
            ))}
          </div>
          <button className="nes-btn is-error" onClick={onClose}>×</button>
        </div>

        <div className="min-h-[300px] flex flex-col justify-between">
          <div>
            <h3 className="nes-text mb-4">{highlights[currentSlide].title}</h3>
            <p className="text-lg">{highlights[currentSlide].content}</p>
          </div>

          <div className="flex justify-between mt-4">
            <button 
              className="nes-btn" 
              onClick={prevSlide}
              disabled={currentSlide === 0}
            >
              Previous
            </button>
            <button 
              className="nes-btn is-primary" 
              onClick={nextSlide}
              disabled={currentSlide === highlights.length - 1}
            >
              {currentSlide === highlights.length - 1 ? 'Read Full Paper' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}