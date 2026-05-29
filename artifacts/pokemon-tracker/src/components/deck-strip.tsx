import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { api } from "@/lib/api";
import { groupDeckSections, deckGrandTotal } from "@/lib/deck-sections";

// Read-only, compact card-art view of the deck for the dashboard. Editing lives
// on the Decklist page; this is just a scannable "what's in the 60" at a glance.
function CardThumb({ card }: { card: any }) {
  return (
    <div className="relative shrink-0" title={`${card.count}× ${card.name}`}>
      {card.imageLocalPath ? (
        <img
          src={card.imageLocalPath}
          alt={card.name}
          loading="lazy"
          className={
            "h-20 w-auto rounded-md border border-p-border bg-p-bg object-contain " +
            (card.count === 0 ? "opacity-40 grayscale" : "")
          }
        />
      ) : (
        <div className="flex h-20 w-14 items-center justify-center rounded-md border border-dashed border-p-border bg-p-bg px-1 text-center text-[9px] leading-tight text-p-muted">
          {card.name}
        </div>
      )}
      <span className="absolute -bottom-1 -right-1 rounded bg-p-title px-1 font-mono text-[10px] font-bold text-p-surface">
        {card.count}
      </span>
    </div>
  );
}

export function DeckStrip() {
  const { data, isLoading } = useQuery({ queryKey: ["decklist"], queryFn: api.listDeckCards });
  const cards = data?.cards ?? [];
  const sections = groupDeckSections(cards);
  const total = deckGrandTotal(cards);
  const legal = total === 60;

  return (
    <section className="rounded-lg border-2 border-p-title bg-p-surface">
      <header className="flex items-center justify-between border-b-2 border-p-border px-3 py-2">
        <h3 className="font-pixel text-xs text-p-title">DECKLIST</h3>
        <div className="flex items-center gap-3">
          <span className={"font-mono text-sm tabular-nums " + (legal ? "text-p-good" : "text-p-bad")}>
            {total}/60
          </span>
          <Link href="/decklist" className="text-xs font-medium text-p-primary hover:underline">
            Edit →
          </Link>
        </div>
      </header>
      {isLoading ? (
        <p className="p-6 text-center text-sm text-p-muted">Loading deck…</p>
      ) : total === 0 ? (
        <p className="p-6 text-center text-sm text-p-muted">No cards yet.</p>
      ) : (
        <div className="space-y-3 p-3">
          {sections.map((section) => (
            <div key={section.key}>
              <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-p-muted">
                {section.label} · {section.subtotal}
              </div>
              <div className="flex flex-wrap gap-2">
                {section.cards.map((card) => (
                  <CardThumb key={card.id} card={card} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
