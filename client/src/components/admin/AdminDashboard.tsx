import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Booking, Message } from "@shared/schema";
import { 
  BarChart, 
  CalendarDays, 
  Clock, 
  Mail, 
  MessageSquare, 
  User,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  Upload,
  Music,
  FileSpreadsheet,
  Settings
} from "lucide-react";

export default function AdminDashboard() {
  const { toast } = useToast();
  
  // Fetch bookings and messages
  const { data: bookings = [], isLoading: isLoadingBookings } = useQuery<Booking[]>({
    queryKey: ['/api/bookings'],
  });
  
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery<Message[]>({
    queryKey: ['/api/messages'],
  });
  
  // Mark message as read
  const markAsRead = async (id: number) => {
    try {
      await apiRequest("PATCH", `/api/messages/${id}/read`, {});
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      toast({
        title: "Message marked as read",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark message as read",
        variant: "destructive",
      });
    }
  };
  
  // Calculate stats
  const pendingBookings = bookings.filter(booking => booking.status === "pending");
  const upcomingBookings = bookings.filter(booking => 
    booking.status === "confirmed" && new Date(booking.date) > new Date()
  );
  const unreadMessages = messages.filter(message => !message.read);
  
  // Format date
  const formatDate = (dateString: string | Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(dateString));
  };
  
  // Format time
  const formatTime = (dateString: string | Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(dateString));
  };
  
  const isLoading = isLoadingBookings || isLoadingMessages;
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings.length}</div>
            <p className="text-xs text-muted-foreground">
              {pendingBookings.length} pending approval
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingBookings.length}</div>
            <p className="text-xs text-muted-foreground">
              Next: {upcomingBookings.length > 0 
                ? formatDate(upcomingBookings[0].date) 
                : "None scheduled"}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{messages.length}</div>
            <p className="text-xs text-muted-foreground">
              {unreadMessages.length} unread
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${bookings
                .filter(b => b.paymentStatus === "paid")
                .reduce((sum, b) => sum + b.amount, 0) / 100}
            </div>
            <p className="text-xs text-muted-foreground">
              From {bookings.filter(b => b.paymentStatus === "paid").length} paid bookings
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Activity Tabs */}
      <Tabs defaultValue="upcoming" className="space-y-4">
        <div className="overflow-x-auto">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="upcoming" className="px-4">Upcoming Sessions</TabsTrigger>
            <TabsTrigger value="pending" className="px-4">Pending Bookings</TabsTrigger>
            <TabsTrigger value="messages" className="px-4">Recent Messages</TabsTrigger>
          </TabsList>
        </div>
        
        {/* Upcoming Sessions Tab */}
        <TabsContent value="upcoming" className="space-y-4">
          <div className="grid gap-4">
            {upcomingBookings.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center pt-6 pb-6">
                  <Calendar className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No upcoming sessions scheduled.</p>
                </CardContent>
              </Card>
            ) : (
              upcomingBookings.slice(0, 5).map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarFallback>{booking.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium leading-none">{booking.name}</p>
                          <p className="text-sm text-muted-foreground">{booking.email}</p>
                          <div className="flex items-center pt-2">
                            <CalendarDays className="mr-1 h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{formatDate(booking.date)}</span>
                            <Clock className="ml-2 mr-1 h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{formatTime(booking.date)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge>{booking.duration / 60} hours</Badge>
                        <p className="mt-1 text-sm font-medium">${booking.amount / 100}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
        
        {/* Pending Bookings Tab */}
        <TabsContent value="pending" className="space-y-4">
          <div className="grid gap-4">
            {pendingBookings.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center pt-6 pb-6">
                  <CheckCircle className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No pending bookings to approve.</p>
                </CardContent>
              </Card>
            ) : (
              pendingBookings.slice(0, 5).map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarFallback>{booking.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium leading-none">{booking.name}</p>
                          <p className="text-sm text-muted-foreground">{booking.email}</p>
                          <div className="flex items-center pt-2">
                            <CalendarDays className="mr-1 h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{formatDate(booking.date)}</span>
                            <Clock className="ml-2 mr-1 h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{formatTime(booking.date)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{booking.paymentStatus}</Badge>
                        <p className="mt-1 text-sm font-medium">${booking.amount / 100}</p>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                      <Button variant="outline" size="sm">
                        <XCircle className="mr-2 h-4 w-4" />
                        Decline
                      </Button>
                      <Button size="sm">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
        
        {/* Recent Messages Tab */}
        <TabsContent value="messages" className="space-y-4">
          <div className="grid gap-4">
            {messages.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center pt-6 pb-6">
                  <MessageSquare className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No messages received yet.</p>
                </CardContent>
              </Card>
            ) : (
              messages.slice(0, 5).map((message) => (
                <Card key={message.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <Avatar>
                          <AvatarFallback>{message.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center">
                            <p className="text-sm font-medium leading-none">{message.name}</p>
                            {!message.read && (
                              <Badge variant="secondary" className="ml-2">New</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{message.email}</p>
                          <p className="text-sm font-medium mt-2">{message.subject}</p>
                          <p className="text-sm mt-1 text-muted-foreground line-clamp-2">
                            {message.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {message.createdAt && formatDate(message.createdAt)} 
                            {message.createdAt && " at "} 
                            {message.createdAt && formatTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                      {!message.read && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => markAsRead(message.id)}
                        >
                          Mark as Read
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}