import {
  LoanInput,
  LoanCalculationResult,
  MonthlyPaymentItem,
  YearlySummaryItem,
  RepaymentMethod,
} from '../types';

/**
 * 格式化数字为千分位金额 (元)
 */
export function formatCurrency(val: number, decimals: number = 2): string {
  if (isNaN(val) || !isFinite(val)) return '¥0.00';
  return (
    '¥' +
    val.toLocaleString('zh-CN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  );
}

/**
 * 格式化纯数字 (保留2位小数)
 */
export function formatNumber(val: number, decimals: number = 2): string {
  if (isNaN(val) || !isFinite(val)) return '0.00';
  return val.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * 格式化大写人民币金额 (如：壹佰万元整)
 */
export function formatChineseRMB(amountWan: number): string {
  if (!amountWan || amountWan <= 0) return '零元整';
  const n = Math.round(amountWan * 10000);
  const fraction = ['角', '分'];
  const digit = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
  const unit = [
    ['元', '万', '亿'],
    ['', '拾', '佰', '仟'],
  ];

  let head = n < 0 ? '欠' : '';
  let num = Math.abs(n);
  let s = '';

  for (let i = 0; i < fraction.length; i++) {
    s += (digit[Math.floor(num * 10 * Math.pow(10, i)) % 10] + fraction[i]).replace(/零./, '');
  }
  s = s || '整';
  num = Math.floor(num);

  for (let i = 0; i < unit[0].length && num > 0; i++) {
    let p = '';
    for (let j = 0; j < unit[1].length && num > 0; j++) {
      p = digit[num % 10] + unit[1][j] + p;
      num = Math.floor(num / 10);
    }
    s = p.replace(/(零.)*零$/, '').replace(/^$/, '零') + unit[0][i] + s;
  }
  return (
    head +
    s
      .replace(/(零.)*零元/, '元')
      .replace(/(零.)+/g, '零')
      .replace(/^整$/, '零元整')
  );
}

/**
 * 计算房贷核心数据与还款明细
 */
export function calculateLoan(input: LoanInput): LoanCalculationResult {
  const loanAmount = Math.max(0, (input.loanAmountWan || 0) * 10000);
  const annualRate = Math.max(0, input.annualRate || 0);
  const monthlyRate = annualRate / 100 / 12;
  const totalMonths = Math.max(1, Math.round((input.termYears || 30) * 12));
  const method = input.repaymentMethod;

  // 解析首期年月
  let startYear = 2026;
  let startMonth = 10;
  if (input.startYearMonth && input.startYearMonth.includes('-')) {
    const parts = input.startYearMonth.split('-');
    startYear = parseInt(parts[0], 10) || 2026;
    startMonth = parseInt(parts[1], 10) || 10;
  }

  const schedule: MonthlyPaymentItem[] = [];
  let remainingPrincipal = loanAmount;
  let accumulatedPayment = 0;
  let accumulatedPrincipal = 0;
  let accumulatedInterest = 0;

  // 等额本金计算
  if (method === 'equal_principal') {
    const monthlyPrincipalBase = loanAmount / totalMonths;

    for (let period = 1; period <= totalMonths; period++) {
      const curYear = startYear + Math.floor((startMonth - 1 + (period - 1)) / 12);
      const curMonth = ((startMonth - 1 + (period - 1)) % 12) + 1;
      const dateStr = `${curYear}年${curMonth < 10 ? '0' + curMonth : curMonth}月`;
      const yearIndex = Math.ceil(period / 12);

      const interest = remainingPrincipal * monthlyRate;
      let principal = monthlyPrincipalBase;

      // 最后一期抹平微小精度误差
      if (period === totalMonths || remainingPrincipal - principal < 0.01) {
        principal = remainingPrincipal;
      }

      const monthlyPayment = principal + interest;
      remainingPrincipal = Math.max(0, remainingPrincipal - principal);

      accumulatedPayment += monthlyPayment;
      accumulatedPrincipal += principal;
      accumulatedInterest += interest;

      schedule.push({
        period,
        yearIndex,
        dateStr,
        monthlyPayment: Number(monthlyPayment.toFixed(2)),
        principal: Number(principal.toFixed(2)),
        interest: Number(interest.toFixed(2)),
        remainingPrincipal: Number(remainingPrincipal.toFixed(2)),
        accumulatedPayment: Number(accumulatedPayment.toFixed(2)),
        accumulatedPrincipal: Number(accumulatedPrincipal.toFixed(2)),
        accumulatedInterest: Number(accumulatedInterest.toFixed(2)),
      });
    }
  } else {
    // 等额本息计算
    // 月供公式: [P * i * (1+i)^N] / [(1+i)^N - 1]
    let fixedMonthlyPayment = 0;
    if (monthlyRate === 0) {
      fixedMonthlyPayment = loanAmount / totalMonths;
    } else {
      const pow = Math.pow(1 + monthlyRate, totalMonths);
      fixedMonthlyPayment = (loanAmount * monthlyRate * pow) / (pow - 1);
    }

    for (let period = 1; period <= totalMonths; period++) {
      const curYear = startYear + Math.floor((startMonth - 1 + (period - 1)) / 12);
      const curMonth = ((startMonth - 1 + (period - 1)) % 12) + 1;
      const dateStr = `${curYear}年${curMonth < 10 ? '0' + curMonth : curMonth}月`;
      const yearIndex = Math.ceil(period / 12);

      const interest = remainingPrincipal * monthlyRate;
      let principal = fixedMonthlyPayment - interest;

      if (period === totalMonths || remainingPrincipal - principal < 0.01) {
        principal = remainingPrincipal;
      }

      const monthlyPayment = principal + interest;
      remainingPrincipal = Math.max(0, remainingPrincipal - principal);

      accumulatedPayment += monthlyPayment;
      accumulatedPrincipal += principal;
      accumulatedInterest += interest;

      schedule.push({
        period,
        yearIndex,
        dateStr,
        monthlyPayment: Number(monthlyPayment.toFixed(2)),
        principal: Number(principal.toFixed(2)),
        interest: Number(interest.toFixed(2)),
        remainingPrincipal: Number(remainingPrincipal.toFixed(2)),
        accumulatedPayment: Number(accumulatedPayment.toFixed(2)),
        accumulatedPrincipal: Number(accumulatedPrincipal.toFixed(2)),
        accumulatedInterest: Number(accumulatedInterest.toFixed(2)),
      });
    }
  }

  // 年度汇总构建
  const yearlyMap = new Map<number, MonthlyPaymentItem[]>();
  schedule.forEach((item) => {
    if (!yearlyMap.has(item.yearIndex)) {
      yearlyMap.set(item.yearIndex, []);
    }
    yearlyMap.get(item.yearIndex)!.push(item);
  });

  const yearlySummary: YearlySummaryItem[] = [];
  yearlyMap.forEach((months, yearIdx) => {
    const totalPay = months.reduce((acc, cur) => acc + cur.monthlyPayment, 0);
    const totalPrin = months.reduce((acc, cur) => acc + cur.principal, 0);
    const totalInt = months.reduce((acc, cur) => acc + cur.interest, 0);
    const endBal = months[months.length - 1].remainingPrincipal;
    const firstDate = months[0].dateStr.slice(0, 5); // "2026年"
    const lastDate = months[months.length - 1].dateStr.slice(0, 5);
    const label = firstDate === lastDate ? `${firstDate} (第${yearIdx}年)` : `${firstDate}-${lastDate} (第${yearIdx}年)`;

    yearlySummary.push({
      yearIndex: yearIdx,
      yearLabel: label,
      totalPayment: Number(totalPay.toFixed(2)),
      totalPrincipal: Number(totalPrin.toFixed(2)),
      totalInterest: Number(totalInt.toFixed(2)),
      endRemainingPrincipal: Number(endBal.toFixed(2)),
      monthsCount: months.length,
    });
  });

  // 关键汇总字段
  const firstMonthPayment = schedule[0]?.monthlyPayment || 0;
  const firstMonthInterest = schedule[0]?.interest || 0;
  const lastMonthPayment = schedule[schedule.length - 1]?.monthlyPayment || 0;
  const monthlyDecrease =
    method === 'equal_principal' && schedule.length > 1
      ? Number((schedule[0].monthlyPayment - schedule[1].monthlyPayment).toFixed(2))
      : 0;
  const totalInterest = Number(accumulatedInterest.toFixed(2));
  const totalPayment = Number(accumulatedPayment.toFixed(2));
  const interestRatio = totalPayment > 0 ? Number(((totalInterest / totalPayment) * 100).toFixed(1)) : 0;

  // 计算另一种还款方式对比 (等额本金 vs 等额本息)
  const otherMethod: RepaymentMethod =
    method === 'equal_principal' ? 'equal_installment' : 'equal_principal';
  const otherTotalInterest = calculateAlternativeTotalInterest(loanAmount, monthlyRate, totalMonths, otherMethod);
  const otherFirstMonth = calculateAlternativeFirstMonthPayment(loanAmount, monthlyRate, totalMonths, otherMethod);
  const interestDiff =
    method === 'equal_principal'
      ? otherTotalInterest - totalInterest // 等额本金节省的利息 (正数)
      : totalInterest - otherTotalInterest; // 等额本息多付的利息

  return {
    loanAmount,
    annualRate,
    monthlyRate,
    totalMonths,
    repaymentMethod: method,
    firstMonthPayment,
    monthlyDecrease,
    lastMonthPayment,
    firstMonthInterest,
    totalInterest,
    totalPayment,
    interestRatio,
    schedule,
    yearlySummary,
    comparison: {
      method: otherMethod,
      totalInterest: otherTotalInterest,
      totalPayment: loanAmount + otherTotalInterest,
      firstMonthPayment: otherFirstMonth,
      interestDifference: Number(interestDiff.toFixed(2)),
    },
  };
}

/**
 * 辅助计算另一种还款方式的总利息
 */
function calculateAlternativeTotalInterest(
  p: number,
  i: number,
  n: number,
  targetMethod: RepaymentMethod
): number {
  if (p <= 0 || n <= 0) return 0;
  if (targetMethod === 'equal_principal') {
    // (n + 1) * p * i / 2
    return Number(((n + 1) * p * i / 2).toFixed(2));
  } else {
    // 等额本息总利息
    if (i === 0) return 0;
    const pow = Math.pow(1 + i, n);
    const m = (p * i * pow) / (pow - 1);
    return Number((m * n - p).toFixed(2));
  }
}

function calculateAlternativeFirstMonthPayment(
  p: number,
  i: number,
  n: number,
  targetMethod: RepaymentMethod
): number {
  if (p <= 0 || n <= 0) return 0;
  if (targetMethod === 'equal_principal') {
    return Number((p / n + p * i).toFixed(2));
  } else {
    if (i === 0) return Number((p / n).toFixed(2));
    const pow = Math.pow(1 + i, n);
    return Number(((p * i * pow) / (pow - 1)).toFixed(2));
  }
}

/**
 * 将还款明细导出为 Excel 友好的 CSV 文件 (带 UTF-8 BOM，Excel 直接双击打开不乱码)
 */
export function exportRepaymentScheduleToCSV(result: LoanCalculationResult, filename?: string): void {
  const methodText = result.repaymentMethod === 'equal_principal' ? '等额本金' : '等额本息';
  const defaultFilename = `房贷还款计划表_${(result.loanAmount / 10000).toFixed(0)}万_${result.annualRate}%_${result.totalMonths / 12}年_${methodText}.csv`;
  const name = filename || defaultFilename;

  // 构建 CSV 内容
  const lines: string[] = [];

  // 头部基本信息摘要
  lines.push(`"房贷还款明细计划表"`);
  lines.push(`"生成时间",${JSON.stringify(new Date().toLocaleString('zh-CN'))}`);
  lines.push(`"贷款本金",${result.loanAmount} 元 (${(result.loanAmount / 10000).toFixed(2)} 万元)`);
  lines.push(`"贷款年利率",${result.annualRate.toFixed(2)} %`);
  lines.push(`"还款年限",${result.totalMonths / 12} 年 (${result.totalMonths} 期)`);
  lines.push(`"还款方式",${methodText}`);
  if (result.repaymentMethod === 'equal_principal') {
    lines.push(`"首月月供",${result.firstMonthPayment} 元`);
    lines.push(`"每月递减",${result.monthlyDecrease} 元`);
    lines.push(`"末月月供",${result.lastMonthPayment} 元`);
  } else {
    lines.push(`"每月月供",${result.firstMonthPayment} 元 (固定)`);
  }
  lines.push(`"首月利息",${result.firstMonthInterest} 元`);
  lines.push(`"支付总利息",${result.totalInterest} 元`);
  lines.push(`"还款总金额",${result.totalPayment} 元`);
  lines.push(`"利息占还款总额比",${result.interestRatio} %`);
  lines.push(''); // 空行分隔

  // 表头
  lines.push(
    ['期数', '还款年月', '月供金额(元)', '偿还本金(元)', '偿还利息(元)', '剩余未还本金(元)', '累计已还本金(元)', '累计已还利息(元)', '累计还款总额(元)']
      .map((col) => `"${col}"`)
      .join(',')
  );

  // 明细行
  result.schedule.forEach((item) => {
    lines.push(
      [
        item.period,
        item.dateStr,
        item.monthlyPayment.toFixed(2),
        item.principal.toFixed(2),
        item.interest.toFixed(2),
        item.remainingPrincipal.toFixed(2),
        item.accumulatedPrincipal.toFixed(2),
        item.accumulatedInterest.toFixed(2),
        item.accumulatedPayment.toFixed(2),
      ].join(',')
    );
  });

  // UTF-8 BOM 确保 Windows Excel 中文正常显示
  const bom = '\uFEFF';
  const csvContent = bom + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', name);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 复制表格数据到剪贴板 (TSV 制表符格式，支持直接粘贴进 Excel / WPS)
 */
export async function copyScheduleToClipboard(result: LoanCalculationResult): Promise<boolean> {
  try {
    const lines: string[] = [];
    lines.push(['期数', '还款年月', '月供金额(元)', '偿还本金(元)', '偿还利息(元)', '剩余未还本金(元)', '累计已还总额(元)'].join('\t'));
    result.schedule.forEach((item) => {
      lines.push(
        [
          item.period,
          item.dateStr,
          item.monthlyPayment.toFixed(2),
          item.principal.toFixed(2),
          item.interest.toFixed(2),
          item.remainingPrincipal.toFixed(2),
          item.accumulatedPayment.toFixed(2),
        ].join('\t')
      );
    });

    await navigator.clipboard.writeText(lines.join('\n'));
    return true;
  } catch {
    return false;
  }
}
