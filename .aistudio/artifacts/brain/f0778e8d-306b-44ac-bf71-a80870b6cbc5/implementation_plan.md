# Constellation — Core Feature Refinement Plan

A focused plan to enhance **Constellation** with personal memory storytelling, weekly celestial balance ephemeris, and museum-grade starmap exports.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> This refined plan prioritizes tangible, self-contained enhancements to the existing daily stargazing workflow.

- **Primary Additions**:
  1. **Memory Star Vault & Deep Star Notes**: Expand individual stars so clicking on any logged star opens a reflective card allowing detailed diary notes, photos/memories, and milestone tags.
  2. **Weekly Sky Ephemeris**: A visual breakdown showing your time balance across categories (Craft, Work, Kin, Mind, Body, Rest) with subtle celestial geometry.
  3. **Printable Vector Starmap Poster**: Generate downloadable high-resolution dark sky charts of your night or life horizon with customizable typography.

---

## 1. Overview & Key Capabilities

- **Memory Star Vault**: Lets you attach meaningful personal reflections, quotes, and memories to each star in tonight's constellation or past archives.
- **Weekly Balance Ephemeris**: Offers quiet insight into how your life hours are distributed across essential categories over days and weeks.
- **Starmap Export**: Renders clean, high-DPI vector celestial posters suitable for wallpapers or print.

---

## 2. Technical Strategy

- **State Persistence**: Extends existing Firestore documents at `/users/{userId}/entries/{entryId}` with optional `note` and `tags` fields.
- **Visual Design**: Retains the signature dark cosmic aesthetic (`#050714` canvas, Cormorant Garamond headings, Manrope body text, DM Mono metrics).
