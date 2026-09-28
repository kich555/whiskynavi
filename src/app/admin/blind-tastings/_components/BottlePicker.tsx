"use client";
import { useRef, useState, useTransition } from "react";
import { searchBottles } from "../actions";
import { buttonClass, inputClass } from "./shared";
export default function BottlePicker({
  name,
  kind,
  initial,
  label,
}: {
  name: string;
  kind: "sale" | "review";
  initial?: number;
  label: string;
}) {
  const [keyword, setKeyword] = useState("");
  const [selected, setSelected] = useState(initial ? { id: initial, name: `보틀 #${initial}` } : undefined);
  const [items, setItems] = useState<{ id: number; name: string }[]>([]);
  const [page, setPage] = useState(0);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const request = useRef(0);
  function search(next: number) {
    const current = ++request.current;
    start(async () => {
      const r = await searchBottles(kind, keyword, next);
      if (current !== request.current) return;
      if (!r.success) {
        setError(r.error);
        return;
      }
      setError("");
      setItems(r.items);
      setPage(next);
    });
  }
  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={selected?.id ?? ""} />
      <div className="flex gap-2">
        <input
          aria-label={`${label} 이름 검색`}
          className={inputClass}
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            request.current++;
          }}
          placeholder="보틀명으로 검색"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              search(0);
            }
          }}
        />
        <button type="button" className={buttonClass} disabled={pending} onClick={() => search(0)}>
          검색
        </button>
      </div>
      {selected && (
        <p className="typo-medium-14 rounded-lg bg-amber-50 p-3 leading-relaxed">
          선택: #{selected.id} {selected.name}
        </p>
      )}
      {pending && <p role="status">검색 중…</p>}
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      <div className="max-h-48 overflow-y-auto">
        {items.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => setSelected(b)}
            className="typo-regular-14 block w-full border-b p-3 text-left leading-relaxed hover:bg-amber-50"
          >
            #{b.id} {b.name}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        {page > 0 && (
          <button className={buttonClass} type="button" disabled={pending} onClick={() => search(page - 1)}>
            이전 검색 결과
          </button>
        )}
        {items.length === 30 && (
          <button className={buttonClass} type="button" disabled={pending} onClick={() => search(page + 1)}>
            다음 검색 결과
          </button>
        )}
      </div>
    </div>
  );
}
