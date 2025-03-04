import React, { useState } from 'react';
import { Wrench, PlusCircle, Shield, Coins, Award, CreditCard, DiceIcon } from 'lucide-react';

const BlackjackDebug = ({ 
  addCardToPlayer, 
  addTarotCard, 
  setDiscardTokens, 
  discardTokens, 
  setWins,
  wins,
  tarotCardDefinitions,
  setCoins = () => {}, // Default value if not provided
  coins = 0 // Default value if not provided
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };
  
  // Card options for debug menu
  const suits = ['♥', '♦', '♠', '♣'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  
  const handleAddCard = (value, suit) => {
    const cardColor = suit === '♥' || suit === '♦' ? 'text-red-600' : 'text-black';
    addCardToPlayer({
      suit,
      value,
      hidden: false,
      color: cardColor,
      id: `${value}-${suit}-${Date.now()}` // Add timestamp to ensure uniqueness
    });
  };
  
  const handleAddTarotCard = (tarotCard) => {
    addTarotCard(tarotCard);
  };
  
  const handleAddTokens = (amount) => {
    setDiscardTokens(discardTokens + amount);
  };
  
  const handleAddWins = (amount) => {
    setWins(wins + amount);
  };

  const handleAddCoins = (amount) => {
    setCoins(coins + amount);
  };

  const handleResetGame = () => {
    // Not implemented yet - just a UI element for now
    alert("Reset game functionality would be implemented here");
  };
  
  const sections = [
    { 
      title: "Cards", 
      icon: <CreditCard size={16} />,
      content: (
        <div className="p-2 border-b border-gray-700">
          <h4 className="text-white font-medium mb-1">Add Card to Hand</h4>
          <div className="grid grid-cols-4 gap-1 max-h-40 overflow-y-auto">
            {values.map(value => (
              suits.map(suit => (
                <button
                  key={`${value}-${suit}`}
                  onClick={() => handleAddCard(value, suit)}
                  className={`p-1 rounded text-center ${suit === '♥' || suit === '♦' ? 'bg-red-900 text-white' : 'bg-gray-800 text-white'} hover:bg-gray-700`}
                  title={`Add ${value} of ${suit}`}
                >
                  {value}{suit}
                </button>
              ))
            ))}
          </div>
        </div>
      )
    },
    { 
      title: "Tarot", 
      icon: <PlusCircle size={16} />,
      content: (
        <div className="p-2 border-b border-gray-700">
          <h4 className="text-white font-medium mb-1">Add Tarot Card</h4>
          <div className="flex flex-col gap-1">
            {tarotCardDefinitions.map(card => (
              <button
                key={card.id}
                onClick={() => handleAddTarotCard(card)}
                className="p-1 rounded text-left bg-purple-900 text-white hover:bg-purple-800"
              >
                {card.name} - {card.effect}
              </button>
            ))}
          </div>
        </div>
      )
    },
    { 
      title: "Tokens", 
      icon: <Shield size={16} />,
      content: (
        <div className="p-2 border-b border-gray-700">
          <h4 className="text-white font-medium mb-1">Add Tokens</h4>
          <div className="flex justify-between">
            <button
              onClick={() => handleAddTokens(1)}
              className="p-1 rounded bg-blue-800 text-white hover:bg-blue-700 flex-1 mr-1"
            >
              +1
            </button>
            <button
              onClick={() => handleAddTokens(5)}
              className="p-1 rounded bg-blue-800 text-white hover:bg-blue-700 flex-1 mr-1"
            >
              +5
            </button>
            <button
              onClick={() => handleAddTokens(10)}
              className="p-1 rounded bg-blue-800 text-white hover:bg-blue-700 flex-1"
            >
              +10
            </button>
          </div>
        </div>
      )
    },
    { 
      title: "Wins", 
      icon: <Award size={16} />,
      content: (
        <div className="p-2 border-b border-gray-700">
          <h4 className="text-white font-medium mb-1">Add Wins</h4>
          <div className="flex justify-between">
            <button
              onClick={() => handleAddWins(1)}
              className="p-1 rounded bg-green-800 text-white hover:bg-green-700 flex-1 mr-1"
            >
              +1
            </button>
            <button
              onClick={() => handleAddWins(3)}
              className="p-1 rounded bg-green-800 text-white hover:bg-green-700 flex-1 mr-1"
            >
              +3
            </button>
            <button
              onClick={() => handleAddWins(5)}
              className="p-1 rounded bg-green-800 text-white hover:bg-green-700 flex-1"
            >
              +5
            </button>
          </div>
        </div>
      )
    },
    { 
      title: "Coins", 
      icon: <Coins size={16} />,
      content: (
        <div className="p-2 border-b border-gray-700">
          <h4 className="text-white font-medium mb-1">Add Coins</h4>
          <div className="flex justify-between">
            <button
              onClick={() => handleAddCoins(5)}
              className="p-1 rounded bg-yellow-800 text-white hover:bg-yellow-700 flex-1 mr-1"
            >
              +5
            </button>
            <button
              onClick={() => handleAddCoins(10)}
              className="p-1 rounded bg-yellow-800 text-white hover:bg-yellow-700 flex-1 mr-1"
            >
              +10
            </button>
            <button
              onClick={() => handleAddCoins(25)}
              className="p-1 rounded bg-yellow-800 text-white hover:bg-yellow-700 flex-1"
            >
              +25
            </button>
          </div>
        </div>
      )
    },
    { 
      title: "Reset", 
      icon: <PlusCircle size={16} />,
      content: (
        <div className="p-2">
          <h4 className="text-white font-medium mb-1">Reset Game</h4>
          <div className="flex justify-center">
            <button
              onClick={handleResetGame}
              className="p-2 rounded bg-red-800 text-white hover:bg-red-700 w-full"
            >
              Reset Game State
            </button>
          </div>
        </div>
      )
    }
  ];
  
  return (
    <div className="relative">
      <button 
        onClick={toggleMenu}
        className="bg-red-600 hover:bg-red-700 text-white rounded-full p-2 transition-colors"
        title="Debug Options"
      >
        <Wrench size={24} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 w-64 text-sm">
          <div className="p-2 border-b border-gray-700 bg-red-800 rounded-t-lg">
            <h3 className="text-white font-bold">Debug Controls</h3>
            <p className="text-white text-xs opacity-75">Developer tools for testing</p>
          </div>
          
          {/* Tabs navigation */}
          <div className="flex border-b border-gray-700">
            {sections.map((section, index) => (
              <button
                key={section.title}
                onClick={() => setActiveSectionIndex(index)}
                className={`flex items-center p-2 text-xs ${activeSectionIndex === index ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <span className="mr-1">{section.icon}</span>
                <span>{section.title}</span>
              </button>
            ))}
          </div>
          
          {/* Tab content */}
          {sections[activeSectionIndex].content}
          
          {/* Version info */}
          <div className="p-1 text-center text-xs text-gray-500 border-t border-gray-700">
            Debug v1.2.0
          </div>
        </div>
      )}
    </div>
  );
};

export default BlackjackDebug;
