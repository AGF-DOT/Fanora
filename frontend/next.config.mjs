/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: process.cwd(),
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@react-native-async-storage/async-storage": false,
      "pino-pretty": false,
    };
    return config;
  },
  images: {
    // 本地开发访问 Pinata IPFS 网关较慢时，服务端图片优化会超时 500；
    // 设 NEXT_PUBLIC_IMAGE_UNOPTIMIZED=true 可让浏览器直接加载原图，绕过优化器。
    unoptimized: process.env.NEXT_PUBLIC_IMAGE_UNOPTIMIZED === "true",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.jsdelivr.net",
        port: "",
      },
      {
        protocol: "https",
        hostname: "gateway.pinata.cloud",
        pathname: "/ipfs/**",
      },
      {
        protocol: "https",
        hostname: "**.mypinata.cloud",
        pathname: "/ipfs/**",
      },
      {
        protocol: "https",
        hostname: "ipfs.io",
        pathname: "/ipfs/**",
      },
      {
        protocol: "https",
        hostname: "fanora-1493413604.cos.ap-guangzhou.myqcloud.com",
      },
      {
        protocol: "https",
        hostname: "**.imglnk.cn",
        pathname: "/v/**",
      },
      {
        protocol: "https",
        hostname: "s3.siliconflow.cn",
        pathname: "/temporary/outputs/**",
      },
    ],
  },
};

export default nextConfig;
