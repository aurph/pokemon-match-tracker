import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/app/games/actions", () => ({
  addGameAction: vi.fn(async () => ({ ok: true })),
  updateGameAction: vi.fn(async () => ({ ok: true })),
  deleteGameAction: vi.fn(async () => ({ ok: true })),
  addCustomOpponentDeckAction: vi.fn(async () => ({ ok: true })),
}));

import { GameModal } from "./game-modal";
import { addGameAction } from "@/app/games/actions";

const props = { deckNames: ["Dreepy", "Elgyem"], opponentDecks: ["Charizard ex"] };
const noop = () => {};

beforeEach(() => vi.clearAllMocks());

describe("GameModal", () => {
  it("shows the form when open", () => {
    render(<GameModal onClose={noop} mode="add" {...props} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/log a game/i)).toBeInTheDocument();
  });

  it("blocks submit when mulligans are out of range", async () => {
    render(<GameModal onClose={noop} mode="add" {...props} />);
    fireEvent.change(screen.getByLabelText(/opponent deck/i), { target: { value: "Charizard ex" } });
    fireEvent.change(screen.getByLabelText(/my mulligans/i), { target: { value: "30" } });
    fireEvent.click(screen.getByRole("button", { name: /save game/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/between 0 and 20/i);
    expect(addGameAction).not.toHaveBeenCalled();
  });

  it("submits a valid game", async () => {
    render(<GameModal onClose={noop} mode="add" {...props} />);
    fireEvent.change(screen.getByLabelText(/opponent deck/i), { target: { value: "Charizard ex" } });
    fireEvent.click(screen.getByRole("button", { name: /save game/i }));
    await waitFor(() => expect(addGameAction).toHaveBeenCalledTimes(1));
  });

  it("toggles prized-card chips", () => {
    render(<GameModal onClose={noop} mode="add" {...props} />);
    const chip = screen.getByRole("button", { name: "Dreepy" });
    fireEvent.click(chip);
    expect(screen.getByText(/prized cards \(1\)/i)).toBeInTheDocument();
  });
});
