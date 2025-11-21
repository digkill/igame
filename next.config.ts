import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export', // Статический экспорт для генерации HTML файлов
  images: {
    unoptimized: true, // Требуется для статического экспорта
  },
  trailingSlash: true, // Добавляет слэш в конце URL
};

export default nextConfig;
