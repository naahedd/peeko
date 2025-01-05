'use client';

import Link from 'next/link';
import { categories } from '@/types/arxiv';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  
  return (
    <div className="space-y-2">
      {categories.map((category) => (
        <Link 
          key={category.id}
          href={`/papers/${category.id}`}
        >
          <button
            className={`nes-btn w-full text-left text-sm ${
              pathname === `/papers/${category.id}` ? 'is-primary' : ''
            }`}
          >
            {category.name}
          </button>
        </Link>
      ))}
    </div>
  );
}
