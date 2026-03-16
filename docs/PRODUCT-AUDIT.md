# Motto Ocha — Product Audit & Recommendations

**Goals (current focus):**
- Keep the product **as simple as possible**.
- Maintain **our own list of teas** and **brands/vendors**; track to **farm** when possible.
- **Core customer flow:** take a picture or describe the tea → we **recognize it** → add to their **tea log**.
- Product = **tea browsing/discovery** + **tea log**.

---

## 1. Current State Summary

| Area | What exists |
|------|-------------|
| **Catalog** | `Tea`, `Vendor`, `Farm` (optional), `TeaCategory`, `TasteTag`, `TeaAlias`, `TeaBarcode`. Populated by seed, scrapers (Samovar, Song, Ippodo, Red Blossom), and admin. |
| **Recognition** | **Two separate flows:** (1) **Identify** (`/api/identify`): text or barcode → search DB (name, alias, vendor, farm). Used by IdentifyTeaPanel at `/identify`. (2) **Log tea** (`/api/log-tea`): describe or photo → Claude extracts data → **always creates a new Tea** + TeaReview + add to "tried" list. No matching against existing catalog. |
| **Tea log** | User’s “journal” = **TeaReview** (rating, notes) + **“tried” list** (ListTea). GET merges reviews and list entries. |
| **Browse** | `/teas` (filter by category, scale, year), `/teas/[slug]`, `/vendors`, `/farms`. Tea cards show category, vendor, taste tags; farm on card but not on tea detail page. |
| **Lists** | Default lists: Favorites, Want to try, Tried. `List` + `ListTea`; `UserTea` exists in schema but there’s a migration script to move data to lists (can be removed after migration). |

---

## 2. What Already Aligns With Your Goals

- **Own list of teas + vendors:** You have a curated catalog (scrapers + admin) and find-or-create vendor on log.
- **Farm when possible:** `Farm` is in the schema and used in browse (cards, farms page, admin). Teas can be linked to a farm; you can extend “when possible” later (e.g. extraction or manual link).
- **Browsing and discovery:** Public `/teas`, `/vendors`, `/farms` with filters and detail pages.
- **Tea log:** Describe or photo → Claude → save as a log (review + tried). Flow is clear.

---

## 3. Gaps and Recommendations

### 3.1 Match before create (high impact)

**Issue:** When a user logs a tea via description/photo, the app **always creates a new Tea**. So the catalog grows with duplicates and “recognize it” doesn’t actually use your catalog.

**Recommendation:** After Claude extraction, **search the catalog** for an existing tea (e.g. by normalized name + vendor, or by calling your existing identify logic with extracted name/vendor).  
- **If there’s a good match:** create only **TeaReview** + add to “tried” list; do **not** create a new Tea. Optionally show “We think this is [existing tea] — log this?” before saving.  
- **If no match:** keep current behavior: create Tea (+ Vendor if needed) + TeaReview + tried list.

This keeps one source of truth (your catalog) and makes “recognize it” real.

### 3.2 Unify “recognize” and “log” (medium impact)

**Issue:** Identify (text/barcode, at `/identify`) and Log (describe/photo, at `/log`) are separate. Users who want to “recognize then log” have two different UIs.

**Recommendation (optional, for simplicity):**  
- Make the **primary entry point** the log flow: describe or photo → extract → **match** → “Log this tea” (existing) or “Add as new and log” (create + log).  
- Reuse `/api/identify` (or equivalent logic) **server-side** after extraction to find matches (e.g. by `extracted.nameEnglish`, `extracted.vendorName`).  
- You can keep Identify as a power-user or barcode-only tool, or fold barcode into the log flow (e.g. “or scan barcode” that runs identify and then offers “Log this tea”).

### 3.3 Farm on tea detail and in extraction (low effort)

**Issue:** Tea detail page (`/teas/[slug]`) doesn’t load or show farm. Farm is optional in extraction.

**Recommendation:**  
- **Tea detail:** Include `farm` in the tea query and show “Farm: [name]” with link to `/farms/[slug]` when `tea.farm` exists.  
- **Extraction (later):** If you want “track to farm when possible,” add optional `farmName` (or region/prefecture) to Claude extraction and, when saving a **new** tea, try to resolve to an existing `Farm` (e.g. by name or region). No need to block MVP.

### 3.4 Simplify data model (optional)

- **UserTea:** If migration to List/ListTea is done, remove `UserTea` and the migration script to avoid confusion.  
- **Tea log as single concept:** Right now one “log” creates both a TeaReview (if rating/notes) and a ListTea in “tried.” You could derive “tried” from “has at least one TeaReview” and drop the separate list entry for that case; or keep both if “tried without review” is desired. Either way, document the rule so the codebase stays consistent.  
- **Scope down for MVP:** Mocktails, brew guides (global + per-user), and roles (reviewer, expert) add surface area. Consider hiding or deferring them until after “browse + log + recognize” is solid.

### 3.5 Barcode in the log flow (nice-to-have)

Identify already supports barcode. For “take a picture,” you could run barcode detection on the uploaded image; if a barcode is found, call `/api/identify` and prefill with the match, then let the user confirm and log. Improves recognition when the photo is of packaging.

---

## 4. Suggested Order of Work

1. **Match before create** in `/api/log-tea` (search by extracted name + vendor; if match, link review to existing tea and add to tried; else create tea as today).  
2. **Show farm** on tea detail page.  
3. (Optional) Unify recognize + log in one flow and/or add “We think this is [tea]” confirmation in the log UI.  
4. (Optional) Clean up UserTea and trim scope (Mocktails, brew guides) if you want to keep “as simple as possible.”

---

## 5. Summary

- **Catalog and farm:** You already maintain teas, vendors, and farms; farm can be shown on tea detail and used in extraction later.  
- **Recognition:** The main gap is that logging **always** creates a new tea. Implementing **match-before-create** (using your existing catalog and identify-style search) makes “recognize it” real and keeps the catalog clean.  
- **Simplicity:** One main flow (describe/photo → recognize → log), optional barcode, and trimming or deferring Mocktails/brew guides will keep the product focused on tea browsing and tea log.
