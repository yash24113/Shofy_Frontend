'use client';
import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { TextShapeLine } from '@/svg';
import BlogItem from './blog-item';

// ---- API config (env-first, fallback to localhost) ----
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '');
const BLOG_PATH = process.env.NEXT_PUBLIC_API_BLOG_PATH || '/blogs';

export default function BlogArea() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}${BLOG_PATH}`, { cache: 'no-store' });
        const json = await res.json();
        if (!alive) return;
        const list = Array.isArray(json?.data) ? json.data : [];
        setRows(list);
      } catch (e) {
        setErr(e?.message || 'Failed to load blogs');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // show the most recent 3 (to match the design)
  const blogs = useMemo(
    () =>
      [...rows]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3),
    [rows]
  );

  return (
    <section className="tp-blog-area pt-110 pb-120">
      <div className="container">
        <div className="row">
          <div className="col-xl-12">
            <div className="tp-section-title-wrapper-2 mb-50 text-center">
              <span className="tp-section-title-pre-2">
                Our Blog & News
                <TextShapeLine />
              </span>
              <h3 className="tp-section-title-2">Latest News & Articles</h3>
            </div>
          </div>
        </div>

        <div className="row">
          {loading && (
            <div className="col-12 text-center">
              <p>Loading…</p>
            </div>
          )}

          {!loading && err && (
            <div className="col-12 text-center">
              <p className="text-danger">{err}</p>
            </div>
          )}

          {!loading && !err && blogs.length === 0 && (
            <div className="col-12 text-center">
              <p>No posts yet.</p>
            </div>
          )}

          {!loading &&
            !err &&
            blogs.map((blog) => (
              <div key={blog._id} className="col-xl-4 col-lg-4 col-md-6">
                <BlogItem blog={blog} />
              </div>
            ))}
        </div>

        <div className="row">
          <div className="col-xl-12">
            <div className="tp-blog-more-2 mt-10 text-center">
              <Link href="/blog" className="tp-btn tp-btn-border tp-btn-border-sm">
                Discover More
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
