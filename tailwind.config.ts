import type { Config } from "tailwindcss";

const config: Config = {
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			fontFamily: {
				sans: [
					'var(--font-inter)',
					'sans-serif'
				],
				heading: [
					'var(--font-outfit)',
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
				}
			},
			animation: {
				'firefly-1': 'firefly-1 10s infinite',
				'firefly-2': 'firefly-2 15s infinite',
				'firefly-3': 'firefly-3 12s infinite'
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
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
		styled: true,
		utils: true,
		prefix: "",
		logs: true,
		themeRoot: ":root",
	},
};
export default config;


