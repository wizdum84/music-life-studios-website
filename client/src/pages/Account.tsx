import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Badge
} from "@/components/ui/badge";
import { 
  BarChart, 
  Calendar, 
  Clock, 
  CreditCard, 
  Gift, 
  History, 
  Loader2,
  LogOut, 
  Star, 
  User as UserIcon 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import PageHeader from "@/components/layout/PageHeader";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { getQueryFn } from "@/lib/queryClient";
import { Booking, LoyaltyRecord, Service } from "@shared/schema";

export default function Account() {
  const [_, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  // Redirect if not logged in
  useEffect(() => {
    if (!user && !logoutMutation.isPending) {
      navigate("/account/login");
    }
  }, [user, navigate, logoutMutation.isPending]);

  // Fetch user bookings
  const { data: bookings = [], isLoading: isLoadingBookings } = useQuery<Booking[]>({
    queryKey: ["/api/user/bookings"],
    queryFn: getQueryFn(),
    enabled: !!user,
  });

  // Fetch loyalty data
  const { data: loyaltyData = { records: [], points: 0, sessionCount: 0 }, isLoading: isLoadingLoyalty } = useQuery<{ 
    records: LoyaltyRecord[],
    points: number,
    sessionCount: number
  }>({
    queryKey: ["/api/user/loyalty"],
    queryFn: getQueryFn(),
    enabled: !!user,
  });
  
  // Extract loyalty records from the response
  const loyaltyRecords = loyaltyData.records || [];

  // Fetch service information for bookings
  const { data: services = [], isLoading: isLoadingServices } = useQuery<Service[]>({
    queryKey: ["/api/services"],
    queryFn: getQueryFn(),
  });

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });
      navigate("/");
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  if (!user) {
    return null; // Protected route takes care of this
  }
  
  // Check if data is loading
  const isLoading = isLoadingBookings || isLoadingLoyalty || isLoadingServices;
  

  // Calculate loyalty program progress
  const sessionCount = loyaltyData.sessionCount || user.sessionCount || 0;
  const loyaltyPoints = loyaltyData.points || user.loyaltyPoints || 0;
  const progressToNextFree = sessionCount % 5;
  const progressPercentage = (progressToNextFree / 5) * 100;
  const sessionsUntilNextFree = 5 - progressToNextFree;

  // Get upcoming and past bookings
  const currentDate = new Date();
  const upcomingBookings = bookings
    .filter(booking => new Date(booking.date) >= currentDate)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const pastBookings = bookings
    .filter(booking => new Date(booking.date) < currentDate)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Helper function to get service name
  const getServiceName = (serviceId: number) => {
    const service = services.find(s => s.id === serviceId);
    return service ? service.name : "Unknown Service";
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  // Get booking status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge variant="success">Confirmed</Badge>;
      case "completed":
        return <Badge variant="outline">Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge>Pending</Badge>;
    }
  };

  return (
    <div className="container py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <PageHeader 
          title={`Welcome, ${user.firstName || user.username}`}
          subtitle="Manage your account and view your bookings"
        />
        <Button variant="ghost" size="sm" onClick={handleLogout} className="self-start md:self-center">
          <LogOut className="mr-2 h-4 w-4" />
          Log Out
        </Button>
      </div>
      
      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading your account data...</p>
          </div>
        </div>
      )}
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          <TabsTrigger value="overview" className="flex items-center">
            <UserIcon className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="bookings" className="flex items-center">
            <Calendar className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Bookings</span>
          </TabsTrigger>
          <TabsTrigger value="loyalty" className="flex items-center">
            <Gift className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Loyalty</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center">
            <History className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">History</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Loyalty Status</CardTitle>
                <CardDescription>Track your rewards progress</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Sessions Completed</span>
                      <span className="font-medium">{sessionCount}</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{progressToNextFree} of 5 sessions</span>
                      <span>{sessionsUntilNextFree} more to free session</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-md">
                    <Gift className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Loyalty Rewards</p>
                      <p className="text-xs text-muted-foreground">For every 5 sessions, receive a free 3-hour session</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a href="#loyalty" onClick={() => setActiveTab("loyalty")}>View Details</a>
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Upcoming Bookings</CardTitle>
                <CardDescription>Your scheduled sessions</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                {upcomingBookings.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingBookings.slice(0, 3).map((booking) => (
                      <div key={booking.id} className="flex flex-col p-3 bg-muted/50 rounded-md">
                        <div className="flex justify-between items-start">
                          <p className="font-medium">{getServiceName(booking.serviceId)}</p>
                          {getStatusBadge(booking.status)}
                        </div>
                        <div className="mt-1 flex gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {format(new Date(booking.date), "MMM d, yyyy")}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {format(new Date(booking.date), "h:mm a")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <p>No upcoming bookings</p>
                    <p className="text-sm mt-1">Schedule your next session!</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <div className="grid grid-cols-2 gap-2 w-full">
                  <Button variant="outline" size="sm" asChild>
                    <a href="#bookings" onClick={() => setActiveTab("bookings")}>View All</a>
                  </Button>
                  <Button size="sm" asChild>
                    <a href="/booking">Book Session</a>
                  </Button>
                </div>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Account Overview</CardTitle>
                <CardDescription>Your membership details</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Username</span>
                    <span className="text-sm font-medium">{user.username}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Email</span>
                    <span className="text-sm font-medium">{user.email}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Phone</span>
                    <span className="text-sm font-medium">{user.phone || "Not provided"}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Member Since</span>
                    <span className="text-sm font-medium">
                      {user.createdAt ? format(new Date(user.createdAt), "MMMM yyyy") : "N/A"}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a href="#settings" onClick={() => setActiveTab("settings")}>Edit Profile</a>
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Activity Summary</CardTitle>
                <CardDescription>Overview of your recent activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-lg">
                    <Calendar className="h-8 w-8 text-primary mb-2" />
                    <h3 className="text-2xl font-bold">{bookings.length}</h3>
                    <p className="text-sm text-muted-foreground">Total Bookings</p>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-lg">
                    <CreditCard className="h-8 w-8 text-primary mb-2" />
                    <h3 className="text-2xl font-bold">
                      {formatCurrency(bookings.reduce((sum, b) => sum + b.amount, 0))}
                    </h3>
                    <p className="text-sm text-muted-foreground">Total Spent</p>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-lg">
                    <Clock className="h-8 w-8 text-primary mb-2" />
                    <h3 className="text-2xl font-bold">
                      {bookings.reduce((total, booking) => total + booking.duration, 0) / 60}
                    </h3>
                    <p className="text-sm text-muted-foreground">Total Hours</p>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-lg">
                    <Star className="h-8 w-8 text-primary mb-2" />
                    <h3 className="text-2xl font-bold">{loyaltyPoints}</h3>
                    <p className="text-sm text-muted-foreground">Loyalty Points</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <CardTitle>Your Bookings</CardTitle>
              <CardDescription>View and manage your upcoming sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="upcoming">
                <TabsList className="mb-4">
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="past">Past</TabsTrigger>
                </TabsList>
                <TabsContent value="upcoming" className="space-y-4">
                  {upcomingBookings.length > 0 ? (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Service</TableHead>
                            <TableHead>Date & Time</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {upcomingBookings.map((booking) => (
                            <TableRow key={booking.id}>
                              <TableCell className="font-medium">{getServiceName(booking.serviceId)}</TableCell>
                              <TableCell>
                                {format(new Date(booking.date), "MMM d, yyyy")}
                                <br />
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(booking.date), "h:mm a")}
                                </span>
                              </TableCell>
                              <TableCell>{booking.duration / 60} hours</TableCell>
                              <TableCell>{getStatusBadge(booking.status)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(booking.amount)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">No Upcoming Bookings</h3>
                      <p className="text-muted-foreground mt-1 mb-4">You don't have any upcoming sessions scheduled.</p>
                      <Button asChild>
                        <a href="/booking">Book a Session</a>
                      </Button>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="past">
                  {pastBookings.length > 0 ? (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Service</TableHead>
                            <TableHead>Date & Time</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pastBookings.map((booking) => (
                            <TableRow key={booking.id}>
                              <TableCell className="font-medium">{getServiceName(booking.serviceId)}</TableCell>
                              <TableCell>
                                {format(new Date(booking.date), "MMM d, yyyy")}
                                <br />
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(booking.date), "h:mm a")}
                                </span>
                              </TableCell>
                              <TableCell>{booking.duration / 60} hours</TableCell>
                              <TableCell>{getStatusBadge(booking.status)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(booking.amount)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">No Past Bookings</h3>
                      <p className="text-muted-foreground mt-1">When you complete sessions, they will appear here</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="loyalty">
          <Card>
            <CardHeader>
              <CardTitle>Loyalty Program</CardTitle>
              <CardDescription>Track your rewards and loyalty status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border bg-card p-6">
                <h3 className="text-lg font-semibold mb-4">Your Loyalty Status</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-muted/50 p-4 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground mb-1">Session Count</p>
                      <p className="text-3xl font-bold">{sessionCount}</p>
                    </div>
                    <div className="bg-muted/50 p-4 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground mb-1">Loyalty Points</p>
                      <p className="text-3xl font-bold">{loyaltyPoints}</p>
                    </div>
                    <div className="bg-muted/50 p-4 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground mb-1">Free Sessions Earned</p>
                      <p className="text-3xl font-bold">{Math.floor(sessionCount / 5)}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Progress to Next Reward</h4>
                    <Progress value={progressPercentage} className="h-2" />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{progressToNextFree}/5 sessions completed</span>
                      <span>{sessionsUntilNextFree} sessions until free reward</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="rounded-lg border bg-card">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold">Loyalty Activity History</h3>
                </div>
                {loyaltyRecords.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Activity</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Points Change</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loyaltyRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            {record.createdAt ? format(new Date(record.createdAt), "MMM d, yyyy") : "N/A"}
                          </TableCell>
                          <TableCell>
                            {record.action === "session_completed" && "Session Completed"}
                            {record.action === "reward_earned" && "Reward Earned"}
                            {record.action === "reward_used" && "Reward Used"}
                          </TableCell>
                          <TableCell>{record.description}</TableCell>
                          <TableCell className={`text-right ${record.pointsChange > 0 ? "text-green-600" : "text-red-600"}`}>
                            {record.pointsChange > 0 ? "+" : ""}{record.pointsChange}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-12 text-center">
                    <BarChart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No Loyalty Activity Yet</h3>
                    <p className="text-muted-foreground mt-1 mb-4">
                      Start booking sessions to earn loyalty points and rewards
                    </p>
                    <Button asChild>
                      <a href="/booking">Book a Session</a>
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="bg-muted/50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">How It Works</h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">1</div>
                    <div>
                      <h4 className="font-medium">Book Sessions</h4>
                      <p className="text-sm text-muted-foreground">Every completed paid session counts toward your loyalty program</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">2</div>
                    <div>
                      <h4 className="font-medium">Earn Points</h4>
                      <p className="text-sm text-muted-foreground">Accumulate loyalty points with each booking</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">3</div>
                    <div>
                      <h4 className="font-medium">Get Rewards</h4>
                      <p className="text-sm text-muted-foreground">After every 5 paid sessions, you'll receive a free 3-hour session</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">4</div>
                    <div>
                      <h4 className="font-medium">Redeem Your Reward</h4>
                      <p className="text-sm text-muted-foreground">Apply your free session during the booking process</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Session History</CardTitle>
              <CardDescription>View your past sessions and activity</CardDescription>
            </CardHeader>
            <CardContent>
              {pastBookings.length > 0 ? (
                <div className="space-y-6">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Service</TableHead>
                          <TableHead>Details</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pastBookings.map((booking) => (
                          <TableRow key={booking.id}>
                            <TableCell>
                              {format(new Date(booking.date), "MMM d, yyyy")}
                              <br />
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(booking.date), "h:mm a")}
                              </span>
                            </TableCell>
                            <TableCell className="font-medium">{getServiceName(booking.serviceId)}</TableCell>
                            <TableCell>
                              <span className="line-clamp-2 text-sm">
                                {booking.details || "No additional details"}
                              </span>
                            </TableCell>
                            <TableCell>{booking.duration / 60} hours</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(booking.amount)}
                              {booking.loyaltyApplied && (
                                <div className="text-xs text-primary font-medium">Loyalty Applied</div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h3 className="text-sm font-medium mb-2">Session Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Total Sessions</p>
                        <p className="text-lg font-bold">{pastBookings.length}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total Hours</p>
                        <p className="text-lg font-bold">
                          {pastBookings.reduce((total, booking) => total + booking.duration, 0) / 60}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total Spent</p>
                        <p className="text-lg font-bold">
                          {formatCurrency(pastBookings.reduce((sum, b) => sum + b.amount, 0))}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Loyalty Rewards</p>
                        <p className="text-lg font-bold">
                          {pastBookings.filter(b => b.loyaltyApplied).length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No Session History</h3>
                  <p className="text-muted-foreground mt-1 mb-4">You haven't completed any sessions yet</p>
                  <Button asChild>
                    <a href="/booking">Book Your First Session</a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your account information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <h3 className="font-medium mb-2">Account Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Username</span>
                      <span className="text-sm font-medium">{user.username}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Email</span>
                      <span className="text-sm font-medium">{user.email}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">First Name</span>
                      <span className="text-sm font-medium">{user.firstName || "Not set"}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Last Name</span>
                      <span className="text-sm font-medium">{user.lastName || "Not set"}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Phone</span>
                      <span className="text-sm font-medium">{user.phone || "Not provided"}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Member Since</span>
                      <span className="text-sm font-medium">
                        {user.createdAt ? format(new Date(user.createdAt), "MMMM d, yyyy") : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 rounded-lg bg-yellow-50/50 border border-yellow-200">
                  <h3 className="font-medium mb-2 text-yellow-800">Profile Update</h3>
                  <p className="text-sm text-yellow-700 mb-2">
                    Profile editing functionality will be available soon. Please contact us if you need to update your account information.
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <a href="/#contact">Contact Us</a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}