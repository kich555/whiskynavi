"use client";

import { createContext, type ReactNode, useContext, useState, useSyncExternalStore } from "react";
import AdminSidebar from "./AdminSidebar";

interface AdminLayoutClientProps {
  children: ReactNode;
  statsSlot: ReactNode;
}

const desktopQuery = "(min-width: 768px)";
function subscribeViewport(callback: () => void) {
  const media = window.matchMedia(desktopQuery);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
const getDesktopSnapshot = () => window.matchMedia(desktopQuery).matches;
const getServerDesktopSnapshot = () => true;

export default function AdminLayoutClient({ children, statsSlot }: AdminLayoutClientProps) {
  const desktop = useSyncExternalStore(subscribeViewport, getDesktopSnapshot, getServerDesktopSnapshot);
  const [sidebarOverride, setSidebarOverride] = useState<boolean | null>(null);
  const isSidebarOpen = sidebarOverride ?? desktop;
  const toggleSidebar = () => setSidebarOverride(!isSidebarOpen);

  return (
    <div className="flex min-h-screen justify-center bg-gray-50">
      <div className="flex w-full max-w-[1920px]">
        {isSidebarOpen && (
          <button
            type="button"
            aria-label="관리자 메뉴 닫기"
            onClick={toggleSidebar}
            className="fixed inset-0 z-20 bg-black/30 md:hidden"
          />
        )}
        <div
          className={`fixed inset-y-0 left-0 z-30 overflow-y-auto bg-white md:static md:overflow-visible ${isSidebarOpen ? "" : "hidden"}`}
        >
          <AdminSidebar isOpen={isSidebarOpen} statsSlot={statsSlot} />
        </div>
        <div className="flex-1 overflow-auto">
          <SidebarContext.Provider
            value={{
              isOpen: isSidebarOpen,
              toggle: toggleSidebar,
            }}
          >
            {children}
          </SidebarContext.Provider>
        </div>
      </div>
    </div>
  );
}

interface SidebarContextType {
  isOpen: boolean;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isOpen: true,
  toggle: () => {},
});

export const useSidebar = () => useContext(SidebarContext);
