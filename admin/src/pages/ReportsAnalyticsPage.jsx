import React, { useCallback } from 'react';
import { Download, FileBarChart2, BarChart3, TrendingUp, Calendar, Box } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import PageHeader from '../components/common/PageHeader';
import useAdminData from '../hooks/useAdminData';
import { fetchReports } from '../services/adminApi';

function escapeCsvValue(value) {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function formatInr(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function normalizeCsvCell(key, value) {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  if (typeof value === 'number' && /(amount|revenue|price)/i.test(String(key))) {
    return formatInr(value);
  }

  return value;
}

function downloadCsv(title, report) {
  const rows = Array.isArray(report?.rows) ? report.rows : [];

  const normalizedRows = rows.length
    ? rows
    : [{ Message: 'No data available', GeneratedAt: new Date(report?.generatedAt || Date.now()).toISOString() }];

  const columns = Array.from(
    normalizedRows.reduce((set, row) => {
      Object.keys(row || {}).forEach((key) => set.add(key));
      return set;
    }, new Set())
  );

  const csvLines = [
    `Report,${escapeCsvValue(title)}`,
    `Generated At,${escapeCsvValue(new Date(report?.generatedAt || Date.now()).toLocaleString())}`,
    '',
    columns.join(','),
    ...normalizedRows.map((row) => columns.map((key) => escapeCsvValue(normalizeCsvCell(key, row?.[key]))).join(',')),
  ];

  const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = title.toLowerCase().replace(/\s+/g, '-');
  link.href = url;
  link.download = `${safeName}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function ReportTile({ title, report }) {
  return (
    <div className="silk-card p-6 group hover:bg-white/[0.02] transition-colors relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity translate-x-4 -translate-y-4">
            <FileBarChart2 size={120} />
        </div>
      <div className="relative z-10">
        <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 mb-4 transition-transform group-hover:scale-110">
                <FileBarChart2 size={24} />
            </div>
        </div>
        <h3 className="text-xl font-black text-white">{title}</h3>
        <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
                <Box size={12} className="text-gray-700" />
                <span>{report.records} Data Points</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
                <Calendar size={12} className="text-gray-700" />
                <span>Last Updated: {new Date(report.generatedAt).toLocaleDateString()}</span>
            </div>
        </div>
        <button
          type="button"
          onClick={() => downloadCsv(title, report)}
          className="mt-8 w-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-black py-4 rounded-xl border border-white/5 hover:border-indigo-500/30 transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest active:scale-95 shadow-lg"
        >
          <Download size={16} />
          Compile Export
        </button>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#161521] border border-white/10 p-5 rounded-2xl shadow-2xl backdrop-blur-xl">
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">{payload[0].payload.status}</p>
                <p className="text-white text-xl font-black">{formatInr(payload[0].value)}</p>
            </div>
        );
    }
    return null;
};

export default function ReportsAnalyticsPage() {
  const loadReports = useCallback(() => fetchReports(), []);
  const { data, loading, error } = useAdminData(loadReports, null);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <PageHeader 
        title="Business Intelligence" 
        subtitle="Analyze revenue vectors, customer lifecycle patterns, and inventory velocity." 
      />

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl text-sm font-medium">
            {error}
        </div>
      )}

      {loading || !data ? (
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-6">
            <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <div className="text-center">
                <p className="text-white font-black tracking-widest uppercase text-xs">Preparing Data Repository</p>
                <p className="text-gray-600 text-[10px] font-bold mt-2">Compiling real-time aggregates...</p>
            </div>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <ReportTile title="Sales Dashboard" report={data.salesReport} />
            <ReportTile title="Operations Log" report={data.orderReport} />
            <ReportTile title="Client Directory" report={data.customerReport} />
          </div>

          <div className="silk-card p-8">
            <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                        <TrendingUp size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Revenue Streams</h3>
                        <p className="text-xs text-gray-500 mt-1">Financial performance across fulfillment states</p>
                    </div>
                </div>
                <div className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Real-time Audit
                </div>
            </div>

            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={data.chartData} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorReportBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818cf8" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                  <XAxis 
                    dataKey="status" 
                    stroke="rgba(255, 255, 255, 0.2)" 
                    tick={{fill: 'rgba(255, 255, 255, 0.4)', fontSize: 10, fontWeight: 700}} 
                    axisLine={false} 
                    tickLine={false} 
                    dy={15} 
                  />
                  <YAxis 
                    stroke="rgba(255, 255, 255, 0.2)" 
                    tick={{fill: 'rgba(255, 255, 255, 0.4)', fontSize: 10, fontWeight: 700}} 
                    axisLine={false} 
                    tickLine={false} 
                    dx={-15} 
                    tickFormatter={(val) => `₹${val / 1000}k`} 
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }} />
                  <Bar 
                     dataKey="revenue" 
                     fill="url(#colorReportBar)" 
                     radius={[10, 10, 0, 0]} 
                     animationBegin={200} 
                     animationDuration={1500} 
                     activeBar={{ filter: 'brightness(1.2)' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
