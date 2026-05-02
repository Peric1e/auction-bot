export function validateBid(text, currentPrice, auction, userHasDeleted, lastBidUserId, userId) {
  if (userHasDeleted) return { valid: false, reason: "blocked" };

  const amount = Number(text?.match(/^\d+$/)?.[0]);
  if (!amount) return { valid: false, reason: "not_a_bid" };

  if (lastBidUserId && lastBidUserId === userId) {
    return { valid: false, reason: "own_bid" };
  }

  const minAllowed = currentPrice === auction.startPrice
    ? auction.startPrice
    : currentPrice + auction.minStep;

  if (amount < minAllowed) return { valid: false, reason: "too_low" };

  if (auction.maxStep && amount > currentPrice + auction.maxStep) {
    return { valid: false, reason: "too_high" };
  }

  return { valid: true, amount };
}