# Toolchain for Replit. pnpm is NOT installed via Nix (that attribute is
# fragile across channels and was the cause of "nix environment failed to
# build"). Instead, Node's bundled corepack provides the exact pnpm pinned in
# package.json's "packageManager" field. These remaining deps are stable
# attributes that always evaluate, plus the C toolchain better-sqlite3 needs.
{ pkgs }:
{
  deps = [
    pkgs.nodejs_20
    pkgs.python3
    pkgs.gnumake
    pkgs.gcc
  ];
}
