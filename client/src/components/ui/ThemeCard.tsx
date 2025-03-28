import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Palette } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemeColorProps {
  color: string;
  active: boolean;
  onClick: () => void;
}

const ThemeColor: React.FC<ThemeColorProps> = ({ color, active, onClick }) => {
  return (
    <Button
      type="button"
      onClick={onClick}
      className={`w-10 h-10 rounded-full flex items-center justify-center ${active ? 'ring-2 ring-offset-2' : ''}`}
      style={{ backgroundColor: `hsl(${color})` }}
      variant="ghost"
    >
      {active && <Check className="h-4 w-4 text-white" />}
    </Button>
  );
};

export const ThemeCard: React.FC = () => {
  const { currentTheme, setTheme, availableThemes } = useTheme();

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" /> Theme Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            {availableThemes.map((theme) => (
              <div key={theme.name} className="flex flex-col items-center gap-2">
                <ThemeColor
                  color={theme.primary}
                  active={currentTheme === theme.name}
                  onClick={() => setTheme(theme.name)}
                />
                <span className="text-xs font-medium">{theme.name}</span>
              </div>
            ))}
          </div>
          <div className="pt-2 text-sm text-muted-foreground">
            Select a theme to customize the appearance of the application.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};