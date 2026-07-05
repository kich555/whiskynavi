import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb", // 기본값: 1mb
    },
    optimizePackageImports: ["lucide-react", "overlay-kit"],
  },
  // ✅ S3 이미지 호스트 허용
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "navi-s3-cask-bucket-a08be16e-142b-4537-86bb-0bbe737bd844.s3.ap-northeast-2.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "file.whiskynavi.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },

  // ✅ Turbopack 설정 추가
  turbopack: {
    rules: {
      // .svg를 SVGR로 JS(리액트 컴포넌트)로 변환
      "*.svg": {
        loaders: [
          {
            loader: "@svgr/webpack",
            options: {
              svgo: true,
              svgoConfig: {
                plugins: [
                  {
                    name: "preset-default",
                    params: {
                      overrides: {
                        removeViewBox: false,
                        cleanupIds: false, // ID 충돌 방지를 위해 비활성화
                      },
                    },
                  },
                  { name: "removeDimensions", active: true },
                  {
                    name: "prefixIds", // 파일별로 고유한 ID prefix 추가
                    params: {
                      prefixIds: true,
                      prefixClassNames: true,
                    },
                  },
                ],
              },
              titleProp: true,
            },
          },
        ],
        as: "*.js",
      },
    },
  },

  // (선택) webpack 설정이 이미 있다면, svg를 asset 로더에서 제외하는 기존 부분은 남겨도 무방하지만
  // Turbopack만 쓴다면 아래 webpack 블록 자체를 지워도 됩니다.
  // webpack(config) {
  //   const assetRule = config.module.rules.find((r) => r.test?.test?.('.svg'));
  //   if (assetRule) assetRule.exclude = /\.svg$/i;
  //   config.module.rules.push({
  //     test: /\.svg$/i,
  //     issuer: /\.[jt]sx?$/,
  //     use: [{ loader: '@svgr/webpack', options: { /* ... */ } }],
  //   });
  //   return config;
  // },
};

export default nextConfig;
