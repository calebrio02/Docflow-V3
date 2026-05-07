/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            '--tw-prose-body': '#1e293b',
            '--tw-prose-headings': '#0f172a',
            '--tw-prose-bold': '#0f172a',
            '--tw-prose-links': '#2563eb',
            '--tw-prose-code': '#0f172a',
            '--tw-prose-quotes': '#475569',
            'code::before': { content: '""' },
            'code::after': { content: '""' },
            pre: {
              backgroundColor: '#f1f5f9',
              borderRadius: '0.5rem',
              padding: '1rem',
              margin: '1rem 0',
              overflow: 'auto',
            },
            code: {
              backgroundColor: '#f1f5f9',
              paddingLeft: '0.25rem',
              paddingRight: '0.25rem',
              paddingTop: '0.125rem',
              paddingBottom: '0.125rem',
              borderRadius: '0.25rem',
              fontWeight: '500',
            },
            blockquote: {
              borderLeftWidth: '3px',
              borderLeftColor: '#cbd5e1',
              fontStyle: 'italic',
            },
            hr: {
              borderColor: '#e2e8f0',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
