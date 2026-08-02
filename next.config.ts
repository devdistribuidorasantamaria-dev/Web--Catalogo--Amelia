import type { NextConfig } from 'next';

// Host/protocolo/puerto del backend se derivan de NEXT_PUBLIC_API_URL para que las
// fotos carguen en cualquier entorno sin tocar el código.
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api';
const { protocol, hostname, port } = new URL(apiUrl);

// Next 16 bloquea la optimización de imágenes servidas desde IPs/hosts locales.
// En desarrollo el backend vive en localhost, así que hay que permitirlo.
const hostLocal = ['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(hostname);

const nextConfig: NextConfig = {
  // Habilita `use cache` / cacheTag / cacheLife.
  cacheComponents: true,

  images: {
    remotePatterns: [
      {
        protocol: protocol.replace(':', '') as 'http' | 'https',
        hostname,
        port: port || undefined,
        pathname: '/storage/**',
      },
    ],
    dangerouslyAllowLocalIP: hostLocal,
  },
};

export default nextConfig;
