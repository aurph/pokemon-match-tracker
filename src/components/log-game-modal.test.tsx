import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// The action touches the DB; stub it so this stays a unit test.
vi.mock("@/app/games/actions", () => ({ addGameAction: vi.fn(async () => ({ ok: true })) }));

import { LogGameModal } from "./log-game-modal";
import { addGameAction } from "@/app/games/actions";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("LogGameModal", () => {
  it("opens when the trigger is clicked", () => {
    render(<LogGameModal />);
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /log game/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("blocks submit and shows an error when mulligans are out of range", async () => {
    render(<LogGameModal />);
    fireEvent.click(screen.getByRole("button", { name: /log game/i }));
    fireEvent.change(screen.getByLabelText(/my mulligans/i), { target: { value: "25" } });
    fireEvent.click(screen.getByRole("button", { name: /save game/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/between 0 and 20/i);
    expect(addGameAction).not.toHaveBeenCalled();
  });

  it("calls the action with valid input", async () => {
    render(<LogGameModal />);
    fireEvent.click(screen.getByRole("button", { name: /log game/i }));
    fireEvent.click(screen.getByRole("button", { name: /save game/i }));
    await waitFor(() => expect(addGameAction).toHaveBeenCalledTimes(1));
  });
});
