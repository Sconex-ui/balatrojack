# Balatrojack

A modern implementation of Blackjack with a twist! This game includes special mechanics such as card discarding, winning streaks, and tarot card powers.

## Features

- Classic Blackjack rules with modern extensions
- Discard mechanic: Use tokens to discard cards when your hand is unfavorable
- Tarot card system: Earn and use powerful cards with special abilities
- Streak system: Build up a winning streak to earn points and tokens
- Shop system: Spend coins to buy new cards, tarot abilities, and discard tokens
- Over-bust protection: If your score is over 21 but under 32, you can still hit after discarding
- Animated card dealing and UI
- Game history tracking
- Debug mode for testing

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
   - Every 5 wins earns you a tarot card if you have space
   - Game continues until you lose, building a winning streak
   - Earn coins for winning rounds, with a bonus if you don't use discards

## Tarot Card System

- **Death Card**: Transform a card into another card (select two cards, left transforms into right)
- **Hanged Man Card**: Remove two selected cards completely from your hand and the deck
- Tarot cards can be earned through wins or purchased from the shop
- You can have up to 2 tarot cards at any time
- Use a tarot card by clicking it or dragging it to your play area

## Shop System

The shop allows you to spend coins to improve your deck and abilities:

- Purchase new cards to add to your deck (2 coins, Aces cost 4)
- Buy tarot cards with special abilities (5 coins)
- Replenish discard tokens (3 coins per token)
- Shop refreshes after each win

## Development

This project is built with:
- React
- Vite
- Tailwind CSS
- Lucide React for icons

### Running Locally

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

### Debug Mode

The game includes a developer debug mode that can be accessed by importing the `BlackjackDebug` component. This feature allows you to:

- Add specific cards to your hand
- Add tarot cards to your inventory
- Add discard tokens
- Increase your win count
- Test different game scenarios

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
