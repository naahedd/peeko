import { GoogleGenerativeAI } from '@google/generative-ai';
import { ArxivPaper } from '@/types/arxiv';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function generatePaperInsights(paper: {
  title: string;
  summary: string;
  authors: string[];
}) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Analyze this research paper and provide insights in the following format:

    Quick Summary
    Give a brief, engaging overview of what this paper is about and why it matters.

    Target Audience
    Who is this paper written for and what background knowledge is needed?

    Key Components
    What are the main research questions, methodology, and key findings?

    Structure Analysis
    What are the key points from each section of the paper?

    Impact & Applications
    What are the practical applications and future implications?

    Technical Complexity
    What is the difficulty level and what core concepts are needed?

    Paper:
    "${paper.title}" by ${paper.authors.join(', ')}
    Abstract: ${paper.summary}

    Provide your analysis in clear sections, starting each with the exact headings above.
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  const sections = {
    quickSummary: text.includes('Quick Summary') ? 
      text.split('Quick Summary')[1].split(/Target Audience|Key Components|Structure Analysis|Impact & Applications|Technical Complexity/)[0].trim() : 
      'Summary not available',
    targetAudience: text.includes('Target Audience') ? 
      text.split('Target Audience')[1].split(/Key Components|Structure Analysis|Impact & Applications|Technical Complexity/)[0].trim() : 
      'Analysis not available',
    keyComponents: text.includes('Key Components') ? 
      text.split('Key Components')[1].split(/Structure Analysis|Impact & Applications|Technical Complexity/)[0].trim() : 
      'Analysis not available',
    structureAnalysis: text.includes('Structure Analysis') ? 
      text.split('Structure Analysis')[1].split(/Impact & Applications|Technical Complexity/)[0].trim() : 
      'Analysis not available',
    impactApplications: text.includes('Impact & Applications') ? 
      text.split('Impact & Applications')[1].split(/Technical Complexity/)[0].trim() : 
      'Analysis not available',
    technicalComplexity: text.includes('Technical Complexity') ? 
      text.split('Technical Complexity')[1].trim() : 
      'Analysis not available'
  };
  
  return sections;
}

interface AxisPair {
  x: string[];
  y: string[];
}

export async function generateTopicScores(paper: ArxivPaper): Promise<{
  scores: Record<string, number>;
  axes: AxisPair;
}> {
  const topicsPrompt = `
    Analyze this paper and identify four distinct main topics it covers.
    Title: ${paper.title}
    Abstract: ${paper.abstract}

    Please respond in this exact JSON format:
    {
      "topics": {
        "topic1": {
          "name": "First Main Topic",
          "score": 0.0
        },
        "topic2": {
          "name": "Second Main Topic",
          "score": 0.0
        },
        "topic3": {
          "name": "Third Main Topic",
          "score": 0.0
        },
        "topic4": {
          "name": "Fourth Main Topic",
          "score": 0.0
        }
      }
    }

    Requirements:
    - Each topic must be unique and distinct
    - Topics should be broad research areas (e.g., Machine Learning, Robotics, Computer Vision)
    - Scores should reflect how strongly the paper relates to that topic (0-1)
    - Topics should be short (1-3 words maximum)
  `;

  const result = await model.generateContent(topicsPrompt);
  const text = result.response.text();
  
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid response format');
  
  const analysis = JSON.parse(jsonMatch[0]);
  const { topics } = analysis;
  
  return {
    scores: {
      [topics.topic1.name]: topics.topic1.score,
      [topics.topic2.name]: topics.topic2.score,
      [topics.topic3.name]: topics.topic3.score,
      [topics.topic4.name]: topics.topic4.score
    },
    axes: {
      x: [topics.topic1.name, topics.topic2.name],
      y: [topics.topic3.name, topics.topic4.name]
    }
  };
}
