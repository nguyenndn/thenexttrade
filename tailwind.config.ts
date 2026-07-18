import type { Config } from "tailwindcss";

const config: Config = {
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
		"./node_modules/onborda/dist/**/*.{js,ts,jsx,tsx}",
		// Exclusions: prevent Tailwind from scanning test/temp dirs
		"!./test-results/**",
		"!./playwright-report/**",
		"!./.next/**",
	],
	theme: {
		extend: {
			fontFamily: {
				sans: [
					'var(--font-source-sans)',
					'sans-serif'
				],
				heading: [
					'var(--font-lexend)',
					'sans-serif'
				]
			},
			screens: {
				'lg-plus': '1025px'
			},
			keyframes: {
				'firefly-1': {
					'0%': {
						transform: 'translate(0, 0)',
						opacity: '0'
					},
					'50%': {
						opacity: '1'
					},
					'100%': {
						transform: 'translate(100px, -100px)',
						opacity: '0'
					}
				},
				'firefly-2': {
					'0%': {
						transform: 'translate(0, 0)',
						opacity: '0'
					},
					'50%': {
						opacity: '1'
					},
					'100%': {
						transform: 'translate(-50px, -80px)',
						opacity: '0'
					}
				},
				'firefly-3': {
					'0%': {
						transform: 'translate(0, 0)',
						opacity: '0'
					},
					'50%': {
						opacity: '1'
					},
					'100%': {
						transform: 'translate(30px, 50px)',
						opacity: '0'
					}
				},
				'electric-zap': {
					'0%, 100%': { opacity: '0.6', filter: 'drop-shadow(0 0 2px rgba(234,179,8,0.3))', transform: 'scale(1)' },
					'50%': { opacity: '1', filter: 'drop-shadow(0 0 12px rgba(234,179,8,1))', transform: 'scale(1.05)' },
				},
				'electric-slow-blink': {
					'0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100%': {
						opacity: '0.92',
						filter: 'drop-shadow(0 0 2px rgba(234,179,8,0.45))',
					},
					'20%, 21.999%, 63%, 63.999%, 65%, 69.999%': {
						opacity: '0.38',
						filter: 'drop-shadow(0 0 0 rgba(234,179,8,0))',
					},
				},
				'electric-flow': {
					'0%': {
						strokeDasharray: '2 42',
						strokeDashoffset: '44',
						opacity: '0.72',
						filter: 'drop-shadow(0 0 1px rgba(234,179,8,0.35))',
					},
					'45%': {
						strokeDasharray: '16 28',
						strokeDashoffset: '0',
						opacity: '1',
						filter: 'drop-shadow(0 0 5px rgba(234,179,8,0.75))',
					},
					'100%': {
						strokeDasharray: '2 42',
						strokeDashoffset: '-44',
						opacity: '0.72',
						filter: 'drop-shadow(0 0 1px rgba(234,179,8,0.35))',
					},
				}
			},
			animation: {
				'firefly-1': 'firefly-1 10s infinite',
				'firefly-2': 'firefly-2 15s infinite',
				'firefly-3': 'firefly-3 12s infinite',
				'electric': 'electric-zap 8s ease-in-out infinite',
				'electric-flow': 'electric-flow 9s ease-in-out infinite',
				'electric-slow-blink': 'electric-slow-blink 8s ease-in-out infinite',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			transitionDuration: {
				'2000': '2000ms',
				'2200': '2200ms',
				'3000': '3000ms',
				'5000': '5000ms',
				'8000': '8000ms',
			},
			transitionTimingFunction: {
				'ease-header': 'cubic-bezier(0.23, 1, 0.32, 1)',
				'ease-login': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
				'ease-tabbar': 'cubic-bezier(0.32, 0.72, 0, 1)',
			},
			colors: {
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
			gold: 'hsl(var(--gold))',
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))'
				}
			}
		}
	},
	darkMode: "class",
	plugins: [require("daisyui"), require("@tailwindcss/typography"), require("tailwindcss-animate")],
	daisyui: {
		themes: [
			{
				light: {
					primary: "#3B82F6",
					"primary-content": "#FFFFFF",
					secondary: "#10B981",
					"secondary-content": "#FFFFFF",
					accent: "#8B5CF6",
					"accent-content": "#FFFFFF",
					neutral: "#1F2933",
					"neutral-content": "#F9FAFB",
					"base-100": "#F9FAFB",
					"base-200": "#F3F4F6",
					"base-300": "#E5E7EB",
					"base-content": "#0B1220",
					info: "#3B82F6",
					"info-content": "#FFFFFF",
					success: "#22C55E",
					"success-content": "#FFFFFF",
					warning: "#FACC15",
					"warning-content": "#0B1220",
					error: "#EF4444",
					"error-content": "#FFFFFF",
				},
				dark: {
					primary: "#3B82F6",
					"primary-content": "#FFFFFF",
					secondary: "#10B981",
					"secondary-content": "#FFFFFF",
					accent: "#8B5CF6",
					"accent-content": "#FFFFFF",
					neutral: "#1F2933",
					"neutral-content": "#F9FAFB",
					"base-100": "#0B1220",
					"base-200": "#111827",
					"base-300": "#1F2933",
					"base-content": "#F9FAFB",
					info: "#3B82F6",
					"info-content": "#FFFFFF",
					success: "#22C55E",
					"success-content": "#FFFFFF",
					warning: "#FACC15",
					"warning-content": "#0B1220",
					error: "#EF4444",
					"error-content": "#FFFFFF",
				},
			},
		],
		darkTheme: "dark",
		base: true,
		styled: false,
		utils: true,
		prefix: "",
		logs: false,
		themeRoot: ":root",
	},
};
export default config;


