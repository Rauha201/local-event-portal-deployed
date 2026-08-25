// Shared design tokens for the whole site. Loaded once, after the
// Tailwind CDN script, in the <head> of every page — so all three
// pages draw from one palette instead of three copy-pasted configs.
//
// Palette is "dusk market at sundown": a deep teal-charcoal night
// sky, warm kraft-paper card stock, and an ember/marigold glow —
// built around the idea that every listing is a printed ticket
// stub pinned to a community board.

tailwind.config = {
  theme: {
    extend: {
      colors: {
        dusk: '#20302B',      // night-sky backdrop: hero + footer
        cloth: '#FBF8F3',     // page background
        paper: '#F1E6D2',     // ticket / index-card stock
        ember: {
          DEFAULT: '#E1591C', // primary accent: CTAs, prices
          600: '#C74710',
          100: '#FBDCC9'
        },
        marigold: {
          DEFAULT: '#F0A63A', // secondary accent: ratings, glow
          100: '#FCEACB'
        },
        moss: {
          DEFAULT: '#4B6A4E', // tertiary accent: category tags
          100: '#DCE6DD'
        },
        ink: '#2B211B'        // body text
      },
      fontFamily: {
        display: ['Fraunces', 'ui-serif', 'serif'],
        body: ['Karla', 'ui-sans-serif', 'system-ui'],
        stub: ['"Space Mono"', 'ui-monospace', 'monospace']
      }
    }
  }
};
