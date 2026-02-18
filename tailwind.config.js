/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        screens: {
            'xs': '320px',
            'mm': '375px',
            'sm': '640px',
            'md': '768px',
            'lg': '1024px',
            'xl': '1280px',
            '2xl': '1536px',
            '3xl': '1920px',
            '4xl': '2560px',
            '5xl': '3840px',
        },
        extend: {
            colors: {
                primary: {
                    50: '#E8F5E9',
                    100: '#C8E6C9',
                    200: '#A5D6A7',
                    300: '#81C784',
                    400: '#66BB6A',
                    500: '#4CAF50', // AppTheme.lightPrimary
                    600: '#43A047',
                    700: '#2E7D32', // AppTheme.primary
                    800: '#1B5E20', // AppTheme.darkPrimary
                    900: '#103E14',
                    950: '#051F07',
                    DEFAULT: '#2E7D32',
                },
                secondary: {
                    DEFAULT: '#FF5722', // AppTheme.secondary (Orange)
                    50: '#FBE9E7',
                    100: '#FFCCBC',
                    200: '#FFAB91',
                    300: '#FF8A65', // AppTheme.lightSecondary
                    400: '#FF7043',
                    500: '#FF5722',
                    600: '#F4511E',
                    700: '#E64A19', // AppTheme.darkSecondary
                    800: '#D84315',
                    900: '#BF360C',
                },
                tertiary: {
                    DEFAULT: '#00695C', // AppTheme.tertiary
                    50: '#E0F2F1',
                    100: '#B2DFDB',
                    200: '#80CBC4',
                    300: '#4DB6AC',
                    400: '#26A69A',
                    500: '#009688',
                    600: '#00897B',
                    700: '#00796B',
                    800: '#00695C',
                    900: '#004D40',
                },
                beige: {
                    DEFAULT: '#FFF8E1', // AppTheme.beige
                    50: '#FFFFFF',
                    100: '#FFFEF9',
                    200: '#FFFDF1',
                    300: '#FFFBCF',
                    400: '#FFF9BF',
                    500: '#FFF8E1', // Base
                    600: '#FFE082',
                    700: '#FFCA28',
                    800: '#FFB300',
                    900: '#FF6F00',
                },
                slate: {
                    DEFAULT: '#455A64', // AppTheme.slate
                    50: '#ECEFF1',
                    100: '#CFD8DC',
                    200: '#B0BEC5',
                    300: '#90A4AE',
                    400: '#78909C',
                    500: '#607D8B',
                    600: '#546E7A',
                    700: '#455A64',
                    800: '#37474F',
                    900: '#263238', // AppTheme.dark
                },
            },
            boxShadow: {
                'premium': '0 12px 24px -6px rgba(0, 0, 0, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.03)',
                'premium-hover': '0 32px 64px -12px rgba(0, 0, 0, 0.14)',
            },
        },
    },
    plugins: [],
}

