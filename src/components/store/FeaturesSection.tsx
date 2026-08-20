import React from "react";
import { Truck, ShieldCheck, ShoppingBag } from "lucide-react";

export function FeaturesSection() {
  const features = [
    {
      icon: Truck,
      title: "توصيل سريع",
      description: "شحن سريع لجميع الطلبات مع تتبع لحظي.",
      color: "text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20",
    },
    {
      icon: ShieldCheck,
      title: "تسوق آمن",
      description: "معاملات مالية محمية وأمان شامل.",
      color: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20",
    },
    {
      icon: ShoppingBag,
      title: "جودة عالية",
      description: "تشكيلات منتقاة بعناية ومصممة بإتقان.",
      color: "text-orange-700 dark:text-orange-300 bg-orange-100/80 dark:bg-orange-600/10 border-orange-200 dark:border-orange-600/20",
    },
  ];

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {features.map((feature, idx) => {
        const Icon = feature.icon;
        return (
          <div
            key={idx}
            className="p-8 rounded-2xl bg-white dark:bg-[#1e1b24] border border-gray-200 dark:border-white/10 hover:border-orange-400 dark:hover:border-orange-500/40 transition-all space-y-4 shadow-sm dark:shadow-md group"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${feature.color} group-hover:scale-105 transition-transform`}>
              <Icon className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{feature.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          </div>
        );
      })}
    </section>
  );
}
