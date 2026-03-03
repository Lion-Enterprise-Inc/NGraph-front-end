"use client";

import { useState } from "react";
import type { QuickExplainItem } from "../services/api";

type Props = {
  items: QuickExplainItem[];
  language: string;
  copy: {
    verified: string;
    aiEstimate: string;
    newItem: string;
    ingredients: string;
    allergens: string;
  };
};

export default function QuickExplainCard({ items, language, copy }: Props) {
  const [expandedIdx, setExpandedIdx] = useState<Set<number>>(new Set());

  const toggle = (idx: number) => {
    setExpandedIdx((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  return (
    <div className="qe-cards">
      {items.map((item, idx) => {
        const open = expandedIdx.has(idx);
        const isDb = item.source === "db";
        const displayName = language !== "ja" && item.name_en ? item.name_en : item.name_jp;
        const subName = language !== "ja" ? item.name_jp : item.name_en;

        return (
          <div key={idx} className="qe-card" onClick={() => toggle(idx)}>
            <div className="qe-card-main">
              <div className="qe-card-left">
                <div className="qe-card-name">{displayName}</div>
                {subName && <div className="qe-card-subname">{subName}</div>}
                {item.price > 0 && (
                  <div className="qe-card-price">¥{item.price.toLocaleString()}</div>
                )}
              </div>
              <div className="qe-card-right">
                {isDb ? (
                  <span className="qe-badge qe-badge-verified">{copy.verified}</span>
                ) : (
                  <span className="qe-badge qe-badge-ai">{copy.aiEstimate}</span>
                )}
                {item.is_new && (
                  <span className="qe-badge qe-badge-new">{copy.newItem}</span>
                )}
              </div>
            </div>
            <div className="qe-card-desc">{item.description}</div>
            {item.description_local && language !== "ja" && (
              <div className="qe-card-desc-local">{item.description_local}</div>
            )}
            {open && (
              <div className="qe-card-details">
                {item.allergens && item.allergens.length > 0 && (
                  <div className="qe-card-detail-row">
                    <span className="qe-detail-label">{copy.allergens}</span>
                    <span className="qe-detail-value">{item.allergens.join(", ")}</span>
                  </div>
                )}
                {item.ingredients && item.ingredients.length > 0 && (
                  <div className="qe-card-detail-row">
                    <span className="qe-detail-label">{copy.ingredients}</span>
                    <span className="qe-detail-value">{item.ingredients.join(", ")}</span>
                  </div>
                )}
                {item.verification_rank && (
                  <div className="qe-card-detail-row">
                    <span className="qe-detail-label">Rank</span>
                    <span className="qe-detail-value">{item.verification_rank}</span>
                  </div>
                )}
              </div>
            )}
            {!open && (item.allergens?.length || item.ingredients?.length) && (
              <div className="qe-card-expand-hint">▼</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
