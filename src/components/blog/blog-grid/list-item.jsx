'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRightLong, Comment, Date as DateIcon } from '@/svg';

const fmt = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
};

const ListItem = ({ blog }) => {
  const id = blog?._id;
  const img = blog?.blogimage1 || blog?.blogimage2 || '/images/placeholder-4x3.jpg';
  const date = fmt(blog?.createdAt);
  const comments = 0;
  const title = blog?.title || 'Untitled';
  const desc =
    blog?.heading ||
    blog?.paragraph1 ||
    blog?.paragraph2 ||
    blog?.paragraph3 ||
    '';

  return (
    <div className="tp-blog-list-item d-md-flex d-lg-block d-xl-flex">
      <div className="tp-blog-list-thumb">
        <Link href={`/blog-details/${id}`}>
          <Image src={img} alt="blog img" width={600} height={450} className="object-cover" />
        </Link>
      </div>
      <div className="tp-blog-list-content">
        <div className="tp-blog-grid-content">
          <div className="tp-blog-grid-meta">
            <span><DateIcon /> {date}</span>
            <span><Comment /> Comments ({comments})</span>
          </div>
          <h3 className="tp-blog-grid-title">
            <Link href={`/blog-details/${id}`}>{title}</Link>
          </h3>
          <p>{desc}</p>
          <div className="tp-blog-grid-btn">
            <Link href={`/blog-details/${id}`} className="tp-link-btn-3">
              Read More <ArrowRightLong />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListItem;
