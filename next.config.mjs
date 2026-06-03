/** @type {import('next').NextConfig} */

// next/image 로 Supabase Storage public URL 을 그대로 쓰려면 호스트를 허용해야 한다.
// .env.local 의 NEXT_PUBLIC_SUPABASE_URL 에서 호스트만 뽑아 등록한다.
const supabaseHost = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
})();

const nextConfig = {
  images: {
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
