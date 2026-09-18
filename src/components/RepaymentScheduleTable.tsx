import React, { useState, useMemo } from 'react';
import { LoanCalculationResult, MonthlyPaymentItem, YearlySummaryItem } from '../types';
import { formatCurrency, formatNumber, exportRepaymentScheduleToCSV, copyScheduleToClipboard } from '../utils/calculator';
import {
  Download,
  Copy,
  Printer,
  Search,
  Check,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
} from 'lucide-react';

interface RepaymentScheduleTableProps {
  result: LoanCalculationResult;
}

export const RepaymentScheduleTable: React.FC<RepaymentScheduleTableProps> = ({ result }) => {
  const [activeTab, setActiveTab] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [pageSize, setPageSize] = useState<number>(12); // 每页12期 (1年)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [copied, setCopied] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 过滤月度明细
  const filteredSchedule = useMemo(() => {
    let items = result.schedule;
    if (selectedYear !== 'all') {
      items = items.filter((item) => item.yearIndex === selectedYear);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim();
      items = items.filter(
        (item) =>
          item.period.toString().includes(q) ||
          item.dateStr.includes(q)
      );
    }
    return items;
  }, [result.schedule, selectedYear, searchQuery]);

  // 分页计算
  const totalPages = Math.max(1, Math.ceil(filteredSchedule.length / pageSize));
  const validPage = Math.min(currentPage, totalPages);
  const paginatedItems = useMemo(() => {
    const start = (validPage - 1) * pageSize;
    return filteredSchedule.slice(start, start + pageSize);
  }, [filteredSchedule, validPage, pageSize]);

  // 导出 CSV
  const handleExportCSV = () => {
    exportRepaymentScheduleToCSV(result);
  };

  // 复制表格
  const handleCopy = async () => {
    const success = await copyScheduleToClipboard(result);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 打印
  const handlePrint = () => {
    window.print();
  };

  const totalYears = Math.ceil(result.totalMonths / 12);
  const yearOptions = Array.from({ length: totalYears }, (_, i) => i + 1);

  return (
    <div id="schedule-table-card" className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 md:p-7 space-y-5">
      {/* 头部与操作栏 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block"></span>
            还款计划明细表
            <span className="text-xs font-normal text-slate-500 ml-1">
              (共 {result.totalMonths} 期 · {totalYears} 年)
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            可查阅每期本金、利息与剩余本金，支持一键导出为 Excel 兼容 CSV 表格
          </p>
        </div>

        {/* 导出 & 操作按钮组 */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-export-csv"
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            title="导出为 Excel 友好的 CSV 表格"
          >
            <Download className="w-4 h-4" />
            导出 Excel 表格
          </button>

          <button
            id="btn-copy-table"
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            title="复制数据，可直接粘贴入 Excel / WPS / 表格软件"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
            {copied ? '已复制明细' : '复制数据'}
          </button>

          <button
            id="btn-print-table"
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            title="调用浏览器打印功能"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            打印 / PDF
          </button>
        </div>
      </div>

      {/* 视图切换与筛选条 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* 逐月 vs 年度汇总 Tab */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/60 self-start">
          <button
            type="button"
            onClick={() => {
              setActiveTab('monthly');
              setCurrentPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'monthly'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            逐月还款明细 ({result.totalMonths}期)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('yearly')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'yearly'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            年度汇总分析 ({totalYears}年)
          </button>
        </div>

        {/* 仅在逐月模式下显示筛选器 */}
        {activeTab === 'monthly' && (
          <div className="flex items-center gap-2 flex-wrap">
            {/* 快速定位年份 */}
            <div className="flex items-center gap-1 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                id="select-year-filter"
                value={selectedYear}
                onChange={(e) => {
                  const val = e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10);
                  setSelectedYear(val);
                  setCurrentPage(1);
                }}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">查看全部年份</option>
                {yearOptions.map((yr) => (
                  <option key={yr} value={yr}>
                    第 {yr} 年 (期数 {(yr - 1) * 12 + 1} - {Math.min(yr * 12, result.totalMonths)})
                  </option>
                ))}
              </select>
            </div>

            {/* 搜索期数或月份 */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="搜索期数/月份"
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-32 sm:w-36"
              />
            </div>
          </div>
        )}
      </div>

      {/* 表格内容区域 */}
      {activeTab === 'monthly' ? (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/90 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-3 px-3.5 text-center w-14">期数</th>
                  <th className="py-3 px-3.5">还款年月</th>
                  <th className="py-3 px-3.5 text-right font-bold text-slate-900">月供总额</th>
                  <th className="py-3 px-3.5 text-right text-blue-700">月供本金</th>
                  <th className="py-3 px-3.5 text-right text-amber-700">月供利息</th>
                  <th className="py-3 px-3.5 text-right">剩余未还本金</th>
                  <th className="py-3 px-3.5 text-right text-slate-500">累计已还本金</th>
                  <th className="py-3 px-3.5 text-right text-slate-500">累计已还利息</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {paginatedItems.length > 0 ? (
                  paginatedItems.map((item) => (
                    <tr
                      key={item.period}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="py-2.5 px-3.5 text-center text-slate-500 font-normal">
                        <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-[11px] font-mono">
                          {item.period}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 font-sans font-medium text-slate-800">
                        {item.dateStr}
                        {item.period % 12 === 0 && (
                          <span className="ml-1.5 text-[10px] px-1 py-0.2 rounded bg-indigo-50 text-indigo-700 font-normal">
                            年终
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-bold text-slate-900 font-sans">
                        {formatCurrency(item.monthlyPayment)}
                      </td>
                      <td className="py-2.5 px-3.5 text-right text-blue-700 font-sans">
                        {formatCurrency(item.principal)}
                      </td>
                      <td className="py-2.5 px-3.5 text-right text-amber-700 font-sans">
                        {formatCurrency(item.interest)}
                      </td>
                      <td className="py-2.5 px-3.5 text-right text-slate-700 font-sans">
                        {formatCurrency(item.remainingPrincipal)}
                      </td>
                      <td className="py-2.5 px-3.5 text-right text-slate-500 font-sans">
                        {formatCurrency(item.accumulatedPrincipal)}
                      </td>
                      <td className="py-2.5 px-3.5 text-right text-slate-500 font-sans">
                        {formatCurrency(item.accumulatedInterest)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 font-sans">
                      未找到符合筛选条件的还款明细
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 分页控制栏 */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 pt-1">
            <div className="flex items-center gap-2">
              <span>共 {filteredSchedule.length} 条数据</span>
              <span>·</span>
              <span>每页显示:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 font-medium"
              >
                <option value={12}>12 期 (1年)</option>
                <option value={24}>24 期 (2年)</option>
                <option value={36}>36 期 (3年)</option>
                <option value={60}>60 期 (5年)</option>
                <option value={360}>全部显示</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={validPage <= 1}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                title="第一页"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={validPage <= 1}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                title="上一页"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-2 font-mono font-medium text-slate-700">
                第 {validPage} / {totalPages} 页
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={validPage >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                title="下一页"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={validPage >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                title="最后一页"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* 年度汇总视图 */
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-3 px-4 w-20">年份</th>
                <th className="py-3 px-4">年度周期</th>
                <th className="py-3 px-4 text-right font-bold text-slate-900">年度还款总额</th>
                <th className="py-3 px-4 text-right text-blue-700">年度归还本金</th>
                <th className="py-3 px-4 text-right text-amber-700">年度归还利息</th>
                <th className="py-3 px-4 text-right">年末剩余本金</th>
                <th className="py-3 px-4 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {result.yearlySummary.map((yearItem) => (
                <tr key={yearItem.yearIndex} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-sans font-bold text-slate-800">
                    第 {yearItem.yearIndex} 年
                  </td>
                  <td className="py-3 px-4 font-sans text-slate-600">
                    {yearItem.yearLabel} ({yearItem.monthsCount}期)
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900 font-sans">
                    {formatCurrency(yearItem.totalPayment)}
                  </td>
                  <td className="py-3 px-4 text-right text-blue-700 font-sans">
                    {formatCurrency(yearItem.totalPrincipal)}
                  </td>
                  <td className="py-3 px-4 text-right text-amber-700 font-sans">
                    {formatCurrency(yearItem.totalInterest)}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-700 font-sans">
                    {formatCurrency(yearItem.endRemainingPrincipal)}
                  </td>
                  <td className="py-3 px-4 text-center font-sans">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedYear(yearItem.yearIndex);
                        setActiveTab('monthly');
                        setCurrentPage(1);
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline font-medium"
                    >
                      查看当年月供
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-bold border-t-2 border-slate-300 font-sans text-xs">
                <td className="py-3.5 px-4" colSpan={2}>
                  合计 (全周期总览)
                </td>
                <td className="py-3.5 px-4 text-right text-slate-900">
                  {formatCurrency(result.totalPayment)}
                </td>
                <td className="py-3.5 px-4 text-right text-blue-700">
                  {formatCurrency(result.loanAmount)}
                </td>
                <td className="py-3.5 px-4 text-right text-amber-700">
                  {formatCurrency(result.totalInterest)}
                </td>
                <td className="py-3.5 px-4 text-right text-slate-500">
                  ¥0.00
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};
