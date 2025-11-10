import Wrapper       from '@/layout/wrapper';
import HeaderTwo     from '@/layout/headers/header-2';
import Footer        from '@/layout/footers/footer';
import ProductClient from './ProductDetailsClient';

/* -----------------------------------------------------------
   Config / helpers
----------------------------------------------------------- */
export const revalidate = 600;

const stripHtml = (html = '') => String(html || '').replace(/<[^>]+>/g, '').trim();

function apiHeaders() {
  return {
    'x-api-key'    : process.env.NEXT_PUBLIC_API_KEY || '',
    'Content-Type' : 'application/json',
    'x-admin-email': process.env.NEXT_PUBLIC_ADMIN_EMAIL || '',
  };
}

const pick = (...v) => v.find(x => x !== undefined && x !== null && String(x).trim() !== '');
const asArray = (v) => Array.isArray(v) ? v : (v ? [v] : []);
const toUrl = (u) => {
  try { return u ? new URL(u) : new URL('https://shofy-frontend1.vercel.app'); }
  catch { return new URL('https://shofy-frontend1.vercel.app'); }
};

// OG type must be from Next's allowed list
const sanitizeOgType = (t) => {
  const allowed = new Set([
    'website','article','book','profile',
    'music.song','music.album','music.playlist','music.radio_station',
    'video.movie','video.episode','video.tv_show','video.other'
  ]);
  return allowed.has(String(t || '').toLowerCase()) ? t : 'website';
};

// ensure only absolute http(s) URLs
const ensureAbs = (u) => {
  try {
    const url = new URL(String(u));
    if (url.protocol === 'http:' || url.protocol === 'https:') return url.toString();
  } catch {}
  return null;
};

/* -----------------------------------------------------------
   Data fetchers (SEO first, then Product)
----------------------------------------------------------- */
async function getSeoBySlug(slug) {
  try {
    const res = await fetch(
      `https://test.amrita-fashions.com/shopy/seo/public/slug/${encodeURIComponent(slug)}`,
      { next: { revalidate } }
    );
    if (!res.ok) return null;
    const j = await res.json();
    return j && j.data ? j.data : null;
  } catch { return null; }
}

async function getProductBySlug(slug) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/product/${encodeURIComponent(slug)}`,
      { headers: apiHeaders(), next: { revalidate } }
    );
    if (!res.ok) return null;
    const j = await res.json();
    return Array.isArray(j && j.data) ? j.data[0] : (j && j.data) || null;
  } catch { return null; }
}

/* -----------------------------------------------------------
   Next.js App Router metadata (JS version)
----------------------------------------------------------- */
export async function generateMetadata({ params }) {
  const { slug } = params;

  const siteURL   = process.env.NEXT_PUBLIC_SITE_URL || 'https://shofy-frontend1.vercel.app';
  const canonical = `${siteURL}/fabric/${slug}`;

  const seo = await getSeoBySlug(slug);
  const product = await getProductBySlug(slug);

  const productNode   = (seo && seo.product) || product || {};
  const fallbackTitle = slug.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const title = pick(seo && seo.title, productNode && productNode.name, fallbackTitle);

  const description = pick(
    seo && seo.description,
    seo && seo.description_html && stripHtml(seo.description_html),
    productNode && productNode.productdescription,
    ''
  );

  // image: only include absolute URLs
  const rawImg = pick(
    seo && seo.image1,
    seo && seo.img,
    productNode && productNode.image1,
    productNode && productNode.img
  );
  const imgAbs = ensureAbs(rawImg);

  const keywords = [
    seo && seo.keywords,
    productNode && productNode.category && productNode.category.name,
    productNode && productNode.design && productNode.design.name,
    productNode && productNode.subfinish && productNode.subfinish.name,
    productNode && productNode.content && productNode.content.name,
    asArray(productNode && productNode.color).map(c => c && c.name).filter(Boolean).join(', ')
  ].filter(Boolean).join(', ');

  // OpenGraph — force allowed type
  const ogType        = sanitizeOgType(pick(seo && seo.ogType, 'website'));
  const ogTitle       = pick(seo && seo.ogTitle, title);
  const ogDescription = pick(seo && seo.ogDescription, description);
  const ogSiteName    = pick(seo && seo.ogSiteName, 'AGE Fabrics');
  const ogLocale      = pick(seo && seo.ogLocale, 'en_US');

  // Twitter
  const twCard        = pick(seo && seo.twitterCard, 'summary_large_image');
  const twTitle       = pick(seo && seo.twitterTitle, title);
  const twDescription = pick(seo && seo.twitterDescription, description);
  const twSite        = seo && seo.twitterSite;

  // Robots (safe defaults)
  const robots = {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true }
  };

  // Verification
  const verification = {
    google: seo && seo.googleSiteVerification ? seo.googleSiteVerification : undefined,
  };

  const themeColor = pick(seo && seo.themeColor, '#ffffff');
  const viewport   = pick(seo && seo.viewport, 'width=device-width, initial-scale=1');
  const xDefault   = pick(seo && seo.x_default);

  return {
    title,
    description,
    keywords,
    metadataBase: toUrl(siteURL),
    alternates: { canonical },
    openGraph: {
      type: ogType,
      url: canonical,
      title: ogTitle,
      description: ogDescription,
      images: imgAbs ? [{ url: imgAbs, width: 1200, height: 630, alt: String(title) }] : [],
      siteName: ogSiteName,
      locale: ogLocale,
    },
    twitter: {
      card: twCard,
      title: twTitle,
      description: twDescription,
      images: imgAbs ? [imgAbs] : [],
      site: twSite,
    },
    robots,
    verification,
    applicationName: pick(seo && seo.applicationName, 'AGE Fabrics'),
    creator: pick(seo && seo.author_name, 'AGE Fabrics'),
    authors: [{ name: pick(seo && seo.author_name, 'AGE Fabrics') }],
    publisher: pick(seo && seo.publisher, 'AGE Fabrics'),
    other: {
      charset: pick(seo && seo.charset, 'UTF-8'),
      'content-language': pick(seo && seo.contentLanguage, 'en-US'),
      'format-detection': pick(seo && seo.formatDetection, 'telephone=no,date=no,address=no,email=no,url=no'),
      'msvalidate.01': pick(seo && seo.msValidate),
      'apple-mobile-web-app-capable': pick(seo && seo.mobileWebAppCapable),
      'x-ua-compatible': pick(seo && seo.xUaCompatible, 'IE=edge'),
      'x-default': xDefault,
      'location-code': pick(seo && seo.locationCode),
      'product-identifier': pick(seo && seo.productIdentifier),
      ...(seo && seo.twitterPlayer ? { 'twitter:player': seo.twitterPlayer } : {}),
      ...(seo && seo.twitterPlayerWidth ? { 'twitter:player:width': String(seo.twitterPlayerWidth) } : {}),
      ...(seo && seo.twitterPlayerHeight ? { 'twitter:player:height': String(seo.twitterPlayerHeight) } : {}),
      ...(seo && seo.ogVideoType ? { 'og:video:type': String(seo.ogVideoType) } : {}),
      ...(seo && seo.ogVideoWidth ? { 'og:video:width': String(seo.ogVideoWidth) } : {}),
      ...(seo && seo.ogVideoHeight ? { 'og:video:height': String(seo.ogVideoHeight) } : {}),
      viewport,
      'theme-color': themeColor,
    },
  };
}

/* -----------------------------------------------------------
   JSON-LD builder (Product + LocalBusiness + Breadcrumb + Logo + Video)
----------------------------------------------------------- */
function buildJsonLdBundle(seo, productNode, canonical) {
  const imgsRaw = [seo && seo.image1, seo && seo.img, productNode && productNode.image1, productNode && productNode.img];
  const images = imgsRaw.map(ensureAbs).filter(Boolean);

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: pick(seo && seo.title, productNode && productNode.name),
    description: pick(
      seo && seo.description,
      seo && seo.description_html && stripHtml(seo.description_html),
      productNode && productNode.productdescription
    ),
    image: images,
    sku: pick(productNode && productNode.sku, ''),
    mpn: pick(productNode && productNode._id, ''),
    brand: { '@type': 'Brand', name: pick(productNode && productNode.vendor && productNode.vendor.name, 'AGE Fabrics') },
    offers: {
      '@type': 'Offer',
      url: canonical,
      priceCurrency: pick(productNode && productNode.currency, 'INR'),
      price: pick(seo && seo.salesPrice, productNode && productNode.salesPrice, 0),
      availability: Number((productNode && productNode.quantity) ?? 0) > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      priceValidUntil: new Date(Date.now() + 1000*60*60*24*30).toISOString().split('T')[0],
    },
    aggregateRating: (seo && seo.rating_value) || (productNode && productNode.rating_value) ? {
      '@type': 'AggregateRating',
      ratingValue: pick(seo && seo.rating_value, productNode && productNode.rating_value),
      ratingCount: pick(seo && seo.rating_count, productNode && productNode.rating_count),
    } : undefined,
  };

  const breadcrumbJson = seo && seo.BreadcrumbJsonLd ? {
    '@context': (seo && seo.BreadcrumbJsonLdcontext) || 'https://schema.org',
    '@type': (seo && seo.BreadcrumbJsonLdtype) || 'BreadcrumbList',
    name: seo && seo.BreadcrumbJsonLdname,
    itemListElement: seo && seo.BreadcrumbJsonLditemListElement,
  } : undefined;

  const logoJson = seo && seo.LogoJsonLd ? {
    '@context': (seo && seo.LogoJsonLdcontext) || 'https://schema.org',
    '@type': (seo && seo.LogoJsonLdtype) || 'ImageObject',
    url: ensureAbs(seo && seo.LogoJsonLd),
    width: seo && seo.logoJsonLdwidth,
    height: seo && seo.logoJsonLdheight,
  } : undefined;

  const videoJson = seo && seo.VideoJsonLd ? {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: pick(seo && seo.twitterTitle, seo && seo.title),
    description: pick(seo && seo.twitterDescription, seo && seo.description),
    thumbnailUrl: images.slice(0,1),
    uploadDate: new Date().toISOString(),
    contentUrl: ensureAbs(seo && seo.VideoJsonLd),
    embedUrl: pick(seo && seo.twitterPlayer),
  } : undefined;

  const localBusinessJson = seo && seo.LocalBusinessJsonLd ? {
    '@context': (seo && seo.LocalBusinessJsonLdcontext) || 'https://schema.org',
    '@type': (seo && seo.LocalBusinessJsonLdtype) || 'LocalBusiness',
    name: seo && seo.LocalBusinessJsonLdname,
    telephone: seo && seo.LocalBusinessJsonLdtelephone,
    areaServed: seo && seo.LocalBusinessJsonLdareaserved,
    address: {
      '@type': (seo && seo.LocalBusinessJsonLdaddresstype) || 'PostalAddress',
      streetAddress: seo && seo.LocalBusinessJsonLdaddressstreetAddress,
      addressLocality: seo && seo.LocalBusinessJsonLdaddressaddressLocality,
      addressRegion: seo && seo.LocalBusinessJsonLdaddressaddressRegion,
      postalCode: seo && seo.LocalBusinessJsonLdaddresspostalCode,
      addressCountry: seo && seo.LocalBusinessJsonLdaddressaddressCountry,
    },
    geo: {
      '@type': (seo && seo.LocalBusinessJsonLdgeotype) || 'GeoCoordinates',
      latitude: seo && seo.LocalBusinessJsonLdgeolatitude,
      longitude: seo && seo.LocalBusinessJsonLdgeolongitude,
    },
  } : undefined;

  return [productJsonLd, breadcrumbJson, logoJson, videoJson, localBusinessJson].filter(Boolean);
}

/* -----------------------------------------------------------
   Page component
----------------------------------------------------------- */
export default async function Page({ params }) {
  const { slug } = params;

  const siteURL   = process.env.NEXT_PUBLIC_SITE_URL || 'https://shofy-frontend1.vercel.app';
  const canonical = `${siteURL}/fabric/${slug}`;

  const seo = await getSeoBySlug(slug);
  const product = await getProductBySlug(slug);
  const productNode = (seo && seo.product) || product || null;

  const jsonLdBundle = buildJsonLdBundle(seo, productNode, canonical);

  return (
    <>
      <Wrapper>
        <HeaderTwo style_2 />
        <ProductClient slug={slug} />
        <Footer primary_style />
      </Wrapper>

      {jsonLdBundle.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
    </>
  );
}
