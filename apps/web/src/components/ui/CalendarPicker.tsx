import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

type CalendarPickerProps = {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  max?: string; // YYYY-MM-DD
  className?: string;
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function formatDateLabel(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parts[2].padStart(2, "0");
  
  const shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = shortMonths[monthIdx] || "";
  return `${day} ${month} ${year}`;
}

export const CalendarPicker = ({
  value,
  onChange,
  max,
  className = ""
}: CalendarPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current date value
  const initialDate = value ? new Date(value + "T00:00:00") : new Date();
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth()); // 0-11

  // Synchronize internal display month when date value changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(value + "T00:00:00");
      if (!isNaN(d.getTime())) {
        setCurrentYear(d.getFullYear());
        setCurrentMonth(d.getMonth());
      }
    }
  }, [value]);

  // Click outside to close calendar
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  // Calendar Math
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const startDayOfWeek = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7; // Monday-first (0=Mon, 6=Sun)
  
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

  // Create Days List
  const days: { day: number; monthOffset: number; dateStr: string }[] = [];

  // Previous month trailing days
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const m = currentMonth === 0 ? 11 : currentMonth - 1;
    const y = currentMonth === 0 ? currentYear - 1 : currentYear;
    days.push({
      day: d,
      monthOffset: -1,
      dateStr: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({
      day: d,
      monthOffset: 0,
      dateStr: `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    });
  }

  // Next month leading days to complete grid (multiples of 7)
  const remaining = 42 - days.length; // 6 rows * 7 days = 42
  for (let d = 1; d <= remaining; d++) {
    const m = currentMonth === 11 ? 0 : currentMonth + 1;
    const y = currentMonth === 11 ? currentYear + 1 : currentYear;
    days.push({
      day: d,
      monthOffset: 1,
      dateStr: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    });
  }

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const isFutureDate = (dateStr: string) => {
    if (!max) return false;
    return dateStr > max;
  };

  const handleDaySelect = (dateStr: string) => {
    if (isFutureDate(dateStr)) return;
    onChange(dateStr);
    setIsOpen(false);
  };

  // Generate Year range for Select
  const maxYear = max ? parseInt(max.split("-")[0], 10) : new Date().getFullYear() + 5;
  const years: number[] = [];
  for (let y = maxYear; y >= maxYear - 80; y--) {
    years.push(y);
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Date Toggle Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between border border-border/70 bg-background/45 px-3.5 py-2 font-mono text-sm text-foreground transition-all hover:border-border sm:h-11"
      >
        <span className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <span>{value ? formatDateLabel(value) : "Select date"}</span>
        </span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Change</span>
      </button>

      {/* Calendar Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-72 border border-border/80 bg-card/95 p-3.5 shadow-2xl backdrop-blur-md animate-fade-up">
          {/* Calendar Header */}
          <div className="mb-3.5 flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="flex h-7 w-7 items-center justify-center border border-border/60 hover:bg-secondary/40 text-muted-foreground hover:text-foreground"
              aria-label="Previous Month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex gap-1.5 font-mono">
              {/* Month Dropdown */}
              <select
                value={currentMonth}
                onChange={(e) => setCurrentMonth(parseInt(e.target.value, 10))}
                className="bg-transparent text-xs font-semibold text-foreground outline-none cursor-pointer border border-transparent hover:border-border/30 px-1"
              >
                {MONTHS.map((m, idx) => (
                  <option key={m} value={idx} className="bg-card text-foreground">{m}</option>
                ))}
              </select>

              {/* Year Dropdown */}
              <select
                value={currentYear}
                onChange={(e) => setCurrentYear(parseInt(e.target.value, 10))}
                className="bg-transparent text-xs font-semibold text-foreground outline-none cursor-pointer border border-transparent hover:border-border/30 px-1"
              >
                {years.map((y) => (
                  <option key={y} value={y} className="bg-card text-foreground">{y}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="flex h-7 w-7 items-center justify-center border border-border/60 hover:bg-secondary/40 text-muted-foreground hover:text-foreground"
              aria-label="Next Month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] font-bold text-muted-foreground/60 mb-2">
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
            <span>Su</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map(({ day, monthOffset, dateStr }, index) => {
              const isSelected = dateStr === value;
              const isFuture = isFutureDate(dateStr);
              const isCurrentMonth = monthOffset === 0;

              return (
                <button
                  key={`${dateStr}-${index}`}
                  type="button"
                  disabled={isFuture}
                  onClick={() => handleDaySelect(dateStr)}
                  className="flex aspect-square items-center justify-center font-mono text-xs transition-all border border-transparent disabled:cursor-not-allowed disabled:opacity-20"
                  style={{
                    color: isSelected
                      ? "var(--card)"
                      : isCurrentMonth
                      ? "var(--foreground)"
                      : "color-mix(in srgb, var(--foreground) 30%, transparent)",
                    backgroundColor: isSelected
                      ? "var(--primary)"
                      : "transparent",
                    borderColor: isSelected ? "var(--primary)" : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected && !isFuture) {
                      e.currentTarget.style.backgroundColor = "var(--secondary)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected && !isFuture) {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
