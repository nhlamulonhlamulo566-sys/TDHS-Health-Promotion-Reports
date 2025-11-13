"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface TimePickerProps {
  value?: string;
  onChange: (value: string) => void;
}

export function TimePicker({ value, onChange }: TimePickerProps) {
  const [hour, setHour] = React.useState<string>(
    value ? value.split(":")[0] : ""
  );
  const [minute, setMinute] = React.useState<string>(
    value ? value.split(":")[1] : ""
  );

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (val === "" || (parseInt(val) >= 0 && parseInt(val) < 24)) {
      setHour(val);
      if (val.length === 2 && minute !== "") {
        onChange(`${val}:${minute}`);
      }
    }
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (val === "" || (parseInt(val) >= 0 && parseInt(val) < 60)) {
      setMinute(val);
      if (hour.length === 2 && val !== "") {
        onChange(`${hour}:${val}`);
      }
    }
  };

  const handleHourBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (val.length === 1) {
      val = `0${val}`;
      setHour(val);
    }
    if (val !== "" && minute !== "") {
       onChange(`${val}:${minute}`);
    }
  };

  const handleMinuteBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (val.length === 1) {
      val = `0${val}`;
      setMinute(val);
    }
     if (hour !== "" && val !== "") {
       onChange(`${hour}:${val}`);
    }
  };


  React.useEffect(() => {
    if (value) {
      const [h, m] = value.split(":");
      setHour(h);
      setMinute(m);
    } else {
        setHour("");
        setMinute("");
    }
  }, [value]);

  return (
    <div className="relative flex items-center">
      <Clock className="absolute left-3 h-4 w-4 text-muted-foreground" />
      <div className="flex h-10 w-full items-center rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <Input
          type="text"
          value={hour}
          onChange={handleHourChange}
          onBlur={handleHourBlur}
          maxLength={2}
          placeholder="--:--"
          className="h-auto w-8 border-none bg-transparent p-0 text-center text-sm focus-visible:ring-0"
        />
        <span>:</span>
        <Input
          type="text"
          value={minute}
          onChange={handleMinuteChange}
          onBlur={handleMinuteBlur}
          maxLength={2}
          placeholder="--"
          className="h-auto w-8 border-none bg-transparent p-0 text-center text-sm focus-visible:ring-0"
        />
      </div>
    </div>
  );
}
