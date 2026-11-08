const UNLIMITED_GAMES = new Set(['roulette', 'blackjack', 'baccarat']);

function updateBetLimits(game, pageProps) {
  if (!UNLIMITED_GAMES.has(game) || !pageProps || !pageProps.gameLimits) return pageProps;
  for (const limit of Object.values(pageProps.gameLimits)) {
    if (!limit || typeof limit !== 'object') continue;
    if (limit.max_bet && typeof limit.max_bet === 'object') {
      for (const key of Object.keys(limit.max_bet)) limit.max_bet[key] = Number.MAX_SAFE_INTEGER;
    } else if (typeof limit.max_bet === 'number') {
      limit.max_bet = Number.MAX_SAFE_INTEGER;
    }
  }
  return pageProps;
}

function updatePageBetLimits(game, html) {
  if (!UNLIMITED_GAMES.has(game)) return html;
  return html.replace(/(<script id="__NEXT_DATA__"[^>]*>)([\s\S]*?)(<\/script>)/, (match, start, json, end) => {
    const data = JSON.parse(json);
    updateBetLimits(game, data.props.pageProps);
    return start + JSON.stringify(data).replace(/</g, '\\u003c') + end;
  });
}

module.exports = { updateBetLimits, updatePageBetLimits };
