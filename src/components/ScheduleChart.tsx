import React, { useState } from 'react';
import { LoanCalculationResult } from '../types';
import { formatCurrency } from '../utils/calculator';
import { TrendingDown, LineChart as ChartIcon, BarChart3 } from 'lucide-react';

interface ScheduleChartProps {
  result: LoanCalculationResult;
}

export const ScheduleChart: React.FC<ScheduleChartProps> = ({ result }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [chartType, setChartType] = useState<'payment' | 'balance'>('payment');

  const { schedule, totalMonths, loanAmount, repaymentMethod } = result;

  // 采样点：当期数较多（如 360 期）时，如果全绘图可能会有些密集，但用 SVG path 绘制全部 360 点平滑效果极佳
  const maxPayment = Math.max(...schedule.map((s) => s.monthlyPayment), 1);
  const minPayment = Math.min(...schedule.map((s) => s.monthlyPayment), 0);

  // SVG 画布尺寸
  const width = 680;
  const height = 180;
  const padding = { top: 20, right: 20, bottom: 28, left: 55 };

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // 坐标转换计算 (确保年限较短如1年时不会除以0)
  const divisor = totalMonths > 1 ? totalMonths - 1 : 1;
  const getX = (index: number) => padding.left + (index / divisor) * chartW;

  // 月供趋势坐标
  const getYPayment = (val: number) => {
    // 留出上下边距
    const range = maxPayment - minPayment || 1;
    const normalized = (val - minPayment) / range;
    return padding.top + chartH - normalized * chartH;
  };

  // 剩余本金坐标
  const getYBalance = (val: number) => {
    const normalized = val / (loanAmount || 1);
    return padding.top + chartH - normalized * chartH;
  };

  // 绘制折线路径
  const points = schedule.map((item, i) => {
    const x = getX(i);
    const y = chartType === 'payment' ? getYPayment(item.monthlyPayment) : getYBalance(item.remainingPrincipal);
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaD = `${pathD} L ${padding.left + chartW},${padding.top + chartH} L ${padding.left},${padding.top + chartH} Z`;

  // 悬浮点数据
  const activeItem = hoverIndex !== null && schedule[hoverIndex] ? schedule[hoverIndex] : null;

  return (
    <div id="schedule-chart-card" className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 md:p-7 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-emerald-600" />
            还款走势可视化
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {repaymentMethod === 'equal_principal'
              ? '等额本金模式下，月供随本金偿还每月平稳递减，后期还款负担持续减轻'
              : '等额本息模式下，每月供额恒定，利息占比逐月减少、本金占比逐月增加'}
          </p>
        </div>

        {/* 切换图表指标 */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-semibold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setChartType('payment')}
            className={`px-3 py-1 rounded-md transition-all ${
              chartType === 'payment' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            月供变化趋势
          </button>
          <button
            type="button"
            onClick={() => setChartType('balance')}
            className={`px-3 py-1 rounded-md transition-all ${
              chartType === 'balance' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            剩余本金递减
          </button>
        </div>
      </div>

      {/* SVG 容器 */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
          onMouseLeave={() => setHoverIndex(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const ratio = mouseX / rect.width;
            const svgX = ratio * width;
            const contentX = Math.max(0, Math.min(chartW, svgX - padding.left));
            const idx = Math.round((contentX / chartW) * (totalMonths - 1));
            setHoverIndex(Math.max(0, Math.min(totalMonths - 1, idx)));
          }}
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="balanceAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* 网格参考线 */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + chartH * ratio;
            let label = '';
            if (chartType === 'payment') {
              const val = minPayment + (1 - ratio) * (maxPayment - minPayment);
              label = `¥${Math.round(val)}`;
            } else {
              const val = (1 - ratio) * loanAmount;
              label = `${(val / 10000).toFixed(0)}万`;
            }
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + chartW}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="#94a3b8"
                  fontFamily="monospace"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* X 轴刻度标签 */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const idx = Math.max(0, Math.min(totalMonths - 1, Math.round(ratio * (totalMonths - 1))));
            const x = getX(idx);
            const item = schedule[idx];
            return (
              <g key={ratio}>
                <line
                  x1={x}
                  y1={padding.top + chartH}
                  x2={x}
                  y2={padding.top + chartH + 5}
                  stroke="#cbd5e1"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={padding.top + chartH + 18}
                  textAnchor={ratio === 0 ? 'start' : ratio === 1 ? 'end' : 'middle'}
                  fontSize="10"
                  fill="#64748b"
                >
                  {item ? `第${item.period}期` : ''}
                </text>
              </g>
            );
          })}

          {/* 填充区域 */}
          <path
            d={areaD}
            fill={chartType === 'payment' ? 'url(#areaGradient)' : 'url(#balanceAreaGradient)'}
          />

          {/* 趋势曲线 */}
          <path
            d={pathD}
            fill="none"
            stroke={chartType === 'payment' ? '#10b981' : '#3b82f6'}
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* 悬停竖线与圆点 */}
          {hoverIndex !== null && activeItem && (
            <g>
              <line
                x1={getX(hoverIndex)}
                y1={padding.top}
                x2={getX(hoverIndex)}
                y2={padding.top + chartH}
                stroke="#64748b"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <circle
                cx={getX(hoverIndex)}
                cy={
                  chartType === 'payment'
                    ? getYPayment(activeItem.monthlyPayment)
                    : getYBalance(activeItem.remainingPrincipal)
                }
                r="4.5"
                fill={chartType === 'payment' ? '#10b981' : '#3b82f6'}
                stroke="#ffffff"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        {/* 动态浮动信息栏 */}
        {activeItem && hoverIndex !== null && (
          <div
            className="absolute top-2 left-16 bg-slate-900/90 backdrop-blur-xs text-white text-xs px-3.5 py-2 rounded-xl shadow-lg border border-slate-700/60 pointer-events-none flex items-center gap-4 transition-all"
          >
            <div>
              <span className="text-slate-400 block text-[10px]">期数/年月</span>
              <span className="font-bold">第{activeItem.period}期 ({activeItem.dateStr})</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">当月月供</span>
              <span className="font-mono font-bold text-emerald-400">{formatCurrency(activeItem.monthlyPayment)}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">本金 / 利息</span>
              <span className="font-mono text-slate-200">
                {formatCurrency(activeItem.principal)} / {formatCurrency(activeItem.interest)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">剩余本金</span>
              <span className="font-mono text-blue-300">{formatCurrency(activeItem.remainingPrincipal)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
