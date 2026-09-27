import React from 'react';
import { StructuredCard } from '../../types/api.js';

interface InsightCardGroupProps {
  cards: StructuredCard[];
  className?: string;
}

export const InsightCardGroup: React.FC<InsightCardGroupProps> = ({ cards, className = '' }) => {
  if (!cards || cards.length === 0) return null;

  const tagColorClasses = [
    'bg-primary-fixed text-on-primary-fixed font-bold',
    'bg-secondary-fixed text-on-secondary-fixed font-bold',
    'bg-surface-container-highest text-primary font-bold',
  ];

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-space-sm ${className}`}>
      {cards.map((card, idx) => {
        const tagClass = tagColorClasses[idx % tagColorClasses.length];

        return (
          <div
            key={idx}
            className="bg-surface-container-low p-space-md rounded-xl flex flex-col justify-between hover:bg-surface-container-lowest hover:shadow-md transition-all duration-200 border border-outline-variant/30"
          >
            <div className="flex flex-col gap-1.5">
              {card.tag && (
                <span className={`text-[11px] px-2 py-0.5 rounded-full w-fit ${tagClass}`}>
                  {card.tag}
                </span>
              )}
              <h3 className="font-headline-sm text-[16px] text-on-surface font-semibold mt-1">
                {card.title}
              </h3>
              <p className="font-body-sm text-[13px] text-on-surface-variant leading-relaxed">
                {card.description}
              </p>
            </div>

            {card.example && (
              <div className="mt-3 pt-2 bg-surface-container-lowest/70 p-2.5 rounded-lg border border-outline-variant/20">
                <span className="text-[11px] uppercase tracking-wider text-primary font-semibold block mb-0.5">
                  Ví dụ thực tế
                </span>
                <span className="font-body-sm text-[12px] text-on-surface-variant">
                  {card.example}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
