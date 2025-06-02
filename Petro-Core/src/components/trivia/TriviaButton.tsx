import { Button } from '@/components/ui/button';
import { LightbulbIcon } from 'lucide-react';
import { showTrivia } from './TriviaToast';

interface TriviaButtonProps {
  category?: string;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  label?: string;
}

export const TriviaButton = ({
  category,
  variant = 'outline',
  size = 'sm',
  className = '',
  label = 'Did You Know?'
}: TriviaButtonProps) => {
  const handleClick = () => {
    showTrivia(category);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={`flex items-center gap-1.5 ${className}`}
    >
      <LightbulbIcon className="h-4 w-4" />
      <span>{label}</span>
    </Button>
  );
}; 