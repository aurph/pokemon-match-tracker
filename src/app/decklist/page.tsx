import { db } from "@/db/client";
import { listDeckCards } from "@/db/deck-cards-repo";
import { listWishlist } from "@/db/wishlist-repo";
import { groupDeckSections, deckGrandTotal } from "@/lib/deck-sections";
import { PageHeader } from "@/components/page-header";
import { DeckCardRow } from "@/components/deck-card-row";

export const dynamic = "force-dynamic";

export default function DecklistPage() {
  const cards = listDeckCards(db);
  const wishlist = listWishlist(db);
  const sections = groupDeckSections(cards);
  const total = deckGrandTotal(cards);
  const legal = total === 60;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Decklist"
        subtitle="Your 60-card Elgyem control list"
        actions={
          <div className="flex flex-col items-end leading-none">
            <span className="text-[11px] font-medium uppercase tracking-wide text-p-muted">Total</span>
            <span
              className={
                "font-pixel text-2xl tabular-nums " + (legal ? "text-p-good" : "text-p-bad")
              }
            >
              {total}
              <span className="text-base font-medium text-p-muted">/60</span>
            </span>
          </div>
        }
      />

      <div className="space-y-5">
        {sections.map((section) => (
          <section
            key={section.key}
            className="rounded-lg border-2 border-p-title bg-p-surface p-4"
          >
            <header className="mb-2 flex items-baseline justify-between border-b border-p-border pb-2">
              <h2 className="font-pixel text-xs text-p-title">
                {section.label}
              </h2>
              <span className="font-mono text-sm font-semibold text-p-primary">
                {section.subtotal}
              </span>
            </header>
            <div className="divide-y divide-p-border/60">
              {section.cards.map((card) => (
                <DeckCardRow key={card.id} card={card} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="mt-6 rounded-lg border-2 border-p-title bg-p-surface p-4">
        <header className="mb-2 flex items-baseline justify-between border-b border-p-border pb-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-p-title">
            Sideboard / Wishlist
          </h2>
          {wishlist.length > 0 && (
            <span className="font-mono text-sm font-semibold text-p-primary">{wishlist.length}</span>
          )}
        </header>
        {wishlist.length === 0 ? (
          <p className="py-6 text-center text-sm text-p-muted">Nothing on the wishlist yet.</p>
        ) : (
          <ul className="divide-y divide-p-border/60">
            {wishlist.map((w) => (
              <li key={w.id} className="flex items-center gap-3 py-2">
                <span className="font-mono text-sm font-semibold text-p-title">{w.count}×</span>
                <span className="font-medium text-p-title">{w.name}</span>
                <span className="font-mono text-xs text-p-muted">
                  {w.setCode} · {w.setNumber}
                </span>
                {w.priority && (
                  <span className="ml-auto rounded-full bg-p-kpi-bg px-2 py-0.5 text-[11px] font-medium text-p-primary">
                    {w.priority}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
