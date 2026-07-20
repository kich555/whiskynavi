"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { useCallback, useState } from "react";

interface DateTimePickerProps {
  /** form submission용 name */
  name?: string;
  /** ISO string 또는 datetime-local 형식 */
  value?: string;
  /** ISO string 또는 datetime-local 형식 */
  defaultValue?: string;
  onChange?: (isoString: string) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

function parseToDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d;
}

function padTwo(n: number) {
  return n.toString().padStart(2, "0");
}

export default function DateTimePicker({
  name,
  value: controlledValue,
  defaultValue,
  onChange,
  required,
  placeholder = "날짜 및 시간을 선택하세요",
  className = "",
}: DateTimePickerProps) {
  const isControlled = controlledValue !== undefined;

  const [internalDate, setInternalDate] = useState<Date | undefined>(() =>
    parseToDate(isControlled ? controlledValue : defaultValue),
  );
  const [open, setOpen] = useState(false);

  const currentDate = isControlled ? parseToDate(controlledValue) : internalDate;

  const hour = currentDate ? padTwo(currentDate.getHours()) : "00";
  const minute = currentDate ? padTwo(currentDate.getMinutes()) : "00";

  const updateDateTime = useCallback(
    (next: Date) => {
      if (!isControlled) {
        setInternalDate(next);
      }
      onChange?.(next.toISOString());
    },
    [isControlled, onChange],
  );

  const handleDaySelect = useCallback(
    (day: Date | undefined) => {
      if (!day) return;
      const next = new Date(day);
      if (currentDate) {
        next.setHours(currentDate.getHours(), currentDate.getMinutes(), 0, 0);
      } else {
        next.setHours(0, 0, 0, 0);
      }
      updateDateTime(next);
    },
    [currentDate, updateDateTime],
  );

  const handleTimeChange = useCallback(
    (type: "hour" | "minute", val: string) => {
      const num = parseInt(val, 10);
      if (isNaN(num)) return;
      const base = currentDate ? new Date(currentDate) : new Date();
      if (!currentDate) {
        base.setSeconds(0, 0);
      }
      if (type === "hour") {
        base.setHours(Math.min(23, Math.max(0, num)));
      } else {
        base.setMinutes(Math.min(59, Math.max(0, num)));
      }
      updateDateTime(base);
    },
    [currentDate, updateDateTime],
  );

  const displayText = currentDate ? format(currentDate, "yyyy년 MM월 dd일 HH:mm", { locale: ko }) : null;

  // form 제출용 hidden value (ISO string)
  const hiddenValue = currentDate ? currentDate.toISOString() : "";

  return (
    <div className={className}>
      {name && <input type="hidden" name={name} value={hiddenValue} />}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={`typo-regular-14 h-auto w-full justify-start px-3 py-2 text-left ${
              !currentDate ? "text-gray-400" : "text-gray-900"
            }`}
          >
            <CalendarDays className="mr-2 h-4 w-4 text-gray-400" />
            {displayText ?? placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={currentDate} onSelect={handleDaySelect} locale={ko} />
          <div className="flex items-center gap-2 border-t border-gray-200 px-4 py-3">
            <label className="typo-medium-14 text-gray-600">시간</label>
            <input
              type="number"
              min={0}
              max={23}
              value={hour}
              onChange={(e) => handleTimeChange("hour", e.target.value)}
              className="typo-medium-14 w-14 rounded border border-gray-300 px-2 py-1 text-center focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
            <span className="text-gray-500">:</span>
            <input
              type="number"
              min={0}
              max={59}
              value={minute}
              onChange={(e) => handleTimeChange("minute", e.target.value)}
              className="typo-medium-14 w-14 rounded border border-gray-300 px-2 py-1 text-center focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>
        </PopoverContent>
      </Popover>
      {required && !currentDate && (
        <input tabIndex={-1} className="absolute h-0 w-0 opacity-0" required value="" onChange={() => {}} />
      )}
    </div>
  );
}
