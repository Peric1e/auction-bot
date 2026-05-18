export function parseAuction(text) {
  if (!text) return null;

  const isAuction = /аукціон|аукцион/i.test(text) && /починаємо|начинаем/i.test(text);
  if (!isAuction) return null;

  // Более гибкий поиск — игнорируем : и другие символы
  const startPrice = text.match(/починаємо[:\s]+(\d+)/i)?.[1];
  const minStep = text.match(/мінімальний\s+крок[^0-9]*?[:\s]*(\d+)/i)?.[1];
  const maxStep = text.match(/перевищувати[:\s]+(\d+)/i)?.[1];
  const endTime = text.match(/час\s+закінчення[:\s]+(\d{1,2}:\d{2})/i)?.[1];

  if (!startPrice || !endTime) {
    const missing = [];
    if (!startPrice) missing.push("startPrice");
    if (!endTime) missing.push("endTime");
    return { _parseError: `Не знайдено: ${missing.join(", ")}` };
  }

  return {
    startPrice: Number(startPrice),
    minStep: Number(minStep) || 100,
    maxStep: maxStep ? Number(maxStep) : null,
    endTime,
  };
}