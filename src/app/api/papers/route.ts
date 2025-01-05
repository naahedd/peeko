import { NextResponse } from 'next/server';
import axios from 'axios';
import { parseString } from 'xml2js';
import { promisify } from 'util';

const parseXMLAsync = promisify(parseString);

interface ArxivResponse {
  feed: {
    entry?: {
      id: string[];
      title: string[];
      summary: string[];
      author: { name: string[] }[];
      published: string[];
      link: { $: { href: string } }[];
    }[];
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  if (!category) {
    return NextResponse.json({ error: 'Category is required' }, { status: 400 });
  }

  try {
    const response = await axios.get(
      `http://export.arxiv.org/api/query?search_query=cat:${category}&sortBy=lastUpdatedDate&max_results=10`
    );

    const result = await parseXMLAsync(response.data) as ArxivResponse;
    const entries = result.feed.entry || [];

    const papers = entries.map((entry: NonNullable<ArxivResponse['feed']['entry']>[number]) => ({
      id: entry.id[0],
      title: entry.title[0],
      summary: entry.summary[0],
      authors: entry.author.map((author: { name: string[] }) => author.name[0]),
      published: entry.published[0],
      link: entry.link[0].$.href,
    }));

    return NextResponse.json(papers);
  } catch (error) {
    console.error('Error fetching papers:', error);
    return NextResponse.json({ error: 'Failed to fetch papers' }, { status: 500 });
  }
}