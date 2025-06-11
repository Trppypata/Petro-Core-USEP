const { fontFamily } = require("tailwindcss/defaultTheme")

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [ 
		"./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
	],
  theme: {
  	container: {
  		center: 'true',
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
        // Rock type specific colors
        igneous: {
          DEFAULT: 'hsl(var(--igneous))',
          bg: 'hsl(var(--igneous-bg))',
          accent: 'hsl(var(--igneous-accent))'
        },
        metamorphic: {
          DEFAULT: 'hsl(var(--metamorphic))',
          bg: 'hsl(var(--metamorphic-bg))',
          accent: 'hsl(var(--metamorphic-accent))'
        },
        sedimentary: {
          DEFAULT: 'hsl(var(--sedimentary))',
          bg: 'hsl(var(--sedimentary-bg))',
          accent: 'hsl(var(--sedimentary-accent))'
        },
        ore: {
          DEFAULT: 'hsl(var(--ore))',
          bg: 'hsl(var(--ore-bg))',
          accent: 'hsl(var(--ore-accent))'
        },
        // Geology-inspired color palette
        moss: {
          50: '#f0f7f0',
          100: '#dceadc',
          200: '#bfd6bf',
          300: '#9aba9a',
          400: '#77a078',
          500: '#5e865f',
          600: '#4a6a4b',
          700: '#3b543c',
          800: '#314431',
          900: '#2a392a',
          950: '#1a211a'
        },
        sage: {
          50: '#f3f7f2',
          100: '#e6efe3',
          200: '#cedecb',
          300: '#afc5ab',
          400: '#8aa686',
          500: '#6f8e6a',
          600: '#587255',
          700: '#465b45',
          800: '#3a4b39',
          900: '#334133',
          950: '#1a231a'
        },
        earth: {
          50: '#f9f7f2',
          100: '#f1ebe0',
          200: '#e4d7c1',
          300: '#d3bc9c',
          400: '#c3a179',
          500: '#b78b60',
          600: '#aa7553',
          700: '#8e5d45',
          800: '#744c3d',
          900: '#604035',
          950: '#341f1a'
        }
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		fontFamily: {
  			sans: ["var(--Inter)", ...fontFamily.sans]
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
