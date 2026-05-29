import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { GamesView } from "@/components/games-view";
import { PixelSprite } from "@/components/pixel-sprite";
import { POKEBALL_SPRITE } from "@/lib/sprites";

export function GamesPage() {
  const qc = useQueryClient();
  const { data: games, isLoading } = useQuery({
    queryKey: ["games"],
    queryFn: api.listGames,
  });
  const { data: meta } = useQuery({
    queryKey: ["games-meta"],
    queryFn: api.getGamesMeta,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["games"] });
    qc.invalidateQueries({ queryKey: ["games-meta"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };

  if (isLoading) return <div className="p-8 text-p-muted">Loading…</div>;

  return (
    <div>
      <PageHeader
        title="Games"
        subtitle="Match log — click any row to edit"
        icon={<PixelSprite src={POKEBALL_SPRITE} alt="" size={36} />}
      />
      <GamesView
        games={games ?? []}
        deckNames={meta?.deckNames ?? []}
        opponentDecks={meta?.opponentDecks ?? []}
        onRefresh={refresh}
      />
    </div>
  );
}
