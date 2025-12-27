/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            colors: {
                gray: {
                    50: '#F9F9FB', // Slightly cooler/lighter gray for background
                    100: '#F2F2F5',
                    200: '#E5E5E8',
                    300: '#D1D1D6',
                    400: '#9CA3AF',
                    500: '#6B7280',
                    600: '#4B5563',
                    700: '#374151',
                    800: '#1F2937',
                    900: '#111827',
                }
            }
        },
    },
    plugins: [],
}
