export type RepaymentMethod = 'equal_principal' | 'equal_installment';

export interface LoanInput {
  loanAmountWan: number; // 贷款金额 (万元)
  annualRate: number; // 年利率 (%, e.g. 2.8)
  termYears: number; // 还款年限 (年, e.g. 30)
  startYearMonth: string; // 首期年月 (YYYY-MM)
  repaymentMethod: RepaymentMethod;
}

export interface MonthlyPaymentItem {
  period: number; // 期数 (1, 2, 3...)
  yearIndex: number; // 第几年 (1, 2, 3...)
  dateStr: string; // 还款年月 (e.g. "2026年10月")
  monthlyPayment: number; // 月供金额 (本息合计)
  principal: number; // 偿还本金
  interest: number; // 偿还利息
  remainingPrincipal: number; // 剩余未还本金
  accumulatedPayment: number; // 累计已还总额
  accumulatedPrincipal: number; // 累计已还本金
  accumulatedInterest: number; // 累计已还利息
}

export interface YearlySummaryItem {
  yearIndex: number; // 第几年 (1, 2...)
  yearLabel: string; // 年份标签 (e.g. "2026年度")
  totalPayment: number; // 年度还款总额
  totalPrincipal: number; // 年度偿还本金
  totalInterest: number; // 年度偿还利息
  endRemainingPrincipal: number; // 年末剩余本金
  monthsCount: number; // 该年包含期数
}

export interface ComparisonInfo {
  method: RepaymentMethod;
  totalInterest: number;
  totalPayment: number;
  firstMonthPayment: number;
  interestDifference: number; // 相比另一种方式节省/多出的利息 (正数表示节省)
}

export interface LoanCalculationResult {
  loanAmount: number; // 贷款本金 (元)
  annualRate: number; // 贷款年利率 (%)
  monthlyRate: number; // 月利率
  totalMonths: number; // 总期数 (月)
  repaymentMethod: RepaymentMethod;
  firstMonthPayment: number; // 首月还款额
  monthlyDecrease: number; // 每月递减金额 (等额本金)
  lastMonthPayment: number; // 末月还款额 (等额本金)
  firstMonthInterest: number; // 首月利息
  totalInterest: number; // 支付总利息
  totalPayment: number; // 还款总额 (本金 + 利息)
  interestRatio: number; // 利息占总额比例 (0-100)
  schedule: MonthlyPaymentItem[];
  yearlySummary: YearlySummaryItem[];
  comparison: ComparisonInfo;
}
