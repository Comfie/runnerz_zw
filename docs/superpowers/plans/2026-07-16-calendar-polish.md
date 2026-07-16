# Calendar Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the public event experience: photo galleries with real uploads, club public pages, embedded maps, and race-day weather.

**Architecture:** Vercel Blob stores images uploaded through server actions; a new `EventPhoto` table holds gallery rows. Pure helpers (`geo.ts`, `weather.ts`, `photos.ts` validation) carry the logic and the unit tests; server actions stay thin orchestration following the existing `requireOrganiser()` + ownership-check pattern.

**Tech Stack:** Next.js 16 App Router, Prisma/Postgres, `@vercel/blob`, Open-Meteo API (no key), Vitest.

## Global Constraints

- **Commits require user approval** (CLAUDE.md: never commit without explicit instruction). At each commit step, ask the user first — unless they have granted blanket approval for this plan's commits.
- Spec: `docs/superpowers/specs/2026-07-16-calendar-polish-design.md`.
- Next.js 16 has breaking changes — consult `node_modules/next/dist/docs/` when an API is in doubt (AGENTS.md).
- Image constraints: jpeg/png/webp only, max 5 MB per file, max 12 photos per event.
- Weather: Open-Meteo, `timezone=Africa/Harare`, 16-day horizon, revalidate 10800 s, failures render nothing.
- Tests run against the dev database (existing pattern: real `db` calls with `beforeAll`/`afterAll` cleanup). Test command: `npx vitest run <file>`. Full gate: `npm test`, `npx tsc --noEmit`, `npm run lint`.
- No new comments/docstrings; match existing code style (no semicolons in `src/`, `className="field"` inputs, `surface rounded-[1.5rem]` cards).
- Env var `BLOB_READ_WRITE_TOKEN` must exist in `.env` (from Vercel Blob store) for uploads to work locally — flag to the user when reaching Task 3 if missing.

---

### Task 1: EventPhoto model + migration

**Files:**
- Modify: `prisma/schema.prisma`
- Test: `tests/photos.test.ts` (created here, extended in Task 2)

**Interfaces:**
- Produces: `db.eventPhoto` Prisma delegate; `Event.photos` relation.

- [ ] **Step 1: Add the model to `prisma/schema.prisma`**

Add after the `Event` model:

```prisma
model EventPhoto {
  id        String   @id @default(cuid())
  eventId   String
  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  url       String
  caption   String?
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())
}
```

And inside the `Event` model, after `registrations Registration[]`:

```prisma
  photos          EventPhoto[]
```

- [ ] **Step 2: Run the migration**

Run: `npx prisma migrate dev --name add_event_photos`
Expected: migration created and applied, client regenerated.

- [ ] **Step 3: Write a failing-first test for cascade delete**

Create `tests/photos.test.ts`:

```ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";

let clubId: string;
let eventId: string;

beforeAll(async () => {
  const club = await db.club.create({
    data: { name: "Photo AC", contact: "p", verified: true },
  });
  const e = await db.event.create({
    data: {
      title: "Photo Race",
      description: "d",
      startsAt: new Date(),
      locationText: "H",
      distanceOptions: ["5k"],
      paymentInfo: "p",
      clubId: club.id,
    },
  });
  clubId = club.id;
  eventId = e.id;
});

afterAll(async () => {
  await db.eventPhoto.deleteMany();
  await db.event.deleteMany();
  await db.club.deleteMany();
});

describe("EventPhoto", () => {
  it("cascades photo deletion when the event is deleted", async () => {
    const e = await db.event.create({
      data: {
        title: "Temp",
        description: "d",
        startsAt: new Date(),
        locationText: "H",
        distanceOptions: ["5k"],
        paymentInfo: "p",
        clubId,
      },
    });
    await db.eventPhoto.create({
      data: { eventId: e.id, url: "https://example.com/a.jpg" },
    });
    await db.event.delete({ where: { id: e.id } });
    const remaining = await db.eventPhoto.count({ where: { eventId: e.id } });
    expect(remaining).toBe(0);
  });
});
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run tests/photos.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit (ask user first)**

```bash
git add prisma tests/photos.test.ts
git commit -m "feat: add EventPhoto model with cascade delete"
```

---

### Task 2: Photo validation + DB helpers (`src/lib/photos.ts`)

**Files:**
- Create: `src/lib/photos.ts`
- Test: `tests/photos.test.ts` (extend)

**Interfaces:**
- Consumes: `db.eventPhoto` from Task 1.
- Produces:
  - `MAX_PHOTOS_PER_EVENT: number` (12)
  - `validateImageFile(file: { type: string; size: number }): string | null`
  - `assertCanAddPhotos(eventId: string, clubId: string, count: number): Promise<void>` (throws `"not your event"` / `"photo limit reached"`)
  - `createEventPhotos(eventId: string, urls: string[]): Promise<unknown>`
  - `deleteEventPhoto(photoId: string, clubId: string): Promise<string>` (returns blob url; throws `"not your photo"`)
  - `updateEventPhotoCaption(photoId: string, clubId: string, caption: string): Promise<unknown>`
  - `listEventPhotos(eventId: string)`

- [ ] **Step 1: Write failing tests** — append to `tests/photos.test.ts` (add a second club `otherClubId` in `beforeAll` mirroring `tests/organisers.test.ts`):

```ts
import {
  MAX_PHOTOS_PER_EVENT,
  assertCanAddPhotos,
  createEventPhotos,
  deleteEventPhoto,
  updateEventPhotoCaption,
  validateImageFile,
} from "@/lib/photos";

describe("validateImageFile", () => {
  it("accepts a small jpeg", () => {
    expect(validateImageFile({ type: "image/jpeg", size: 1000 })).toBeNull();
  });

  it("rejects a pdf", () => {
    expect(validateImageFile({ type: "application/pdf", size: 1000 })).toMatch(
      /JPEG, PNG or WebP/,
    );
  });

  it("rejects files over 5 MB", () => {
    expect(
      validateImageFile({ type: "image/png", size: 5 * 1024 * 1024 + 1 }),
    ).toMatch(/5 MB/);
  });
});

describe("photo helpers", () => {
  it("refuses to add photos to another club's event", async () => {
    await expect(assertCanAddPhotos(eventId, otherClubId, 1)).rejects.toThrow(
      "not your event",
    );
  });

  it("enforces the photo cap", async () => {
    await expect(
      assertCanAddPhotos(eventId, clubId, MAX_PHOTOS_PER_EVENT + 1),
    ).rejects.toThrow("photo limit reached");
  });

  it("creates, captions, and deletes photos with ownership checks", async () => {
    await createEventPhotos(eventId, ["https://example.com/1.jpg"]);
    const photo = await db.eventPhoto.findFirstOrThrow({ where: { eventId } });

    await expect(
      updateEventPhotoCaption(photo.id, otherClubId, "x"),
    ).rejects.toThrow("not your photo");
    await updateEventPhotoCaption(photo.id, clubId, "Start line");
    const updated = await db.eventPhoto.findUniqueOrThrow({
      where: { id: photo.id },
    });
    expect(updated.caption).toBe("Start line");

    await expect(deleteEventPhoto(photo.id, otherClubId)).rejects.toThrow(
      "not your photo",
    );
    const url = await deleteEventPhoto(photo.id, clubId);
    expect(url).toBe("https://example.com/1.jpg");
    expect(await db.eventPhoto.count({ where: { eventId } })).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/photos.test.ts`
Expected: FAIL — cannot resolve `@/lib/photos`.

- [ ] **Step 3: Implement `src/lib/photos.ts`**

```ts
import { db } from "@/lib/db"

export const MAX_PHOTOS_PER_EVENT = 12
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_BYTES = 5 * 1024 * 1024

export function validateImageFile(file: {
  type: string
  size: number
}): string | null {
  if (!ALLOWED_TYPES.includes(file.type))
    return "Only JPEG, PNG or WebP images are allowed"
  if (file.size > MAX_BYTES) return "Images must be 5 MB or smaller"
  return null
}

export async function assertCanAddPhotos(
  eventId: string,
  clubId: string,
  count: number,
) {
  const event = await db.event.findUnique({
    where: { id: eventId },
    include: { _count: { select: { photos: true } } },
  })
  if (!event || event.clubId !== clubId) throw new Error("not your event")
  if (event._count.photos + count > MAX_PHOTOS_PER_EVENT)
    throw new Error("photo limit reached")
}

export function createEventPhotos(eventId: string, urls: string[]) {
  return db.eventPhoto.createMany({
    data: urls.map((url) => ({ eventId, url })),
  })
}

async function requireOwnedPhoto(photoId: string, clubId: string) {
  const photo = await db.eventPhoto.findUnique({
    where: { id: photoId },
    include: { event: true },
  })
  if (!photo || photo.event.clubId !== clubId)
    throw new Error("not your photo")
  return photo
}

export async function deleteEventPhoto(photoId: string, clubId: string) {
  const photo = await requireOwnedPhoto(photoId, clubId)
  await db.eventPhoto.delete({ where: { id: photoId } })
  return photo.url
}

export async function updateEventPhotoCaption(
  photoId: string,
  clubId: string,
  caption: string,
) {
  await requireOwnedPhoto(photoId, clubId)
  return db.eventPhoto.update({
    where: { id: photoId },
    data: { caption: caption.trim() || null },
  })
}

export function listEventPhotos(eventId: string) {
  return db.eventPhoto.findMany({
    where: { eventId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  })
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/photos.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit (ask user first)**

```bash
git add src/lib/photos.ts tests/photos.test.ts
git commit -m "feat: add photo validation and gallery db helpers"
```

---

### Task 3: Vercel Blob setup + cover image upload

**Files:**
- Create: `src/lib/blob.ts`
- Modify: `next.config.ts`, `src/app/organiser/events/new/page.tsx`, `src/app/organiser/events/new/actions.ts`, `src/app/organiser/events/[id]/edit/page.tsx`, `src/app/organiser/events/[id]/edit/actions.ts`
- Modify: `package.json` (dependency)

**Interfaces:**
- Consumes: `validateImageFile` from Task 2.
- Produces: `uploadEventImage(prefix: string, file: File): Promise<string>` (returns public blob URL).

- [ ] **Step 1: Install the dependency**

Run: `npm install @vercel/blob`
Expected: added to `package.json` dependencies.

Check `.env` for `BLOB_READ_WRITE_TOKEN`. If missing, tell the user: they must create a Blob store on the Vercel project (Storage → Create → Blob) and paste the token into `.env`; uploads will fail locally until then.

- [ ] **Step 2: Raise the server-action body limit in `next.config.ts`**

```ts
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "30mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
}

export default nextConfig
```

- [ ] **Step 3: Create `src/lib/blob.ts`**

```ts
import { put } from "@vercel/blob"

export async function uploadEventImage(prefix: string, file: File) {
  const blob = await put(`${prefix}/${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  })
  return blob.url
}
```

- [ ] **Step 4: Add the file input to both forms**

In `src/app/organiser/events/new/page.tsx`, replace the `coverImageUrl` input block with:

```tsx
      <label className="block text-sm font-bold">
        Cover photo
        <input
          type="file"
          name="coverImage"
          accept="image/jpeg,image/png,image/webp"
          className="field mt-1"
        />
      </label>
      <input
        name="coverImageUrl"
        placeholder="…or paste a cover image URL"
        className="field"
      />
```

In `src/app/organiser/events/[id]/edit/page.tsx`, replace the `coverImageUrl` input with the same block, keeping `defaultValue={event.coverImageUrl ?? ""}` on the URL input.

- [ ] **Step 5: Handle the file in both actions**

In `src/app/organiser/events/new/actions.ts` add imports and resolve the cover URL before `saveEvent`:

```ts
import { uploadEventImage } from "@/lib/blob"
import { validateImageFile } from "@/lib/photos"
```

```ts
  const coverFile = formData.get("coverImage")
  let coverImageUrl = String(formData.get("coverImageUrl") ?? "") || null
  if (coverFile instanceof File && coverFile.size > 0) {
    const fileError = validateImageFile(coverFile)
    if (fileError) throw new Error(fileError)
    coverImageUrl = await uploadEventImage("events/covers", coverFile)
  }
```

Then pass `coverImageUrl` (the variable) instead of the inline `String(formData.get("coverImageUrl") ?? "") || null`. Apply the identical change to `src/app/organiser/events/[id]/edit/actions.ts`.

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit && npm test`
Expected: clean, all tests pass.
Manual (if `BLOB_READ_WRITE_TOKEN` present): `npm run dev`, create an event with an uploaded cover, confirm the blob URL renders on the event page.

- [ ] **Step 7: Commit (ask user first)**

```bash
git add package.json package-lock.json next.config.ts src/lib/blob.ts src/app/organiser/events
git commit -m "feat: cover image upload via Vercel Blob"
```

---

### Task 4: Gallery management on the organiser edit page

**Files:**
- Modify: `src/app/organiser/events/[id]/edit/page.tsx`, `src/app/organiser/events/[id]/edit/actions.ts`

**Interfaces:**
- Consumes: Task 2 helpers, `uploadEventImage` from Task 3.
- Produces: server actions `uploadPhotos(eventId, formData)`, `saveCaption(eventId, photoId, formData)`, `removePhoto(eventId, photoId)`.

- [ ] **Step 1: Add the three server actions to `src/app/organiser/events/[id]/edit/actions.ts`**

Add imports:

```ts
import { revalidatePath } from "next/cache"
import { del } from "@vercel/blob"
import { uploadEventImage } from "@/lib/blob"
import {
  assertCanAddPhotos,
  createEventPhotos,
  deleteEventPhoto,
  updateEventPhotoCaption,
  validateImageFile,
} from "@/lib/photos"
```

Add actions:

```ts
export async function uploadPhotos(eventId: string, formData: FormData) {
  const { clubId } = await requireOrganiser()
  const files = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0)
  if (files.length === 0) return
  await assertCanAddPhotos(eventId, clubId, files.length)
  for (const file of files) {
    const fileError = validateImageFile(file)
    if (fileError) throw new Error(fileError)
  }
  const urls: string[] = []
  for (const file of files) {
    urls.push(await uploadEventImage(`events/${eventId}`, file))
  }
  await createEventPhotos(eventId, urls)
  revalidatePath(`/organiser/events/${eventId}/edit`)
}

export async function saveCaption(
  eventId: string,
  photoId: string,
  formData: FormData,
) {
  const { clubId } = await requireOrganiser()
  await updateEventPhotoCaption(photoId, clubId, String(formData.get("caption") ?? ""))
  revalidatePath(`/organiser/events/${eventId}/edit`)
}

export async function removePhoto(eventId: string, photoId: string) {
  const { clubId } = await requireOrganiser()
  const url = await deleteEventPhoto(photoId, clubId)
  await del(url).catch(() => {})
  revalidatePath(`/organiser/events/${eventId}/edit`)
}
```

- [ ] **Step 2: Render the photos section on the edit page**

In `src/app/organiser/events/[id]/edit/page.tsx`: add imports

```tsx
import Image from "next/image"
import { listEventPhotos, MAX_PHOTOS_PER_EVENT } from "@/lib/photos"
import { removePhoto, saveCaption, updateEvent, uploadPhotos } from "./actions"
```

fetch photos after the event lookup:

```tsx
  const photos = await listEventPhotos(id)
```

and add a second `<section>` after the existing one, inside `<main>`:

```tsx
      <section className="surface mx-auto mt-5 max-w-2xl rounded-[1.5rem] p-5 sm:p-7">
        <h2 className="text-lg font-black">Photos</h2>
        <p className="mt-1 text-sm text-[color:var(--muted)]">
          Up to {MAX_PHOTOS_PER_EVENT} photos shown on the public event page.
        </p>
        {photos.length < MAX_PHOTOS_PER_EVENT && (
          <form
            action={uploadPhotos.bind(null, id)}
            className="mt-3 flex flex-wrap items-center gap-3"
          >
            <input
              type="file"
              name="photos"
              accept="image/jpeg,image/png,image/webp"
              multiple
              required
              className="field flex-1"
            />
            <button className="button-primary">Upload</button>
          </form>
        )}
        {photos.length > 0 && (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((p) => (
              <li key={p.id} className="space-y-2">
                <div className="relative aspect-square overflow-hidden rounded-xl">
                  <Image
                    src={p.url}
                    alt={p.caption ?? "Event photo"}
                    fill
                    className="object-cover"
                  />
                </div>
                <form
                  action={saveCaption.bind(null, id, p.id)}
                  className="flex gap-2"
                >
                  <input
                    name="caption"
                    defaultValue={p.caption ?? ""}
                    placeholder="Caption"
                    className="field text-xs"
                  />
                  <button className="button-secondary text-xs">Save</button>
                </form>
                <form action={removePhoto.bind(null, id, p.id)}>
                  <button className="button-secondary w-full text-xs">
                    Delete
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm test && npm run lint`
Expected: clean.
Manual (with token): upload two photos, caption one, delete one.

- [ ] **Step 4: Commit (ask user first)**

```bash
git add src/app/organiser/events
git commit -m "feat: organiser gallery management with upload, caption, delete"
```

---

### Task 5: Public gallery on the event page

**Files:**
- Modify: `src/lib/events.ts:64-66` (`getEvent`), `src/app/events/[id]/page.tsx`

**Interfaces:**
- Consumes: `Event.photos` relation.
- Produces: `getEvent` now returns `photos` ordered by `sortOrder`, `createdAt`.

- [ ] **Step 1: Include photos in `getEvent`** (`src/lib/events.ts`):

```ts
export function getEvent(id: string) {
  return db.event.findUnique({
    where: { id },
    include: {
      club: true,
      photos: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
    },
  })
}
```

- [ ] **Step 2: Render the gallery** — in `src/app/events/[id]/page.tsx`, in the main column after the "Race day info" block (after line 106):

```tsx
          {e.photos.length > 0 && (
            <div className="surface rounded-[1.5rem] p-5 sm:p-6">
              <h2 className="text-lg font-black">Photos</h2>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {e.photos.map((p) => (
                  <div
                    key={p.id}
                    className="relative aspect-square overflow-hidden rounded-xl"
                  >
                    <Image
                      src={p.url}
                      alt={p.caption ?? e.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm test`
Expected: clean. Manual: event page shows the grid only when photos exist.

- [ ] **Step 4: Commit (ask user first)**

```bash
git add src/lib/events.ts "src/app/events/[id]/page.tsx"
git commit -m "feat: photo gallery on public event page"
```

---

### Task 6: Club public pages

**Files:**
- Create: `src/lib/clubs.ts`, `src/app/clubs/[id]/page.tsx`
- Modify: `src/app/events/[id]/page.tsx:126-144` (link club name)
- Test: `tests/clubs.test.ts`

**Interfaces:**
- Produces: `getPublicClub(id: string): Promise<{ club: Club; upcomingEvents: EventWithClub[]; pastEventCount: number } | null>` — `null` for missing or unverified clubs.

**Spec deviation (documented):** club names on `EventCard` stay plain text — the whole card is already an `<a>`, and nested anchors are invalid HTML. The event detail page links to the club page instead.

- [ ] **Step 1: Write failing tests** — create `tests/clubs.test.ts`:

```ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { getPublicClub } from "@/lib/clubs";

let verifiedId: string;
let unverifiedId: string;

beforeAll(async () => {
  const verified = await db.club.create({
    data: { name: "Public AC", contact: "c", verified: true },
  });
  const unverified = await db.club.create({
    data: { name: "Hidden AC", contact: "c", verified: false },
  });
  verifiedId = verified.id;
  unverifiedId = unverified.id;
  const base = {
    description: "d",
    locationText: "H",
    distanceOptions: ["5k"],
    paymentInfo: "p",
    clubId: verified.id,
    status: "PUBLISHED" as const,
  };
  await db.event.create({
    data: { ...base, title: "Future", startsAt: new Date(Date.now() + 86400000) },
  });
  await db.event.create({
    data: { ...base, title: "Past", startsAt: new Date(Date.now() - 86400000) },
  });
  await db.event.create({
    data: {
      ...base,
      title: "Draft",
      status: "DRAFT",
      startsAt: new Date(Date.now() + 86400000),
    },
  });
});

afterAll(async () => {
  await db.event.deleteMany();
  await db.club.deleteMany();
});

describe("getPublicClub", () => {
  it("returns null for an unverified club", async () => {
    expect(await getPublicClub(unverifiedId)).toBeNull();
  });

  it("returns null for a missing club", async () => {
    expect(await getPublicClub("nope")).toBeNull();
  });

  it("returns upcoming published events and past count", async () => {
    const result = await getPublicClub(verifiedId);
    expect(result?.club.name).toBe("Public AC");
    expect(result?.upcomingEvents.map((e) => e.title)).toEqual(["Future"]);
    expect(result?.pastEventCount).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/clubs.test.ts`
Expected: FAIL — cannot resolve `@/lib/clubs`.

- [ ] **Step 3: Implement `src/lib/clubs.ts`**

```ts
import { db } from "@/lib/db"

export async function getPublicClub(id: string) {
  const club = await db.club.findUnique({ where: { id } })
  if (!club || !club.verified) return null
  const now = new Date()
  const [upcomingEvents, pastEventCount] = await Promise.all([
    db.event.findMany({
      where: { clubId: id, status: "PUBLISHED", startsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
      include: { club: true },
    }),
    db.event.count({
      where: { clubId: id, status: "PUBLISHED", startsAt: { lt: now } },
    }),
  ])
  return { club, upcomingEvents, pastEventCount }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/clubs.test.ts`
Expected: PASS.

- [ ] **Step 5: Create `src/app/clubs/[id]/page.tsx`**

```tsx
import Image from "next/image"
import { notFound } from "next/navigation"
import { getPublicClub } from "@/lib/clubs"
import { EventCard } from "@/components/EventCard"

export const dynamic = "force-dynamic"

export default async function ClubPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const result = await getPublicClub(id)
  if (!result) notFound()
  const { club, upcomingEvents, pastEventCount } = result

  return (
    <main className="app-container py-5 sm:py-8">
      <section className="surface rounded-[1.5rem] p-5 sm:p-7">
        <div className="flex items-center gap-4">
          {club.logoUrl && /^https?:\/\/|^\//.test(club.logoUrl) ? (
            <Image
              src={club.logoUrl}
              width={64}
              height={64}
              alt={club.name}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--teal-dark)] text-2xl font-black text-white">
              {club.name.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-black">
              {club.name}
              <span className="rounded-full bg-[rgba(8,127,123,0.1)] px-2 py-0.5 text-xs font-bold text-[color:var(--teal-dark)]">
                ✓ Verified
              </span>
            </h1>
            <p className="text-sm text-[color:var(--muted)]">{club.contact}</p>
            {pastEventCount > 0 && (
              <p className="mt-1 text-xs text-[color:var(--muted)]">
                {pastEventCount} past {pastEventCount === 1 ? "event" : "events"}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-black">Upcoming events</h2>
        {upcomingEvents.length === 0 ? (
          <p className="mt-3 text-sm text-[color:var(--muted)]">
            No upcoming events yet.
          </p>
        ) : (
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingEvents.map((e) => (
              <EventCard key={e.id} e={e} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
```

- [ ] **Step 6: Link the club name from the event detail page**

In `src/app/events/[id]/page.tsx`, in the "Organised by" card, replace `<p className="font-bold">{e.club.name}</p>` with:

```tsx
                <Link
                  href={`/clubs/${e.clubId}`}
                  className="font-bold text-[color:var(--teal-dark)] hover:underline"
                >
                  {e.club.name}
                </Link>
```

- [ ] **Step 7: Verify**

Run: `npx tsc --noEmit && npm test && npm run lint`
Expected: clean. Manual: visit `/clubs/<verified-club-id>`; unverified club 404s.

- [ ] **Step 8: Commit (ask user first)**

```bash
git add src/lib/clubs.ts src/app/clubs tests/clubs.test.ts "src/app/events/[id]/page.tsx"
git commit -m "feat: public club pages with upcoming events"
```

---

### Task 7: `parseLatLng` helper

**Files:**
- Create: `src/lib/geo.ts`
- Test: `tests/geo.test.ts`

**Interfaces:**
- Produces: `parseLatLng(input: string): { lat: number; lng: number } | null`

- [ ] **Step 1: Write failing tests** — create `tests/geo.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parseLatLng } from "@/lib/geo";

describe("parseLatLng", () => {
  it("parses raw 'lat, lng'", () => {
    expect(parseLatLng("-17.8292, 31.0522")).toEqual({
      lat: -17.8292,
      lng: 31.0522,
    });
  });

  it("parses a Google Maps @lat,lng URL", () => {
    expect(
      parseLatLng("https://www.google.com/maps/@-17.9257,25.8526,15z"),
    ).toEqual({ lat: -17.9257, lng: 25.8526 });
  });

  it("parses a ?q=lat,lng URL", () => {
    expect(parseLatLng("https://maps.google.com/?q=-20.15,28.58")).toEqual({
      lat: -20.15,
      lng: 28.58,
    });
  });

  it("parses a URL-encoded query=lat%2Clng URL", () => {
    expect(
      parseLatLng(
        "https://www.google.com/maps/search/?api=1&query=-18.97%2C32.67",
      ),
    ).toEqual({ lat: -18.97, lng: 32.67 });
  });

  it("returns null for empty input", () => {
    expect(parseLatLng("")).toBeNull();
    expect(parseLatLng("   ")).toBeNull();
  });

  it("returns null for text and shortened links", () => {
    expect(parseLatLng("Harare Gardens")).toBeNull();
    expect(parseLatLng("https://maps.app.goo.gl/AbC123")).toBeNull();
  });

  it("returns null for out-of-range coordinates", () => {
    expect(parseLatLng("91, 31")).toBeNull();
    expect(parseLatLng("-17, 181")).toBeNull();
  });

  it("returns null for malformed percent-encoding", () => {
    expect(parseLatLng("https://maps.google.com/?q=%E0%A4%A")).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/geo.test.ts`
Expected: FAIL — cannot resolve `@/lib/geo`.

- [ ] **Step 3: Implement `src/lib/geo.ts`**

```ts
const PATTERNS = [
  /^(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)$/,
  /@(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/,
  /[?&](?:q|query|ll|destination)=(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)/,
]

export function parseLatLng(
  input: string,
): { lat: number; lng: number } | null {
  let text = input.trim()
  if (!text) return null
  try {
    text = decodeURIComponent(text)
  } catch {
    return null
  }
  for (const pattern of PATTERNS) {
    const match = text.match(pattern)
    if (!match) continue
    const lat = Number.parseFloat(match[1])
    const lng = Number.parseFloat(match[2])
    if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng }
  }
  return null
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/geo.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit (ask user first)**

```bash
git add src/lib/geo.ts tests/geo.test.ts
git commit -m "feat: parse coordinates from Google Maps links"
```

---

### Task 8: Location capture in forms + map embed

**Files:**
- Modify: `src/lib/organisers.ts:34-47` (`EventInput`), both organiser form pages and actions, `src/app/events/[id]/page.tsx:108-123`

**Interfaces:**
- Consumes: `parseLatLng` from Task 7.
- Produces: `EventInput` gains `lat?: number | null; lng?: number | null`.

- [ ] **Step 1: Extend `EventInput`** in `src/lib/organisers.ts` — add to the type:

```ts
  lat?: number | null
  lng?: number | null
```

- [ ] **Step 2: Add the form field**

In `src/app/organiser/events/new/page.tsx`, after the `locationText` input:

```tsx
      <input
        name="locationPin"
        placeholder="Google Maps link or coordinates, e.g. -17.82, 31.05 (optional)"
        className="field"
      />
```

In `src/app/organiser/events/[id]/edit/page.tsx`, same field with:

```tsx
        defaultValue={
          event.lat !== null && event.lng !== null
            ? `${event.lat}, ${event.lng}`
            : ""
        }
```

- [ ] **Step 3: Parse in both actions**

In `src/app/organiser/events/new/actions.ts` (and identically in `edit/actions.ts`), add `import { parseLatLng } from "@/lib/geo"`, then before `saveEvent`:

```ts
  const locationPin = String(formData.get("locationPin") ?? "").trim()
  const coords = locationPin ? parseLatLng(locationPin) : null
  if (locationPin && !coords)
    throw new Error(
      "Could not read coordinates — paste a full Google Maps link or 'lat, lng'",
    )
```

and pass to `saveEvent`:

```ts
    lat: coords?.lat ?? null,
    lng: coords?.lng ?? null,
```

- [ ] **Step 4: Embed the map** — in `src/app/events/[id]/page.tsx`, inside the existing Location card, after the `locationText` paragraph:

```tsx
              <div className="mt-3 overflow-hidden rounded-xl">
                <iframe
                  src={`https://maps.google.com/maps?q=${e.lat},${e.lng}&z=14&output=embed`}
                  className="h-64 w-full border-0"
                  loading="lazy"
                  title="Event location map"
                />
              </div>
```

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit && npm test && npm run lint`
Expected: clean. Manual: edit an event, paste `-17.8292, 31.0522`, confirm map renders on the event page.

- [ ] **Step 6: Commit (ask user first)**

```bash
git add src/lib/organisers.ts src/app/organiser/events "src/app/events/[id]/page.tsx"
git commit -m "feat: capture event coordinates and embed location map"
```

---

### Task 9: Weather library

**Files:**
- Create: `src/lib/weather.ts`
- Test: `tests/weather.test.ts`

**Interfaces:**
- Produces:
  - `type RaceDayWeather = { label: string; maxTempC: number; minTempC: number; humidityPct: number; windKmh: number }`
  - `isWithinForecastWindow(startsAt: Date, now?: Date): boolean`
  - `weatherCodeLabel(code: number): string`
  - `parseDailyForecast(json: unknown, dateISO: string): RaceDayWeather | null`
  - `getRaceDayWeather(lat: number, lng: number, startsAt: Date): Promise<RaceDayWeather | null>`

- [ ] **Step 1: Write failing tests** — create `tests/weather.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  isWithinForecastWindow,
  parseDailyForecast,
  weatherCodeLabel,
} from "@/lib/weather";

describe("isWithinForecastWindow", () => {
  const now = new Date("2026-07-16T08:00:00.000Z");

  it("rejects past events", () => {
    expect(isWithinForecastWindow(new Date("2026-07-15T08:00:00Z"), now)).toBe(
      false,
    );
  });

  it("accepts an event 10 days away", () => {
    expect(isWithinForecastWindow(new Date("2026-07-26T08:00:00Z"), now)).toBe(
      true,
    );
  });

  it("rejects an event 17 days away", () => {
    expect(isWithinForecastWindow(new Date("2026-08-02T08:00:00Z"), now)).toBe(
      false,
    );
  });
});

describe("weatherCodeLabel", () => {
  it.each([
    [0, "Clear"],
    [2, "Partly cloudy"],
    [3, "Overcast"],
    [45, "Fog"],
    [53, "Drizzle"],
    [63, "Rain"],
    [81, "Rain showers"],
    [95, "Thunderstorm"],
  ])("maps code %i to %s", (code, label) => {
    expect(weatherCodeLabel(code)).toBe(label);
  });
});

describe("parseDailyForecast", () => {
  const json = {
    daily: {
      time: ["2026-07-16", "2026-07-17"],
      weather_code: [0, 61],
      temperature_2m_max: [21.4, 18.2],
      temperature_2m_min: [8.6, 9.1],
      relative_humidity_2m_mean: [45.2, 80.7],
      wind_speed_10m_max: [12.3, 20.1],
    },
  };

  it("extracts the matching day", () => {
    expect(parseDailyForecast(json, "2026-07-17")).toEqual({
      label: "Rain",
      maxTempC: 18,
      minTempC: 9,
      humidityPct: 81,
      windKmh: 20,
    });
  });

  it("returns null when the date is missing", () => {
    expect(parseDailyForecast(json, "2026-08-01")).toBeNull();
  });

  it("returns null for malformed payloads", () => {
    expect(parseDailyForecast({}, "2026-07-16")).toBeNull();
    expect(parseDailyForecast(null, "2026-07-16")).toBeNull();
    expect(parseDailyForecast({ daily: { time: "x" } }, "2026-07-16")).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/weather.test.ts`
Expected: FAIL — cannot resolve `@/lib/weather`.

- [ ] **Step 3: Implement `src/lib/weather.ts`**

```ts
export type RaceDayWeather = {
  label: string
  maxTempC: number
  minTempC: number
  humidityPct: number
  windKmh: number
}

const FORECAST_DAYS = 16

export function isWithinForecastWindow(startsAt: Date, now = new Date()) {
  if (startsAt < now) return false
  return startsAt.getTime() - now.getTime() <= FORECAST_DAYS * 86400000
}

export function weatherCodeLabel(code: number): string {
  if (code === 0) return "Clear"
  if (code <= 2) return "Partly cloudy"
  if (code === 3) return "Overcast"
  if (code === 45 || code === 48) return "Fog"
  if (code >= 51 && code <= 57) return "Drizzle"
  if (code >= 61 && code <= 67) return "Rain"
  if (code >= 71 && code <= 77) return "Snow"
  if (code >= 80 && code <= 82) return "Rain showers"
  if (code >= 95) return "Thunderstorm"
  return "Mixed"
}

export function parseDailyForecast(
  json: unknown,
  dateISO: string,
): RaceDayWeather | null {
  const daily = (json as { daily?: Record<string, unknown> } | null)?.daily
  if (!daily || !Array.isArray(daily.time)) return null
  const i = daily.time.indexOf(dateISO)
  if (i === -1) return null
  const num = (key: string) => {
    const arr = daily[key]
    return Array.isArray(arr) && typeof arr[i] === "number"
      ? (arr[i] as number)
      : null
  }
  const code = num("weather_code")
  const max = num("temperature_2m_max")
  const min = num("temperature_2m_min")
  const humidity = num("relative_humidity_2m_mean")
  const wind = num("wind_speed_10m_max")
  if (
    code === null ||
    max === null ||
    min === null ||
    humidity === null ||
    wind === null
  )
    return null
  return {
    label: weatherCodeLabel(code),
    maxTempC: Math.round(max),
    minTempC: Math.round(min),
    humidityPct: Math.round(humidity),
    windKmh: Math.round(wind),
  }
}

export async function getRaceDayWeather(
  lat: number,
  lng: number,
  startsAt: Date,
): Promise<RaceDayWeather | null> {
  if (!isWithinForecastWindow(startsAt)) return null
  const dateISO = startsAt.toLocaleDateString("en-CA", {
    timeZone: "Africa/Harare",
  })
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean,wind_speed_10m_max` +
    `&timezone=Africa%2FHarare&forecast_days=${FORECAST_DAYS}`
  try {
    const res = await fetch(url, { next: { revalidate: 10800 } })
    if (!res.ok) return null
    return parseDailyForecast(await res.json(), dateISO)
  } catch {
    return null
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/weather.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit (ask user first)**

```bash
git add src/lib/weather.ts tests/weather.test.ts
git commit -m "feat: race-day weather via Open-Meteo"
```

---

### Task 10: Weather card on the event page

**Files:**
- Modify: `src/app/events/[id]/page.tsx`

**Interfaces:**
- Consumes: `getRaceDayWeather` from Task 9.

- [ ] **Step 1: Fetch weather in the page component** — add `import { getRaceDayWeather } from "@/lib/weather"` and, after the `deadlineCountdown` declaration:

```tsx
  const weather =
    e.lat !== null && e.lng !== null && !isPast
      ? await getRaceDayWeather(e.lat, e.lng, e.startsAt)
      : null
```

- [ ] **Step 2: Render the card** — in the main column, directly after the "Race day info" block:

```tsx
          {weather && (
            <div className="surface rounded-[1.5rem] p-5 sm:p-6">
              <h2 className="text-lg font-black">Race-day weather</h2>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[color:var(--muted)]">
                <span className="font-bold text-[color:var(--foreground)]">
                  {weather.label}
                </span>
                <span>
                  {weather.maxTempC}° / {weather.minTempC}°C
                </span>
                <span>Humidity {weather.humidityPct}%</span>
                <span>Wind {weather.windKmh} km/h</span>
              </div>
              <p className="mt-2 text-xs text-[color:var(--muted)]">
                Forecast via Open-Meteo
              </p>
            </div>
          )}
```

- [ ] **Step 3: Full verification gate**

Run: `npm test && npx tsc --noEmit && npm run lint && npm run build`
Expected: all clean. Manual: an event with coordinates within 16 days shows the weather card; others show nothing.

- [ ] **Step 4: Commit (ask user first)**

```bash
git add "src/app/events/[id]/page.tsx"
git commit -m "feat: show race-day weather on event pages"
```
