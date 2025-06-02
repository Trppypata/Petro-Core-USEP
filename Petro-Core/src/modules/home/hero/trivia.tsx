import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Info, MapPin, Mountain } from 'lucide-react';

interface Trivia {
  fact: string;
  category: string;
}

// Philippines trivia data
const PHILIPPINES_TRIVIAS: Trivia[] = [
  { fact: "The smallest active volcano in the world is found in the Philippines — it's called Taal Volcano!", category: "general" },
  { fact: "Taal Volcano is only 311 meters tall, but it has a big history of eruptions.", category: "general" },
  { fact: "The tallest active volcano in the Philippines is Mount Ragang.", category: "general" },
  { fact: "The most active volcano in the Philippines is Mayon Volcano, found in Albay, Bicol Region.", category: "general" },
  { fact: "Mayon Volcano has erupted more than 50 times in the past 400 years!", category: "general" },
  { fact: "Mount Pinatubo is located at the borders of Pampanga, Tarlac, and Zambales in Luzon.", category: "general" },
  { fact: "Lake Maughan (Lake Holon) in South Cotabato was formed by the eruption of Mount Parker in 1641.", category: "general" },
  { fact: "There are 27 potentially active volcanoes in the Philippines.", category: "general" },
  { fact: "The Philippines is home to around 300 inactive volcanoes scattered across its islands.", category: "general" },
  { fact: "The 1991 eruption of Mount Pinatubo sent an ash cloud 35 km into the sky.", category: "general" },
  { fact: "The Hinatuan Enchanted River in Surigao del Sur is the deepest river in the Philippines.", category: "rivers" },
  { fact: "The Cagayan River Basin covers 27,280 square km, making it the largest river basin in the Philippines.", category: "rivers" },
  { fact: "The longest natural cave in the Philippines is St. Paul Cave in Palawan Province.", category: "general" },
  { fact: "The island province of Camiguin has more volcanoes (7) than towns (5)!", category: "general" },
  { fact: "Mount Apo is the highest mountain in the Philippines, towering at 2,954 meters above sea level.", category: "general" },
  { fact: "The second highest peak is Mt. Pulag in Luzon, at 2,842 meters.", category: "general" },
  { fact: "Luzonite, one of the rarest copper ores, was first discovered in Luzon.", category: "minerals" },
  { fact: "Laguna de Bay is the largest freshwater lake in the Philippines.", category: "lakes" },
  { fact: "Taal Volcano is a geological inception: an island with a lake, inside which is a volcano island, with a crater lake!", category: "general" },
  { fact: "The highest temperature recorded in the Philippines was 42.2°C in Tuguegarao, Cagayan.", category: "weather" },
  { fact: "The Sierra Madre is the longest mountain range in the Philippines.", category: "general" },
];

// Add custom CSS for trivia toasts
const addTriviaStyles = () => {
  if (!document.getElementById('trivia-toast-styles')) {
    const style = document.createElement('style');
    style.id = 'trivia-toast-styles';
    style.innerHTML = `
      .trivia-toast {
        border-left: 4px solid #0ea5e9;
        background: linear-gradient(to right, rgba(14, 165, 233, 0.05), transparent);
      }
    `;
    document.head.appendChild(style);
  }
};

export function Trivia({ category = 'all' }: { category?: string }) {
  const [trivias] = useState<Trivia[]>(PHILIPPINES_TRIVIAS);

  // Add custom styles on mount
  useEffect(() => {
    addTriviaStyles();
  }, []);

  // Show a random trivia as toast notification
  const showRandomTrivia = () => {
    // Filter by category if specified
    const filteredTrivias = category && category !== 'all' 
      ? trivias.filter(t => t.category.toLowerCase().includes(category.toLowerCase()))
      : trivias;
    
    // Use all trivias if no match for the category
    const triviasToUse = filteredTrivias.length > 0 ? filteredTrivias : trivias;
    
    // Get a random trivia
    const randomIndex = Math.floor(Math.random() * triviasToUse.length);
    const trivia = triviasToUse[randomIndex];
    
    // Determine icon based on category
    let icon = <Info className="h-5 w-5" />;
    if (trivia.category === 'rivers' || trivia.category === 'lakes') {
      icon = <MapPin className="h-5 w-5" />;
    } else if (trivia.category === 'general') {
      icon = <Mountain className="h-5 w-5" />;
    }
    
    // Show toast with the trivia fact
    toast(
      <div className="flex flex-col">
        <h4 className="font-medium text-base">Philippine Trivia</h4>
        <p className="text-sm text-muted-foreground mt-1">
          {trivia.fact}
        </p>
      </div>,
      {
        duration: 8000,
        icon: icon,
        position: "bottom-right",
        className: "trivia-toast",
        dismissible: true
      }
    );
  };

  // Show trivia on mount and every 30 seconds
  useEffect(() => {
    // Initial trivia (after 2 seconds to let page load)
    const initialTimeout = setTimeout(() => {
      showRandomTrivia();
    }, 2000);
    
    // Set interval for subsequent trivias
    const interval = setInterval(() => {
      showRandomTrivia();
    }, 30000);
    
    // Cleanup
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [category]);

  // No visible UI needed
  return null;
} 