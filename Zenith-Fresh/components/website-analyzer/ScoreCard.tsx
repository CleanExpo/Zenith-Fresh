'use client';

interface ScoreCardProps {
  title: string;
  score: number;
  description: string;
  color: 'blue' | 'green' | 'red' | 'purple';
}

export function ScoreCard({ title, score, description, color }: ScoreCardProps) {
  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-800',
        score: 'text-blue-600',
      },
      green: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-800',
        score: 'text-green-600',
      },
      red: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800',
        score: 'text-red-600',
      },
      purple: {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-800',
        score: 'text-purple-600',
      },
    };
    return colorMap[color];
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const colors = getColorClasses(color);

  return (
    <div className={`${colors.bg} ${colors.border} border rounded-lg p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-lg font-semibold ${colors.text}`}>{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
        <div className="text-center">
          <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
            {Math.round(score)}
          </div>
          <div className="text-xs text-gray-500">/ 100</div>
        </div>
      </div>
    </div>
  );
}