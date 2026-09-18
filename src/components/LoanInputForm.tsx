import React, { useState, useEffect } from 'react';
import { LoanInput, RepaymentMethod } from '../types';
import { formatChineseRMB } from '../utils/calculator';
import { Landmark, Percent, Calendar, ArrowDownUp, Plus, Minus, Sliders } from 'lucide-react';

interface LoanInputFormProps {
  input: LoanInput;
  onChange: (input: LoanInput) => void;
}

const AMOUNT_PRESETS = [30, 50, 80, 100, 150, 200, 300];

const RATE_PRESETS = [
  { label: '公积金首套 (2.60%)', value: 2.6 },
  { label: '商贷优惠 (2.80%)', value: 2.8 },
  { label: '基准利率 (3.00%)', value: 3.0 },
  { label: '公积金二套 (3.15%)', value: 3.15 },
  { label: '常规商贷 (3.30%)', value: 3.3 },
];

// 涵盖短期、中期和长期的完整年限预设 (1年 ~ 30年)
const POPULAR_TERMS = [
  { years: 1, label: '1年 (12期)' },
  { years: 2, label: '2年 (24期)' },
  { years: 3, label: '3年 (36期)' },
  { years: 5, label: '5年 (60期)' },
  { years: 10, label: '10年 (120期)' },
  { years: 15, label: '15年 (180期)' },
  { years: 20, label: '20年 (240期)' },
  { years: 25, label: '25年 (300期)' },
  { years: 30, label: '30年 (360期)' },
];

export const LoanInputForm: React.FC<LoanInputFormProps> = ({ input, onChange }) => {
  // 保持年限输入的本地临时输入字符串，避免删除时光标跳跃或强制回退
  const [termYearsText, setTermYearsText] = useState<string>(input.termYears.toString());
  const [amountText, setAmountText] = useState<string>(input.loanAmountWan.toString());
  const [rateText, setRateText] = useState<string>(input.annualRate.toString());

  useEffect(() => {
    setTermYearsText(input.termYears.toString());
  }, [input.termYears]);

  useEffect(() => {
    setAmountText(input.loanAmountWan.toString());
  }, [input.loanAmountWan]);

  useEffect(() => {
    setRateText(input.annualRate.toString());
  }, [input.annualRate]);

  // 金额输入
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setAmountText(raw);
    const val = parseFloat(raw);
    if (!isNaN(val) && val >= 0) {
      onChange({ ...input, loanAmountWan: Math.min(10000, val) });
    }
  };

  // 利率输入
  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setRateText(raw);
    const val = parseFloat(raw);
    if (!isNaN(val) && val >= 0) {
      onChange({ ...input, annualRate: Math.min(30, val) });
    }
  };

  const adjustRate = (delta: number) => {
    const newRate = Math.max(0.1, Number((input.annualRate + delta).toFixed(2)));
    onChange({ ...input, annualRate: newRate });
  };

  // 年限输入与调整 (支持 1 到 40 年自由设置)
  const handleTermYearsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setTermYearsText(raw);
    const val = parseInt(raw, 10);
    if (!isNaN(val) && val >= 1) {
      onChange({ ...input, termYears: Math.min(40, val) });
    }
  };

  const handleTermYearsBlur = () => {
    const val = parseInt(termYearsText, 10);
    if (isNaN(val) || val < 1) {
      setTermYearsText('1');
      onChange({ ...input, termYears: 1 });
    } else if (val > 40) {
      setTermYearsText('40');
      onChange({ ...input, termYears: 40 });
    }
  };

  const adjustTermYears = (deltaYears: number) => {
    const next = Math.max(1, Math.min(40, input.termYears + deltaYears));
    onChange({ ...input, termYears: next });
  };

  const handleMethodChange = (method: RepaymentMethod) => {
    onChange({ ...input, repaymentMethod: method });
  };

  return (
    <div id="loan-input-card" className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 md:p-7 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
            贷款条件输入
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">支持1~40年期商业贷款、公积金贷款及短期消费贷款</p>
        </div>
        <div className="text-xs font-medium px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200/60">
          默认等额本金
        </div>
      </div>

      {/* 还款方式切换 */}
      <div>
        <label className="block text-sm font-semibold text-slate-800 mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <ArrowDownUp className="w-4 h-4 text-emerald-600" />
            还款方式
          </span>
          <span className="text-xs font-normal text-slate-500">
            {input.repaymentMethod === 'equal_principal' ? '前期还款多，每月递减，利息最省' : '每月还款额固定，前期压力较小'}
          </span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            id="btn-method-equal-principal"
            type="button"
            onClick={() => handleMethodChange('equal_principal')}
            className={`p-3.5 rounded-xl border text-left transition-all relative ${
              input.repaymentMethod === 'equal_principal'
                ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600 shadow-xs'
                : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-sm font-bold ${input.repaymentMethod === 'equal_principal' ? 'text-emerald-950' : 'text-slate-800'}`}>
                等额本金 (默认推荐)
              </span>
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">省利息</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">每月偿还等额本金，利息随本金逐月递减</p>
          </button>

          <button
            id="btn-method-equal-installment"
            type="button"
            onClick={() => handleMethodChange('equal_installment')}
            className={`p-3.5 rounded-xl border text-left transition-all relative ${
              input.repaymentMethod === 'equal_installment'
                ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600 shadow-xs'
                : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-sm font-bold ${input.repaymentMethod === 'equal_installment' ? 'text-emerald-950' : 'text-slate-800'}`}>
                等额本息
              </span>
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-medium">固定月供</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">每月还款固定总金额，前期利息多本金少</p>
          </button>
        </div>
      </div>

      {/* 贷款金额 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="input-loan-amount" className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
            <Landmark className="w-4 h-4 text-emerald-600" />
            贷款金额
          </label>
          <span className="text-xs text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded">
            ≈ {(input.loanAmountWan * 10000).toLocaleString('zh-CN')} 元整
          </span>
        </div>

        <div className="relative flex items-center">
          <input
            id="input-loan-amount"
            type="number"
            min="1"
            max="10000"
            step="1"
            value={amountText}
            onChange={handleAmountChange}
            placeholder="例如: 100"
            className="w-full pl-4 pr-16 py-2.5 text-lg font-bold text-slate-900 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 bg-white"
          />
          <span className="absolute right-4 text-sm font-semibold text-slate-500 pointer-events-none">万元</span>
        </div>

        {/* 人民币大写提示 */}
        <p className="text-xs text-slate-400 truncate">
          大写金额：<span className="text-slate-600 font-mono">{formatChineseRMB(input.loanAmountWan)}</span>
        </p>

        {/* 快捷金额按键 */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-xs text-slate-400 mr-1">快捷预设:</span>
          {AMOUNT_PRESETS.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => onChange({ ...input, loanAmountWan: amt })}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                input.loanAmountWan === amt
                  ? 'bg-emerald-600 text-white border-emerald-600 font-medium'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              {amt}万
            </button>
          ))}
        </div>
      </div>

      {/* 贷款利率 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="input-loan-rate" className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
            <Percent className="w-4 h-4 text-emerald-600" />
            贷款年利率
          </label>
          <span className="text-xs text-slate-500 font-mono">
            月利率约 {(input.annualRate / 12).toFixed(4)}%
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              id="input-loan-rate"
              type="number"
              min="0.1"
              max="25"
              step="0.05"
              value={rateText}
              onChange={handleRateChange}
              placeholder="例如: 2.8"
              className="w-full pl-4 pr-12 py-2.5 text-lg font-bold text-slate-900 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 bg-white font-mono"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500 pointer-events-none">
              %
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => adjustRate(-0.1)}
              title="减小 0.1%"
              className="h-11 px-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition-colors"
            >
              -0.1%
            </button>
            <button
              type="button"
              onClick={() => adjustRate(-0.05)}
              title="减小 0.05%"
              className="h-11 px-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition-colors"
            >
              -0.05%
            </button>
            <button
              type="button"
              onClick={() => adjustRate(0.05)}
              title="增加 0.05%"
              className="h-11 px-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition-colors"
            >
              +0.05%
            </button>
            <button
              type="button"
              onClick={() => adjustRate(0.1)}
              title="增加 0.1%"
              className="h-11 px-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition-colors"
            >
              +0.1%
            </button>
          </div>
        </div>

        {/* 常见参考利率 */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-xs text-slate-400 mr-1">参考档位:</span>
          {RATE_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => onChange({ ...input, annualRate: preset.value })}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                Math.abs(input.annualRate - preset.value) < 0.001
                  ? 'bg-emerald-600 text-white border-emerald-600 font-medium'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* 还款年限（支持 1 到 40 年自由设置，修复了原先预设只从10年起步的问题） */}
      <div className="space-y-3 pt-1 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <label htmlFor="input-loan-term" className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-600" />
            还款年限设置
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
              当前: {input.termYears} 年 ({input.termYears * 12} 期)
            </span>
          </div>
        </div>

        {/* 核心主输入与微调步进器 */}
        <div className="flex items-center gap-2">
          {/* 减年限步进按钮 */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => adjustTermYears(-5)}
              disabled={input.termYears <= 1}
              title="减少 5 年"
              className="h-11 px-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              -5年
            </button>
            <button
              type="button"
              onClick={() => adjustTermYears(-1)}
              disabled={input.termYears <= 1}
              title="减少 1 年"
              className="h-11 px-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              -1年
            </button>
          </div>

          {/* 年限数字输入框 */}
          <div className="relative flex-1">
            <input
              id="input-loan-term"
              type="number"
              min="1"
              max="40"
              step="1"
              value={termYearsText}
              onChange={handleTermYearsChange}
              onBlur={handleTermYearsBlur}
              placeholder="输入1~40年"
              className="w-full pl-4 pr-12 py-2.5 text-lg font-bold text-slate-900 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 bg-white font-mono"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500 pointer-events-none">
              年
            </span>
          </div>

          {/* 增年限步进按钮 */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => adjustTermYears(1)}
              disabled={input.termYears >= 40}
              title="增加 1 年"
              className="h-11 px-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              +1年
            </button>
            <button
              type="button"
              onClick={() => adjustTermYears(5)}
              disabled={input.termYears >= 40}
              title="增加 5 年"
              className="h-11 px-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              +5年
            </button>
          </div>
        </div>

        {/* 滑动条辅助调节 (1年 - 30年) */}
        <div className="pt-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span>1年 (短期)</span>
            <span>5年</span>
            <span>10年</span>
            <span>20年</span>
            <span>30年 (长期)</span>
          </div>
          <input
            type="range"
            min="1"
            max="30"
            step="1"
            value={Math.min(30, input.termYears)}
            onChange={(e) => onChange({ ...input, termYears: parseInt(e.target.value, 10) })}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />
        </div>

        {/* 覆盖从 1年 到 30年的全部快捷预设按钮组 */}
        <div className="space-y-1.5 pt-1">
          <div className="text-xs text-slate-500 font-medium">快捷选择常用年限：</div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
            {POPULAR_TERMS.map((item) => (
              <button
                key={item.years}
                type="button"
                onClick={() => onChange({ ...input, termYears: item.years })}
                className={`py-2 px-1 rounded-xl text-xs font-semibold border transition-all truncate text-center ${
                  input.termYears === item.years
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-1 ring-emerald-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 首期年月设置 */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <span className="text-xs text-slate-600">首期还款年月：</span>
          <input
            id="input-loan-start-date"
            type="month"
            value={input.startYearMonth}
            onChange={(e) => onChange({ ...input, startYearMonth: e.target.value })}
            className="px-3 py-1.5 text-xs font-semibold text-slate-900 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            title="首期还款年月"
          />
        </div>
      </div>
    </div>
  );
};
