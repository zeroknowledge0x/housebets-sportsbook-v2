# Variant 2 design plan: "Floodlit board" (frontend-design two-pass plan)

## Why a second direction
Variant 1 followed the official wireframe: rounded slate cards and label-over-price tiles. Variant 2 keeps the Housebets shell and brand cues. Everything else changes: the idea, the layout, the type and the components.

## Idea
Treat the sportsbook as a floodlit stadium board crossed with a trading screen.
- The thing that leads is the match that is live right now.
- Prices sit in joined price bars, like a ticker, not in floating tiles.
- A price leaves a trace: every price keeps its recent history, and that history becomes:
  - the hero's price trace
  - the cash-out trend in My bets

## Colour (brand cues kept: dark navy/teal, aqua wordmark + wave, cyan primary)
- Night       #06121a  page
- Pitch       #0b1d26  surfaces
- Board       #0f2731  price cells
- Hairline    #1c3946  every divider (structure is drawn with lines, not boxes)
- Aqua        #22e4f2  prices, wordmark, primary
- Foam        #bff7fb  primary-hover, receipt paper tint
- Live        #d9233f  pill fill (white text passes 4.5:1); #ff5a73 as text
- Up / Down   #3ee6a0 / #ff7083  movement, always paired with an arrow
- Signal      #ffbf4d  odds changed, suspended reasons

## Type (new pairing; v1 used Outfit)
- Saira Condensed 600/700: scores, clocks, prices, headings. This is scoreboard vernacular, and its tabular figures come from the condensed cut.
- Schibsted Grotesk (variable): UI text, labels, body.
- Scale: 12 / 13 / 15 / 18 / 24 / 34 / 72 (hero score).

## Layout
Desktop 1440:
```
[ top: logo | search teams/players/competitions/markets | demo  balance wallet ]
[ ticker band: LIVE ARS 1–0 BHA 53'  RMA 2–1 SEV 68'  …                      ]
[ sidebar 216: sports + counts ][ main                     ][ slip 352 + keypad ]
```
Phone 390: top bar, ticker strip, content, a bet slip bar above the bottom nav (Menu, Sports, Casino, Chat, Search).

## Principles
1. One hero per page: Home leads with the live pulse; the Match page leads with the condensed score and a pinned price bar.
2. Density is a feature. Football is a stack of league tables with sticky headers, one line per match.
3. A price is a cell, not a card. 1X2 sits in a joined bar with column headers.
4. Every state has a sentence: suspended, changed, failed and placed all say what happened and what to do.

## Review vs generic defaults
- Avoided v1's card grid and the SaaS card kit. Tables, bars and hairlines carry the structure instead.
- Avoided monospace for numbers; the condensed display face carries the figures.
- The price trace is real content (price history), not a decorative sparkline.
- Avoided momentum and attack graphs: the brief puts stats widgets and match trackers out of scope.
