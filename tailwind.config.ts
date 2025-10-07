import type { Config } from 'tailwindcss';

const config: Config = {
	content: [
		'./src/pages/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/components/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/app/**/*.{js,ts,jsx,tsx,mdx}'
	],
	theme: {
		extend: {
			colors: {
				background: {
					DEFAULT: '#0A0A0B',
					surface: '#151518',
					elevated: '#1F1F23'
				},
				primary: {
					DEFAULT: '#D4AF37',
					dark: '#C5A028',
					light: '#E5C158'
				},
				accent: {
					platinum: '#E5E4E2',
					silver: '#C0C0C0'
				},
				text: {
					primary: '#F5F5F0',
					secondary: '#A8A8A0',
					muted: '#6B6B66'
				},
				status: {
					success: '#2D8659',
					warning: '#D97706',
					error: '#991B1B',
					info: '#475569'
				}
			},
			fontFamily: {
				serif: ['var(--font-cormorant)', 'Georgia', 'serif'],
				sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
				mono: ['var(--font-space-grotesk)', 'Menlo', 'monospace']
			},
			backgroundImage: {
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
				'gradient-luxury': 'linear-gradient(135deg, #0A0A0B 0%, #151518 100%)',
				'gradient-gold': 'linear-gradient(90deg, #D4AF37 0%, #C5A028 100%)'
			},
			animation: {
				'fade-in': 'fadeIn 0.6s ease-in-out',
				'slide-up': 'slideUp 0.6s ease-out',
				'slide-down': 'slideDown 0.6s ease-out',
				'scale-in': 'scaleIn 0.5s ease-out',
				shimmer: 'shimmer 2s infinite',
				'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite'
			},
			keyframes: {
				fadeIn: {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				},
				slideUp: {
					'0%': { transform: 'translateY(20px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				slideDown: {
					'0%': { transform: 'translateY(-20px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				scaleIn: {
					'0%': { transform: 'scale(0.95)', opacity: '0' },
					'100%': { transform: 'scale(1)', opacity: '1' }
				},
				shimmer: {
					'0%': { backgroundPosition: '-1000px 0' },
					'100%': { backgroundPosition: '1000px 0' }
				}
			},
			backdropBlur: {
				xs: '2px'
			},
			boxShadow: {
				luxury: '0 10px 40px rgba(212, 175, 55, 0.1)',
				'luxury-lg': '0 20px 60px rgba(212, 175, 55, 0.15)',
				'inner-luxury': 'inset 0 2px 4px rgba(212, 175, 55, 0.06)'
			}
		}
	},
	plugins: []
};

export default config;

