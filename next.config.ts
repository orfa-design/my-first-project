import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Навчальні сторінки переїхали під /study — старі посилання ведуть на нові адреси.
  async redirects() {
    return ["tasks", "subjects", "schedule", "grades", "semesters"].flatMap((section) => [
      { source: `/${section}`, destination: `/study/${section}`, permanent: true },
      { source: `/${section}/:path*`, destination: `/study/${section}/:path*`, permanent: true },
    ]);
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
