# WashDeck Design System & Branding Guidelines

This document outlines the visual identity, user interface patterns, and responsive design guidelines for the WashDeck SaaS platform. Developers and designers should refer to this specification when building new features or modifying existing layouts to maintain a cohesive, high-performance, and mobile-oriented user experience.

---

## 1. Brand Identity & Color System

WashDeck's visual identity is built around a modern, tech-forward detailing and operations theme, balancing a premium dark navy corporate identity with a clean, high-contrast dashboard system.

### 1.1 Core Brand Palette
These colors define the global public-facing pages (e.g., login, password reset, landing pages) and represent the core WashDeck brand:

| Token | Color Value | Description | Usage |
| :--- | :--- | :--- | :--- |
| **Brand Navy** | `#0b2240` | Deep, premium dark blue | Primary text, brand icons, login button backgrounds, and left-panel gradient start. |
| **Brand Light Blue** | `#38bdf8` | Vibrant sky blue | Accent indicators, active state highlights, and focus rings. |
| **Dark Gradient End** | `#0f3564` | Rich royal blue | Right-hand side of the dark background gradient. |
| **Background Light** | `#f8fafc` | Soft slate grey (`slate-50`) | Global page backgrounds to reduce eye strain. |
| **Neutral Border** | `#e2e8f0` | Crisp light grey (`slate-200`) | Input borders, dividers, and card outlines. |

### 1.2 Multi-Tenant Dynamic Theming
WashDeck supports custom white-label branding for detailing stations. Instead of hardcoded values, dashboard components must use CSS variables:

*   **`--primary-color`**: Injected dynamically from the station's database record (defaults to `#0f766e` teal).
*   **Application**: 
    *   Dashboard header background accents.
    *   Active navigation highlights.
    *   Action buttons (e.g., "Create Job Card", "Sign In").
    *   Input focus states (`focus:border-[var(--primary-color)]`).

---

## 2. Typography

WashDeck uses a clean, highly legible, system-native sans-serif typeface to ensure fast load times and crisp rendering on high-density mobile screens.

*   **Font Family**: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`
*   **Scale & Hierarchy**:
    *   **Display / Hero**: `text-4xl` (36px) or `text-5xl` (48px) | Bold/Extrabold | Used for marketing headers.
    *   **Page Title**: `text-2xl` (24px) | Black/Bold | Primary screen headers (e.g., "Welcome Back").
    *   **Section Header**: `text-lg` (18px) | Semibold | Card and module headers.
    *   **Body Text**: `text-sm` (14px) | Regular/Medium | General interface text.
    *   **Microcopy**: `text-[10px]` or `text-xs` (12px) | Medium/Bold | Badges, status pills, and field labels.

---

## 3. Responsive Design Rules (Mobile-First)

WashDeck is a **mobile-oriented operations platform** designed to be used by detailing staff standing on the wash bay floor. Therefore, layouts must be designed mobile-first.

### 3.1 Eliminating "Double Padding" on Mobile
A common UI bug is rendering a bordered, shadowed card inside a mobile container that already has margins. This squishes fields and wastes screen width.

*   **Rule**: Outer wrappers (like the login form card) must be borderless, backgroundless, and shadowless on mobile viewports. Only apply borders, backgrounds, and shadows on desktop screens (`md` and up).
*   **Tailwind Pattern**:
    ```html
    <div className="w-full rounded-2xl border-0 md:border border-slate-200 bg-transparent md:bg-white p-0 md:p-8 shadow-none md:shadow-xl">
      <!-- Form content goes here -->
    </div>
    ```

### 3.2 Vertical Space Conservation
On small mobile screens, vertical space is highly restricted.
*   **Rule**: Avoid duplicate headers. If a parent container already has a prominent page header (e.g., "Welcome Back"), hide any internal module headers (e.g., "Secure Sign In") to prevent redundant text stacking.
*   **Rule**: Keep form inputs compact (`h-11`) and utilize clean icons inside the input fields rather than large external labels where possible.

---

## 4. UI Patterns & Components

### 4.1 Login & Public Pages
Public entry points use a **premium split-screen layout**:
*   **Left Panel (Desktop Only)**: A rich, deep dark gradient background overlayed with a subtle radial grid pattern and floating glassmorphic cards (`bg-white/5 backdrop-blur-md border-white/10`). This panel is hidden on mobile.
*   **Right Panel (Mobile & Desktop)**: A clean, centered, white panel. The brand logo is enclosed in a light-grey container to blend its background seamlessly.

### 4.2 Form Fields & Inputs
Inputs must feel tactile and responsive:
*   **Height**: `h-11` (44px) for comfortable touch targets on mobile.
*   **Corners**: `rounded-xl` (12px) for a soft, modern aesthetic.
*   **Icons**: Left-aligned icons (`lucide-react` at `size={16}`) inside the input field to provide immediate visual context.
*   **Interactive States**:
    *   *Default*: Soft background (`bg-slate-50/50`) and thin border (`border-slate-200`).
    *   *Focus*: Background turns white, border transitions smoothly to `var(--primary-color)`, and outline is disabled.

---

## 5. Directory Asset Structure

All branding assets are organized in the public directory:
*   `/public/brand/washdeck-logo-transparent.png` - The primary horizontal brand logo (white background, transparent spacing, used for clean backgrounds).
*   `/public/uploads/` - Destination folder for dynamic station logo uploads (handled by the CDN/upload endpoint).
