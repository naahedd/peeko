'use client';

import { useEffect, useState } from 'react';
import { ArxivPaper } from '@/types/arxiv';
import axios from 'axios';
import { useParams } from 'next/navigation';
import PaperTabs from '@/components/PaperTabs';

export default function PapersPage() {
  const [papers, setPapers] = useState<ArxivPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const category = params.category as string;

  useEffect(() => {
    const fetchPapers = async () => {
      try {
        const response = await axios.get(`/api/papers?category=${category}`);
        setPapers(response.data);
      } catch (error) {
        console.error('Error fetching papers:', error);
      } finally {
        setLoading(false);
      }
    };

    if (category) {
      fetchPapers();
    }
  }, [category]);

  return (
    <div className="container mx-auto">
      <PaperTabs papers={papers} loading={loading} />
    </div>
  );
}