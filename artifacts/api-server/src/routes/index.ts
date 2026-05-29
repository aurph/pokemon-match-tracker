import { Router, type IRouter } from "express";
import { db } from "../db/client";
import { runMigrations } from "../db/migrate";
import {
  listGames,
  createGame,
  updateGame,
  deleteGame,
  listCustomOpponentDecks,
  addCustomOpponentDeck,
} from "../db/games-repo";
import { listDeckCards, updateDeckCard } from "../db/deck-cards-repo";
import { listIterations, createIteration } from "../db/iterations-repo";
import { listWishlist } from "../db/wishlist-repo";
import { seedDeckCards, seedFirstIteration } from "../db/seed-data";
import { deckCards, games as gamesTable, iterations as iterTable, wishlist as wlTable, customOpponentDecks as codTable, tournaments as tourTable } from "../db/schema";
import { OPPONENT_DECKS } from "../lib/enums";
import {
  winPct,
  lastNWinPct,
  rollingWinPct,
  goingWinPct,
  formatGameWinPct,
  mulliganRate,
  avgTurns,
  avgTimeMin,
  avgHandQuality,
  bo3MatchWinPct,
  handQualityHistogram,
  perOpponent,
  currentStreak,
  longestStreak,
  favoriteVictim,
  nemesis,
} from "../lib/stats";
import { asc } from "drizzle-orm";

runMigrations(db);

const deckCount = db.select().from(deckCards).all().length;
if (deckCount === 0) {
  seedDeckCards(db);
  seedFirstIteration(db);
}

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

router.get("/games/meta", (_req, res) => {
  const names = Array.from(
    new Set(
      db
        .select({ name: deckCards.name })
        .from(deckCards)
        .orderBy(asc(deckCards.orderIndex))
        .all()
        .map((r) => r.name),
    ),
  );
  const opponentDecks = [...OPPONENT_DECKS, ...listCustomOpponentDecks(db)];
  res.json({ deckNames: names, opponentDecks });
});

router.post("/games/custom-opponent-decks", (req, res) => {
  addCustomOpponentDeck(db, req.body.name ?? "");
  res.status(201).json({ ok: true });
});

router.get("/games", (_req, res) => {
  res.json(listGames(db));
});

router.post("/games", (req, res) => {
  try {
    const body = req.body;
    const game = createGame(db, {
      event: body.event ?? "Casual",
      format: body.format,
      opponentDeck: body.opponentDeck,
      opponentName: body.opponentName ?? null,
      round: body.round ?? null,
      going: body.going,
      coinFlip: body.coinFlip ?? null,
      result: body.result,
      myMulligans: body.myMulligans ?? 0,
      oppMulligans: body.oppMulligans ?? 0,
      handQuality: body.handQuality ?? null,
      turnCount: body.turnCount ?? null,
      timeUsedMin: body.timeUsedMin ?? null,
      lockTurn: body.lockTurn ?? null,
      prizeTrade: body.prizeTrade ?? null,
      keyCardsDrawn: body.keyCardsDrawn ?? null,
      techCardsUsed: body.techCardsUsed ?? null,
      prizedCards: body.prizedCards ?? null,
      mistakes: body.mistakes ?? null,
      notes: body.notes ?? null,
      playedAt: body.playedAt ?? Date.now(),
      newMatch: body.newMatch ?? true,
      matchId: body.matchId ?? null,
      gameNumber: body.gameNumber ?? 1,
    });
    res.status(201).json(game);
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

router.patch("/games/:id", (req, res) => {
  try {
    const { id } = req.params;
    const existing = listGames(db).find((g) => g.id === id);
    if (!existing) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    updateGame(db, id, req.body);
    const updated = listGames(db).find((g) => g.id === id)!;
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

router.delete("/games/:id", (req, res) => {
  deleteGame(db, req.params.id);
  res.status(204).end();
});

router.get("/dashboard", (_req, res) => {
  const games = listGames(db);
  const bo1 = games.filter((g) => g.format === "BO1");
  const bo3 = games.filter((g) => g.format === "BO3");
  const kpis = {
    total: games.length,
    winPct: winPct(games),
    last10WinPct: lastNWinPct(games, 10),
    going1stWinPct: goingWinPct(games, "1st"),
    going2ndWinPct: goingWinPct(games, "2nd"),
    mulliganRate: mulliganRate(games),
    bo1WinPct: formatGameWinPct(bo1, "BO1"),
    bo3GameWinPct: winPct(bo3),
    bo3MatchWinPct: bo3MatchWinPct(games),
    avgTurns: avgTurns(games),
    avgTimeMin: avgTimeMin(games),
    avgHandQuality: avgHandQuality(games),
  };
  const recentGames = [...games].sort((a, b) => b.playedAt - a.playedAt).slice(0, 10);
  res.json({
    games,
    kpis,
    rollingWinPct: rollingWinPct(games),
    handQualityHistogram: handQualityHistogram(games),
    matchupTable: perOpponent(games),
    recentGames,
    streak: currentStreak(games),
    longestWinStreak: longestStreak(games, "W"),
    favoriteVictim: favoriteVictim(games),
    nemesis: nemesis(games),
  });
});

router.get("/decklist", (_req, res) => {
  const cards = listDeckCards(db);
  const wishlistItems = listWishlist(db);
  res.json({ cards, wishlist: wishlistItems });
});

router.patch("/decklist/:id", (req, res) => {
  try {
    updateDeckCard(db, req.params.id, req.body);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

router.get("/iterations", (_req, res) => {
  res.json(listIterations(db));
});

router.post("/iterations", (req, res) => {
  try {
    const body = req.body;
    const dated = body.date ? new Date(body.date).getTime() : Date.now();
    const iteration = createIteration(db, {
      dated,
      version: body.version,
      cardsIn: body.cardsIn ? [body.cardsIn] : null,
      cardsOut: body.cardsOut ? [body.cardsOut] : null,
      reasoning: body.reasoning ?? null,
      testedVs: body.testedVs ?? null,
      verdict: body.verdict ?? null,
    });
    res.status(201).json(iteration);
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

router.get("/export", (_req, res) => {
  const data = {
    games: listGames(db),
    deckCards: listDeckCards(db),
    iterations: listIterations(db),
    wishlist: listWishlist(db),
    customOpponentDecks: db.select().from(codTable).all(),
    tournaments: db.select().from(tourTable).all(),
    exportedAt: new Date().toISOString(),
  };
  res.setHeader("Content-Disposition", `attachment; filename="pokemon-tracker-export.json"`);
  res.json(data);
});

router.post("/settings/import", (req, res) => {
  try {
    const raw = req.body.json;
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;

    db.transaction(() => {
      if (Array.isArray(data.games) && data.games.length > 0) {
        db.delete(gamesTable).run();
        for (const g of data.games) db.insert(gamesTable).values(g).run();
      }
      if (Array.isArray(data.deckCards) && data.deckCards.length > 0) {
        db.delete(deckCards).run();
        for (const c of data.deckCards) db.insert(deckCards).values(c).run();
      }
      if (Array.isArray(data.iterations) && data.iterations.length > 0) {
        db.delete(iterTable).run();
        for (const it of data.iterations) db.insert(iterTable).values(it).run();
      }
      if (Array.isArray(data.wishlist) && data.wishlist.length > 0) {
        db.delete(wlTable).run();
        for (const w of data.wishlist) db.insert(wlTable).values(w).run();
      }
      if (Array.isArray(data.customOpponentDecks) && data.customOpponentDecks.length > 0) {
        db.delete(codTable).run();
        for (const c of data.customOpponentDecks) db.insert(codTable).values(c).run();
      }
      if (Array.isArray(data.tournaments) && data.tournaments.length > 0) {
        db.delete(tourTable).run();
        for (const t of data.tournaments) db.insert(tourTable).values(t).run();
      }
    });

    res.json({
      ok: true,
      imported: {
        games: data.games?.length ?? 0,
        deckCards: data.deckCards?.length ?? 0,
        iterations: data.iterations?.length ?? 0,
        wishlist: data.wishlist?.length ?? 0,
        customOpponentDecks: data.customOpponentDecks?.length ?? 0,
        tournaments: data.tournaments?.length ?? 0,
      },
    });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

router.post("/settings/wipe-games", (_req, res) => {
  db.delete(gamesTable).run();
  res.json({ ok: true });
});

router.post("/settings/wipe-all", (_req, res) => {
  db.delete(gamesTable).run();
  db.delete(iterTable).run();
  db.delete(wlTable).run();
  db.delete(codTable).run();
  db.delete(deckCards).run();
  seedDeckCards(db);
  seedFirstIteration(db);
  res.json({ ok: true });
});

export default router;
