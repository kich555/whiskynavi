"use client";

const TABS = [
  { key: "general", label: "일반" },
  { key: "popular", label: "인기" },
  { key: "announcement", label: "공지" },
] as const;

interface BoardTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function BoardTabs({ activeTab, onTabChange }: BoardTabsProps) {
  return (
    <div className="flex gap-0">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onTabChange(tab.key)}
          className={`px-4 py-3 text-sm font-medium transition-colors relative ${
            activeTab === tab.key
              ? "text-amber-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {tab.label}
          {activeTab === tab.key && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600" />
          )}
        </button>
      ))}
    </div>
  );
}