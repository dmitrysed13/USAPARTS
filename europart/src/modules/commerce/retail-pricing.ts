/**
 * Retail pricing pipeline: purchase → FX → markup → extras → retail BYN.
 * Never invents an FX rate or markup — missing config leaves retail unset.
 */

export type MarkupKind = "PERCENT" | "FIXED";

export type MarkupRuleMatch = {
  id: string;
  name: string;
  scope: "GLOBAL" | "CATEGORY" | "SUPPLIER" | "PART_BRAND";
  markupType: MarkupKind;
  value: number;
  b2bValue: number | null;
  priority: number;
};

export type FxQuote = {
  rate: number;
  source: string;
  effectiveFrom: Date;
};

export type PricingInput = {
  purchaseAmount: number;
  purchaseCurrency: string;
  extrasAmount?: number | null;
  fx: FxQuote | null;
  rule: MarkupRuleMatch | null;
  /** When true, apply b2bValue (or same rule value if b2bValue null and audience is retail-only). */
  audience?: "retail" | "b2b";
};

export type PricingResult = {
  purchaseAmount: number;
  purchaseCurrency: string;
  convertedAmount: number | null;
  fxRate: number | null;
  fxSource: string | null;
  markupType: MarkupKind | null;
  markupValue: number | null;
  markupRuleId: string | null;
  extrasAmount: number;
  retailAmount: number | null;
  b2bAmount: number | null;
  currency: "BYN";
  reason: string | null;
};

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function applyMarkup(base: number, type: MarkupKind, value: number): number {
  if (type === "PERCENT") {
    return roundMoney(base * (1 + value / 100));
  }
  return roundMoney(base + value);
}

/**
 * Convert purchase currency to BYN using a configured rate only.
 * Same-currency BYN needs no FX row.
 */
export function convertToByn(
  amount: number,
  currency: string,
  fx: FxQuote | null,
): { amount: number | null; rate: number | null; source: string | null; reason: string | null } {
  const code = currency.trim().toUpperCase();
  if (!Number.isFinite(amount) || amount < 0) {
    return { amount: null, rate: null, source: null, reason: "Некорректная сумма закупки." };
  }
  if (code === "BYN") {
    return { amount: roundMoney(amount), rate: 1, source: "identity", reason: null };
  }
  if (!fx || !Number.isFinite(fx.rate) || fx.rate <= 0) {
    return {
      amount: null,
      rate: null,
      source: null,
      reason: `Нет настроенного курса ${code}→BYN. Автоматическая конвертация отключена.`,
    };
  }
  return {
    amount: roundMoney(amount * fx.rate),
    rate: fx.rate,
    source: fx.source,
    reason: null,
  };
}

/**
 * Pick the highest-priority active rule. Lower priority number wins; ties keep first.
 */
export function selectMarkupRule(rules: MarkupRuleMatch[]): MarkupRuleMatch | null {
  if (rules.length === 0) {
    return null;
  }
  return [...rules].sort((left, right) => {
    if (left.priority !== right.priority) {
      return left.priority - right.priority;
    }
    return left.name.localeCompare(right.name, "ru");
  })[0]!;
}

export function computeRetailPrice(input: PricingInput): PricingResult {
  const extras = input.extrasAmount && input.extrasAmount > 0 ? roundMoney(input.extrasAmount) : 0;
  const converted = convertToByn(input.purchaseAmount, input.purchaseCurrency, input.fx);
  if (converted.amount === null) {
    return {
      purchaseAmount: input.purchaseAmount,
      purchaseCurrency: input.purchaseCurrency.trim().toUpperCase(),
      convertedAmount: null,
      fxRate: null,
      fxSource: null,
      markupType: null,
      markupValue: null,
      markupRuleId: null,
      extrasAmount: extras,
      retailAmount: null,
      b2bAmount: null,
      currency: "BYN",
      reason: converted.reason,
    };
  }

  if (!input.rule) {
    return {
      purchaseAmount: input.purchaseAmount,
      purchaseCurrency: input.purchaseCurrency.trim().toUpperCase(),
      convertedAmount: converted.amount,
      fxRate: converted.rate,
      fxSource: converted.source,
      markupType: null,
      markupValue: null,
      markupRuleId: null,
      extrasAmount: extras,
      retailAmount: null,
      b2bAmount: null,
      currency: "BYN",
      reason: "Нет активного правила наценки. Розница не вычисляется автоматически.",
    };
  }

  const base = roundMoney(converted.amount + extras);
  const retailAmount = applyMarkup(base, input.rule.markupType, input.rule.value);
  const b2bAmount =
    input.rule.b2bValue !== null && input.rule.b2bValue !== undefined
      ? applyMarkup(base, input.rule.markupType, input.rule.b2bValue)
      : null;

  return {
    purchaseAmount: input.purchaseAmount,
    purchaseCurrency: input.purchaseCurrency.trim().toUpperCase(),
    convertedAmount: converted.amount,
    fxRate: converted.rate,
    fxSource: converted.source,
    markupType: input.rule.markupType,
    markupValue: input.rule.value,
    markupRuleId: input.rule.id,
    extrasAmount: extras,
    retailAmount,
    b2bAmount,
    currency: "BYN",
    reason: null,
  };
}

/** Manager view: cost + margin. Never serialize into public DTO. */
export type ManagerPriceView = {
  purchaseAmount: number | null;
  purchaseCurrency: string | null;
  retailAmount: number | null;
  b2bAmount: number | null;
  marginAmount: number | null;
  marginPercent: number | null;
  currency: "BYN";
};

export function toManagerPriceView(input: {
  purchaseAmount: number | null;
  purchaseCurrency: string | null;
  retailAmount: number | null;
  b2bAmount: number | null;
}): ManagerPriceView {
  const purchase = input.purchaseAmount;
  const retail = input.retailAmount;
  let marginAmount: number | null = null;
  let marginPercent: number | null = null;
  if (purchase !== null && retail !== null) {
    marginAmount = roundMoney(retail - purchase);
    marginPercent = purchase === 0 ? null : roundMoney((marginAmount / purchase) * 100);
  }
  return {
    purchaseAmount: purchase,
    purchaseCurrency: input.purchaseCurrency,
    retailAmount: retail,
    b2bAmount: input.b2bAmount,
    marginAmount,
    marginPercent,
    currency: "BYN",
  };
}
