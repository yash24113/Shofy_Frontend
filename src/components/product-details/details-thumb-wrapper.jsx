'use client';
import Image from 'next/image';
import { useState, useMemo, useEffect, useRef } from 'react';
import { CgPlayButtonO } from 'react-icons/cg';

/* ---------------- helpers ---------------- */
const isRemote = (url) => !!url && /^https?:\/\//i.test(url);
const isCloudinaryUrl = (url) => !!url && /res\.cloudinary\.com/i.test(url);

const processImageUrl = (url) => {
  if (!url) return null;
  if (isRemote(url)) return url; // http/https → use as-is
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = url.startsWith('/') ? url.slice(1) : url;
  return `${cleanBaseUrl}/uploads/${cleanPath}`;
};

/* Dedup while keeping the **first** occurrence */
const uniqueByUrl = (arr) => {
  const seen = new Set();
  return arr.filter((it) => {
    const key = `${it.type}|${it.img}|${it.video || ''}`;
    if (!it.img) return false;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

/* ---------------- component ---------------- */
const DetailsThumbWrapper = ({
  /** Explicit product fields (preferred) */
  img, image1, image2,
  video, videoThumbnail,

  /** Optional legacy sources (will be merged after the 3 preferred fields) */
  imageURLs,          // [{ type:'image'|'video', img, video? }]
  apiImages,          // { img?, image1?, image2?, video?, videoThumbnail? }

  handleImageActive,
  activeImg,          // default large image (we prefer `img` if provided)
  imgWidth = 416,
  imgHeight = 480,
  videoId = false,
  status,
  zoomScale = 2.2,
  zoomPaneWidth = 620,
  zoomPaneHeight = 480,
  lensSize = 140,
  lensBorder = '2px solid rgba(59,130,246,.75)',
  lensBg = 'rgba(255,255,255,.25)',
}) => {
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState(null);

  /* ---------- Build the thumbnail list including main img, image1 and image2 ---------- */
  const primaryThumbs = useMemo(() => {
    const list = [];

    // include main img first in the thumbs
    if (img) {
      list.push({ type: 'image', img: processImageUrl(img) });
    }

    // then image1 and image2
    if (image1) {
      list.push({ type: 'image', img: processImageUrl(image1) });
    }

    if (image2 && image2 !== image1) {
      list.push({ type: 'image', img: processImageUrl(image2) });
    }

    // optional video from explicit fields
    if (video || videoThumbnail) {
      const vUrl = video ? (isRemote(video) ? video : processImageUrl(video)) : null;
      const poster = processImageUrl(videoThumbnail) || list[0]?.img || null;
      if (vUrl || poster) list.push({ type: 'video', img: poster, video: vUrl });
    }

    return list;
  }, [img, image1, image2, video, videoThumbnail]);

  /* ---------- Merge optional apiImages and imageURLs AFTER the 3 primaries ---------- */
  const extrasFromApiImages = useMemo(() => {
    const src = apiImages || {};
    const pics = [src.img, src.image1, src.image2]
      .map(processImageUrl)
      .filter(Boolean)
      .map((p) => ({ type: 'image', img: p }));

    if (src.video || src.videoThumbnail) {
      const vUrl = src.video ? (isRemote(src.video) ? src.video : processImageUrl(src.video)) : null;
      const poster = processImageUrl(src.videoThumbnail) || pics[0]?.img || null;
      if (vUrl || poster) pics.push({ type: 'video', img: poster, video: vUrl });
    }
    return pics;
  }, [apiImages]);

  const extrasFromImageURLs = useMemo(() => {
    const list = Array.isArray(imageURLs) ? imageURLs : [];
    return list
      .map((item) => {
        if (!item) return null;
        const type = item.type === 'video' ? 'video' : 'image';
        const thumb = processImageUrl(item.img || item.thumbnail || item.poster);
        const vUrl =
          type === 'video'
            ? (isRemote(item.video) ? item.video : processImageUrl(item.video))
            : null;
        return thumb ? { type, img: thumb, video: vUrl } : null;
      })
      .filter(Boolean);
  }, [imageURLs]);

  const processedImageURLs = useMemo(() => {
    // enforce order: img → image1 → image2 → (video) → apiImages → imageURLs
    return uniqueByUrl([...primaryThumbs, ...extrasFromApiImages, ...extrasFromImageURLs]);
  }, [primaryThumbs, extrasFromApiImages, extrasFromImageURLs]);

  /* ---------- Main image handling ---------- */
  const mainImageUrl = useMemo(() => {
    if (activeImg) return processImageUrl(activeImg);
    if (img) return processImageUrl(img);
    const firstImage = processedImageURLs.find(x => x?.type === 'image');
    return firstImage?.img || null;
  }, [img, activeImg, processedImageURLs]);

  const [mainSrc, setMainSrc] = useState(mainImageUrl);

  useEffect(() => {
    if (!mainSrc && mainImageUrl) {
      setMainSrc(mainImageUrl);
      setIsVideoActive(false);
      setCurrentVideoUrl(null);
      if (typeof handleImageActive === 'function') {
        handleImageActive({ img: mainImageUrl, type: 'image' });
      }
    }
  }, [mainImageUrl, mainSrc, handleImageActive]);

  const isActiveThumb = (item) =>
    (!isVideoActive && item.type === 'image' && item.img === mainSrc) ||
    (isVideoActive && item.type === 'video' && item.video === (currentVideoUrl || videoId));

  const onThumbClick = (item) => {
    if (item.type === 'video') {
      setIsVideoActive(true);
      setCurrentVideoUrl(item.video || videoId || null);
    } else {
      setIsVideoActive(false);
      setCurrentVideoUrl(null);
      setMainSrc(item.img);
      typeof handleImageActive === 'function' &&
        handleImageActive({ img: item.img, type: 'image' });
    }
  };

  /* ---------------- Zoom + Lens logic ---------------- */
  const imgWrapRef = useRef(null);
  const [showZoom, setShowZoom] = useState(false);
  const [zoomBgPos, setZoomBgPos] = useState('50% 50%');
  const [naturalSize, setNaturalSize] = useState({ w: imgWidth, h: imgHeight });

  const [showLens, setShowLens] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 });

  const handleImageLoaded = ({ naturalWidth, naturalHeight }) => {
    setNaturalSize({ w: naturalWidth || imgWidth, h: naturalHeight || imgHeight });
  };

  const handleMouseEnter = () => {
    if (!isVideoActive) {
      setShowZoom(true);
      setShowLens(true);
    }
  };
  const handleMouseLeave = () => {
    setShowZoom(false);
    setShowLens(false);
  };
  const handleMouseMove = (e) => {
    if (!imgWrapRef.current || isVideoActive) return;
    const rect = imgWrapRef.current.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    const half = lensSize / 2;
    const lx = Math.max(0, Math.min(rect.width - lensSize, cx - half));
    const ly = Math.max(0, Math.min(rect.height - lensSize, cy - half));
    setLensPos({ x: lx, y: ly });

    const centerX = (lx + half) / rect.width;
    const centerY = (ly + half) / rect.height;
    setZoomBgPos(`${centerX * 100}% ${centerY * 100}%`);
  };

  const zoomBgSize = `${naturalSize.w * zoomScale}px ${naturalSize.h * zoomScale}px`;

  return (
    <div className="pdw-wrapper">
      {/* Thumbs column */}
      <nav className="pdw-thumbs">
        <div className="pdw-thumbs-inner">
          {processedImageURLs?.map((item, i) =>
            item.type === 'video' ? (
              <button
                key={`v-${i}`}
                className={`pdw-thumb ${isActiveThumb(item) ? 'is-active' : ''}`}
                onClick={() => onThumbClick(item)}
                type="button"
                aria-label="Play video"
                title="Play video"
              >
                <Image
                  src={item.img || '/assets/img/product/default-product-img.jpg'}
                  alt="video thumbnail"
                  width={80}
                  height={80}
                  className="pdw-thumb-img"
                  style={{ objectFit: 'cover' }}
                  unoptimized={isCloudinaryUrl(item.img)}
                  loading="lazy"
                />
                <span className="pdw-thumb-play" aria-hidden>
                  <CgPlayButtonO />
                </span>
              </button>
            ) : (
              <button
                key={`i-${i}`}
                className={`pdw-thumb ${isActiveThumb(item) ? 'is-active' : ''}`}
                onClick={() => onThumbClick(item)}
                type="button"
                title="View image"
              >
                <Image
                  src={item.img || '/assets/img/product/default-product-img.jpg'}
                  alt="image"
                  width={80}
                  height={80}
                  className="pdw-thumb-img"
                  style={{ objectFit: 'cover' }}
                  unoptimized={isCloudinaryUrl(item.img)}
                  loading="lazy"
                />
              </button>
            )
          )}
        </div>
      </nav>

      {/* Main viewer with lens */}
      <div className="pdw-main">
        <div
          ref={imgWrapRef}
          className="pdw-main-inner"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseMove={handleMouseMove}
        >
          {isVideoActive && (currentVideoUrl || videoId) ? (
            <video
              src={currentVideoUrl || videoId}
              controls
              autoPlay
              className="pdw-video"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          ) : (
           <div style={{
  position: 'relative',
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#fafafa',
  border: '1px solid #1b0cf4ff',
  overflow: 'hidden',
  marginBottom: '30px'     // ← add this
}}>
              {mainSrc ? (
                <img
                  src={mainSrc}
                  alt="product img"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    display: 'block'
                  }}
                  onLoad={handleImageLoaded}
                  onError={(e) => {
                    console.error('Error loading image:', mainSrc);
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div style={{
                  color: '#999',
                  textAlign: 'center',
                  padding: '20px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '8px'
                }}>
                  No image available
                </div>
              )}
            </div>
          )}

          {/* Lens overlay */}
          {!isVideoActive && showLens && mainSrc && (
            <span
              className="pdw-lens"
              style={{
                width: lensSize,
                height: lensSize,
                transform: `translate(${lensPos.x}px, ${lensPos.y}px)`,
                border: lensBorder,
                background: lensBg
              }}
              aria-hidden
            />
          )}

          <div className="tp-product-badge">
            {status === 'out-of-stock' && <span className="product-hot">out-stock</span>}
          </div>
        </div>
      </div>

      {/* Right zoom panel */}
      <aside
        className={`pdw-zoom ${showZoom && !isVideoActive ? 'is-visible' : ''}`}
        style={{
          backgroundImage: mainSrc ? `url(${mainSrc})` : 'none',
          backgroundSize: zoomBgSize,
          backgroundPosition: zoomBgPos
        }}
        aria-hidden={!showZoom || isVideoActive}
      />

      {/* ---------- internal styles ---------- */}
     <style jsx>{`
  .pdw-wrapper {
    display: grid;
    grid-template-columns: 96px ${imgWidth}px ${zoomPaneWidth}px;
    gap: 16px;
    align-items: start;
  }

  /* Thumbs */
  .pdw-thumbs { width: 96px; }
  .pdw-thumbs-inner {
    display: flex; flex-direction: column; gap: 12px;
    max-height: ${zoomPaneHeight}px;
    overflow: auto;
    padding-right: 4px;
  }

  .pdw-thumb {
    position: relative;
    width: 80px;
    height: 80px;
    padding: 0;
    border: 0;                     /* no border that can change size */
    box-sizing: border-box;        /* be explicit */
    border-radius: 12px;           /* ↑ match image radius */
    overflow: hidden;
    background: #fff;
    cursor: pointer;
    transition: transform 120ms ease, box-shadow 160ms ease;
    flex: 0 0 auto;

    display: grid;                 /* perfect centering */
    place-items: center;
  }

  .pdw-thumb:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(0,0,0,.08);
  }

  /* ✅ Active ring INSIDE the box — no layout shift */
  .pdw-thumb.is-active {
    box-shadow: inset 0 0 0 3px #3b82f6;
  }

  /* Keyboard focus consistent with active, without moving the box */
  .pdw-thumb:focus { outline: none; }
  .pdw-thumb:focus-visible {
    box-shadow: inset 0 0 0 3px #3b82f6;
  }

  .pdw-thumb-img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    border-radius: inherit;        /* keep same radius as the container */
  }

  .pdw-thumb-play {
    position: absolute; inset: 0; display: grid; place-items: center;
    color: #fff; font-size: 34px;
    background: linear-gradient(to top, rgba(0,0,0,.45), rgba(0,0,0,.05));
    pointer-events: none;
  }

  /* Main */
.pdw-main {
  width: ${imgWidth}px; height: ${imgHeight}px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,.06);
  overflow: hidden;
  background: #fff;
}
  .pdw-main-inner {
    width: 100%; height: 100%;
    display: grid; place-items: center; position: relative;
  }
  .pdw-video { background: #000; }

  /* Lens overlay */
  .pdw-lens {
    position: absolute; top: 0; left: 0;
    pointer-events: none;
    border-radius: 8px;
    box-shadow: inset 0 0 0 1px rgba(255,255,255,.6);
    backdrop-filter: saturate(120%) brightness(105%);
  }

  .tp-product-badge { position: absolute; left: 10px; top: 10px; }
  .product-hot {
    display: inline-block; background: #ef4444; color: #fff;
    font-size: 12px; padding: 4px 8px; border-radius: 6px;
  }

  /* Right zoom pane */
 .pdw-zoom {
  width: ${zoomPaneWidth}px; height: ${zoomPaneHeight}px;

  /* make visuals identical to main box */
  border-radius: 12px;
  border: 1px solid #f0f0f0;
  background-color: #fafafa;

  /* clip background to the content box so it lines up with the rounded corners */
  background-repeat: no-repeat;
  background-origin: content-box;
  background-clip: content-box;

  /* match elevation and hide any spill */
  box-shadow: 0 8px 24px rgba(0,0,0,.06);
  overflow: hidden;

  /* transition states */
  opacity: 0; visibility: hidden; transform: translateY(4px);
  transition: opacity 160ms ease, visibility 160ms ease, transform 160ms ease;
}
 .pdw-zoom.is-visible { opacity: 1; visibility: visible; transform: translateY(0); }

  /* Responsive – hide zoom pane on smaller screens */
  @media (max-width: 1200px) {
    .pdw-wrapper { grid-template-columns: 96px ${imgWidth}px; }
    .pdw-zoom { display: none; }
  }
  @media (max-width: 640px) {
    .pdw-wrapper { grid-template-columns: 72px minmax(220px, 1fr); gap: 12px; }
    .pdw-main { width: 100%; height: auto; aspect-ratio: ${imgWidth} / ${imgHeight}; }
  }
`}</style>

    </div>
  );
};

export default DetailsThumbWrapper;
