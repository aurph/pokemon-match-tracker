const BASE = "/api";

async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  getDashboard: () => req<any>("/dashboard"),
  listGames: () => req<any[]>("/games"),
  createGame: (body: any) => req<any>("/games", { method: "POST", body: JSON.stringify(body) }),
  updateGame: (id: string, body: any) =>
    req<any>(`/games/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteGame: (id: string) => req<void>(`/games/${id}`, { method: "DELETE" }),
  getGamesMeta: () => req<{ deckNames: string[]; opponentDecks: string[] }>("/games/meta"),
  addCustomOpponentDeck: (name: string) =>
    req<any>("/games/custom-opponent-decks", { method: "POST", body: JSON.stringify({ name }) }),
  listDeckCards: () => req<{ cards: any[]; wishlist: any[] }>("/decklist"),
  updateDeckCard: (id: string, body: any) =>
    req<any>(`/decklist/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  listIterations: () => req<any[]>("/iterations"),
  createIteration: (body: any) =>
    req<any>("/iterations", { method: "POST", body: JSON.stringify(body) }),
  exportData: () => `${BASE}/export`,
  importData: (json: string) =>
    req<any>("/settings/import", { method: "POST", body: JSON.stringify({ json }) }),
  wipeGames: () => req<any>("/settings/wipe-games", { method: "POST" }),
  wipeAll: () => req<any>("/settings/wipe-all", { method: "POST" }),
};
