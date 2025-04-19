import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TimeSlot } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, PlusCircle, Clock, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, startOfWeek, endOfWeek, parseISO, addWeeks } from "date-fns";

export default function ScheduleManager() {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date>(startOfWeek(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfWeek(new Date()));
  const [scheduleForm, setScheduleForm] = useState({
    startDate: startOfWeek(new Date()),
    endDate: endOfWeek(new Date()),
    dailyStartTime: "09:00",
    dailyEndTime: "17:00",
    slotDuration: 60, // in minutes
    daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday (0=Sunday, 6=Saturday)
  });
  
  // Fetch time slots
  const { data: timeSlots = [], isLoading } = useQuery<TimeSlot[]>({
    queryKey: ['/api/time-slots'],
  });
  
  // Filter time slots based on date range
  const filteredTimeSlots = timeSlots.filter(slot => {
    const slotDate = new Date(slot.date);
    return slotDate >= startDate && slotDate <= endDate;
  });
  
  // Group time slots by date
  const timeSlotsByDate = filteredTimeSlots.reduce((acc, slot) => {
    const dateStr = format(new Date(slot.date), "yyyy-MM-dd");
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    acc[dateStr].push(slot);
    return acc;
  }, {} as Record<string, TimeSlot[]>);
  
  // Create weekly schedule mutation
  const createScheduleMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/time-slots/weekly", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/time-slots'] });
      toast({
        title: "Schedule created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating schedule",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Delete time slots mutation
  const deleteSlotsMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("DELETE", "/api/time-slots/range", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/time-slots'] });
      toast({
        title: "Time slots deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting time slots",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Generate and create weekly schedule
  const generateWeeklySchedule = () => {
    createScheduleMutation.mutate(scheduleForm);
  };
  
  // Clear time slots in selected date range
  const clearTimeSlots = () => {
    deleteSlotsMutation.mutate({
      startDate,
      endDate
    });
  };
  
  const handleDayOfWeekChange = (day: number, checked: boolean) => {
    if (checked) {
      setScheduleForm({
        ...scheduleForm,
        daysOfWeek: [...scheduleForm.daysOfWeek, day]
      });
    } else {
      setScheduleForm({
        ...scheduleForm,
        daysOfWeek: scheduleForm.daysOfWeek.filter(d => d !== day)
      });
    }
  };
  
  // Navigate to next week
  const nextWeek = () => {
    setStartDate(prev => addWeeks(prev, 1));
    setEndDate(prev => addWeeks(prev, 1));
  };
  
  // Navigate to previous week
  const prevWeek = () => {
    setStartDate(prev => addWeeks(prev, -1));
    setEndDate(prev => addWeeks(prev, -1));
  };
  
  // Format date for display
  const formatDate = (date: Date) => {
    return format(date, "MMMM d, yyyy");
  };
  
  // Format time from ISO or time string
  const formatTimeString = (timeString: string) => {
    // If it contains T, it's a date-time string
    if (timeString.includes('T')) {
      return format(parseISO(timeString), "h:mm a");
    }
    
    // Otherwise it's just a time string like "09:00"
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    return format(date, "h:mm a");
  };
  
  // Render days of the week checkboxes
  const renderDaysOfWeek = () => {
    const days = [
      { value: 0, label: "Sun" },
      { value: 1, label: "Mon" },
      { value: 2, label: "Tue" },
      { value: 3, label: "Wed" },
      { value: 4, label: "Thu" },
      { value: 5, label: "Fri" },
      { value: 6, label: "Sat" },
    ];
    
    return (
      <div className="flex flex-wrap gap-4">
        {days.map(day => (
          <div key={day.value} className="flex items-center space-x-2">
            <Checkbox 
              id={`day-${day.value}`} 
              checked={scheduleForm.daysOfWeek.includes(day.value)}
              onCheckedChange={(checked) => handleDayOfWeekChange(day.value, checked === true)}
            />
            <Label htmlFor={`day-${day.value}`}>{day.label}</Label>
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Schedule Manager</CardTitle>
        <CardDescription>Create and manage your studio availability schedule</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Schedule Generation Form */}
        <div className="border rounded-lg p-4 bg-muted/30">
          <h3 className="text-lg font-medium mb-4">Generate Weekly Schedule</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="dailyStartTime">Daily Start Time</Label>
              <Input 
                id="dailyStartTime" 
                type="time" 
                value={scheduleForm.dailyStartTime}
                onChange={(e) => setScheduleForm({...scheduleForm, dailyStartTime: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dailyEndTime">Daily End Time</Label>
              <Input 
                id="dailyEndTime" 
                type="time" 
                value={scheduleForm.dailyEndTime}
                onChange={(e) => setScheduleForm({...scheduleForm, dailyEndTime: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="slotDuration">Session Duration (minutes)</Label>
              <Select 
                value={scheduleForm.slotDuration.toString()}
                onValueChange={(value) => setScheduleForm({...scheduleForm, slotDuration: parseInt(value)})}
              >
                <SelectTrigger id="slotDuration">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                  <SelectItem value="180">3 hours</SelectItem>
                  <SelectItem value="240">4 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Week Range</Label>
              <div className="flex items-center space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formatDate(scheduleForm.startDate)}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={scheduleForm.startDate}
                      onSelect={(date) => date && setScheduleForm({
                        ...scheduleForm, 
                        startDate: startOfWeek(date),
                        endDate: endOfWeek(date)
                      })}
                    />
                  </PopoverContent>
                </Popover>
                <span>to</span>
                <div className="text-sm font-medium">{formatDate(scheduleForm.endDate)}</div>
              </div>
            </div>
          </div>
          
          <div className="space-y-2 mb-4">
            <Label>Working Days</Label>
            {renderDaysOfWeek()}
          </div>
          
          <div className="flex justify-end mt-4">
            <Button onClick={generateWeeklySchedule}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Generate Schedule
            </Button>
          </div>
        </div>
        
        {/* Schedule View */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Schedule Preview</h3>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={prevWeek}>
                Previous Week
              </Button>
              <div className="text-sm font-medium">
                {formatDate(startDate)} - {formatDate(endDate)}
              </div>
              <Button variant="outline" size="sm" onClick={nextWeek}>
                Next Week
              </Button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : Object.keys(timeSlotsByDate).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
              <p>No time slots scheduled for this week.</p>
              <Button className="mt-4" variant="outline" onClick={generateWeeklySchedule}>
                Generate Time Slots
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(timeSlotsByDate)
                .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                .map(([dateStr, slots]) => (
                  <div key={dateStr} className="border rounded p-3">
                    <div className="font-medium mb-2">
                      {format(new Date(dateStr), "EEEE, MMMM d")}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {slots
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                        .map(slot => (
                          <div 
                            key={slot.id} 
                            className={`p-2 text-center text-sm rounded ${
                              slot.available 
                                ? "bg-green-100 text-green-800" 
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {formatTimeString(new Date(slot.date).toISOString())}
                            {!slot.available && slot.bookingId && (
                              <div className="text-xs mt-1">Booked</div>
                            )}
                          </div>
                        ))
                      }
                    </div>
                  </div>
                ))
              }
              
              <div className="flex justify-end mt-4">
                <Button variant="outline" className="text-destructive" onClick={clearTimeSlots}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All Time Slots
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
