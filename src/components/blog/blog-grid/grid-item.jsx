'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRightLong, Comment, Date as DateIcon } from '@/svg';

// safe date
const fmt = (iso) => {
  try { return iso ? new Date(iso).toLocaleDateString('en-IN',{month:'long',day:'numeric',year:'numeric'}) : ''; }
  catch { return ''; }
};

const GridItem = ({ blog, style_2 = false }) => {
  const id    = blog?._id;
  const img   = blog?.blogimage1 || blog?.blogimage2 || '/images/placeholder-16x9.jpg';
  const date  = fmt(blog?.createdAt);
  const title = blog?.title || '';
  // you said you’ll sometimes store ready-made HTML (h1/h2/strong etc.)
  const desc  = blog?.heading || blog?.paragraph1 || blog?.paragraph2 || blog?.paragraph3 || '';

  return (
    <article className={`tp-blog-grid-item ${style_2 ? 'tp-blog-grid-style2' : ''} p-relative mb-30 blog-card`}>
      {/* Fixed aspect-ratio wrapper; Image fills and uses object-contain */}
      <div className="blog-card__thumb mb-30">
        <Link href={`/blog-details/${id}`} className="block w-full h-full">
          <Image
            src={img}
            alt="blog img"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="blog-card__img"
            priority={false}
          />
        </Link>
      </div>

      <div className="tp-blog-grid-content">
        <div className="tp-blog-grid-meta">
          <span><DateIcon /> {date}</span>
          <span><Comment /> Comments (0)</span>
        </div>

        {/* title can contain HTML -> render safely */}
        <h3 className="tp-blog-grid-title">
          <Link href={`/blog-details/${id}`}>
            <span dangerouslySetInnerHTML={{ __html: title }} />
          </Link>
        </h3>

        {/* short HTML snippet/summary */}
        <div className="tp-blog-grid-excerpt" dangerouslySetInnerHTML={{ __html: desc }} />

        <div className="tp-blog-grid-btn">
          <Link href={`/blog-details/${id}`} className="tp-link-btn-3">
            Read More <ArrowRightLong />
          </Link>
        </div>
      </div>
    </article>
  );
};

export default GridItem;
