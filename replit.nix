# Toolchain for Replit: Node 20, pnpm, and the C toolchain better-sqlite3 needs
# to build its native binding if a prebuilt binary isn't available.
{ pkgs }:
{
  deps = [
    pkgs.nodejs_20
    pkgs.pnpm
    pkgs.python3
    pkgs.gnumake
    pkgs.gcc
  ];
}
