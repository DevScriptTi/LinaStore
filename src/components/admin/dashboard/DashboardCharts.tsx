"use client";

import React, { useMemo } from "react";
import { IOrder } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from "recharts";
import { TrendingUp, Award, BarChart3, Calendar } from "lucide-react";

interface DashboardChartsProps {
  orders: IOrder[];
}

export function DashboardCharts({ orders }: DashboardChartsProps) {
  
  // 1. Process Daily Revenue & Orders Trend (Last 7 Days) using strictly local time keys
  const dailyRevenueData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        matchKey: `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`,
        name: d.toLocaleDateString("ar-DZ", { day: "numeric", month: "short" }).replace(".", ""),
        revenue: 0,
        orders: 0,
      };
    });

    orders.forEach((ord) => {
      if (!ord.createdAt) return;
      let orderDate: Date | null = null;
      if (ord.createdAt?.toDate) {
        orderDate = ord.createdAt.toDate();
      } else if (ord.createdAt) {
        orderDate = new Date(ord.createdAt);
      }

      if (orderDate && !isNaN(orderDate.getTime())) {
        const matchKey = `${orderDate.getDate()}-${orderDate.getMonth() + 1}-${orderDate.getFullYear()}`;
        const dayData = last7Days.find((day) => day.matchKey === matchKey);
        if (dayData) {
          dayData.orders += 1;
          if (ord.status !== "cancelled" && ord.status !== "returned") {
            dayData.revenue += Number(ord.total || (ord.productPrice * ord.quantity + ord.shippingCost) || 0);
          }
        }
      }
    });

    return last7Days;
  }, [orders]);

  // 2. Process Top Products Sold Data
  const topProductsData = useMemo(() => {
    const productMap: Record<string, { name: string; sold: number; revenue: number }> = {};

    orders.forEach((ord) => {
      const pName = ord.productName || "منتج غير مسمى";
      if (!productMap[pName]) {
        productMap[pName] = { name: pName, sold: 0, revenue: 0 };
      }
      productMap[pName].sold += ord.quantity || 1;
      if (ord.status !== "cancelled" && ord.status !== "returned") {
        productMap[pName].revenue += ord.total || (ord.productPrice * ord.quantity + ord.shippingCost);
      }
    });

    return Object.values(productMap)
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5)
      .map((item) => ({
        ...item,
        shortName: item.name.length > 18 ? item.name.substring(0, 18) + "..." : item.name,
      }));
  }, [orders]);

  // Custom Dark/Light Themed Tooltip for Trend Chart
  const CustomTrendTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3.5 rounded-2xl bg-[#1C1B1F] border border-gray-700/60 text-white shadow-2xl space-y-1.5 text-xs select-none">
          <p className="font-extrabold text-orange-400 border-b border-gray-700/60 pb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>تاريخ: {label}</span>
          </p>
          <p className="font-bold text-gray-200">
            الأرباح: <span className="font-mono text-emerald-400 font-black">{formatCurrency(payload[0]?.value || 0)}</span>
          </p>
          <p className="font-bold text-gray-200">
            الطلبات: <span className="font-mono text-orange-400 font-black">{payload[1]?.value || 0} طلب</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom Dark/Light Themed Tooltip for Products Chart
  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-3.5 rounded-2xl bg-[#1C1B1F] border border-gray-700/60 text-white shadow-2xl space-y-1.5 text-xs select-none max-w-xs">
          <p className="font-extrabold text-orange-400 border-b border-gray-700/60 pb-1 line-clamp-1">
            {data.name}
          </p>
          <p className="font-bold text-gray-200">
            الكمية المباعة: <span className="font-mono text-orange-400 font-black">{data.sold} قطعة</span>
          </p>
          <p className="font-bold text-gray-200">
            إجمالي الإيرادات: <span className="font-mono text-emerald-400 font-black">{formatCurrency(data.revenue)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 select-none" dir="rtl">
      
      {/* Chart 1: Revenue & Orders Trend (Takes 2 Columns on LG) */}
      <div className="lg:col-span-2 p-6 rounded-3xl bg-md-surface border border-md-outline/10 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-md-outline/10">
          <div>
            <h3 className="text-base font-extrabold text-md-surface-on flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <span>مخطط نمو الأرباح والطلبات (7 أيام الأخيرة)</span>
            </h3>
            <p className="text-xs text-md-surface-on-variant mt-0.5">
              تطور الإيرادات اليومية وعدد الطلبات المسجلة في المتجر
            </p>
          </div>
        </div>

        <div className="h-[250px] sm:h-[300px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyRevenueData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#88888820" />
              <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} />
              <YAxis yAxisId="left" stroke="#f97316" fontSize={11} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
              <YAxis yAxisId="right" orientation="right" stroke="#22c55e" fontSize={11} tickLine={false} />
              <Tooltip content={<CustomTrendTooltip />} />
              <Area yAxisId="left" type="monotone" dataKey="revenue" name="الأرباح (د.ج)" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              <Area yAxisId="right" type="monotone" dataKey="orders" name="عدد الطلبات" stroke="#22c55e" strokeWidth={2.5} fillOpacity={1} fill="url(#colorOrders)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Top Selling Products (Takes 1 Column on LG) */}
      <div className="p-6 rounded-3xl bg-md-surface border border-md-outline/10 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-md-outline/10">
          <div>
            <h3 className="text-base font-extrabold text-md-surface-on flex items-center gap-2">
              <Award className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <span>المنتجات الأكثر مبيعاً 🏆</span>
            </h3>
            <p className="text-xs text-md-surface-on-variant mt-0.5">
              ترتيب أعلى 5 منتجات مبيعاً بالقطع
            </p>
          </div>
        </div>

        {topProductsData.length === 0 ? (
          <div className="h-[280px] flex items-center justify-center text-xs text-md-surface-on-variant font-semibold">
            لا توجد بيانات مبيعات كافية لعرض الرسم البياني.
          </div>
        ) : (
          <div className="h-[250px] sm:h-[300px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProductsData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#88888820" horizontal={false} />
                <XAxis type="number" stroke="#888888" fontSize={11} tickLine={false} />
                <YAxis dataKey="shortName" type="category" stroke="#888888" fontSize={10} tickLine={false} width={100} />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey="sold" name="القطع المباعة" fill="#f97316" radius={[0, 8, 8, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

    </div>
  );
}
