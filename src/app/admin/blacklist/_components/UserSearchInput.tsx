"use client";

import { Loader2 } from "lucide-react";

import type { AdminUserResponse } from "@/apis/generated/api";
import { Label } from "@/components/ui/label";
import { SearchInput } from "@/components/ui/search-input";
import { useUserSearch } from "./hooks/useUserSearch";

type UserSearchInputProps = {
  onSelect: (user: AdminUserResponse) => void;
  onClear: () => void;
};

export default function UserSearchInput({ onSelect, onClear }: UserSearchInputProps) {
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    showDropdown,
    setShowDropdown,
    selectedUser,
    searchContainerRef,
    selectUser,
    clearSelection,
  } = useUserSearch();

  const handleSelectUser = (user: AdminUserResponse) => {
    selectUser(user);
    onSelect(user);
  };

  const handleClearSelection = () => {
    clearSelection();
    onClear();
  };

  return (
    <div className="space-y-1.5">
      <Label>사용자 선택 *</Label>
      {selectedUser ? (
        <div className="flex items-center justify-between rounded-lg border border-gray-300 bg-gray-50 px-3 py-2">
          <div>
            <span className="font-medium">{selectedUser.name}</span>
            <span className="typo-medium-14 ml-2 text-gray-500">({selectedUser.email})</span>
          </div>
          <button type="button" onClick={handleClearSelection} className="typo-medium-14 text-red-500 hover:text-red-700">
            취소
          </button>
        </div>
      ) : (
        <div ref={searchContainerRef} className="relative">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery && setShowDropdown(true)}
            placeholder="이름으로 사용자 검색..."
            className="w-full"
          />
          {isSearching && (
            <Loader2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
          )}
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleSelectUser(user)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-gray-100"
                >
                  <div>
                    <span className="font-medium">{user.name}</span>
                    <span className="typo-medium-14 ml-2 text-gray-500">{user.email}</span>
                  </div>
                  <span className="typo-medium-12 text-gray-400">ID: {user.id}</span>
                </button>
              ))}
            </div>
          )}
          {showDropdown && !isSearching && searchQuery && searchResults.length === 0 && (
            <div className="typo-medium-14 absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-500 shadow-lg">
              검색 결과가 없습니다
            </div>
          )}
        </div>
      )}
    </div>
  );
}
