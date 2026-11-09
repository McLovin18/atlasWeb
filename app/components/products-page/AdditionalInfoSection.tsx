"use client";

import React, { useState } from "react";
import { AdditionalInfoItem } from "../../lib/productos-db";

interface AdditionalInfoSectionProps {
  items: AdditionalInfoItem[];
}

export default function AdditionalInfoSection({ items }: AdditionalInfoSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!items || items.length === 0) {
    return null;
  }

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-12 sm:py-16 bg-white dark:bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-4">
          {items.map((item, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div
                key={idx}
                className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden"
              >
                {/* Accordion Header */}
                <button
                  onClick={() => toggleItem(idx)}
                  className="w-full px-6 py-5 flex items-center justify-between bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white text-left">
                    {item.titulo}
                  </h3>
                  <span
                    className={`material-icons-round text-slate-600 dark:text-slate-300 transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  >
                    expand_more
                  </span>
                </button>

                {/* Accordion Content */}
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isOpen ? "max-h-96" : "max-h-0"
                  }`}
                >
                  <div className="px-6 py-5 bg-white dark:bg-slate-900">
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                      {item.contenido}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
