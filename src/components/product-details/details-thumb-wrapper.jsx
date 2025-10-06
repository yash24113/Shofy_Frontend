'use client';
import Image from 'next/image';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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

  /** If you pass a video id/url but not thumbs, we'll still render */
  videoId = false,
  status,

  /** Zoom tuning */
  zoomScale = 2.2,             // magnification multiplier on natural pixels
  zoomPaneWidth = 620,
  zoomPaneHeight = 480,

  /** Lens visuals (border/bg only; size is auto-calculated) */
  lensBorder = '2px solid rgba(59,130,246,.75)',
  lensBg = 'rgba(255,255,255,.25)',
}) => {

  const [isVideoActive, setIsVideoActive] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState(null);

  /* ---------- Build the thumbnail list in EXACT order: img, image1, image2 ---------- */
  const primaryThumbs = useMemo(() => {
    const list = [
      { type: 'image', img: processImageUrl(img) },
      { type: 'image', img: processImageUrl(image1) },
      { type: 'image', img: processImageUrl(image2) },
    ].filter((x) => !!x.img);

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
    const pics = [src?.img, src?.image1, src?.image2]
      .map(processImageUrl)
      .filter(Boolean)
      .map((p) => ({ type: 'image', img: p }));

    if (src?.video || src?.videoThumbnail) {
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
            ? (isRemote(item.video || '') ? item.video : processImageUrl(item.video))
            : null;
        return thumb ? { type, img: thumb, video: vUrl } : null;
      })
      .filter(Boolean);
  }, [imageURLs]);

  const processedImageURLs = useMemo(() => {
    // enforce order: img → image1 → image2 → (video) → apiImages → imageURLs
    return uniqueByUrl([...primaryThumbs, ...extrasFromApiImages, ...extrasFromImageURLs]);
  }, [primaryThumbs, extrasFromApiImages, extrasFromImageURLs]);

  /* ---------- Default main image: prefer `img`, then activeImg, then first image ---------- */
  const preferredDefault = useMemo(
    () => processImageUrl(img) || processImageUrl(activeImg) || null,
    [img, activeImg]
  );
  const firstImageUrl = useMemo(() => {
    const first = processedImageURLs.find((x) => x.type === 'image');
    return first ? first.img : null;
  }, [processedImageURLs]);

  const defaultMain = useMemo(
    () => preferredDefault || firstImageUrl || processedImageURLs[0]?.img || null,
    [preferredDefault, firstImageUrl, processedImageURLs]
  );

  const [mainSrc, setMainSrc] = useState(defaultMain);
  useEffect(() => {
    setMainSrc(defaultMain);
    setIsVideoActive(false);
    setCurrentVideoUrl(null);
  }, [defaultMain]);

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

  /* ---------------- Zoom + Lens logic (true hover-area mapping) ---------------- */
  const wrapRef = useRef(null);

  const [showZoom, setShowZoom] = useState(false);
  const [zoomBgPosPx, setZoomBgPosPx] = useState({ x: 0, y: 0 }); // pixel-based background-position
  const [natural, setNatural] = useState({ w: imgWidth, h: imgHeight });
  const [displayRect, setDisplayRect] = useState({ ox: 0, oy: 0, dw: imgWidth, dh: imgHeight });

  // Lens size auto-matches the visible area shown in the zoom pane
  const [lensSize, setLensSize] = useState({ lw: 140, lh: 140 });
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 });
  const [showLens, setShowLens] = useState(false);

  const computeDisplayRect = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const W = wrap.clientWidth;
    const H = wrap.clientHeight;
    const NW = natural.w;
    const NH = natural.h;

    if (!NW || !NH) return;

    // object-fit: contain math
    const wrapRatio = W / H;
    const imgRatio = NW / NH;

    let dw, dh;
    if (imgRatio > wrapRatio) {
      // limited by width
      dw = W;
      dh = W / imgRatio;
    } else {
      // limited by height
      dh = H;
      dw = H * imgRatio;
    }

    const ox = (W - dw) / 2; // left letterbox
    const oy = (H - dh) / 2; // top letterbox
    setDisplayRect({ ox, oy, dw, dh });

    // lens size so that zoom pane shows exactly the same area
    const lw = (zoomPaneWidth / (natural.w * zoomScale)) * dw;
    const lh = (zoomPaneHeight / (natural.h * zoomScale)) * dh;
    setLensSize({
      lw: Math.max(30, Math.min(dw, lw)),
      lh: Math.max(30, Math.min(dh, lh)),
    });
  }, [natural, zoomPaneWidth, zoomPaneHeight, zoomScale]);

  // recompute on size or new image/natural change
  useEffect(() => {
    computeDisplayRect();
    const r = () => computeDisplayRect();
    window.addEventListener('resize', r);
    return () => window.removeEventListener('resize', r);
  }, [computeDisplayRect, mainSrc]);

  const onImageLoaded = ({ naturalWidth, naturalHeight }) => {
    setNatural({ w: naturalWidth || imgWidth, h: naturalHeight || imgHeight });
    // After natural known, compute display rect
    setTimeout(computeDisplayRect, 0);
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

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const handleMouseMove = (e) => {
    if (!wrapRef.current || isVideoActive) return;

    const rect = wrapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const { ox, oy, dw, dh } = displayRect;

    // If pointer outside the drawn image (letterbox zones), hide lens/zoom
    const inside =
      x >= ox && x <= ox + dw &&
      y >= oy && y <= oy + dh;

    if (!inside) {
      setShowLens(false);
      setShowZoom(false);
      return;
    } else {
      setShowLens(true);
      setShowZoom(true);
    }

    // Relative position within displayed image
    const px = (x - ox) / dw; // 0..1
    const py = (y - oy) / dh; // 0..1

    // Lens top-left (so that cursor is at lens center)
    const lx = clamp(x - lensSize.lw / 2, ox, ox + dw - lensSize.lw);
    const ly = clamp(y - lensSize.lh / 2, oy, oy + dh - lensSize.lh);
    setLensPos({ x: lx, y: ly });

    // Convert to natural pixel coords
    const natX = px * natural.w;
    const natY = py * natural.h;

    // Background is scaled by zoomScale; set bg-position so (natX,natY) is centered in zoom pane
    const bgX = -(natX * zoomScale - zoomPaneWidth / 2);
    const bgY = -(natY * zoomScale - zoomPaneHeight / 2);
    setZoomBgPosPx({ x: bgX, y: bgY });
  };

  const bgSize = `${natural.w * zoomScale}px ${natural.h * zoomScale}px`;
  const bgPos = `${zoomBgPosPx.x}px ${zoomBgPosPx.y}px`;

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
          ref={wrapRef}
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
              unoptimized={isCloudinaryUrl(mainSrc || '')}
              priority
              onLoadingComplete={onImageLoaded}
            />
          )}

          {/* Lens overlay */}
          {!isVideoActive && showLens && mainSrc && (
            <span
              className="pdw-lens"
              style={{
                width: `${lensSize.lw}px`,
                height: `${lensSize.lh}px`,
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
          backgroundSize: bgSize,
          backgroundPosition: bgPos
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
          position: relative; width: 80px; height: 80px;
          padding: 0; border: 2px solid transparent; border-radius: 8px;
          overflow: hidden; background: #fff; cursor: pointer;
          transition: border-color 160ms ease, transform 120ms ease, box-shadow 160ms ease;
          flex: 0 0 auto;
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
          border-radius: 12px; background-repeat: no-repeat;
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
