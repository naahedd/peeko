'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ArxivPaper } from '@/types/arxiv';
import { PaperInsights } from '@/types/insights';
import { generateTopicScores } from '@/services/gemini';

interface TopicMapProps {
  papers: ArxivPaper[];
  insights: Record<string, PaperInsights>;
  currentPaperIndex: number;
}

export default function TopicMap({ papers, insights, currentPaperIndex }: TopicMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    let mounted = true;

    const updateMap = async () => {
      if (!svgRef.current || !papers.length || !mounted) return;

      const currentPaper = papers[currentPaperIndex];
      const analysis = await generateTopicScores(currentPaper);
      if (!mounted) return;

      d3.select(svgRef.current).selectAll('*').remove();

      const width = 800;
      const height = 600;
      const margin = { top: 40, right: 40, bottom: 40, left: 40 };

      const svg = d3.select(svgRef.current)
        .attr('width', width)
        .attr('height', height);

      // Create color scale
      const colorScale = d3.scaleLinear<string>()
        .domain([0, 0.5, 1])
        .range(['#e8f5e9', '#66bb6a', '#1b5e20']);

      // Center the heatmap in container
      const totalWidth = width - margin.left - margin.right;
      const totalHeight = height - margin.top - margin.bottom;
      const gridSize = 2;
      const cellSize = Math.min(totalWidth, totalHeight) / gridSize;
      
      const startX = (width - (cellSize * gridSize)) / 2;
      const startY = (height - (cellSize * gridSize)) / 2;

      // Create array of unique topics
      const topics = [
        [analysis.axes.x[0]], // Top left
        [analysis.axes.x[1]], // Top right
        [analysis.axes.y[0]], // Bottom left
        [analysis.axes.y[1]]  // Bottom right
      ];

      // Create heatmap cells with centered positioning
      const cells = svg.selectAll('.cell')
        .data(topics)
        .enter()
        .append('g')
        .attr('class', 'cell')
        .attr('transform', (d, i) => {
          const x = startX + (i % 2) * cellSize;
          const y = startY + Math.floor(i / 2) * cellSize;
          return `translate(${x},${y})`;
        });

      // Add rectangles for each cell
      cells.append('rect')
        .attr('width', cellSize)
        .attr('height', cellSize)
        .attr('fill', (d) => {
          const score = analysis.scores[d[0]];  // Use single topic score
          return colorScale(score);
        });

      // Add text labels (without hover effects)
      cells.each(function(d) {
        const cell = d3.select(this);
        const topic = d[0];
        
        const words = topic.split(' ');
        const lines = [];
        let currentLine = '';
        
        words.forEach(word => {
          if (currentLine.length + word.length > 15) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine += (currentLine ? ' ' : '') + word;
          }
        });
        if (currentLine) {
          lines.push(currentLine);
        }
        
        lines.forEach((line, i) => {
          cell.append('text')
            .attr('x', cellSize / 2)
            .attr('y', cellSize / 2 + (i - (lines.length - 1) / 2) * 20)
            .attr('text-anchor', 'middle')
            .attr('fill', 'white')
            .attr('font-size', '14px')
            .attr('font-weight', 'bold')
            .text(line);
        });
      });
    };

    updateMap();

    return () => {
      mounted = false;
    };
  }, [papers, insights, currentPaperIndex]);

  return (
    <div className="nes-container with-title">
      <p className="title">Topic Distribution</p>
      <div className="overflow-auto">
        <svg ref={svgRef} className="mx-auto"></svg>
      </div>
    </div>
  );
}