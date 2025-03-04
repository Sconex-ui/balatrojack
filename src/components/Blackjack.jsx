import React, { useState, useEffect, useRef } from 'react';
import { Shield, RefreshCw, X, Info, Award, Trash2 } from 'lucide-react';

const Blackjack = () => {
  // Game state
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [gameState, setGameState] = useState('playing'); // playing, dealerTurn, result, tarotSelection
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
  
  // Tarot-specific state
  const [tarotDrawCounter, setTarotDrawCounter] = useState(5);
  const [availableTarotCards, setAvailableTarotCards] = useState([]);
  const [consumableSlots, setConsumableSlots] = useState([null, null]);
  const [showTarotSelection, setShowTarotSelection] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedCardIndex, setDraggedCardIndex] = useState(null);
  const [dragSourceType, setDragSourceType] = useState(null); // 'player' or 'consumable'
  const [draggedTarotCardIndex, setDraggedTarotCardIndex] = useState(null);
  const [draggedCard, setDraggedCard] = useState(null); // Store the card being dragged
  
  // Define tarot cards
  const tarotCardDefinitions = [
    {
      id: 'death',
      name: 'Death',
      effect: 'transform',
      description: 'Transform the left selected card into the right selected card.',
      image: 'death'
    },
    {
      id: 'hanged-man',
      name: 'The Hanged Man',
      effect: 'remove',
      description: 'Remove two selected cards completely from your hand.',
      image: 'hanged-man'
    }
  ];
  
  // Direct deck reference to avoid state update issues
  const deckRef = useRef([]);
  const dealtCardsRef = useRef(new Set());
  const removedCardsRef = useRef(new Set()); // Track permanently removed cards
  
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
  
  // Draw 10 random tarot cards for selection
  const drawTarotSelection = () => {
    // For now, just shuffle and present the tarot definitions we have (limited to 2 for this implementation)
    // This would be enhanced in a full version with more tarot cards
    setAvailableTarotCards(shuffleDeck([...tarotCardDefinitions]));
    setGameState('tarotSelection');
    setShowTarotSelection(true);
  };
  
  // Add tarot card to consumable slot
  const selectTarotCard = (tarotCard) => {
    const emptySlotIndex = consumableSlots.findIndex(slot => slot === null);
    
    if (emptySlotIndex !== -1) {
      const newSlots = [...consumableSlots];
      newSlots[emptySlotIndex] = tarotCard;
      setConsumableSlots(newSlots);
      
      // Close tarot selection and continue game
      setShowTarotSelection(false);
      setGameState('playing');
      startNewRound();
    } else {
      setMessage("Consumable slots are full! You must use a tarot card before getting another.");
    }
  };
  
  // Use tarot card from consumable slot
  const useTarotCard = (slotIndex) => {
    const tarotCard = consumableSlots[slotIndex];
    
    if (!tarotCard) return;
    
    if (tarotCard.id === 'death') {
      // Death card - transform left selected card into right selected card
      if (selectedCards.length === 2) {
        const sortedSelection = [...selectedCards].sort((a, b) => a - b);
        const [leftCardIndex, rightCardIndex] = sortedSelection;
        
        // Get the card to duplicate (right card)
        const rightCard = playerHand[rightCardIndex];
        
        // Create a new player hand with the transformation
        const newHand = [...playerHand];
        newHand[leftCardIndex] = {...rightCard, id: `${rightCard.id}-${Date.now()}`}; // ensure unique ID
        
        setPlayerHand(newHand);
        setSelectedCards([]);
        
        // Calculate new score
        const newScore = calculateScore(newHand);
        setPlayerScore(newScore);
        
        // Remove the used tarot card
        const newSlots = [...consumableSlots];
        newSlots[slotIndex] = null;
        setConsumableSlots(newSlots);
        
        setMessage('Death card used! Left card transformed into right card.');
      } else {
        setMessage('Death card requires exactly 2 selected cards. Select left and right cards.');
      }
    } else if (tarotCard.id === 'hanged-man') {
      // Hanged Man card - remove 2 selected cards completely
      if (selectedCards.length === 2) {
        // Sort indices in descending order to avoid shifting issues when removing
        const sortedSelection = [...selectedCards].sort((a, b) => b - a);
        
        // Store the cards being removed to track them
        const cardsToRemove = sortedSelection.map(index => playerHand[index]);
        
        // Add cards to the permanently removed set
        cardsToRemove.forEach(card => {
          removedCardsRef.current.add(card.id);
        });
        
        // Create a new player hand without the selected cards
        const newHand = [...playerHand];
        sortedSelection.forEach(index => {
          newHand.splice(index, 1);
        });
        
        setPlayerHand(newHand);
        setSelectedCards([]);
        
        // Calculate new score
        const newScore = calculateScore(newHand);
        setPlayerScore(newScore);
        
        // Remove the used tarot card
        const newSlots = [...consumableSlots];
        newSlots[slotIndex] = null;
        setConsumableSlots(newSlots);
        
        setMessage('Hanged Man card used! Two cards removed from your hand and the deck.');
      } else {
        setMessage('Hanged Man card requires exactly 2 selected cards.');
      }
    }
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
    
    // Reset the deck and dealt cards tracking, but maintain removed cards
    deckRef.current = shuffled;
    dealtCardsRef.current = new Set();
    
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
          <div className="w-8 h-8 border-2 border-blue-300 opacity-80 transform rotate-45"></div>
          <div className="absolute w-6 h-6 bg-blue-300 opacity-50 rounded-full"></div>
        </div>
        
        {/* Corner patterns */}
        <div className="absolute top-2 left-2 w-4 h-4 border-2 border-blue-300 opacity-70 transform rotate-45"></div>
        <div className="absolute top-2 right-2 w-4 h-4 border-2 border-blue-300 opacity-70 transform rotate-45"></div>
        <div className="absolute bottom-2 left-2 w-4 h-4 border-2 border-blue-300 opacity-70 transform rotate-45"></div>
        <div className="absolute bottom-2 right-2 w-4 h-4 border-2 border-blue-300 opacity-70 transform rotate-45"></div>
        
        {/* Small dots */}
        <div className="absolute top-12 left-3 w-2 h-2 bg-blue-300 rounded-full"></div>
        <div className="absolute top-12 right-3 w-2 h-2 bg-blue-300 rounded-full"></div>
        <div className="absolute bottom-12 left-3 w-2 h-2 bg-blue-300 rounded-full"></div>
        <div className="absolute bottom-12 right-3 w-2 h-2 bg-blue-300 rounded-full"></div>
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
    
    // Find a card that hasn't been dealt yet and hasn't been permanently removed
    let cardIndex = 0;
    let card;
    
    while (cardIndex < deckRef.current.length) {
      const candidate = deckRef.current[cardIndex];
      if (!dealtCardsRef.current.has(candidate.id) && !removedCardsRef.current.has(candidate.id)) {
        card = {...candidate, hidden, isNew: true};
        dealtCardsRef.current.add(candidate.id);
        
        // Remove card from deck
        deckRef.current.splice(cardIndex, 1);
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
    
    // Check if player should draw a Tarot card
    let newTarotDrawCounter = tarotDrawCounter - 1;
    if (newTarotDrawCounter <= 0) {
      // Reset counter
      newTarotDrawCounter = 5; 
      
      // Check if player has space for a tarot card
      if (consumableSlots.some(slot => slot === null)) {
        setTimeout(() => {
          setMessage("You've earned a Tarot card! Choose one to add to your consumables.");
          drawTarotSelection();
        }, 1000);
        setTarotDrawCounter(newTarotDrawCounter);
        return; // Don't start a new round yet
      } else {
        setMessage(prevMessage => `${prevMessage} You would earn a Tarot card, but your slots are full!`);
      }
    }
    
    setTarotDrawCounter(newTarotDrawCounter);
    
    // Start new round after delay if we're not drawing tarot cards
    setTimeout(startNewRound, 2000);
  };
  
  // Reset game after a loss
  const resetAfterLoss = () => {
    setWins(0);
    setWinningStreak(0);
    setConsumableSlots([null, null]); // Clear tarot cards when losing
    removedCardsRef.current.clear(); // Reset the permanently removed cards
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
  
  // Handle drag start for playing cards
  const handleDragStart = (e, index, type) => {
    if (gameState !== 'playing') return;
    
    // Set data for drag operation
    if (type === 'player') {
      setDraggedCardIndex(index);
      setDragSourceType('player');
      setDraggedCard(playerHand[index]); // Store the card being dragged
      e.dataTransfer.setData('text/plain', `player-${index}`);
    } else if (type === 'consumable') {
      setDraggedTarotCardIndex(index);
      setDragSourceType('consumable');
      e.dataTransfer.setData('text/plain', `consumable-${index}`);
    }
    
    setIsDragging(true);
    
    // Make dragging more responsive with a custom ghost image
    if (type === 'player') {
      // Create a custom drag image/ghost that's full-sized
      const dragEl = document.createElement('div');
      dragEl.className = 'card-ghost';
      dragEl.style.width = '112px'; // w-28 in pixels
      dragEl.style.height = '160px'; // h-40 in pixels
      dragEl.style.background = 'white';
      dragEl.style.border = '2px solid #4299e1';
      dragEl.style.borderRadius = '8px';
      dragEl.style.display = 'flex';
      dragEl.style.alignItems = 'center';
      dragEl.style.justifyContent = 'center';
      dragEl.style.fontSize = '24px';
      dragEl.style.color = playerHand[index].color === 'text-red-600' ? '#e53e3e' : '#000';
      dragEl.style.position = 'absolute';
      dragEl.style.top = '-1000px';
      dragEl.style.opacity = '0.9';
      dragEl.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
      
      const cardContent = document.createElement('div');
      cardContent.style.display = 'flex';
      cardContent.style.flexDirection = 'column';
      cardContent.style.alignItems = 'center';
      
      const cardValue = document.createElement('div');
      cardValue.textContent = playerHand[index].value;
      cardValue.style.fontSize = '36px';
      cardValue.style.fontWeight = 'bold';
      
      const cardSuit = document.createElement('div');
      cardSuit.textContent = playerHand[index].suit;
      cardSuit.style.fontSize = '48px';
      
      cardContent.appendChild(cardValue);
      cardContent.appendChild(cardSuit);
      dragEl.appendChild(cardContent);
      
      document.body.appendChild(dragEl);
      e.dataTransfer.setDragImage(dragEl, 56, 80); // Center the drag image
      
      setTimeout(() => {
        document.body.removeChild(dragEl);
      }, 0);
    }
  };
  
  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  // Handle drop for card reordering
  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    setIsDragging(false);
    
    const data = e.dataTransfer.getData('text/plain');
    
    // Handle player card rearrangement
    if (data.startsWith('player-') && dragSourceType === 'player' && draggedCardIndex !== null) {
      const sourceIndex = draggedCardIndex;
      
      // Don't do anything if dropping on the same card
      if (sourceIndex === targetIndex) return;
      
      // Create a new hand with reordered cards
      const newHand = [...playerHand];
      const [movedCard] = newHand.splice(sourceIndex, 1);
      newHand.splice(targetIndex, 0, movedCard);
      
      setPlayerHand(newHand);
      
      // Adjust selected cards if needed
      setSelectedCards(prevSelected => {
        return prevSelected.map(index => {
          if (index === sourceIndex) return targetIndex;
          if (sourceIndex < index && index <= targetIndex) return index - 1;
          if (sourceIndex > index && index >= targetIndex) return index + 1;
          return index;
        });
      });
    }
    
    // Reset drag state
    setDraggedCardIndex(null);
    setDraggedTarotCardIndex(null);
    setDragSourceType(null);
    setDraggedCard(null);
  };
  
  // Handle drop for tarot card usage
  const handleTarotDrop = (e, targetArea) => {
    e.preventDefault();
    setIsDragging(false);
    
    const data = e.dataTransfer.getData('text/plain');
    
    // Handle tarot card usage
    if (data.startsWith('consumable-') && dragSourceType === 'consumable' && draggedTarotCardIndex !== null) {
      const slotIndex = draggedTarotCardIndex;
      
      // Use the tarot card
      useTarotCard(slotIndex);
    }
    
    // Reset drag state
    setDraggedCardIndex(null);
    setDraggedTarotCardIndex(null);
    setDragSourceType(null);
    setDraggedCard(null);
  };
  
  // Toggle info panel
  const toggleInfo = () => {
    setShowInfo(!showInfo);
  };
  
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
        draggable={isPlayerHand && gameState === 'playing'}
        onDragStart={(e) => isPlayerHand && handleDragStart(e, index, 'player')}
        onDragOver={handleDragOver}
        onDrop={(e) => isPlayerHand && handleDrop(e, index)}
        className={`relative flex items-center justify-center w-28 h-40 border-2 border-gray-300 rounded-lg shadow-md overflow-hidden
          ${isPlayerHand && gameState === 'playing' ? 'cursor-grab active:cursor-grabbing hover:border-blue-500' : ''} 
          ${isSelected ? 'border-yellow-400 border-4 shadow-lg' : ''}
          ${getTilt()}
          ${isNewCard ? 'animate-deal' : ''}
          ${isDragging && draggedCardIndex === index ? 'opacity-50' : ''}
          transition-all duration-200 ease-in-out hover:shadow-xl`}
        style={{ 
          margin: '-0.5rem',
          transformOrigin: 'center bottom',
          transform: `${isSelected ? 'translateY(-16px)' : 'translateY(0)'} ${isPlayerHand ? `rotate(${index % 2 === 0 ? -1 : 1}deg)` : 'rotate(0)'}`,
          zIndex: isSelected ? 10 : index
        }}
      >
        {/* Card face */}
        <div className={`absolute inset-0 flex items-center justify-center bg-white ${isHidden ? 'hidden' : ''}`}>
          <div className={`flex flex-col items-center ${card.color}`}>
            <div className="text-3xl font-bold">{card.value}</div>
            <div className="text-4xl">{card.suit}</div>
          </div>
        </div>
        
        {/* Card back with pattern */}
        {isHidden && <CardBackPattern />}
      </div>
    );
  };
  
  // Render a tarot card
  const renderTarotCard = (card, index) => {
    if (!card) {
      // Empty slot
      return (
        <div 
          key={`tarot-empty-${index}`}
          className="relative w-24 h-36 border-2 border-gray-300 border-dashed rounded-lg bg-gray-100 bg-opacity-20 flex items-center justify-center mb-4 shadow-md"
        >
          <span className="text-white opacity-50 text-lg">Empty</span>
        </div>
      );
    }
    
    return (
      <div 
        key={`tarot-${card.id}`}
        className="relative w-24 h-36 border-2 border-yellow-600 rounded-lg overflow-hidden cursor-grab bg-purple-900 shadow-lg mb-4 hover:shadow-xl transition-all duration-200 active:scale-95"
        draggable={gameState === 'playing'}
        onDragStart={(e) => handleDragStart(e, index, 'consumable')}
        onClick={() => gameState === 'playing' && useTarotCard(index)}
      >
        <div className="absolute inset-0 p-2 flex flex-col items-center justify-between">
          <div className="text-yellow-300 text-sm font-bold">{card.name}</div>
          
          {/* Custom tarot card art based on the card type */}
          <div className="flex-grow flex items-center justify-center">
            {card.id === 'death' && (
              <div className="text-purple-100 text-5xl transform">🪦</div>
            )}
            {card.id === 'hanged-man' && (
              <div className="text-purple-100 text-5xl transform rotate-180">🧍</div>
            )}
          </div>
          
          <div className="text-yellow-300 text-sm text-center">
            {card.id === 'death' ? 'Transform' : 'Remove'}
          </div>
        </div>
      </div>
    );
  };
  
  // Tarot Selection Modal Component
  const TarotSelectionModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-purple-900 rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-yellow-300">Choose a Tarot Card</h2>
        </div>
        
        <div className="flex flex-wrap justify-center gap-8 mb-8">
          {availableTarotCards.map((card, index) => (
            <div 
              key={`selection-${card.id}`}
              onClick={() => selectTarotCard(card)}
              className="relative w-40 h-64 border-2 border-yellow-600 rounded-lg overflow-hidden cursor-pointer bg-purple-800 shadow-lg hover:scale-105 transition-transform"
            >
              <div className="absolute inset-0 p-4 flex flex-col items-center justify-between">
                <div className="text-yellow-300 text-xl font-bold">{card.name}</div>
                
                {/* Custom tarot card art based on the card type */}
                <div className="flex-grow flex items-center justify-center">
                  {card.id === 'death' && (
                    <div className="text-purple-100 text-6xl">🪦</div>
                  )}
                  {card.id === 'hanged-man' && (
                    <div className="text-purple-100 text-6xl transform rotate-180">🧍</div>
                  )}
                </div>
                
                <div className="text-white text-sm text-center">
                  {card.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  
  // Info Panel Component
  const InfoPanel = () => (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-green-900 rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-white">Modified Blackjack Rules</h2>
          <button 
            onClick={toggleInfo}
            className="text-white hover:text-yellow-300 transition-colors"
          >
            <X size={32} />
          </button>
        </div>
        
        <div className="text-white space-y-6 text-lg">
          <div>
            <h3 className="text-2xl font-semibold mb-2 text-yellow-300">Game Objective</h3>
            <p>Get a hand value closer to 21 than the dealer without going over. Build a winning streak to earn points.</p>
          </div>
          
          <div>
            <h3 className="text-2xl font-semibold mb-2 text-yellow-300">Deck & Dealing</h3>
            <p>A standard 52-card deck is used and reshuffled after each round. Cards are dealt from the same deck to both player and dealer.</p>
          </div>
          
          <div>
            <h3 className="text-2xl font-semibold mb-2 text-yellow-300">Special Rules</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><span className="font-bold">Discard System:</span> You have a limited number of discard tokens (starting with 5).</li>
              <li><span className="font-bold">Discard Refill:</span> Every 3 wins, you earn 5 more discard tokens.</li>
              <li><span className="font-bold">Winning Streak:</span> Game continues until you lose to the dealer, which resets your score to 0.</li>
              <li><span className="font-bold">Over-Bust Rule:</span> If your score is over 21 but under 32, you can still hit after discarding.</li>
              <li><span className="font-bold">Hard Bust:</span> If your score is 32 or higher, you cannot hit until discarding to get below 32.</li>
              <li><span className="font-bold">Card Selection:</span> Select a card by clicking on it, then use the discard button to remove it.</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-2xl font-semibold mb-2 text-yellow-300">Tarot Card System</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><span className="font-bold">Earning Tarot Cards:</span> Every 5 wins, you earn a tarot card (if you have space).</li>
              <li><span className="font-bold">Death Card:</span> Transforms the left selected card into the right selected card.</li>
              <li><span className="font-bold">Hanged Man Card:</span> Removes two selected cards completely from your hand.</li>
              <li><span className="font-bold">Using Tarot Cards:</span> Click or drag the tarot card to use its effect.</li>
              <li><span className="font-bold">Card Slots:</span> You can hold a maximum of 2 tarot cards at a time.</li>
              <li><span className="font-bold">Reset on Loss:</span> All tarot cards are lost when you lose to the dealer.</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-2xl font-semibold mb-2 text-yellow-300">Standard Blackjack Rules</h3>
            <ul className="list-disc pl-6 space-y-2">
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

  // Dragged card preview overlay for more responsive drag and drop
  const DraggedCardPreview = () => {
    if (!isDragging || !draggedCard) return null;
    
    return (
      <div className="fixed top-0 left-0 z-50 pointer-events-none opacity-0">
        <div className="w-28 h-40 bg-white border-2 border-blue-500 rounded-lg shadow-xl flex items-center justify-center">
          <div className={`flex flex-col items-center ${draggedCard.color}`}>
            <div className="text-3xl font-bold">{draggedCard.value}</div>
            <div className="text-4xl">{draggedCard.suit}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative bg-green-800 text-white min-h-screen w-full overflow-hidden">
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
          animation: dealCard 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .animate-discard {
          animation: discardCard 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .animate-shuffle {
          animation: shuffle 0.8s ease-in-out;
        }
        .card-lift {
          transition: transform 0.2s ease;
        }
        .card-lift:hover {
          transform: translateY(-8px);
        }
      `}</style>
      
      {/* Header with title and info button */}
      <div className="flex justify-between items-center p-4 bg-green-900">
        <h1 className="text-3xl font-bold">Blackjack</h1>
        <div className="flex items-center">
          <button 
            onClick={toggleInfo}
            className="ml-4 bg-yellow-600 hover:bg-yellow-700 text-white rounded-full p-2 transition-colors"
            title="Game Rules"
          >
            <Info size={24} />
          </button>
        </div>
      </div>
      
      {/* Main gameplay area - using grid layout for better space utilization */}
      <div className="grid grid-cols-12 gap-4 p-4 h-full">
        {/* Left side: Game history */}
        <div className="col-span-2">
          {/* Scoreboard - compact version */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-blue-900 p-2 rounded-lg text-center">
              <div className="text-sm font-bold">Score</div>
              <div className="text-2xl">{wins}</div>
            </div>
            
            <div className="bg-blue-900 p-2 rounded-lg text-center">
              <div className="text-sm font-bold">Streak</div>
              <div className="text-2xl">{winningStreak}</div>
            </div>
            
            <div className="bg-blue-900 p-2 rounded-lg text-center">
              <div className="text-sm font-bold">Tokens</div>
              <div className="text-2xl">{discardTokens}</div>
            </div>
            
            <div className="bg-blue-900 p-2 rounded-lg text-center">
              <div className="text-sm font-bold">Till Tarot</div>
              <div className="text-2xl">{tarotDrawCounter}</div>
            </div>
          </div>
          
          {/* Game history - compact version */}
          {gameHistory.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-2 shadow-lg mb-4 overflow-hidden">
              <h2 className="text-lg font-bold mb-2 border-b border-gray-700 pb-1">Game History</h2>
              <div className="max-h-72 overflow-y-auto text-xs">
                {gameHistory.map((game, index) => (
                  <div key={index} className="border-b border-gray-700 py-1 flex flex-col">
                    <div className={game.winner === 'Player' ? 'text-green-400' : game.winner === 'Dealer' ? 'text-red-400' : 'text-yellow-400'}>
                      {game.winner} {game.winner !== 'Push' && 'wins'} ({game.reason})
                    </div>
                    <div className="text-gray-400">
                      P: {game.playerScore} | D: {game.dealerScore}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Deck visualization */}
          <div 
            className={`w-full flex justify-center mb-4 ${isShuffling ? 'animate-shuffle' : ''}`}
          >
            <div className="relative w-20 h-32 border-2 border-white rounded-lg shadow-md overflow-hidden">
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
              <div className="absolute bottom-0 left-0 right-0 text-sm text-white p-1 z-10 text-center bg-black bg-opacity-50">
                {deckRef.current.length - removedCardsRef.current.size} cards
              </div>
            </div>
          </div>
        </div>
        
        {/* Center: Main game area */}
        <div className="col-span-8 bg-green-700 rounded-lg p-4 shadow-lg flex flex-col">
          {/* Dealer area */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold">Dealer</h2>
              <div className="bg-white text-black px-3 py-1 rounded text-lg">Score: {dealerScore}</div>
            </div>
            
            <div className="flex justify-center min-h-[160px] items-center">
              {dealerHand.filter(card => card).map((card, index) => renderCard(card, index, 'dealer'))}
            </div>
          </div>
          
          {/* Message area */}
          <div className="text-center py-2 mb-4 bg-green-900 rounded-lg">
            <p className="text-xl">{message}</p>
          </div>
          
          {/* Player area */}
          <div className="flex-grow">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold">Player</h2>
              <div className={`px-3 py-1 rounded text-lg ${playerScore > 21 ? 'bg-red-500' : 'bg-white text-black'}`}>
                Score: {playerScore} {playerScore > 21 && '(Bust)'}
              </div>
            </div>
            
            <div 
              className="flex justify-center min-h-[160px] items-center mb-4"
              onDragOver={handleDragOver}
              onDrop={(e) => handleTarotDrop(e, 'playArea')}
            >
              {playerHand.filter(card => card).map((card, index) => renderCard(card, index, 'player'))}
            </div>
            
            {/* Controls */}
            <div className="flex justify-center space-x-4 mt-auto">
              {gameState === 'playing' && (
                <>
                  <button
                    onClick={hit}
                    disabled={playerScore >= 32}
                    className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-lg focus:outline-none transition-all duration-200 active:scale-95 ${playerScore >= 32 ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}`}
                  >
                    Hit
                  </button>
                  <button
                    onClick={stand}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg text-lg focus:outline-none transition-all duration-200 active:scale-95 hover:shadow-lg"
                  >
                    Stand
                  </button>
                  <button
                    onClick={discardSelectedCard}
                    disabled={discardTokens <= 0 || selectedCards.length !== 1}
                    className={`flex items-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg text-lg focus:outline-none transition-all duration-200 active:scale-95 ${(discardTokens <= 0 || selectedCards.length !== 1) ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}`}
                  >
                    <Shield size={20} className="mr-2" /> Discard ({discardTokens})
                  </button>
                  {selectedCards.length > 0 && (
                    <div className="text-white text-lg flex items-center bg-gray-800 px-3 py-1 rounded-lg">
                      {selectedCards.length === 1 ? "1 card selected" : `${selectedCards.length} cards selected`}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Right side: Tarot cards (vertical layout) */}
        <div className="col-span-2">
          <div className="bg-purple-900 bg-opacity-50 rounded-lg p-4 shadow-lg">
            <h2 className="text-xl font-bold mb-3">Tarot Cards</h2>
            <div className="text-sm text-yellow-300 mb-4">
              Drag to use or click to activate
            </div>
            
            <div 
              className="flex flex-col items-center"
              onDragOver={handleDragOver}
              onDrop={(e) => handleTarotDrop(e, 'tarotArea')}
            >
              {consumableSlots.map((card, index) => renderTarotCard(card, index))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Animating cards overlay */}
      {animatingCards.map(card => (
        <div 
          key={card.id}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-28 h-40 bg-white border-2 border-gray-300 rounded-lg shadow-xl animate-discard z-50"
        >
          <div className={`flex flex-col items-center ${card.color}`}>
            <div className="text-3xl font-bold">{card.value}</div>
            <div className="text-4xl">{card.suit}</div>
          </div>
        </div>
      ))}
      
      {/* Dragged card preview - for better drag and drop feedback */}
      <DraggedCardPreview />
      
      {/* Info Panel */}
      {showInfo && <InfoPanel />}
      
      {/* Tarot Selection Modal */}
      {showTarotSelection && <TarotSelectionModal />}
    </div>
  );
};

export default Blackjack;