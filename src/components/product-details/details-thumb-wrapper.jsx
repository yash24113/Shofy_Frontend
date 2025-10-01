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

/* ---------------- component ---------------- */
const DetailsThumbWrapper = ({
  imageURLs,           // [{ type:'image'|'video', img:<thumb>, video?:<url> }, ...]
  handleImageActive,   // optional callback when user clicks an image thumb
  activeImg,           // default large image (use product.img)
  imgWidth = 416,
  imgHeight = 480,
  videoId = false,     // optional fallback video url
  status,
  zoomScale = 2.2,     // magnification factor for zoom panel
  zoomPaneWidth = 620, // right panel width (px)
  zoomPaneHeight = 480,// right panel height (px)
  lensSize = 140,      // square lens side in px
  lensBorder = '2px solid rgba(59,130,246,.75)',
  lensBg = 'rgba(255,255,255,.25)',
}) => {
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState(null);

  // 1) normalize + process all items
  const processedImageURLs = useMemo(() => {
    const list = Array.isArray(imageURLs) ? imageURLs : [];
    const seen = new Set();
    return list
      .map((item) => {
        if (!item) return null;
        const type = item.type === 'video' ? 'video' : 'image';
        const img = processImageUrl(item.img || item.thumbnail || item.poster);
        const video = type === 'video'
          ? (isRemote(item.video) ? item.video : processImageUrl(item.video))
          : null;
        return img ? { ...item, type, img, video } : null;
      })
      .filter(Boolean)
      .filter((it) => {
        const k = `${it.type}|${it.img}|${it.video || ''}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
  }, [imageURLs]);

  // 2) default main image
  const processedActiveImg = useMemo(() => processImageUrl(activeImg), [activeImg]);
  const firstImageUrl = useMemo(() => {
    const first = processedImageURLs.find((x) => x.type === 'image');
    return first ? first.img : null;
  }, [processedImageURLs]);

  const defaultMain = useMemo(() => {
    return processedActiveImg || firstImageUrl || (processedImageURLs[0]?.img ?? null);
  }, [processedActiveImg, firstImageUrl, processedImageURLs]);

  const [mainSrc, setMainSrc] = useState(defaultMain);

  // reset on change
  useEffect(() => {
    setMainSrc(defaultMain);
    setIsVideoActive(false);
    setCurrentVideoUrl(null);
  }, [defaultMain]);

  // active thumb highlight
  const isActiveThumb = (item) =>
    (!isVideoActive && item.type === 'image' && item.img === mainSrc) ||
    (isVideoActive && item.type === 'video' && item.video === (currentVideoUrl || videoId));

  // click handlers
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

  // lens
  const [showLens, setShowLens] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 }); // top-left of lens (px relative to main container)

  // capture natural image size from next/image
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
    const cx = e.clientX - rect.left; // cursor inside container
    const cy = e.clientY - rect.top;

    // lens should be centered at cursor but clamped within container
    const half = lensSize / 2;
    const lx = Math.max(0, Math.min(rect.width  - lensSize, cx - half));
    const ly = Math.max(0, Math.min(rect.height - lensSize, cy - half));
    setLensPos({ x: lx, y: ly });

    // relative center of lens for background position (0..1)
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
            <Image
              src={mainSrc || '/assets/img/product/default-product-img.jpg'}
              alt="product img"
              width={imgWidth}
              height={imgHeight}
              style={{ objectFit: 'contain' }}
              unoptimized={isCloudinaryUrl(mainSrc)}
              priority
              onLoadingComplete={handleImageLoaded}
            />
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
        .pdw-thumbs-inner { display: flex; flex-direction: column; gap: 12px; }
        .pdw-thumb {
          position: relative; width: 80px; height: 80px;
          padding: 0; border: 2px solid transparent; border-radius: 8px;
          overflow: hidden; background: #fff; cursor: pointer;
          transition: border-color 160ms ease, transform 120ms ease, box-shadow 160ms ease;
        }
        .pdw-thumb:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0,0,0,.08); }
        .pdw-thumb.is-active { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.25); }
        .pdw-thumb-img { width: 100%; height: 100%; border-radius: 6px; object-fit: cover; }
        .pdw-thumb-play {
          position: absolute; inset: 0; display: grid; place-items: center;
          color: #fff; font-size: 34px; background: linear-gradient(to top, rgba(0,0,0,.45), rgba(0,0,0,.05));
          pointer-events: none;
        }

        /* Main */
        .pdw-main {
          width: ${imgWidth}px; height: ${imgHeight}px;
          border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,.06);
          overflow: hidden; background: #fff;
        }
        .pdw-main-inner {
          width: 100%; height: 100%; display: grid; place-items: center; position: relative;
        }
        .pdw-video { background: #000; }

        /* Lens overlay */
        .pdw-lens {
          position: absolute; top: 0; left: 0;
          pointer-events: none; /* don't block mouse events */
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
          border-radius: 12px; background-repeat: no-repeat; background-position: center;
          background-color: #fff; box-shadow: 0 8px 24px rgba(0,0,0,.06);
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
