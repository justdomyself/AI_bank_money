import React from 'react';
import { LoanCalculationResult } from '../types';
import { formatCurrency, formatNumber } from '../utils/calculator';
import { TrendingDown, Coins, CircleDot, ShieldCheck, Scale, CheckCircle2 } from 'lucide-react';

interface ResultOverviewProps {
  result: LoanCalculationResult;
  onSwitchMethod: () => void;
}

export const ResultOverview: React.FC<ResultOverviewProps> = ({ result, onSwitchMethod }) => {
  const isEqualPrincipal = result.repaymentMethod === 'equal_principal';
  const principalWan = result.loanAmount / 10000;
  const interestWan = result.totalInterest / 10000;
  const totalPaymentWan = result.totalPayment / 10000;

  const principalRatio = 100 - result.interestRatio;

  return (
    <div id="result-overview-card" className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 md:p-7 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
            还款测算结果
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            基于 {principalWan.toFixed(0)} 万元 · {result.annualRate}% 利率 · {result.totalMonths / 12} 年期计算
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md">
          {isEqualPrincipal ? '等额本金模式' : '等额本息模式'}
        </span>
      </div>

      {/* 核心主卡片: 首月还款 / 每月还款 */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        {/* 背景装饰光晕 */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <CircleDot className="w-3.5 h-3.5 text-emerald-400" />
              {isEqualPrincipal ? '首月还款金额 (最高月供)' : '每月月供金额 (固定金额)'}
            </span>
            {isEqualPrincipal && (
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                逐月递减
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-white font-mono">
              {formatCurrency(result.firstMonthPayment)}
            </span>
            <span className="text-sm text-slate-300">/ 月</span>
          </div>

          {/* 首月明细拆解 */}
          <div className="pt-3 border-t border-slate-700/60 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">首月本金</span>
              <span className="font-semibold text-slate-200 font-mono">
                {formatCurrency(result.schedule[0]?.principal || 0)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">首月利息</span>
              <span className="font-semibold text-amber-300 font-mono">
                {formatCurrency(result.firstMonthInterest)}
              </span>
            </div>
            {isEqualPrincipal && (
              <div className="col-span-2 sm:col-span-1">
                <span className="text-slate-400 block mb-0.5">每月递减金额</span>
                <span className="font-semibold text-emerald-400 flex items-center gap-0.5 font-mono">
                  <TrendingDown className="w-3.5 h-3.5" />
                  {formatCurrency(result.monthlyDecrease)}
                </span>
              </div>
            )}
          </div>

          {isEqualPrincipal && (
            <div className="text-xs text-slate-400 bg-slate-800/80 rounded-xl px-3 py-2 border border-slate-700/40 flex items-center justify-between">
              <span>末月还款 (最后一期第 {result.totalMonths} 期)</span>
              <span className="font-bold text-white font-mono">{formatCurrency(result.lastMonthPayment)}</span>
            </div>
          )}
        </div>
      </div>

      {/* 次级关键指标网格 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Coins className="w-3.5 h-3.5 text-amber-600" />
            支付总利息
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">
            {formatCurrency(result.totalInterest)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            折合约 <span className="font-semibold text-slate-800">{interestWan.toFixed(2)} 万元</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            还款总额 (本息合计)
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">
            {formatCurrency(result.totalPayment)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            折合约 <span className="font-semibold text-slate-800">{totalPaymentWan.toFixed(2)} 万元</span>
          </div>
        </div>
      </div>

      {/* 本金与利息构成比例条 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 inline-block" />
            <span className="text-slate-600">贷款本金: {principalWan.toFixed(1)}万 ({principalRatio.toFixed(1)}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
            <span className="text-slate-600">支付利息: {interestWan.toFixed(1)}万 ({result.interestRatio}%)</span>
          </div>
        </div>

        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
          <div
            className="bg-blue-600 h-full transition-all duration-500"
            style={{ width: `${principalRatio}%` }}
            title={`本金: ${formatCurrency(result.loanAmount)}`}
          />
          <div
            className="bg-amber-500 h-full transition-all duration-500"
            style={{ width: `${result.interestRatio}%` }}
            title={`利息: ${formatCurrency(result.totalInterest)}`}
          />
        </div>
      </div>

      {/* 方案对比洞察 */}
      <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
              <Scale className="w-4 h-4 text-emerald-700" />
              还款方式优劣对比
            </div>
            {isEqualPrincipal ? (
              <p className="text-xs text-emerald-800 leading-relaxed">
                当前采用<strong className="font-semibold text-emerald-950">等额本金</strong>
                ，相比等额本息共可<strong className="text-emerald-700 font-bold">节省利息 {formatCurrency(result.comparison.interestDifference)}</strong>
                （等额本息总利息约 {formatCurrency(result.comparison.totalInterest)}）。前期月供稍高，适合当前收入充裕且希望尽可能降低利息支出的家庭。
              </p>
            ) : (
              <p className="text-xs text-slate-700 leading-relaxed">
                当前采用<strong className="font-semibold text-slate-900">等额本息</strong>
                ，每月供固定为 <strong className="font-semibold">{formatCurrency(result.firstMonthPayment)}</strong>
                。相比等额本金前期还款压力低，但总利息支出多付约 <strong className="text-amber-700 font-semibold">{formatCurrency(result.comparison.interestDifference)}</strong>。
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onSwitchMethod}
            className="shrink-0 text-xs px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-white hover:bg-emerald-100/50 text-emerald-800 font-medium transition-colors"
          >
            切换为{isEqualPrincipal ? '等额本息' : '等额本金'}
          </button>
        </div>
      </div>
    </div>
  );
};
