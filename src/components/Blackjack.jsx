import React, { useState, useEffect, useRef } from 'react';
import { Shield, RefreshCw, X, Info } from 'lucide-react';

const Blackjack = () => {
  // Game state
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [gameState, setGameState] = useState('playing'); // playing, dealerTurn, result
  const [playerScore, setPlayerScore] = useState(0);
  const [dealerScore, setDealerScore] = useState(0);
  const [message, setMessage] = useState('Your move: Hit or Stand?');
  const [wins, setWins] = useState(0);
  const [discardTokens, setDiscardTokens] = useState(5);
  const [winsUntilRefill, setWinsUntilRefill] = useState(3);
  const [gameHistory, setGameHistory] = useState([]);
  const [playerBlackjack, setPlayerBlackjack] = useState(false);
  const [dealerBlackjack, setDealerBlackjack] = useState(false);
  const [winningStreak, setWinningStreak] = useState(0);
  const [isShuffling, setIsShuffling] = useState(false);
  const [animatingCards, setAnimatingCards] = useState([]);
  const [animationIndex, setAnimationIndex] = useState(0);
  const [selectedCards, setSelectedCards] = useState([]);
  const [showInfo, setShowInfo] = useState(false);
  
  // Direct deck reference to avoid state update issues
  const deckRef = useRef([]);
  const dealtCardsRef = useRef(new Set());
  
  // Create a standard deck of 52 cards
  const createFreshDeck = () => {
    const suits = ['♥', '♦', '♠', '♣'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const newDeck = [];
    
    for (const suit of suits) {
      for (const value of values) {
        newDeck.push({
          suit,
          value,
          hidden: false,
          color: suit === '♥' || suit === '♦' ? 'text-red-600' : 'text-black',
          id: `${value}-${suit}`
        });
      }
    }
    
    return newDeck;
  };
  
  // Shuffle the deck using Fisher-Yates algorithm
  const shuffleDeck = (deck) => {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };
  
  // Start a new round with a fresh deck
  const startNewRound = () => {
    // Clear animation states
    setAnimatingCards([]);
    setIsShuffling(true);
    
    // Clear all hands and selections
    setPlayerHand([]);
    setDealerHand([]);
    setSelectedCards([]);
    setPlayerBlackjack(false);
    setDealerBlackjack(false);
    
    // Create and shuffle a brand new deck
    const freshDeck = createFreshDeck();
    const shuffled = shuffleDeck(freshDeck);
    
    // Reset the deck and dealt cards tracking
    deckRef.current = shuffled;
    dealtCardsRef.current = new Set();
    
    console.log("Starting new round with fresh deck of 52 cards");
    
    // Delay to show shuffling animation
    setTimeout(() => {
      setIsShuffling(false);
      dealInitialCards();
    }, 800);
  };
  
  // Card back pattern component
  const CardBackPattern = () => (
    <div className="absolute inset-0 bg-blue-800 flex items-center justify-center">
      <div className="relative w-full h-full p-1">
        {/* Diamond pattern */}
        <div className="absolute inset-2 border-2 border-blue-300 opacity-50 rounded"></div>
        <div className="absolute inset-4 border-2 border-blue-300 opacity-50 transform rotate-45"></div>
        
        {/* Center elements */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-300 opacity-80 transform rotate-45"></div>
          <div className="absolute w-4 h-4 bg-blue-300 opacity-50 rounded-full"></div>
        </div>
        
        {/* Corner patterns */}
        <div className="absolute top-1 left-1 w-3 h-3 border-2 border-blue-300 opacity-70 transform rotate-45"></div>
        <div className="absolute top-1 right-1 w-3 h-3 border-2 border-blue-300 opacity-70 transform rotate-45"></div>
        <div className="absolute bottom-1 left-1 w-3 h-3 border-2 border-blue-300 opacity-70 transform rotate-45"></div>
        <div className="absolute bottom-1 right-1 w-3 h-3 border-2 border-blue-300 opacity-70 transform rotate-45"></div>
        
        {/* Small dots */}
        <div className="absolute top-8 left-2 w-1 h-1 bg-blue-300 rounded-full"></div>
        <div className="absolute top-8 right-2 w-1 h-1 bg-blue-300 rounded-full"></div>
        <div className="absolute bottom-8 left-2 w-1 h-1 bg-blue-300 rounded-full"></div>
        <div className="absolute bottom-8 right-2 w-1 h-1 bg-blue-300 rounded-full"></div>
      </div>
    </div>
  );
  
  // Deal initial cards for a new round
  const dealInitialCards = async () => {
    // Deal cards one by one with animation delays
    const pCard1 = dealCardFromDeck(false);
    setPlayerHand([pCard1]);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const dCard1 = dealCardFromDeck(false);
    setDealerHand([dCard1]);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const pCard2 = dealCardFromDeck(false);
    setPlayerHand(prev => [...prev, pCard2]);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const dCard2 = dealCardFromDeck(true);
    setDealerHand(prev => [...prev, dCard2]);
    
    const pInitialHand = [pCard1, pCard2];
    const dInitialHand = [dCard1, dCard2];
    
    // Verify no duplicate cards were dealt
    const dealtCardIds = [pCard1.id, pCard2.id, dCard1.id, dCard2.id];
    const uniqueIds = new Set(dealtCardIds);
    
    if (uniqueIds.size !== dealtCardIds.length) {
      console.error("DUPLICATE DETECTION: Initial cards contain duplicates!", dealtCardIds);
    }
    
    // Calculate initial scores
    const pScore = calculateScore(pInitialHand);
    const dScore = calculateScore([dInitialHand[0]]); // Only count visible dealer card
    
    setPlayerScore(pScore);
    setDealerScore(dScore);
    
    // Check for blackjack
    const pBlackjack = checkBlackjack(pInitialHand);
    setPlayerBlackjack(pBlackjack);
    
    if (pBlackjack) {
      // Reveal dealer's hidden card
      setTimeout(() => {
        const updatedDealerHand = dInitialHand.map(card => ({...card, hidden: false}));
        setDealerHand(updatedDealerHand);
        
        // Check if dealer also has blackjack
        const dBlackjack = checkBlackjack(updatedDealerHand);
        setDealerBlackjack(dBlackjack);
        setDealerScore(calculateScore(updatedDealerHand));
        
        if (dBlackjack) {
          setMessage("Both have Blackjack! It's a push. Your streak continues.");
          setGameState('result');
          setTimeout(startNewRound, 2000);
        } else {
          setMessage('Blackjack! You win!');
          setGameState('result');
          handleWin();
          setTimeout(startNewRound, 2000);
        }
      }, 500);
    } else {
      setGameState('playing');
      setMessage('Your move: Hit or Stand?');
    }
  };
  
  // Deal a single card from the deck
  const dealCardFromDeck = (hidden = false) => {
    // Check if we have cards left
    if (deckRef.current.length === 0) {
      console.error("No cards left in deck! This shouldn't happen.");
      // Create emergency new deck
      deckRef.current = shuffleDeck(createFreshDeck());
      dealtCardsRef.current = new Set();
    }
    
    // Find the first card that hasn't been dealt yet
    let cardIndex = 0;
    let card;
    
    // Find a card that hasn't been dealt yet
    while (cardIndex < deckRef.current.length) {
      const candidate = deckRef.current[cardIndex];
      if (!dealtCardsRef.current.has(candidate.id)) {
        card = {...candidate, hidden, isNew: true};
        dealtCardsRef.current.add(candidate.id);
        
        // Remove card from deck
        deckRef.current.splice(cardIndex, 1);
        
        console.log(`Dealt card: ${card.id}, Remaining in deck: ${deckRef.current.length}`);
        break;
      }
      cardIndex++;
    }
    
    // If all cards have been dealt (shouldn't happen but just in case)
    if (!card) {
      console.error("Could not find an undealt card!");
      // Create emergency new deck
      deckRef.current = shuffleDeck(createFreshDeck());
      dealtCardsRef.current = new Set();
      
      card = {...deckRef.current[0], hidden, isNew: true};
      dealtCardsRef.current.add(card.id);
      deckRef.current.splice(0, 1);
    }
    
    // Trigger animation
    setAnimationIndex(prev => prev + 1);
    
    return card;
  };
  
  // Calculate score for a hand
  const calculateScore = (hand) => {
    if (!hand || hand.length === 0) return 0;
    
    let score = 0;
    let aces = 0;
    
    for (const card of hand) {
      if (!card || card.hidden) continue;
      
      if (['J', 'Q', 'K'].includes(card.value)) {
        score += 10;
      } else if (card.value === 'A') {
        score += 11;
        aces += 1;
      } else {
        score += parseInt(card.value);
      }
    }
    
    // Adjust for aces if score is over 21
    while (score > 21 && aces > 0) {
      score -= 10;
      aces -= 1;
    }
    
    return score;
  };
  
  // Check for blackjack (21 with 2 cards)
  const checkBlackjack = (hand) => {
    return hand.length === 2 && calculateScore(hand) === 21;
  };
  
  // Player action: Hit (draw a card)
  const hit = () => {
    if (gameState !== 'playing') return;
    
    // Can't hit if score is >= 32 (need to discard first)
    if (playerScore >= 32) {
      setMessage('Score too high! Discard cards to get below 32 before hitting again.');
      return;
    }
    
    // Clear selection when hitting
    setSelectedCards([]);
    
    // Deal a new card to player
    const newCard = dealCardFromDeck();
    setPlayerHand(prev => [...prev, newCard]);
    
    // Calculate new score
    const newHand = [...playerHand, newCard];
    const newScore = calculateScore(newHand);
    setPlayerScore(newScore);
    
    // Check if player is bust
    if (newScore > 21) {
      if (newScore >= 32) {
        setMessage('Bust! Score is over 32. Discard cards to continue hitting.');
      } else {
        setMessage('Bust! You can discard cards or stand to end your turn.');
      }
    }
  };
  
  // Player action: Stand (end turn)
  const stand = () => {
    if (gameState !== 'playing') return;
    
    // Clear selection when standing
    setSelectedCards([]);
    
    // Check if player is bust
    if (playerScore > 21) {
      // Player busts and loses
      setMessage('Bust! Your winning streak has ended.');
      
      // Reveal dealer's hidden card
      setTimeout(() => {
        const revealedDealerHand = dealerHand.map(card => ({...card, hidden: false}));
        setDealerHand(revealedDealerHand);
        setDealerScore(calculateScore(revealedDealerHand));
        
        setGameState('result');
        addGameToHistory('Dealer', 'Player bust');
        
        // Reset winning streak
        setWinningStreak(0);
        
        // Start new round after delay
        setTimeout(resetAfterLoss, 2000);
      }, 500);
      
      return;
    }
    
    // Change game state to dealer's turn
    setGameState('dealerTurn');
    
    // Reveal dealer's hidden card
    setTimeout(() => {
      const revealedDealerHand = dealerHand.map(card => ({...card, hidden: false}));
      setDealerHand(revealedDealerHand);
      
      const dealerInitialScore = calculateScore(revealedDealerHand);
      setDealerScore(dealerInitialScore);
      
      // Dealer plays
      dealerPlay(revealedDealerHand, dealerInitialScore);
    }, 500);
  };
  
  // Dealer plays their turn
  const dealerPlay = (currentHand, currentScore) => {
    let dealerCurrentHand = [...currentHand];
    let dealerCurrentScore = currentScore;
    
    // Dealer draws cards until they have 17 or more
    const dealerDrawSequence = async () => {
      while (dealerCurrentScore < 17) {
        await new Promise(resolve => setTimeout(resolve, 600));
        
        // Dealer draws a card
        const newCard = dealCardFromDeck();
        dealerCurrentHand = [...dealerCurrentHand, newCard];
        setDealerHand(dealerCurrentHand);
        
        dealerCurrentScore = calculateScore(dealerCurrentHand);
        setDealerScore(dealerCurrentScore);
      }
      
      // Determine the winner
      determineWinner(dealerCurrentScore);
    };
    
    dealerDrawSequence();
  };
  
  // Determine who won the round
  const determineWinner = (finalDealerScore) => {
    setTimeout(() => {
      if (finalDealerScore > 21) {
        // Dealer busts, player wins
        setMessage('Dealer busts! You win!');
        handleWin();
        addGameToHistory('Player', 'Dealer bust');
      } else if (finalDealerScore > playerScore) {
        // Dealer has higher score, player loses
        setMessage('Dealer wins! Your winning streak has ended.');
        addGameToHistory('Dealer', 'Higher score');
        setWinningStreak(0);
        setTimeout(resetAfterLoss, 2000);
      } else if (finalDealerScore < playerScore) {
        // Player has higher score, player wins
        setMessage('You win!');
        handleWin();
        addGameToHistory('Player', 'Higher score');
      } else {
        // Same score, it's a push
        setMessage("It's a push! Your streak continues.");
        addGameToHistory('Push', 'Equal scores');
        setTimeout(startNewRound, 2000);
      }
      
      setGameState('result');
    }, 800);
  };
  
  // Handle player win
  const handleWin = () => {
    // Increase score and winning streak
    const newWins = wins + 1;
    const newStreak = winningStreak + 1;
    
    setWins(newWins);
    setWinningStreak(newStreak);
    
    // Check if player earned new discard tokens
    let newWinsUntilRefill = winsUntilRefill - 1;
    let newDiscardTokens = discardTokens;
    
    if (newWinsUntilRefill <= 0) {
      newDiscardTokens += 5;
      newWinsUntilRefill = 3;
      setMessage(prevMessage => `${prevMessage} You earned 5 discard tokens!`);
    }
    
    setWinsUntilRefill(newWinsUntilRefill);
    setDiscardTokens(newDiscardTokens);
    
    // Start new round after delay
    setTimeout(startNewRound, 2000);
  };
  
  // Reset game after a loss
  const resetAfterLoss = () => {
    setWins(0);
    setWinningStreak(0);
    startNewRound();
  };
  
  // Add game to history
  const addGameToHistory = (winner, reason) => {
    const newHistory = [
      { 
        winner, 
        reason, 
        playerScore: playerScore, 
        dealerScore: dealerScore,
        playerHand: [...playerHand], 
        dealerHand: [...dealerHand].map(card => ({...card, hidden: false}))
      },
      ...gameHistory
    ].slice(0, 10); // Keep only the 10 most recent games
    
    setGameHistory(newHistory);
  };
  
  // Toggle card selection
  const toggleCardSelection = (index) => {
    if (gameState !== 'playing') return;
    
    setSelectedCards(prev => {
      // If card is already selected, remove it
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } 
      // Otherwise add it to selection
      else {
        return [...prev, index];
      }
    });
  };
  
  // Discard selected card
  const discardSelectedCard = () => {
    if (gameState !== 'playing' || discardTokens <= 0 || selectedCards.length !== 1) return;
    
    const index = selectedCards[0];
    const newHand = [...playerHand];
    const discardedCard = newHand.splice(index, 1)[0];
    
    // Animation for card going back to deck
    setAnimatingCards([{ 
      ...discardedCard, 
      id: Date.now(),
      type: 'discard'
    }]);
    
    setTimeout(() => {
      setAnimatingCards([]);
    }, 600);
    
    setPlayerHand(newHand);
    setSelectedCards([]);
    
    const newScore = calculateScore(newHand);
    setPlayerScore(newScore);
    
    setDiscardTokens(discardTokens - 1);
    
    if (newScore > 21) {
      if (newScore >= 32) {
        setMessage('Still bust! Score is over 32. Discard more cards to continue hitting.');
      } else {
        setMessage('Still bust, but you can hit again! Score is below 32.');
      }
    } else {
      setMessage('Card discarded! Your move: Hit or Stand?');
    }
  };
  
  // Toggle info panel
  const toggleInfo = () => {
    setShowInfo(!showInfo);
  };
  
  // Debug function to check current game state
  useEffect(() => {
    if (playerHand.length > 0 || dealerHand.length > 0) {
      const allCardIds = [
        ...playerHand.filter(c => c).map(c => c.id),
        ...dealerHand.filter(c => c).map(c => c.id)
      ].filter(id => id); // Filter out any undefined IDs
      
      const uniqueCardIds = new Set(allCardIds);
      
      // Log current state
      console.log("Game state:", {
        playerCards: playerHand.filter(c => c).map(c => c.id),
        dealerCards: dealerHand.filter(c => c).map(c => c.id),
        remainingCards: deckRef.current.length,
        usedCards: dealtCardsRef.current.size
      });
      
      // Check for duplicate cards
      if (uniqueCardIds.size !== allCardIds.length) {
        console.error("DUPLICATE CARDS DETECTED IN PLAY!");
        
        // Find which cards are duplicated
        const cardCounts = {};
        allCardIds.forEach(id => {
          cardCounts[id] = (cardCounts[id] || 0) + 1;
        });
        
        const duplicates = Object.entries(cardCounts)
          .filter(([_, count]) => count > 1)
          .map(([id]) => id);
        
        console.error("Duplicate cards:", duplicates);
      }
    }
  }, [playerHand, dealerHand]);
  
  // Remove animation flag from cards
  useEffect(() => {
    if (playerHand.length > 0 || dealerHand.length > 0) {
      const timer = setTimeout(() => {
        if (playerHand.some(card => card && card.isNew)) {
          setPlayerHand(prevHand => 
            prevHand.map(card => card ? { ...card, isNew: false } : card)
          );
        }
        if (dealerHand.some(card => card && card.isNew)) {
          setDealerHand(prevHand => 
            prevHand.map(card => card ? { ...card, isNew: false } : card)
          );
        }
      }, 600);
      
      return () => clearTimeout(timer);
    }
  }, [playerHand, dealerHand, animationIndex]);
  
  // Initialize the game
  useEffect(() => {
    console.log("Initializing new game");
    startNewRound();
    
    // Add error listener
    window.addEventListener('error', (event) => {
      console.error('Caught error:', event.message);
    });
    
    return () => {
      window.removeEventListener('error', () => {});
    };
  }, []);
  
  // Render a card
  const renderCard = (card, index, hand) => {
    if (!card) return null;
    
    const isPlayerHand = hand === 'player';
    const isNewCard = card.isNew || false;
    const isSelected = isPlayerHand && selectedCards.includes(index);
    const isHidden = card.hidden;
    
    // Calculate tilt angle for player cards
    const getTilt = () => {
      if (!isPlayerHand) return 'rotate-0';
      
      const tiltDirection = index % 2 === 0 ? -1 : 1;
      const tiltAmount = Math.max(1, Math.min(3, Math.abs(index - (playerHand.length - 1)/2))) * tiltDirection;
      
      return `rotate-[${tiltAmount}deg]`;
    };
    
    return (
      <div 
        key={`${hand}-${card.id || index}`}
        onClick={() => isPlayerHand && gameState === 'playing' && toggleCardSelection(index)}
        className={`relative flex items-center justify-center w-16 h-24 border-2 border-gray-300 rounded-lg shadow-md overflow-hidden
          ${isPlayerHand && gameState === 'playing' ? 'cursor-pointer hover:border-blue-500' : ''} 
          ${isSelected ? 'border-yellow-400 border-4' : ''}
          ${getTilt()}
          ${isNewCard ? 'animate-deal' : ''}
          transition-all duration-150`}
        style={{ 
          margin: '-0.5rem',
          transformOrigin: 'center bottom',
          transform: `${isSelected ? 'translateY(-10px)' : 'translateY(0)'} ${isPlayerHand ? `rotate(${index % 2 === 0 ? -1 : 1}deg)` : 'rotate(0)'}`,
          zIndex: isSelected ? 10 : index
        }}
      >
        {/* Card face */}
        <div className={`absolute inset-0 flex items-center justify-center bg-white ${isHidden ? 'hidden' : ''}`}>
          <div className={`flex flex-col items-center ${card.color}`}>
            <div className="text-xl font-bold">{card.value}</div>
            <div className="text-2xl">{card.suit}</div>
          </div>
        </div>
        
        {/* Card back with pattern */}
        {isHidden && <CardBackPattern />}
      </div>
    );
  };
  
  // Info Panel Component
  const InfoPanel = () => (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-green-900 rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Modified Blackjack Rules</h2>
          <button 
            onClick={toggleInfo}
            className="text-white hover:text-yellow-300"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="text-white space-y-4">
          <div>
            <h3 className="text-xl font-semibold mb-2 text-yellow-300">Game Objective</h3>
            <p>Get a hand value closer to 21 than the dealer without going over. Build a winning streak to earn points.</p>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-2 text-yellow-300">Deck & Dealing</h3>
            <p>A standard 52-card deck is used and reshuffled after each round. Cards are dealt from the same deck to both player and dealer.</p>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-2 text-yellow-300">Special Rules</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li><span className="font-bold">Discard System:</span> You have a limited number of discard tokens (starting with 5).</li>
              <li><span className="font-bold">Discard Refill:</span> Every 3 wins, you earn 5 more discard tokens.</li>
              <li><span className="font-bold">Winning Streak:</span> Game continues until you lose to the dealer, which resets your score to 0.</li>
              <li><span className="font-bold">Over-Bust Rule:</span> If your score is over 21 but under 32, you can still hit after discarding.</li>
              <li><span className="font-bold">Hard Bust:</span> If your score is 32 or higher, you cannot hit until discarding to get below 32.</li>
              <li><span className="font-bold">Card Selection:</span> Select a card by clicking on it, then use the discard button to remove it.</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-2 text-yellow-300">Standard Blackjack Rules</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Cards 2-10 are worth their face value</li>
              <li>Face cards (J, Q, K) are worth 10</li>
              <li>Aces are worth 11, but convert to 1 if the hand would bust</li>
              <li>Dealer must hit on 16 or less and stand on 17 or more</li>
              <li>Blackjack (an Ace and a 10-value card) beats all other 21-point hands</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center p-4 bg-green-800 text-white min-h-screen w-full">
      <style jsx global>{`
        @keyframes dealCard {
          0% {
            opacity: 0;
            transform: translateY(-100px) scale(0.5);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes discardCard {
          0% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(100px) rotate(180deg) scale(0.5);
          }
        }
        @keyframes shuffle {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(-5deg) translateY(-5px); }
          50% { transform: rotate(0deg); }
          75% { transform: rotate(5deg) translateY(-5px); }
          100% { transform: rotate(0deg); }
        }
        .animate-deal {
          animation: dealCard 0.5s ease-out;
        }
        .animate-discard {
          animation: discardCard 0.5s ease-in;
        }
        .animate-shuffle {
          animation: shuffle 0.8s ease-in-out;
        }
      `}</style>
      
      <div className="flex items-center mb-2">
        <h1 className="text-3xl font-bold">Blackjack</h1>
        <button 
          onClick={toggleInfo}
          className="ml-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-full p-1 transition-colors"
          title="Game Rules"
        >
          <Info size={20} />
        </button>
      </div>
      
      {/* Scoreboard */}
      <div className="flex justify-between w-full max-w-2xl mb-4">
        <div className="bg-blue-900 p-2 rounded-lg">
          <div className="font-bold">Current Score</div>
          <div className="text-2xl">{wins}</div>
        </div>
        
        <div className="bg-blue-900 p-2 rounded-lg">
          <div className="font-bold">Winning Streak</div>
          <div className="text-2xl">{winningStreak}</div>
        </div>
        
        <div className="bg-blue-900 p-2 rounded-lg">
          <div className="font-bold">Discard Tokens</div>
          <div className="text-2xl">{discardTokens}</div>
        </div>
        
        <div className="bg-blue-900 p-2 rounded-lg">
          <div className="font-bold">Wins Until Refill</div>
          <div className="text-2xl">{winsUntilRefill}</div>
        </div>
      </div>
      
      {/* Game area */}
      <div className="w-full max-w-2xl bg-green-700 rounded-lg p-4 shadow-lg mb-4 relative">
        {/* Deck visualization - moved to bottom left corner */}
        <div 
          className={`absolute bottom-4 left-4 w-12 h-20 border-2 border-white rounded-lg shadow-md overflow-hidden ${isShuffling ? 'animate-shuffle' : ''}`}
        >
          {/* Card stack effect */}
          <div className="absolute inset-0 rounded-lg" style={{ transform: 'rotate(2deg)' }}>
            <CardBackPattern />
          </div>
          <div className="absolute inset-0 rounded-lg" style={{ transform: 'rotate(-2deg)' }}>
            <CardBackPattern />
          </div>
          <div className="absolute inset-0 rounded-lg">
            <CardBackPattern />
          </div>
          <div className="absolute bottom-0 left-0 text-xs text-white p-1 z-10">
            {deckRef.current.length}
          </div>
        </div>
        
        {/* Dealer area */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <h2 className="text-xl font-bold">Dealer</h2>
            <div className="bg-white text-black px-2 rounded">Score: {dealerScore}</div>
          </div>
          
          <div className="flex justify-center">
            {dealerHand.filter(card => card).map((card, index) => renderCard(card, index, 'dealer'))}
          </div>
        </div>
        
        {/* Message area */}
        <div className="text-center py-2 mb-4 bg-green-900 rounded-lg">
          <p className="text-xl">{message}</p>
        </div>
        
        {/* Player area */}
        <div>
          <div className="flex justify-between mb-2">
            <h2 className="text-xl font-bold">Player</h2>
            <div className={`px-2 rounded ${playerScore > 21 ? 'bg-red-500' : 'bg-white text-black'}`}>
              Score: {playerScore} {playerScore > 21 && '(Bust)'}
            </div>
          </div>
          
          <div className="flex justify-center">
            {playerHand.filter(card => card).map((card, index) => renderCard(card, index, 'player'))}
          </div>
        </div>
        
        {/* Animating cards overlay */}
        {animatingCards.map(card => (
          <div 
            key={card.id}
            className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-16 h-24 bg-white border-2 border-gray-300 rounded-lg shadow-md animate-discard`}
          >
            <div className={`flex flex-col items-center ${card.color}`}>
              <div className="text-xl font-bold">{card.value}</div>
              <div className="text-2xl">{card.suit}</div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Controls */}
      <div className="flex justify-center space-x-4 mb-6">
        {gameState === 'playing' && (
          <>
            <button
              onClick={hit}
              disabled={playerScore >= 32}
              className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none transition-transform active:scale-95 ${playerScore >= 32 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Hit
            </button>
            <button
              onClick={stand}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none transition-transform active:scale-95"
            >
              Stand
            </button>
            <button
              onClick={discardSelectedCard}
              disabled={discardTokens <= 0 || selectedCards.length !== 1}
              className={`flex items-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none transition-transform active:scale-95 ${(discardTokens <= 0 || selectedCards.length !== 1) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Shield size={16} className="mr-1" /> Discard ({discardTokens})
            </button>
            {selectedCards.length > 0 && (
              <div className="text-white">
                {selectedCards.length === 1 ? "1 card selected" : `${selectedCards.length} cards selected`}
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Selected cards count */}
      {gameState === 'playing' && selectedCards.length > 1 && (
        <div className="text-yellow-400 mb-4">
          Select only 1 card to discard
        </div>
      )}
      
      {/* Game history */}
      {gameHistory.length > 0 && (
        <div className="w-full max-w-2xl">
          <h2 className="text-xl font-bold mb-2">Game History</h2>
          <div className="bg-gray-800 rounded-lg p-2 max-h-40 overflow-y-auto">
            {gameHistory.map((game, index) => (
              <div key={index} className="border-b border-gray-700 py-1 flex justify-between text-sm">
                <div className={game.winner === 'Player' ? 'text-green-400' : game.winner === 'Dealer' ? 'text-red-400' : 'text-yellow-400'}>
                  {game.winner} {game.winner !== 'Push' && 'wins'} ({game.reason})
                </div>
                <div>
                  Player: {game.playerScore} | Dealer: {game.dealerScore}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Info Panel */}
      {showInfo && <InfoPanel />}
    </div>
  );
};

export default Blackjack;
