import { db } from "@/db/client";
import { listGames, listCustomOpponentDecks } from "@/db/games-repo";
import { deckCards } from "@/db/schema";
import { OPPONENT_DECKS } from "@/lib/enums";
import { PageHeader } from "@/components/page-header";
import { GamesView } from "@/components/games-view";
import { PixelSprite } from "@/components/pixel-sprite";
import { ELGYEM_SPRITE } from "@/lib/sprites";

export const dynamic = "force-dynamic";

export default function GamesPage() {
  const games = listGames(db);
  const deckNames = Array.from(
    new Set(
      db
        .select({ name: deckCards.name })
        .from(deckCards)
        .orderBy(deckCards.orderIndex)
        .all()
        .map((r) => r.name),
    ),
  );
  const opponentDecks = [...OPPONENT_DECKS, ...listCustomOpponentDecks(db)];

  return (
    <div>
      <PageHeader
        title="Games"
        subtitle="Match log — click any row to edit"
        icon={<PixelSprite src={ELGYEM_SPRITE} alt="Elgyem" size={36} />}
      />
      <GamesView games={games} deckNames={deckNames} opponentDecks={opponentDecks} />
    </div>
  );
}
