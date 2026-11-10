# Housebets Sportsbook, variant 2: "Floodlit board"

A front-end clickable prototype for the Housebets "Sportsbook is coming" contest. It is variant 2. It keeps the Housebets shell (top bar, left nav, side panel) and brand cues (dark navy and teal, aqua wordmark and wave, cyan primary), but it uses a different layout idea from variant 1. The page is built like a stadium price board.

**Live:** https://zeroknowledge0x.github.io/housebets-sportsbook-v2/

| Page | Link |
| --- | --- |
| Sports home (live pulse hero) | [#/](https://zeroknowledge0x.github.io/housebets-sportsbook-v2/#/) |
| Live | [#/live](https://zeroknowledge0x.github.io/housebets-sportsbook-v2/#/live) |
| Football (league boards) | [#/football](https://zeroknowledge0x.github.io/housebets-sportsbook-v2/#/football) |
| Match page | [#/match/ars-bha](https://zeroknowledge0x.github.io/housebets-sportsbook-v2/#/match/ars-bha) |
| Bet slip & My bets | [#/betslip](https://zeroknowledge0x.github.io/housebets-sportsbook-v2/#/betslip) |

## The idea
- **Live ticker:** a band under the top bar that is always visible. Every live score and clock is one tap from its match.
- **Live pulse hero:** the hero is the biggest live match. It shows the score in large type, a 1X2 price bar, next goal, and a trace of the last 24 price moves.
- **Dense league boards:** one line per match. League headers and the 1 X 2 column labels stay sticky.
- **Match page:** the Match result price bar stays pinned while you scroll. You can search markets, collapse all of them, or jump to a group.
- **Bet slip:** a big stake keypad with USDT quick stakes. A placed bet shows a receipt-style ticket.
- **My bets:** each card shows a cash-out value trend and how it moved since the last price change.
- **Every state is covered:** empty, filled, price changed (accept), suspended selection or match, placing, failed, placed, cash-out confirm, settled, nothing live, signed out, search with no results, and follows/favourites. Open the **Demo states** panel in the top bar to switch between them.

Sample data only. There are no real players, teams, or money. Balances are demo USDT. The prototype covers singles only. Multis, bet builder, boosts, promos, outrights, stats widgets, and match trackers are out of scope. The price trace shows odds history, not match stats.

## Run
```
npm install
npm run dev      # http://localhost:5173/housebets-sportsbook-v2/
npm run build    # static build in dist/
```

## Tools and credits
- [Vite](https://vite.dev) (vanilla JS, hash router, static build)
- Fonts: [Saira Condensed](https://fonts.google.com/specimen/Saira+Condensed) and [Schibsted Grotesk](https://fonts.google.com/specimen/Schibsted+Grotesk), under the SIL Open Font License, served through [Fontsource](https://fontsource.org)
- Icons, crests, and the wordmark wave are hand-authored inline SVG
- [Playwright](https://playwright.dev) with Chrome for screenshots and overflow and console checks at 390px and 1440px
- GitHub Pages through GitHub Actions
- AI agent skills, used only as design instructions. No skill files, assets, scripts, or data are included in this repo:
  - frontend-design from [anthropics/skills](https://github.com/anthropics/skills)
  - impeccable (craft, layout, polish, audit, harden, detect) from [pbakaus/impeccable](https://github.com/pbakaus/impeccable)
  - [taste-skill](https://github.com/Leonxlnx/taste-skill) (anti-generic checks)
  - [ui-ux-pro-max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) (type pairing search)
  - web-design-guidelines from [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills)

This is an unofficial concept entry and is not affiliated with Housebets. The wordmark is redrawn as a placeholder.
