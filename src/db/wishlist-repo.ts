import { asc } from "drizzle-orm";
import type { DB } from "./client";
import { wishlist, type WishlistItem } from "./schema";

export function listWishlist(db: DB): WishlistItem[] {
  return db.select().from(wishlist).orderBy(asc(wishlist.orderIndex)).all();
}
