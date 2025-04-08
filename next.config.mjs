/** @type {import('next').NextConfig} */
//tzasipfripgaopulvhed.supabase.co
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'picsum.photos',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'tzasipfripgaopulvhed.supabase.co',
                port: '',
                pathname: '/storage/v1/object/public/**',
            },
        ]

    }
};

export default nextConfig;
