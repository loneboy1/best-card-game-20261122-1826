// Emerald Table Blackjack — complete 6-deck blackjack.
// Rules: dealer stands on all 17s, blackjack pays 3:2, double down on any
// two cards, split any pair (one split per hand), 6-deck shoe reshuffled
// when under 52 cards remain. Goal: grow $1,000 to $5,000 (Table Master).
'use strict';

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const START_BANKROLL = 1000;
const MASTER_GOAL = 5000;
const NUM_DECKS = 6;
const RESHUFFLE_AT = 52;

const state = {
  shoe: [],
  bankroll: START_BANKROLL,
  bet: 0,
  lastBet: 0,
  dealer: [],
  dealerHidden: true,
  hands: [],          // { cards: [], bet, doubled, done, result, blackjack }
  activeHand: 0,
  phase: 'betting',   // betting | playing | dealer | done
  stats: { hands: 0, wins: 0, losses: 0, pushes: 0, blackjacks: 0, streak: 0, biggest: 0, best: START_BANKROLL },
  master: false,
};

const $ = (id) => document.getElementById(id);

// ---------- cards ----------
function buildShoe() {
  const shoe = [];
  for (let d = 0; d < NUM_DECKS; d++)
    for (const s of SUITS) for (const r of RANKS) shoe.push({ rank: r, suit: s });
  // Fisher–Yates shuffle
  for (let i = shoe.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shoe[i], shoe[j]] = [shoe[j], shoe[i]];
  }
  return shoe;
}

function drawCard() {
  if (state.shoe.length < RESHUFFLE_AT) {
    state.shoe = buildShoe();
    log('Shoe reshuffled — fresh 6 decks.');
  }
  return state.shoe.pop();
}

function cardValue(rank) {
  if (rank === 'A') return 11;
  if (rank === 'K' || rank === 'Q' || rank === 'J') return 10;
  return parseInt(rank, 10);
}

// Best hand total: count aces as 11, drop to 1 while over 21.
function handValue(cards) {
  let total = 0, aces = 0;
  for (const c of cards) { total += cardValue(c.rank); if (c.rank === 'A') aces++; }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

function isBlackjack(cards) {
  return cards.length === 2 && handValue(cards) === 21;
}

function isSoft(cards) {
  let total = 0, aces = 0;
  for (const c of cards) { total += cardValue(c.rank); if (c.rank === 'A') aces++; }
  return aces > 0 && total <= 21;
}

// ---------- rendering ----------
function cardEl(card, hidden) {
  const el = document.createElement('div');
  if (hidden) { el.className = 'card back'; el.innerHTML = '<span class="gem">◆</span>'; return el; }
  const red = card.suit === '♥' || card.suit === '♦';
  el.className = 'card' + (red ? ' red' : '');
  el.innerHTML =
    '<div class="corner"><div class="rank">' + card.rank + '</div><div class="suit">' + card.suit + '</div></div>' +
    '<div class="center">' + card.suit + '</div>' +
    '<div class="corner-b"><div class="rank">' + card.rank + '</div><div class="suit">' + card.suit + '</div></div>';
  return el;
}

function renderCards() {
  const dc = $('dealer-cards');
  dc.innerHTML = '';
  state.dealer.forEach((c, i) => dc.appendChild(cardEl(c, i === 1 && state.dealerHidden)));
  const pc = $('player-cards');
  pc.innerHTML = '';
  const hand = state.hands[state.activeHand];
  if (hand) hand.cards.forEach((c) => pc.appendChild(cardEl(c, false)));
  const sc = $('split-cards');
  if (state.hands.length > 1) {
    sc.style.display = 'flex';
    sc.innerHTML = '';
    state.hands.forEach((h, i) => {
      if (i === state.activeHand) return;
      h.cards.forEach((c) => sc.appendChild(cardEl(c, false)));
    });
  } else sc.style.display = 'none';

  const dv = state.dealerHidden && state.dealer.length > 1
    ? cardValue(state.dealer[0].rank)
    : handValue(state.dealer);
  $('dealer-value').textContent = state.dealer.length ? (state.dealerHidden && state.dealer.length > 1 ? dv + ' + ?' : String(dv)) : '';
  $('player-value').textContent = hand ? String(handValue(hand.cards)) + (isSoft(hand.cards) && handValue(hand.cards) !== 21 ? ' (soft)' : '') : '';
  $('player-label').textContent = state.hands.length > 1 ? 'YOU — HAND ' + (state.activeHand + 1) + ' OF ' + state.hands.length : 'YOU';
}

function renderBank() {
  $('bankroll').textContent = '$' + state.bankroll.toLocaleString();
  $('current-bet').textContent = '$' + state.bet.toLocaleString();
  $('shoe').textContent = state.shoe.length + ' cards';
  $('st-hands').textContent = state.stats.hands;
  $('st-wins').textContent = state.stats.wins;
  $('st-losses').textContent = state.stats.losses;
  $('st-pushes').textContent = state.stats.pushes;
  $('st-bj').textContent = state.stats.blackjacks;
  $('st-streak').textContent = (state.stats.streak > 0 ? '+' : '') + state.stats.streak;
  $('st-biggest').textContent = '$' + state.stats.biggest.toLocaleString();
  $('st-best').textContent = '$' + state.stats.best.toLocaleString();
}

function setMessage(text, kind) {
  const m = $('message');
  m.textContent = text;
  m.className = 'message' + (kind ? ' ' + kind : '');
}

function log(text) {
  const li = document.createElement('li');
  li.textContent = text;
  const ul = $('log');
  ul.prepend(li);
  while (ul.children.length > 8) ul.removeChild(ul.lastChild);
}

function setPhaseUI() {
  const betting = state.phase === 'betting';
  const playing = state.phase === 'playing';
  const done = state.phase === 'done';
  $('betting').style.display = betting ? '' : 'none';
  $('actions').style.display = playing ? '' : 'none';
  $('after-hand').style.display = done ? '' : 'none';
  document.querySelectorAll('#betting .chip').forEach((b) => {
    b.disabled = !betting || state.bankroll < parseInt(b.dataset.bet, 10);
  });
  $('deal').disabled = !betting || state.bet <= 0;
  $('clear-bet').disabled = !betting || state.bet <= 0;
  if (playing) {
    const hand = state.hands[state.activeHand];
    const canDouble = hand.cards.length === 2 && state.bankroll >= hand.bet;
    const canSplit = hand.cards.length === 2 && hand.cards[0].rank === hand.cards[1].rank &&
      state.bankroll >= hand.bet && state.hands.length === 1;
    $('double').disabled = !canDouble;
    $('split').disabled = !canSplit;
  }
  $('rebuy').style.display = done && state.bankroll <= 0 ? '' : 'none';
}

// ---------- flow ----------
function placeBet(amount) {
  if (state.phase !== 'betting') return;
  if (state.bankroll < amount) return;
  state.bankroll -= amount;
  state.bet += amount;
  renderBank(); setPhaseUI();
}

function clearBet() {
  if (state.phase !== 'betting') return;
  state.bankroll += state.bet;
  state.bet = 0;
  renderBank(); setPhaseUI();
}

function deal() {
  if (state.phase !== 'betting' || state.bet <= 0) return;
  state.lastBet = state.bet;
  state.dealer = [drawCard(), drawCard()];
  state.dealerHidden = true;
  state.hands = [{ cards: [drawCard(), drawCard()], bet: state.bet, doubled: false, done: false, result: null, blackjack: false }];
  state.activeHand = 0;
  state.phase = 'playing';
  const hand = state.hands[0];
  hand.blackjack = isBlackjack(hand.cards);
  const dealerBJ = isBlackjack(state.dealer);
  renderCards(); renderBank(); setPhaseUI();
  if (hand.blackjack || dealerBJ) { settleNatural(hand.blackjack, dealerBJ); return; }
  setMessage('Your move — hit, stand, double or split.');
}

function settleNatural(playerBJ, dealerBJ) {
  state.dealerHidden = false;
  state.phase = 'done';
  const hand = state.hands[0];
  if (playerBJ && dealerBJ) {
    state.bankroll += hand.bet;
    applyResult(hand, 'push', 0);
    setMessage('Both blackjack — push. Your bet is returned.');
    log('Push — both blackjack.');
  } else if (playerBJ) {
    const win = Math.floor(hand.bet * 1.5);
    state.bankroll += hand.bet + win;
    state.stats.blackjacks++;
    applyResult(hand, 'win', win);
    setMessage('BLACKJACK! You win $' + win.toLocaleString() + '!', 'win');
    log('Blackjack! Won $' + win.toLocaleString() + '.');
  } else {
    applyResult(hand, 'lose', -hand.bet);
    setMessage('Dealer has blackjack. You lose $' + hand.bet.toLocaleString() + '.', 'lose');
    log('Dealer blackjack — lost $' + hand.bet.toLocaleString() + '.');
  }
  finishHand();
}

function hit() {
  const hand = state.hands[state.activeHand];
  if (state.phase !== 'playing' || !hand) return;
  hand.cards.push(drawCard());
  renderCards();
  if (handValue(hand.cards) > 21) {
    hand.done = true;
    hand.result = 'lose';
    setMessage('Bust! Hand ' + (state.activeHand + 1) + ' is over 21.', 'lose');
    advanceHand();
  } else if (handValue(hand.cards) === 21) {
    hand.done = true;
    setMessage('21! Hand ' + (state.activeHand + 1) + ' stands.');
    advanceHand();
  }
  renderBank();
}

function stand() {
  const hand = state.hands[state.activeHand];
  if (state.phase !== 'playing' || !hand) return;
  hand.done = true;
  advanceHand();
}

function doubleDown() {
  const hand = state.hands[state.activeHand];
  if (state.phase !== 'playing' || !hand || hand.cards.length !== 2) return;
  if (state.bankroll < hand.bet) return;
  state.bankroll -= hand.bet;
  hand.bet *= 2;
  state.bet = state.hands.reduce((s, h) => s + h.bet, 0);
  hand.doubled = true;
  hand.cards.push(drawCard());
  renderCards(); renderBank();
  hand.done = true;
  if (handValue(hand.cards) > 21) {
    hand.result = 'lose';
    setMessage('Bust after doubling!', 'lose');
  }
  advanceHand();
}

function split() {
  const hand = state.hands[state.activeHand];
  if (state.phase !== 'playing' || !hand || hand.cards.length !== 2) return;
  if (hand.cards[0].rank !== hand.cards[1].rank) return;
  if (state.bankroll < hand.bet) return;
  state.bankroll -= hand.bet;
  const second = { cards: [hand.cards.pop(), drawCard()], bet: hand.bet, doubled: false, done: false, result: null, blackjack: false };
  hand.cards.push(drawCard());
  state.hands.push(second);
  state.bet = state.hands.reduce((s, h) => s + h.bet, 0);
  renderCards(); renderBank(); setPhaseUI();
  setMessage('Split into two hands. Play hand 1 first.');
  log('Split pair of ' + hand.cards[0].rank + 's into two hands.');
}

function advanceHand() {
  const hand = state.hands[state.activeHand];
  if (hand && handValue(hand.cards) === 21 && !hand.done) hand.done = true;
  // move to next unfinished hand, or dealer plays
  let next = state.activeHand + 1;
  while (next < state.hands.length && state.hands[next].done) next++;
  if (next < state.hands.length) {
    state.activeHand = next;
    renderCards(); setPhaseUI();
    setMessage('Now playing hand ' + (next + 1) + ' of ' + state.hands.length + '.');
    return;
  }
  dealerPlay();
}

function dealerPlay() {
  state.phase = 'dealer';
  state.dealerHidden = false;
  renderCards();
  const dealerBJ = isBlackjack(state.dealer);
  // Dealer hits on 16, stands on all 17s.
  while (handValue(state.dealer) < 17) {
    state.dealer.push(drawCard());
    renderCards();
  }
  const dv = handValue(state.dealer);
  state.phase = 'done';
  let msg = 'Dealer has ' + dv + '. ';
  const parts = [];
  state.hands.forEach((hand, i) => {
    const pv = handValue(hand.cards);
    let result, delta;
    if (hand.result === 'lose') { result = 'lose'; delta = -hand.bet; }
    else if (hand.blackjack) { result = 'win'; delta = Math.floor(hand.bet * 1.5); }
    else if (dv > 21) { result = 'win'; delta = hand.bet; }
    else if (pv > dv) { result = 'win'; delta = hand.bet; }
    else if (pv < dv) { result = 'lose'; delta = -hand.bet; }
    else { result = 'push'; delta = 0; }
    if (result === 'win') state.bankroll += hand.bet + delta;
    else if (result === 'push') state.bankroll += hand.bet;
    applyResult(hand, result, delta);
    parts.push('Hand ' + (i + 1) + ': ' + pv + ' vs ' + dv + ' — ' +
      (result === 'win' ? 'win $' + delta.toLocaleString() : result === 'lose' ? 'lose $' + hand.bet.toLocaleString() : 'push'));
  });
  const wins = state.hands.filter((h) => h.result === 'win').length;
  const losses = state.hands.filter((h) => h.result === 'lose').length;
  const kind = wins > losses ? 'win' : losses > wins ? 'lose' : '';
  setMessage(msg + parts.join(' · '), kind);
  log(parts.join(' · '));
  finishHand();
}

function applyResult(hand, result, delta) {
  hand.result = result;
  state.stats.hands++;
  if (result === 'win') {
    state.stats.wins++;
    state.stats.streak = state.stats.streak > 0 ? state.stats.streak + 1 : 1;
    if (delta > state.stats.biggest) state.stats.biggest = delta;
  } else if (result === 'lose') {
    state.stats.losses++;
    state.stats.streak = state.stats.streak < 0 ? state.stats.streak - 1 : -1;
  } else {
    state.stats.pushes++;
  }
  if (state.bankroll > state.stats.best) state.stats.best = state.bankroll;
  if (state.bankroll >= MASTER_GOAL && !state.master) {
    state.master = true;
    setTimeout(() => alert('TABLE MASTER! You reached $' + MASTER_GOAL.toLocaleString() + ' — the table is yours.'), 300);
  }
}

function finishHand() {
  state.phase = 'done';
  state.bet = 0;
  renderCards(); renderBank(); setPhaseUI();
  if (state.bankroll <= 0) setMessage('Bankroll empty. Rebuy to keep playing.', 'lose');
}

function nextHand() {
  if (state.phase !== 'done') return;
  if (state.bankroll <= 0) { setMessage('Rebuy first — your bankroll is empty.', 'lose'); return; }
  state.phase = 'betting';
  state.dealer = [];
  state.hands = [];
  setMessage('Place your bet to begin. Good luck at the table.');
  renderCards(); renderBank(); setPhaseUI();
}

function rebuy() {
  state.bankroll = START_BANKROLL;
  state.stats.best = Math.max(state.stats.best, START_BANKROLL);
  log('Rebought $' + START_BANKROLL.toLocaleString() + ' in chips.');
  nextHand();
}

function rebetDeal() {
  if (state.phase !== 'playing') return;
  // finish current hand(s) by standing, then rebet next hand
  state.hands.forEach((h) => { h.done = true; });
  dealerPlay();
  setTimeout(() => {
    if (state.bankroll < state.lastBet) { setMessage('Not enough bankroll to rebet $' + state.lastBet + '.', 'lose'); return; }
    state.phase = 'betting';
    state.dealer = []; state.hands = [];
    state.bankroll -= state.lastBet;
    state.bet = state.lastBet;
    renderBank();
    deal();
  }, 600);
}

function newShoe() {
  if (state.phase === 'playing' || state.phase === 'dealer') return;
  state.shoe = buildShoe();
  log('New 6-deck shoe shuffled.');
  renderBank();
}

// ---------- wire up ----------
document.querySelectorAll('#betting .chip').forEach((b) =>
  b.addEventListener('click', () => placeBet(parseInt(b.dataset.bet, 10))));
$('clear-bet').addEventListener('click', clearBet);
$('deal').addEventListener('click', deal);
$('hit').addEventListener('click', hit);
$('stand').addEventListener('click', stand);
$('double').addEventListener('click', doubleDown);
$('split').addEventListener('click', split);
$('rebet').addEventListener('click', rebetDeal);
$('next-hand').addEventListener('click', nextHand);
$('rebuy').addEventListener('click', rebuy);
$('new-shoe').addEventListener('click', newShoe);

state.shoe = buildShoe();
renderCards(); renderBank(); setPhaseUI();
