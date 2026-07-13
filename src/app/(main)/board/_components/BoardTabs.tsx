"use client";

import { useEffect, useRef } from "react";
import type { BoardTab } from "../_lib/tabs";

interface BoardTabsProps {
  tabs: BoardTab[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function BoardTabs({ tabs, activeTab, onTabChange }: BoardTabsProps) {
  const activeTabRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeTabRef.current?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }, [activeTab]);

  return (
    <nav
      aria-label="게시판 분류"
      className="flex min-w-0 flex-1 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          ref={activeTab === tab.key ? activeTabRef : undefined}
          type="button"
          onClick={() => onTabChange(tab.key)}
          aria-current={activeTab === tab.key ? "page" : undefined}
          className={`relative shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
            activeTab === tab.key ? "text-white" : "text-gray-400 hover:text-gray-300"
          }`}
        >
          {tab.label}
          {activeTab === tab.key && <span className="absolute right-0 bottom-0 left-0 h-0.5 bg-amber-600" />}
        </button>
      ))}
    </nav>
  );
}
