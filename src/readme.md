# Blackjack Game

A modern implementation of Blackjack with a twist! This game includes special mechanics such as card discarding, winning streaks, and more.

## Features

- Classic Blackjack rules with modern extensions
- Discard mechanic: Use tokens to discard cards when your hand is unfavorable
- Streak system: Build up a winning streak to earn points and tokens
- Over-bust protection: If your score is over 21 but under 32, you can still hit after discarding
- Animated card dealing and UI
- Game history tracking

## How to Play

1. Start with the standard goal of reaching 21 without going over
2. You can Hit (draw cards) or Stand (end your turn)
3. Use the Discard feature to remove cards when needed:
   - Click on a card to select it
   - Click the Discard button to remove it
   - Each discard costs 1 token
4. Special rules:
   - If your score reaches 32 or more, you must discard before hitting again
   - Every 3 wins earns you 5 more discard tokens
   - Game continues until you lose, building a winning streak

## Development

This project is built with:
- React
- Vite
- Tailwind CSS
- Lucide React for icons

## Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deploying to Cloudflare Pages

This project is optimized for deployment on Cloudflare Pages:

1. Push your code to a GitHub repository
2. In Cloudflare Pages dashboard, create a new project and connect to your repository
3. Use the following build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Node.js version: 16 (or newer)

## License

MIT
