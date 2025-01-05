export interface ArxivPaper {
    id: string;
    title: string;
    summary: string;
    authors: string[];
    published: string;
    link: string;
    abstract: string;
  }
  
  export type Category = {
    id: string;
    name: string;
    description: string;
  };
  
  export const categories: Category[] = [
    { id: 'cs.AI', name: 'Artificial Intelligence', description: 'AI and Machine Learning' },
    { id: 'cs.CL', name: 'Computation and Language', description: 'Natural Language Processing' },
    { id: 'cs.CV', name: 'Computer Vision', description: 'Image Processing and Vision' },
    { id: 'cs.RO', name: 'Robotics', description: 'Robotics and Automation' },
    { id: 'cs.SE', name: 'Software Engineering', description: 'Software Development and Engineering' },
  ];