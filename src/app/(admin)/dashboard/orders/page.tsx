import React from "react";
import { OrdersTable } from "@/components/admin/orders/OrdersTable";
import { ShoppingBag, Clock, CheckCircle2, Truck, DollarSign } from "lucide-react";

export default function AdminOrdersPage() {
  return (
    <div className="space-y-6 select-none" dir="rtl">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-md-outline/10">
        <div>
          <h1 className="text-2xl font-black text-md-surface-on flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-md-primary-container text-md-primary-on-container">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <span>إدارة الطلبات المباشرة (Orders Management)</span>
          </h1>
          <p className="text-xs text-md-surface-on-variant mt-1">
            متابعة وتأكيد طلبات الدفع عند الاستلام (COD) وتغيير حالات التوصيل بالولايات
          </p>
        </div>
      </div>

      {/* Orders Management Table */}
      <OrdersTable />

    </div>
  );
}
