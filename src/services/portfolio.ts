import { db } from "../db/client";
import { holdings } from "../db/schema/holdings";
import { fundService } from "./fund";

export interface HoldingDetail {
  fundId: string;
  fundName: string;
  units: number;
  purchaseDate: string;
  purchaseNav: number;
  latestNav: number;
  costBasis: number;
  currentValue: number;
  gain: number;
  gainPct: number;
}

export interface PortfolioSummary {
  totalCost: number;
  totalValue: number;
  totalGain: number;
  totalGainPct: number;
}

export class PortfolioService {
  async getHoldingReturns(): Promise<HoldingDetail[]> {
    const allHoldings = await db.select().from(holdings);
    const details: HoldingDetail[] = [];

    for (const h of allHoldings) {
      const latestNav = await fundService.getLatestNav(h.fundId);
      const units = parseFloat(h.units);
      const purchaseNav = parseFloat(h.purchaseNav);

      const costBasis = units * purchaseNav;
      const currentValue = units * latestNav;
      const gain = currentValue - costBasis;
      const gainPct = costBasis !== 0 ? (gain / costBasis) * 100 : 0;

      details.push({
        fundId: h.fundId,
        fundName: h.fundName,
        units,
        purchaseDate: h.purchaseDate,
        purchaseNav,
        latestNav,
        costBasis: parseFloat(costBasis.toFixed(2)),
        currentValue: parseFloat(currentValue.toFixed(2)),
        gain: parseFloat(gain.toFixed(2)),
        gainPct: parseFloat(gainPct.toFixed(2)),
      });
    }

    return details;
  }

  async getPortfolioSummary(): Promise<PortfolioSummary> {
    const holdingsDetail = await this.getHoldingReturns();

    let totalCost = 0;
    let totalValue = 0;

    for (const h of holdingsDetail) {
      totalCost += h.costBasis;
      totalValue += h.currentValue;
    }

    const totalGain = totalValue - totalCost;
    const totalGainPct = totalCost !== 0 ? (totalGain / totalCost) * 100 : 0;

    return {
      totalCost: parseFloat(totalCost.toFixed(2)),
      totalValue: parseFloat(totalValue.toFixed(2)),
      totalGain: parseFloat(totalGain.toFixed(2)),
      totalGainPct: parseFloat(totalGainPct.toFixed(2)),
    };
  }
}

export const portfolioService = new PortfolioService();
