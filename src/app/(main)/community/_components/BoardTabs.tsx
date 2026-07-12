"use client";

import type { CommunityTab } from "../_lib/tabs";

interface BoardTabsProps {
  tabs: CommunityTab[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function BoardTabs({ tabs, activeTab, onTabChange }: BoardTabsProps) {
  return (
    <div className="flex gap-0 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onTabChange(tab.key)}
          className={`relative px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === tab.key ? "text-white" : "text-gray-400 hover:text-gray-300"
          }`}
        >
          {tab.label}
          {activeTab === tab.key && <span className="absolute right-0 bottom-0 left-0 h-0.5 bg-amber-600" />}
        </button>
      ))}
    </div>
  );
}
