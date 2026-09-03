import {
  Camera,
  Crown,
  Flower2,
  Gem,
  Gift,
  Heart,
  Music,
  ShoppingBag,
  Sparkles,
  Star,
  Umbrella,
  Watch,
  type LucideIcon,
} from "lucide-react";
import type { MemoryCard } from "@minibarbara/games";
import "./MemoryBoard.css";

const SYMBOL_ICONS: Record<string, LucideIcon> = {
  crown: Crown,
  gem: Gem,
  heart: Heart,
  sparkle: Sparkles,
  bag: ShoppingBag,
  star: Star,
  flower: Flower2,
  watch: Watch,
  gift: Gift,
  music: Music,
  camera: Camera,
  umbrella: Umbrella,
};

interface MemoryBoardProps {
  cards: readonly MemoryCard[];
  revealedIds: ReadonlySet<string>;
  matchedIds: ReadonlySet<string>;
  onCardClick: (card: MemoryCard) => void;
  disabled?: boolean;
}

export function MemoryBoard({
  cards,
  revealedIds,
  matchedIds,
  onCardClick,
  disabled = false,
}: MemoryBoardProps): React.JSX.Element {
  const columns = Math.ceil(Math.sqrt(cards.length));

  return (
    <div
      className="memory-board"
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      role="grid"
      aria-label="Tablero de memorama"
    >
      {cards.map((card) => {
        const isMatched = matchedIds.has(card.id);
        const isFaceUp = isMatched || revealedIds.has(card.id);
        const Icon = SYMBOL_ICONS[card.symbolId];

        return (
          <button
            key={card.id}
            type="button"
            className="memory-card"
            data-face-up={isFaceUp}
            data-matched={isMatched}
            disabled={disabled || isFaceUp}
            onClick={() => onCardClick(card)}
            aria-label={isFaceUp ? `Carta: ${card.symbolId}` : "Carta boca abajo"}
          >
            {isFaceUp && Icon ? <Icon size={24} aria-hidden="true" /> : null}
          </button>
        );
      })}
    </div>
  );
}
