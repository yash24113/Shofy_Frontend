// app/blog-details/[id]/page.jsx
import HeaderTwo from "@/layout/headers/header-2";
import Wrapper from "@/layout/wrapper";
import Footer from "@/layout/footers/footer";
import BlogDetailsArea from "@/components/blog-details/blog-details-area";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000").replace(/\/+$/,'');
const BLOG_PATH = process.env.NEXT_PUBLIC_API_BLOG_PATH || "/blogs";

async function getBlog(id) {
  const res = await fetch(`${API_BASE}${BLOG_PATH}/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  const json = await res.json();
  return json?.data ?? null;
}

export async function generateMetadata({ params }) {
  const blog = await getBlog(params.id);
  return {
    title: blog?.title ? `${blog.title} | Blog` : "Blog Details",
    description: blog?.heading || blog?.paragraph1 || "",
    openGraph: { images: [blog?.blogimage1 || blog?.blogimage2].filter(Boolean) },
  };
}

export default async function BlogDetails({ params }) {
  const blog = await getBlog(params.id);

  return (
    <Wrapper>
      <HeaderTwo style_2 />
      {/* You can show a nicer 404 section if blog is null */}
      <BlogDetailsArea blog={blog} />
      <Footer primary_style />
    </Wrapper>
  );
}
