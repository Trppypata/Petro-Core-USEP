import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getRandomTrivia, getRandomTriviaByCategory } from '@/services/trivia.service';
import type { Trivia } from '@/services/trivia.service';
import { InfoIcon } from 'lucide-react';

interface TriviaToastProps {
  autoShow?: boolean;
  delay?: number;
  category?: string;
  position?: 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left';
}

export const TriviaToast = ({ 
  autoShow = true, 
  delay = 3000, 
  category,
  position = 'bottom-right'
}: TriviaToastProps) => {
  const [currentTrivia, setCurrentTrivia] = useState<Trivia | null>(null);

  // Load random trivia on mount if autoShow is true
  useEffect(() => {
    if (autoShow) {
      const timer = setTimeout(() => {
        showRandomTrivia();
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [autoShow, delay]);

  // Function to show a random trivia
  const showRandomTrivia = async () => {
    try {
      let trivia: Trivia | null;
      
      if (category) {
        trivia = await getRandomTriviaByCategory(category);
        // Fallback to random trivia if none found for the category
        if (!trivia) {
          trivia = await getRandomTrivia();
        }
      } else {
        trivia = await getRandomTrivia();
      }
      
      setCurrentTrivia(trivia);
      
      if (trivia) {
        toast(
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <InfoIcon className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-medium">{trivia.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{trivia.content}</p>
          </div>,
          {
            duration: 8000,
            position,
            className: 'bg-card border border-border shadow-md',
            action: {
              label: 'More',
              onClick: () => showRandomTrivia()
            }
          }
        );
      }
    } catch (error) {
      console.error('Error showing trivia:', error);
    }
  };

  return null; // This component doesn't render anything directly
};

// This function can be imported and used anywhere to show a trivia toast
export const showTrivia = async (category?: string) => {
  try {
    let trivia: Trivia | null;
    
    if (category) {
      trivia = await getRandomTriviaByCategory(category);
      if (!trivia) {
        trivia = await getRandomTrivia();
      }
    } else {
      trivia = await getRandomTrivia();
    }
    
    if (trivia) {
      toast(
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <InfoIcon className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-medium">{trivia.title}</h3>
          </div>
          <p className="text-sm text-muted-foreground">{trivia.content}</p>
        </div>,
        {
          duration: 8000,
          className: 'bg-card border border-border shadow-md',
          action: {
            label: 'Another',
            onClick: () => showTrivia(category)
          }
        }
      );
    }
  } catch (error) {
    console.error('Error showing trivia:', error);
  }
}; 