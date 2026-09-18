import React, { useState, useMemo } from 'react';
import { LoanInput, RepaymentMethod } from './types';
import { calculateLoan } from './utils/calculator';
import { LoanInputForm } from './components/LoanInputForm';
import { ResultOverview } from './components/ResultOverview';
import { RepaymentScheduleTable } from './components/RepaymentScheduleTable';
import { ScheduleChart } from './components/ScheduleChart';
import { Calculator, RotateCcw, FileSpreadsheet, Sparkles, BookOpen } from 'lucide-react';

const DEFAULT_INPUT: LoanInput = {
  loanAmountWan: 100, // 默认 100 万元
  annualRate: 2.8, // 用户指定：默认 2.8%
  termYears: 30, // 默认 30 年
  startYearMonth: '2026-10',
  repaymentMethod: 'equal_principal', // 用户指定：默认使用等额本金
};

export default function App() {
  const [input, setInput] = useState<LoanInput>(DEFAULT_INPUT);

  // 实时响应式计算结果
  const result = useMemo(() => {
    return calculateLoan(input);
  }, [input]);

  // 重置回初始默认值
  const handleReset = () => {
    setInput(DEFAULT_INPUT);
  };

  // 切换还款方式
  const handleToggleMethod = () => {
    setInput((prev) => ({
      ...prev,
      repaymentMethod: prev.repaymentMethod === 'equal_principal' ? 'equal_installment' : 'equal_principal',
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-800 antialiased selection:bg-emerald-100 selection:text-emerald-900 pb-16">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  房贷还款计算器
                </h1>
                <span className="hidden sm:inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  默认等额本金 · 2.8% 利率
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden md:block">
                精准月供利息测算 · 逐月与年度计划表 · 支持导出 Excel 表格
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-reset-default"
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 rounded-lg transition-colors cursor-pointer"
              title="重置为默认 100万 · 2.8%利率 · 30年 · 等额本金"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">重置默认</span>
            </button>
          </div>
        </div>
      </header>

      {/* 主体计算内容区域 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6 sm:space-y-8">
        {/* 上半区：输入参数卡片 + 测算结果卡片 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* 左侧：输入表单 */}
          <div className="lg:col-span-5">
            <LoanInputForm input={input} onChange={setInput} />
          </div>

          {/* 右侧：结果核心展示与走势图 */}
          <div className="lg:col-span-7 space-y-6">
            <ResultOverview result={result} onSwitchMethod={handleToggleMethod} />
            <ScheduleChart result={result} />
          </div>
        </div>

        {/* 下半区：详细还款明细表格与导出功能 */}
        <div className="w-full">
          <RepaymentScheduleTable result={result} />
        </div>

        {/* 底部知识普及与说明 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 text-xs text-slate-500">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            还款方式说明与计算规则
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 leading-relaxed">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
              <h3 className="font-bold text-slate-800 mb-1">等额本金还款法 (本计算器默认)</h3>
              <p>
                每月归还固定的本金（贷款总额 ÷ 还款总月数），利息则根据当期剩余本金逐月计算。因此前期月供较高，随后每月递减（每月少还约
                Δ 元）。在整个贷款周期中，由于前期本金扣减快，产生的总利息远低于等额本息，适合前期经济能力较强、希望尽可能节省利息的借款人。
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
              <h3 className="font-bold text-slate-800 mb-1">等额本息还款法</h3>
              <p>
                每月还款的总金额固定不变。在还款初期，每月供款中利息占比较大、本金占比较小；随着时间推移，利息逐月减少、本金逐月增加。其优势在于每月支出确定，前期压力相对较小，便于进行每月家庭财务规划。
              </p>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 pt-1">
            * 友情提示：本计算器结果仅供参考，实际月供还款金额以贷款经办银行与公积金中心合同签署及最终放款结算单为准。导出表格采用标准 UTF-8 BOM 编码，可直接使用 Excel、WPS、Numbers 或各表格软件打开。
          </p>
        </div>
      </main>
    </div>
  );
}
