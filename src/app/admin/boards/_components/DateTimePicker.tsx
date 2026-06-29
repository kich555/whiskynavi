"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
  name: string;
  label: string;
  defaultValue?: string;
}

/**
 * Calendar + time input 조합의 날짜/시간 선택기.
 * 선택된 값은 hidden input을 통해 form submit 시 ISO 8601 문자열로 전달된다.
 */
export default function DateTimePicker({ name, label, defaultValue }: DateTimePickerProps) {
  const id = useId();
  const hiddenId = `${id}-${name}`;

  const initialDate = defaultValue ? new Date(defaultValue) : undefined;
  const initialTime = defaultValue
    ? `${String(initialDate!.getHours()).padStart(2, "0")}:${String(initialDate!.getMinutes()).padStart(2, "0")}`
    : "";

  const [date, setDate] = useState<Date | undefined>(initialDate);
  const [time, setTime] = useState(initialTime);

  const buildIsoString = (d: Date | undefined, t: string): string => {
    if (!d || !t) return "";
    const [h, m] = t.split(":").map(Number);
    const result = new Date(d);
    result.setHours(h ?? 0, m ?? 0, 0, 0);
    return result.toISOString();
  };

  return (
    <div>
      <Label htmlFor={hiddenId} className="typo-bold-12 mb-1 block text-gray-700">{label}</Label>
      <input type="hidden" name={name} id={hiddenId} value={buildIsoString(date, time)} />

      <div className="flex gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
            >
              <CalendarIcon className="size-4" />
              {date ? format(date, "yyyy-MM-dd", { locale: ko }) : "날짜 선택"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="w-[120px] shrink-0"
        />
      </div>
    </div>
  );
}