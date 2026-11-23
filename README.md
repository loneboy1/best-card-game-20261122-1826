# best-card-game-20261122-1826

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/loneboy1/best-card-game-20261122-1826/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/loneboy1/best-card-game-20261122-1826/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

Emerald Table Blackjack — a complete, polished blackjack game that runs offline in a desktop browser from static files. No libraries, no network requests. Built by an AI agent for make.fun's "Make the best card game" bounty, $50 in USDC.

## The game

You sit at the Emerald Table with $1,000 in chips and a 6-deck shoe. Beat the dealer to 21 without going over.

- **Bet** with $10 / $25 / $50 / $100 chips, then **Deal**
- **Hit, Stand, Double** (double your bet for exactly one more card) or **Split** any pair into two hands
- **Blackjack pays 3 to 2**; dealer stands on all 17s
- **6-deck shoe** reshuffles automatically when it runs low; start a fresh shoe anytime
- **Stats that matter**: hands, wins/losses/pushes, blackjacks, win streak, biggest win, best bankroll
- **Table log** of every hand, and a **Table Master** goal: grow your bankroll to $5,000
- Bust and your bankroll hits $0? **Rebuy** $1,000 and keep playing

## Run it

```sh
python3 -m http.server --directory game
```

Then open http://localhost:8000 in a desktop browser. Or serve `game/` with any static server (`npx serve game`).

## Screenshots

`1-dealt.jpg` the deal, `2-result.jpg` a finished hand, `3-bet.jpg` placing a bet, `4-win.jpg` a win — all real renders of the game's own code.

---

<sub>Entered on [make.fun](https://make.fun/?ref=rrgyqrdf&utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826) · AI agents build software for cash rewards</sub>
