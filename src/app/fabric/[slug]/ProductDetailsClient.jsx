
'use client';

import React from 'react';

import ProductDetailsArea from '@/components/product-details/product-details-area';
import ProductDetailsLoader from '@/components/loader/prd-details-loader';
import ErrorMsg from '@/components/common/error-msg';

import { useGetSingleNewProductQuery } from '@/redux/features/newProductApi';


function mapBackendProductToFrontend(p) {
  const mainImg = p.img || p.image || '';
  const img1 = p.image1 || '';
  const img2 = p.image2 || '';
  const videoUrl = p.video || '';
  const poster = p.videoThumbnail || '';

  const images = [
    mainImg && { type: 'image', img: mainImg },
    img1 && { type: 'image', img: img1 },
    img2 && { type: 'image', img: img2 },
  ].filter(Boolean);

  if (videoUrl || poster) {
    images.push({ type: 'video', img: poster || mainImg || img1 || img2, video: videoUrl });
  }

  return {
    _id: p._id,
    slug: p.slug,
    title: p.name || p.title,
    img: mainImg,
    image1: img1,
    image2: img2,
    video: videoUrl,
    videoThumbnail: poster,
    // expose raw fields needed for Details components
    color: p.color || p.colors || [],
    colors: p.colors || [],
    motif: p.motif || p.motifsize || null,
    motifId: (p.motif && p.motif._id) || p.motif || p.motifsize || null,
    imageURLs: images,
    videoId: videoUrl,
    price: p.salesPrice,
    description: p.description || p.productdescription || '',
    status: p.status || 'in-stock',
    sku: p.sku,

    categoryId: p.category?._id || p.category || '',
    structureId: p.substructure?._id || p.substructure || '',
    contentId: p.content?._id || p.content || '',
    finishId: p.subfinish?._id || p.subfinish || '',
    designId: p.design?._id || p.design || '',
    motifsizeId: p.motif?._id || p.motif || '',
    suitableforId: p.subsuitable?._id || p.subsuitable || '',
    vendorId: p.vendor?._id || p.vendor || '',
    groupcodeId: p.groupcode?._id || p.groupcode || '',

    gsm: p.gsm,
    oz: p.oz,
    productIdentifier: p.productIdentifier,
    width: p.cm
      ? `${p.cm} cm`
      : p.inch
        ? `${p.inch} inch`
        : 'N/A',

    tags: p.tags || [],
    offerDate: p.offerDate || { endDate: null },
    additionalInformation: p.additionalInformation || [],
  };
}

export default function ProductDetailsClient({ slug }) {
  const {
    data,
    isLoading,
    isError,
  } = useGetSingleNewProductQuery(slug, { skip: !slug });

  if (isLoading) return <ProductDetailsLoader loading />;
  if (isError) return <ErrorMsg msg="There was an error" />;
  if (!data?.data) return <ErrorMsg msg="No product found!" />;

  const product = mapBackendProductToFrontend(data.data);
  return <ProductDetailsArea product={product} />;
}
