import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CalendarProps {
  onDateSelect: (date: Date) => void;
  selectedDate: Date | null;
  availableDates: Date[];
}

export default function Calendar({ onDateSelect, selectedDate, availableDates }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<Date[][]>([]);
  
  // Generate calendar days for the current month
  useEffect(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Get first day of month
    const firstDayOfMonth = new Date(year, month, 1);
    const dayOfWeek = firstDayOfMonth.getDay();
    
    // Calculate days in month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Generate calendar grid including padding days from previous/next month
    const days: Date[][] = [];
    let week: Date[] = [];
    
    // Add padding days from previous month
    const lastMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = dayOfWeek - 1; i >= 0; i--) {
      week.push(new Date(year, month - 1, lastMonthLastDay - i));
    }
    
    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      week.push(new Date(year, month, day));
      
      if (week.length === 7) {
        days.push(week);
        week = [];
      }
    }
    
    // Add padding days from next month
    if (week.length > 0) {
      const paddingDays = 7 - week.length;
      for (let i = 1; i <= paddingDays; i++) {
        week.push(new Date(year, month + 1, i));
      }
      days.push(week);
    }
    
    setCalendarDays(days);
  }, [currentMonth]);
  
  // Navigate to prev/next month
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => {
      const date = new Date(prev);
      date.setMonth(date.getMonth() - 1);
      return date;
    });
  };
  
  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      const date = new Date(prev);
      date.setMonth(date.getMonth() + 1);
      return date;
    });
  };
  
  // Format month for display
  const formatMonth = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric'
    }).format(date);
  };
  
  // Check if date is in current month
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth();
  };
  
  // Check if date is selected
  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };
  
  // Check if date is available
  const isAvailable = (date: Date) => {
    // Only check availability for current or future dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) return false;
    
    return availableDates.some(availableDate => {
      const availDay = new Date(availableDate);
      return (
        availDay.getDate() === date.getDate() &&
        availDay.getMonth() === date.getMonth() &&
        availDay.getFullYear() === date.getFullYear()
      );
    });
  };
  
  // Get day classes
  const getDayClasses = (date: Date) => {
    let classes = "p-2 flex items-center justify-center rounded w-full h-full ";
    
    if (!isCurrentMonth(date)) {
      classes += "text-muted-foreground/40 ";
    } else if (!isAvailable(date)) {
      classes += "text-muted-foreground/60 cursor-not-allowed ";
    } else {
      classes += "hover:bg-primary/10 cursor-pointer ";
    }
    
    if (isSelected(date)) {
      classes += "bg-primary text-white hover:bg-primary ";
    }
    
    return classes;
  };
  
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-4">
        <Button 
          type="button" 
          variant="ghost" 
          size="icon" 
          onClick={goToPreviousMonth}
          className="text-primary hover:text-primary-600"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h4 className="font-medium">{formatMonth(currentMonth)}</h4>
        <Button 
          type="button" 
          variant="ghost" 
          size="icon" 
          onClick={goToNextMonth}
          className="text-primary hover:text-primary-600"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center text-sm mb-2">
        <div>Su</div>
        <div>Mo</div>
        <div>Tu</div>
        <div>We</div>
        <div>Th</div>
        <div>Fr</div>
        <div>Sa</div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center">
        {calendarDays.flat().map((day, index) => (
          <div 
            key={index} 
            className={getDayClasses(day)}
            onClick={() => {
              if (isCurrentMonth(day) && isAvailable(day)) {
                onDateSelect(day);
              }
            }}
          >
            {day.getDate()}
          </div>
        ))}
      </div>
    </div>
  );
}
