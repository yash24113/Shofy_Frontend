'use client';
import Image from 'next/image';
import { useState, useMemo, useEffect, useRef } from 'react';
import { CgPlayButtonO } from 'react-icons/cg';

/* ---------------- helpers ---------------- */
const isRemote = (url) => !!url && /^https?:\/\//i.test(url);
const isCloudinaryUrl = (url) => !!url && /res\.cloudinary\.com/i.test(url);

const processImageUrl = (url) => {
  if (!url) return null;
  if (isRemote(url)) return url;
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = url.startsWith('/') ? url.slice(1) : url;
  return `${cleanBaseUrl}/uploads/${cleanPath}`;
};

const uniqueByUrl = (arr) => {
  const seen = new Set();
  return arr.filter((it) => {
    const key = `${it?.type}|${it?.img}|${it?.video || ''}`;
    if (!it?.img) return false;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const NO_IMG = `data:image/svg+xml;utf8,
<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='900'>
  <rect width='100%' height='100%' fill='%23f5f5f5'/>
  <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
        font-family='Arial' font-size='28' fill='%23999'>No image available</text>
</svg>`;

/* how the image is rendered inside the box */
function getRenderedMetrics({ boxW, boxH, naturalW, naturalH, objectFit = 'cover' }) {
  const imgAR = naturalW / naturalH;
  const boxAR = boxW / boxH;
  let renderW, renderH, offsetX, offsetY;

  if (objectFit === 'contain') {
    if (imgAR > boxAR) {
      renderW = boxW; renderH = boxW / imgAR;
    } else {
      renderH = boxH; renderW = boxH * imgAR;
    }
    offsetX = (boxW - renderW) / 2;
    offsetY = (boxH - renderH) / 2;
  } else {
    // cover
    if (imgAR > boxAR) {
      renderH = boxH; renderW = boxH * imgAR;
      offsetX = (boxW - renderW) / 2; offsetY = 0;
    } else {
      renderW = boxW; renderH = boxW / imgAR;
      offsetX = 0; offsetY = (boxH - renderH) / 2;
    }
  }
  return { renderW, renderH, offsetX, offsetY };
}

/* ---------------- component ---------------- */
const DetailsThumbWrapper = ({
  img, image1, image2,
  video, videoThumbnail,

  imageURLs,
  apiImages,

  handleImageActive,
  activeImg,

  imgWidth = 416,
  imgHeight = 480,

  videoId = false,
  status,

  /* lens & zoom */
  lensSize = 140,
  objectFitMode = 'cover',      // 'cover' | 'contain'
  zoomPaneWidth = 620,
  zoomPaneHeight = 480,
  // extra magnification on top of the exact lens→pane mapping
  extraZoom = 1.0,

  lensBorder = '2px solid rgba(59,130,246,.75)',
  lensBg = 'rgba(255,255,255,.25)',
}) => {
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState(null);

  /* ---------- Build thumbs ---------- */
  const primaryThumbs = useMemo(() => {
    const list = [];
    if (img) list.push({ type: 'image', img: processImageUrl(img) });
    if (image1) list.push({ type: 'image', img: processImageUrl(image1) });
    if (image2 && image2 !== image1) list.push({ type: 'image', img: processImageUrl(image2) });
    if (video || videoThumbnail) {
      const vUrl = video ? (isRemote(video) ? video : processImageUrl(video)) : null;
      const poster = processImageUrl(videoThumbnail) || list[0]?.img || null;
      if (vUrl || poster) list.push({ type: 'video', img: poster, video: vUrl });
    }
    return list;
  }, [img, image1, image2, video, videoThumbnail]);

  const extrasFromApiImages = useMemo(() => {
    const src = apiImages || {};
    const pics = [src.img, src.image1, src.image2]
      .map(processImageUrl).filter(Boolean)
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
    return list.map((item) => {
      if (!item) return null;
      const type = item.type === 'video' ? 'video' : 'image';
      const thumb = processImageUrl(item.img || item.thumbnail || item.poster);
      const vUrl = type === 'video'
        ? (isRemote(item.video) ? item.video : processImageUrl(item.video))
        : null;
      return thumb ? { type, img: thumb, video: vUrl } : null;
    }).filter(Boolean);
  }, [imageURLs]);

  const processedImageURLs = useMemo(
    () => uniqueByUrl([...primaryThumbs, ...extrasFromApiImages, ...extrasFromImageURLs]),
    [primaryThumbs, extrasFromApiImages, extrasFromImageURLs]
  );

  /* ---------- Main image ---------- */
  const mainImageUrl = useMemo(() => {
    if (activeImg) return processImageUrl(activeImg);
    if (img) return processImageUrl(img);
    const first = processedImageURLs.find(x => x?.type === 'image');
    return first?.img || null;
  }, [img, activeImg, processedImageURLs]);

  const [mainSrc, setMainSrc] = useState(mainImageUrl);
  useEffect(() => {
    if (mainImageUrl && mainImageUrl !== mainSrc) {
      setMainSrc(mainImageUrl);
      setIsVideoActive(false);
      setCurrentVideoUrl(null);
      if (typeof handleImageActive === 'function') {
        handleImageActive({ img: mainImageUrl, type: 'image' });
      }
    }
  }, [mainImageUrl]); // keep in sync

  const isActiveThumb = (item) =>
    (!isVideoActive && item.type === 'image' && item.img === mainSrc) ||
    (isVideoActive && item.type === 'video' && (item.video || null) === (currentVideoUrl || videoId || null));

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

  /* ---------------- Accurate lens → pane mapping ---------------- */
  const imgWrapRef = useRef(null);
  const [showZoom, setShowZoom] = useState(false);
  const [naturalSize, setNaturalSize] = useState({ w: imgWidth, h: imgHeight });

  // Zoom pane CSS values (in pixels) — top-left of lens == top-left of zoom pane
  const [bgSizePx, setBgSizePx] = useState({ w: 0, h: 0 });
  const [bgPosPx, setBgPosPx] = useState({ x: 0, y: 0 });

  const [showLens, setShowLens] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 });

  const handleImageLoaded = ({ naturalWidth, naturalHeight }) =>
    setNaturalSize({ w: naturalWidth || imgWidth, h: naturalHeight || imgHeight });

  const handleMouseEnter = () => {
    if (!isVideoActive && mainSrc) { setShowZoom(true); setShowLens(true); }
  };
  const handleMouseLeave = () => { setShowZoom(false); setShowLens(false); };

  const handleMouseMove = (e) => {
    if (!imgWrapRef.current || isVideoActive || !mainSrc) return;

    const rect = imgWrapRef.current.getBoundingClientRect();
    const cx = e.clientX - rect.left;   // cursor in box coords
    const cy = e.clientY - rect.top;

    // image placement inside the box
    const { renderW, renderH, offsetX, offsetY } = getRenderedMetrics({
      boxW: rect.width,
      boxH: rect.height,
      naturalW: naturalSize.w,
      naturalH: naturalSize.h,
      objectFit: objectFitMode
    });

    // lens position (clamped to the drawn image area)
    const half = lensSize / 2;
    const minX = offsetX;
    const maxX = offsetX + renderW - lensSize;
    const minY = offsetY;
    const maxY = offsetY + renderH - lensSize;

    const lx = Math.max(minX, Math.min(maxX, cx - half));
    const ly = Math.max(minY, Math.min(maxY, cy - half));
    setLensPos({ x: lx, y: ly });

    // convert the LENS TOP-LEFT inside the drawn image -> natural pixels
    const imgLx = lx - offsetX;                 // px inside drawn image
    const imgLy = ly - offsetY;
    const natLx = (imgLx / renderW) * naturalSize.w;
    const natLy = (imgLy / renderH) * naturalSize.h;

    // scale so lens area exactly fills the pane (with optional extra magnification)
    const scaleX = (zoomPaneWidth / lensSize) * extraZoom;
    const scaleY = (zoomPaneHeight / lensSize) * extraZoom;

    // background-size in pixels (natural * scale)
    const bgW = naturalSize.w * scaleX;
    const bgH = naturalSize.h * scaleY;
    setBgSizePx({ w: bgW, h: bgH });

    // background-position in pixels: negative to align lens TL with pane TL
    const bgX = natLx * scaleX;
    const bgY = natLy * scaleY;
    setBgPosPx({ x: bgX, y: bgY });
  };

  return (
    <div className="pdw-wrapper">
      {/* Thumbs */}
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
            <img
              src={mainSrc || NO_IMG}
              alt="product img"
              style={{
                display: 'block',
                width: '100%',
                height: '100%',
                objectFit: objectFitMode,
                objectPosition: 'center',
              }}
              onLoad={(e) => handleImageLoaded(e.currentTarget)}
              onError={(e) => { if (e.currentTarget.src !== NO_IMG) e.currentTarget.src = NO_IMG; }}
            />
          )}

          {/* Lens */}
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

      {/* Right zoom pane — EXACT lens region */}
      <aside
        className={`pdw-zoom ${showZoom && !isVideoActive ? 'is-visible' : ''}`}
        style={{
          backgroundImage: mainSrc ? `url(${mainSrc})` : 'none',
          backgroundRepeat: 'no-repeat',
          backgroundSize: `${bgSizePx.w}px ${bgSizePx.h}px`,
          backgroundPosition: `-${bgPosPx.x}px -${bgPosPx.y}px`,
        }}
        aria-hidden={!showZoom || isVideoActive}
      />

      {/* ---------- styles ---------- */}
      <style jsx>{`
  .pdw-wrapper {
    display: grid;
    grid-template-columns: 96px ${imgWidth}px ${zoomPaneWidth}px;
    gap: 16px;
    align-items: start;
  }

  .pdw-thumbs { width: 96px; }
  .pdw-thumbs-inner {
    display: flex; flex-direction: column; gap: 12px;
    max-height: ${zoomPaneHeight}px;
    overflow: auto; padding-right: 4px;
  }
  .pdw-thumb {
    position: relative; width: 80px; height: 80px;
    padding: 0; border: 0; box-sizing: border-box;
    border-radius: 12px; overflow: hidden; background: #fff; cursor: pointer;
    transition: transform .12s ease, box-shadow .16s ease;
    flex: 0 0 auto; display: grid; place-items: center;
  }
  .pdw-thumb:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0,0,0,.08); }
  .pdw-thumb.is-active { box-shadow: inset 0 0 0 3px #3b82f6; }
  .pdw-thumb:focus-visible { box-shadow: inset 0 0 0 3px #3b82f6; }

  .pdw-thumb-img { width: 100%; height: 100%; object-fit: cover; display: block; border-radius: inherit; }

  .pdw-thumb-play {
    position: absolute; inset: 0; display: grid; place-items: center;
    color: #fff; font-size: 34px;
    background: linear-gradient(to top, rgba(0,0,0,.45), rgba(0,0,0,.05));
    pointer-events: none;
  }

  .pdw-main {
    width: ${imgWidth}px; height: ${imgHeight}px;
    border-radius: 12px; overflow: hidden;
    background: #fff; border: 1px solid #1b0cf4ff;
    box-shadow: 0 8px 24px rgba(0,0,0,.06);
  }
  .pdw-main-inner { width: 100%; height: 100%; position: relative; display: grid; place-items: center; }
  .pdw-video { background: #000; width: 100%; height: 100%; }

  .pdw-lens {
    position: absolute; top: 0; left: 0; pointer-events: none;
    border-radius: 8px; box-shadow: inset 0 0 0 1px rgba(255,255,255,.6);
    backdrop-filter: saturate(120%) brightness(105%);
  }

  .tp-product-badge { position: absolute; left: 10px; top: 10px; }
  .product-hot { display: inline-block; background: #ef4444; color: #fff; font-size: 12px; padding: 4px 8px; border-radius: 6px; }

  .pdw-zoom {
    width: ${zoomPaneWidth}px; height: ${zoomPaneHeight}px;
    border-radius: 12px; border: 1px solid #f0f0f0; background-color: #fafafa;
    box-shadow: 0 8px 24px rgba(0,0,0,.06); overflow: hidden;
    opacity: 0; visibility: hidden; transform: translateY(4px);
    transition: opacity .16s ease, visibility .16s ease, transform .16s ease;
  }
  .pdw-zoom.is-visible { opacity: 1; visibility: visible; transform: translateY(0); }

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
