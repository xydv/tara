export function normalizeCategory(
    category: string,
) {
    return category
        .trim()
        .toLowerCase();
}

export function normalizeMerchant(
    merchant: string,
): string {
    return merchant
        .toUpperCase()
        .replace(/\*/g, " ")
        .replace(/[^\w\s]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}
