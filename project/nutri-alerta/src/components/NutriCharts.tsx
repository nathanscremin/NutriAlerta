"use client";
import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid } from 'recharts';

const pieData = [
  { name: 'Normal', value: 45 },
  { name: 'Risco Baixo', value: 30 },
  { name: 'Risco Alto', value: 25 },
];

const COLORS = ['#10b981', '#f59e0b', '#f43f5e'];

const barData = [
  { name: 'UBS Centro', risco: 65 },
  { name: 'UBS Sul', risco: 40 },
  { name: 'UBS Norte', risco: 80 },
  { name: 'UBS Leste', risco: 30 },
];

const lineData = [
  { ano: '2019', taxa: 12 },
  { ano: '2020', taxa: 15 },
  { ano: '2021', taxa: 18 },
  { ano: '2022', taxa: 22 },
  { ano: '2023', taxa: 25 },
];

export default function NutriCharts() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
      {/* Donut Chart */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 shadow-xl rounded-2xl p-5 flex flex-col">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Distribuição Nutricional</h3>
        <div className="flex-1 min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} itemStyle={{ color: '#e2e8f0' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 shadow-xl rounded-2xl p-5 flex flex-col">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Risco por Unidade (UBS)</h3>
        <div className="flex-1 min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
              <Bar dataKey="risco" radius={[0, 4, 4, 0]}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.risco > 70 ? '#f43f5e' : entry.risco > 40 ? '#f59e0b' : '#10b981'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Line Chart */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 shadow-xl rounded-2xl p-5 flex flex-col">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Evolução Temporal (Risco)</h3>
        <div className="flex-1 min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="ano" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
              <Line type="monotone" dataKey="taxa" stroke="#06b6d4" strokeWidth={3} dot={{ fill: '#06b6d4', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: '#fff' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
