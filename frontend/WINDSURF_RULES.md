# 🌊 Windsurf Frontend Manifest

## 1. Architektura i organizacja kodu
- Stosuj modularną strukturę katalogów: komponenty, hooki, serwisy, style, utils – każdy w osobnym folderze.
- Dziel kod na atomiczne komponenty (Atomic Design): `atoms`, `molecules`, `organisms`, `templates`, `pages`.
- Wykorzystuj **TypeScript** do typowania całej aplikacji.
- Każdy komponent powinien być czysty, testowalny i posiadać własny plik ze stylami (preferuj CSS Modules lub styled-components).

## 2. Stylistyka i UI/UX
- Używaj nowoczesnych bibliotek UI (np. MUI, Chakra, Tailwind) – zachowuj spójność stylów i kolorystyki.
- Projektuj responsywnie – aplikacja musi wyglądać świetnie zarówno na desktopie, jak i mobile.
- Dbaj o dostępność (a11y): poprawne role, aria-labels, kontrast kolorów, nawigacja klawiaturą.
- Animacje i mikrointerakcje stosuj z umiarem, zawsze z myślą o wydajności i UX.

## 3. Zasady kodowania
- Stosuj ES6+ i najnowsze możliwości React/Next.js.
- Używaj async/await zamiast callbacków/promisów.
- Każdy request do API obsługuj przez dedykowany serwis (np. `services/api.ts`).
- Nie duplikuj kodu – wyciągaj powtarzalne fragmenty do hooków lub utils.
- Stosuj linting (ESLint + Prettier) oraz automatyczne formatowanie kodu.

## 4. Autoryzacja i bezpieczeństwo
- Cała obsługa użytkownika (login, rejestracja, sesja) przez **Supabase Auth**.
- Przechowuj tokeny wyłącznie w pamięci (np. context, react-query) lub w httpOnly cookies – nigdy w localStorage.
- Zabezpieczaj trasy i komponenty za pomocą HOC/guards (`withAuth`, `ProtectedRoute`).
- Waliduj dane wejściowe po stronie klienta i serwera.

## 5. Stan aplikacji i komunikacja
- Zarządzaj stanem globalnym przez React Context lub dedykowane biblioteki (np. Zustand, Redux Toolkit) – tylko jeśli to konieczne.
- Do obsługi fetchowania i cache’owania danych używaj React Query lub SWR.
- Stosuj toast/notyfikacje do komunikatów zwrotnych dla użytkownika.

## 6. Testowanie i jakość
- Pisz testy jednostkowe dla logiki i komponentów (Jest + React Testing Library).
- Dodawaj testy integracyjne dla kluczowych flow (np. logowanie, rejestracja, reset hasła).
- Każdy pull request powinien przechodzić przez pipeline CI (lint, testy, build).

## 7. Dokumentacja i komunikacja
- Każdy komponent i hook powinien mieć krótki JSDoc lub komentarz opisujący przeznaczenie.
- Dokumentuj endpointy API i modele danych.
- Komunikuj zmiany w zespole – korzystaj z opisowych commit message i PR-ów.

## 8. Wydajność i optymalizacja
- Optymalizuj obrazy i assety (np. przez Next.js Image).
- Stosuj lazy loading dla ciężkich komponentów i stron.
- Unikaj niepotrzebnych re-renderów (memoizacja, useCallback, useMemo).

## 9. Wersjonowanie i workflow
- Pracuj na osobnych branchach feature/bugfix.
- Stosuj konwencję commitów (Conventional Commits).
- Każdy merge do main/master po code review.

---

**Pamiętaj:**
Twój kod powinien być czytelny, spójny i łatwy do utrzymania przez cały zespół.
Dbaj o użytkownika końcowego – UX i wydajność są równie ważne jak architektura!
