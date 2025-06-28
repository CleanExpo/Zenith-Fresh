const { fontFamily } = require("tailwindcss/defaultTheme")

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}'
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '2rem',
        lg: '4rem',
        xl: '5rem',
        '2xl': '6rem',
      },
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
        // Extended status colors
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))'
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))'
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))'
        },
        // Chart colors
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
        '3xl': 'calc(var(--radius) + 12px)',
      },
      fontFamily: {
        sans: ["Inter", "var(--font-sans)", ...fontFamily.sans],
        mono: ["JetBrains Mono", ...fontFamily.mono],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        '144': '36rem',
      },
      height: {
        'header': 'var(--header-height)',
        'sidebar': 'calc(100vh - var(--header-height))',
        'content': 'calc(100vh - var(--header-height))',
      },
      width: {
        'sidebar': 'var(--sidebar-width)',
        'sidebar-collapsed': 'var(--sidebar-collapsed-width)',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      backdropBlur: {
        xs: '2px',
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-brand': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-success': 'linear-gradient(135deg, #11f460 0%, #0b8043 100%)',
        'gradient-warning': 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)',
        'gradient-danger': 'linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)',
      },
      boxShadow: {
        'glass': 'var(--glass-shadow)',
        'glow': 'var(--shadow-glow)',
        'inner-lg': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.1)',
      },
      dropShadow: {
        'glow': [
          '0 0px 20px rgb(59 130 246 / 0.35)',
          '0 0px 65px rgb(59 130 246 / 0.2)'
        ]
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        },
        'fadeIn': {
          from: { opacity: '0' },
          to: { opacity: '1' }
        },
        'slideUp': {
          from: { 
            opacity: '0', 
            transform: 'translateY(20px)' 
          },
          to: { 
            opacity: '1', 
            transform: 'translateY(0)' 
          }
        },
        'slideDown': {
          from: { 
            opacity: '0', 
            transform: 'translateY(-20px)' 
          },
          to: { 
            opacity: '1', 
            transform: 'translateY(0)' 
          }
        },
        'scaleIn': {
          from: { 
            opacity: '0', 
            transform: 'scale(0.9)' 
          },
          to: { 
            opacity: '1', 
            transform: 'scale(1)' 
          }
        },
        'bounceIn': {
          '0%': { 
            opacity: '0', 
            transform: 'scale(0.3)' 
          },
          '50%': { 
            opacity: '1', 
            transform: 'scale(1.05)' 
          },
          '70%': { 
            transform: 'scale(0.9)' 
          },
          '100%': { 
            opacity: '1', 
            transform: 'scale(1)' 
          }
        },
        'float': {
          '0%, 100%': { 
            transform: 'translateY(0px)' 
          },
          '50%': { 
            transform: 'translateY(-10px)' 
          }
        },
        'pulseGlow': {
          '0%, 100%': { 
            boxShadow: '0 0 5px hsl(var(--primary) / 0.5)'
          },
          '50%': { 
            boxShadow: '0 0 20px hsl(var(--primary) / 0.8)'
          }
        },
        'shimmer': {
          '0%': { 
            backgroundPosition: '-200% 0' 
          },
          '100%': { 
            backgroundPosition: '200% 0' 
          }
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' }
        },
        'ping-slow': {
          '75%, 100%': {
            transform: 'scale(2)',
            opacity: '0'
          }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'bounce-in': 'bounceIn 0.6s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        'spin-slow': 'spin-slow 3s linear infinite',
        'ping-slow': 'ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      transitionDuration: {
        '2000': '2000ms',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      }
    }
  },
  plugins: [
    require('tailwindcss-animate'),
    // Custom plugin for additional utilities
    function({ addUtilities, theme, e }) {
      const utilities = {
        '.text-gradient': {
          'background': `linear-gradient(135deg, ${theme('colors.primary.DEFAULT')}, ${theme('colors.accent.DEFAULT')})`,
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        '.glass-morphism': {
          'background': 'var(--glass-bg)',
          'backdrop-filter': 'blur(20px)',
          '-webkit-backdrop-filter': 'blur(20px)',
          'border': '1px solid var(--glass-border)',
          'box-shadow': 'var(--glass-shadow)',
        },
        '.card-elevated': {
          'background-color': theme('colors.card.DEFAULT'),
          'border': `1px solid ${theme('colors.border')}`,
          'border-radius': theme('borderRadius.lg'),
          'box-shadow': theme('boxShadow.lg'),
          'transition-property': 'all',
          'transition-duration': '300ms',
          '&:hover': {
            'box-shadow': theme('boxShadow.xl'),
          }
        },
        '.loading-shimmer': {
          'background': `linear-gradient(90deg, transparent 0%, ${theme('colors.muted.foreground')}1a 50%, transparent 100%)`,
          'background-size': '200% 100%',
          'animation': 'shimmer 2s infinite',
        }
      }
      addUtilities(utilities)
    }
  ]
};
