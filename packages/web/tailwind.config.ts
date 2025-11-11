import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'node-intent': '#9333ea',      // purple-600
        'node-subintent': '#2563eb',   // blue-600
        'node-feature': '#16a34a',     // green-600
        'node-task': '#ea580c',        // orange-600
        'node-uxspec': '#db2777',      // pink-600
      },
    },
  },
  plugins: [],
}

export default config
