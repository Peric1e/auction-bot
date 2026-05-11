export function validateBid(text, currentPrice, auction, lastBidUserId, userId) {
  const amount = Number(text?.match(/^\d+$/)?.[0]);
  if (!amount) return { valid: false, reason: "not_a_bid" };

  if (lastBidUserId && lastBidUserId === userId) {
    return { valid: false, reason: "own_bid" };
  }

  const isFirstBid = lastBidUserId === null;
  const minAllowed = isFirstBid ? auction.startPrice : currentPrice + auction.minStep;
  const maxAllowed = isFirstBid ? auction.startPrice : currentPrice + (auction.maxStep ?? Infinity);

  if (amount < minAllowed) return { valid: false, reason: "too_low" };
  if (amount > maxAllowed) return { valid: false, reason: "too_high" };

  return { valid: true, amount };
}