// src/components/ContentTypeTabs.tsx
import React from "react";

export type ContentType = "all" | "technical" | "rex";

interface ContentTypeTabsProps {
  activeTab: ContentType;
  onTabChange: (tab: ContentType) => void;
  technicalCount?: number;
  rexCount?: number;
}

export default function ContentTypeTabs({
  activeTab,
  onTabChange,
  technicalCount = 0,
  rexCount = 0,
}: ContentTypeTabsProps) {
  const tabs = [
    {
      id: "all" as ContentType,
      label: "Tous les articles",
      icon: "📚",
      count: technicalCount + rexCount,
    },
    {
      id: "technical" as ContentType,
      label: "Articles techniques",
      icon: "🔧",
      count: technicalCount,
    },
    {
      id: "rex" as ContentType,
      label: "REX & All Hands",
      icon: "📖",
      count: rexCount,
    },
  ];

  return (
    <div className="border-b border-neutral-200 overflow-x-auto">
      <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max sm:min-w-0" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm
              transition-colors flex items-center gap-1.5 sm:gap-2
              ${
                activeTab === tab.id
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
              }
            `}
            aria-current={activeTab === tab.id ? "page" : undefined}
          >
            <span className="text-base sm:text-lg">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            {tab.count > 0 && (
              <span
                className={`
                  ml-1 sm:ml-2 py-0.5 px-1.5 sm:px-2 rounded-full text-xs font-medium
                  ${
                    activeTab === tab.id
                      ? "bg-indigo-100 text-indigo-600"
                      : "bg-neutral-100 text-neutral-600"
                  }
                `}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
