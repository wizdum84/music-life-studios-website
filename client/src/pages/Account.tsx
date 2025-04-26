import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import PageHeader from "@/components/layout/PageHeader";
import { Booking } from "@shared/schema";
import { format } from "date-fns";
import { CalendarDays, Calendar, CircleDollarSign, Gift, History, LogOut, Settings, User } from "lucide-react";

interface LoyaltyData {
  points: number;
  sessionCount: number;
  records: LoyaltyRecord[];
}

interface LoyaltyRecord {
  id: number;
  userId: number;
  points: number;
  reason: string;
  bookingId: number | null;
  createdAt: Date;
}

export default function Account() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  // Get user's loyalty data
  const { data: loyaltyData, isLoading: loyaltyLoading } = useQuery<LoyaltyData>({
    queryKey: ["/api/user/loyalty"],
    enabled: !!user,
  });

  // Get user's bookings
  const { data: bookings, isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["/api/user/bookings"],
    enabled: !!user,
  });

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "An error occurred while logging out",
        variant: "destructive",
      });
    }
  };

  function calculateNextReward() {
    if (!loyaltyData) return null;
    
    const currentSessions = loyaltyData.sessionCount;
    const sessionsUntilReward = 5 - (currentSessions % 5);
    
    return {
      current: currentSessions,
      needed: 5,
      remaining: sessionsUntilReward,
      progress: ((5 - sessionsUntilReward) / 5) * 100
    };
  }

  const rewardStatus = calculateNextReward();

  return (
    <div className="container py-10">
      <PageHeader 
        title="Member Account" 
        subtitle={`Welcome back, ${user?.firstName || user?.username}!`}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Account Menu</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                orientation="vertical"
                className="w-full"
              >
                <TabsList className="flex flex-col h-auto items-start p-0 bg-transparent">
                  <TabsTrigger 
                    value="overview" 
                    className="w-full justify-start py-3 px-4 data-[state=active]:bg-muted/50"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger 
                    value="loyalty" 
                    className="w-full justify-start py-3 px-4 data-[state=active]:bg-muted/50"
                  >
                    <Gift className="mr-2 h-4 w-4" />
                    Loyalty Program
                  </TabsTrigger>
                  <TabsTrigger 
                    value="bookings" 
                    className="w-full justify-start py-3 px-4 data-[state=active]:bg-muted/50"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    My Bookings
                  </TabsTrigger>
                  <TabsTrigger 
                    value="history" 
                    className="w-full justify-start py-3 px-4 data-[state=active]:bg-muted/50"
                  >
                    <History className="mr-2 h-4 w-4" />
                    Activity History
                  </TabsTrigger>
                  <TabsTrigger 
                    value="settings" 
                    className="w-full justify-start py-3 px-4 data-[state=active]:bg-muted/50"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              <Separator className="my-2" />
              
              <Button 
                variant="ghost" 
                className="w-full justify-start py-3 px-4 rounded-none text-muted-foreground hover:text-foreground"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="overview" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Loyalty Points
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold">
                        {loyaltyLoading ? "-" : loyaltyData?.points || 0}
                      </div>
                      <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Completed Sessions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold">
                        {loyaltyLoading ? "-" : loyaltyData?.sessionCount || 0}
                      </div>
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Next Reward In
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold">
                        {loyaltyLoading ? "-" : (rewardStatus?.remaining || 0) + " sessions"}
                      </div>
                      <Gift className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Reward Progress</CardTitle>
                    <CardDescription>Every 5 sessions earns a free 3-hour session</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {rewardStatus && (
                      <div className="space-y-4">
                        <div className="w-full bg-muted rounded-full h-2.5">
                          <div 
                            className="bg-primary h-2.5 rounded-full" 
                            style={{ width: `${rewardStatus.progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-sm">
                          <div>
                            <span className="font-medium">{rewardStatus.current % 5}</span>
                            <span className="text-muted-foreground"> / {rewardStatus.needed} sessions</span>
                          </div>
                          <div className="text-muted-foreground">
                            {rewardStatus.remaining} sessions until reward
                          </div>
                        </div>
                        {rewardStatus.remaining === 0 && (
                          <div className="bg-green-50 dark:bg-green-950 p-4 rounded border border-green-200 dark:border-green-800">
                            <p className="text-green-700 dark:text-green-300 font-medium">
                              Congratulations! You've earned a free 3-hour session!
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Bookings</CardTitle>
                    <CardDescription>Your latest studio sessions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {bookingsLoading ? (
                      <p className="text-muted-foreground">Loading bookings...</p>
                    ) : !bookings || bookings.length === 0 ? (
                      <p className="text-muted-foreground">No bookings found</p>
                    ) : (
                      <div className="space-y-4">
                        {bookings.slice(0, 3).map((booking) => (
                          <div key={booking.id} className="flex justify-between border-b pb-2 last:border-0">
                            <div>
                              <p className="font-medium">{booking.serviceName || "Studio Session"}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(booking.date), "MMM d, yyyy 'at' h:mm a")}
                              </p>
                            </div>
                            <Badge variant={
                              booking.status === "completed" ? "default" :
                              booking.status === "confirmed" ? "success" : "outline"
                            }>
                              {booking.status === "pending" ? "Pending" :
                               booking.status === "confirmed" ? "Confirmed" : 
                               booking.status === "completed" ? "Completed" : 
                               booking.status === "cancelled" ? "Cancelled" : 
                               booking.status}
                            </Badge>
                          </div>
                        ))}
                        {bookings.length > 3 && (
                          <Button variant="outline" className="w-full">
                            View All Bookings
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="loyalty" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Loyalty Program</CardTitle>
                  <CardDescription>
                    Track your progress and rewards
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Your Loyalty Status</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-muted p-4 rounded-lg">
                            <p className="text-sm text-muted-foreground">Points Balance</p>
                            <p className="text-2xl font-bold">{loyaltyLoading ? "-" : loyaltyData?.points || 0}</p>
                          </div>
                          <div className="bg-muted p-4 rounded-lg">
                            <p className="text-sm text-muted-foreground">Completed Sessions</p>
                            <p className="text-2xl font-bold">{loyaltyLoading ? "-" : loyaltyData?.sessionCount || 0}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Progress to Next Reward</h3>
                        {rewardStatus && (
                          <div className="space-y-4">
                            <div className="w-full bg-muted rounded-full h-4">
                              <div 
                                className="bg-primary h-4 rounded-full flex items-center justify-center text-xs text-white font-medium" 
                                style={{ width: `${rewardStatus.progress}%` }}
                              >
                                {rewardStatus.progress >= 35 ? `${Math.round(rewardStatus.progress)}%` : ''}
                              </div>
                            </div>
                            <div className="flex justify-between text-sm">
                              <div>
                                <span className="font-medium">{rewardStatus.current % 5}</span>
                                <span className="text-muted-foreground"> / {rewardStatus.needed} sessions</span>
                              </div>
                              <div className="text-muted-foreground">
                                {rewardStatus.remaining} sessions until reward
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Activity History</h3>
                      {loyaltyLoading ? (
                        <p className="text-muted-foreground">Loading activity history...</p>
                      ) : !loyaltyData?.records || loyaltyData.records.length === 0 ? (
                        <p className="text-muted-foreground">No loyalty activity found</p>
                      ) : (
                        <ScrollArea className="h-[300px] rounded-md border">
                          <div className="p-4">
                            {loyaltyData.records.map((record) => (
                              <div key={record.id} className="mb-4 pb-4 border-b last:border-0 last:mb-0 last:pb-0">
                                <div className="flex justify-between">
                                  <p className="font-medium">{record.reason}</p>
                                  <p className={`font-medium ${record.points > 0 ? 'text-green-600 dark:text-green-400' : ''}`}>
                                    {record.points > 0 ? '+' : ''}{record.points} points
                                  </p>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(record.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                                </p>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="bookings" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>My Bookings</CardTitle>
                  <CardDescription>
                    View and manage your studio sessions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {bookingsLoading ? (
                    <p className="text-muted-foreground">Loading bookings...</p>
                  ) : !bookings || bookings.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium">No bookings found</h3>
                      <p className="text-muted-foreground mb-6">You haven't made any studio bookings yet.</p>
                      <Button onClick={() => window.location.href = '/booking'}>
                        Book a Session
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Upcoming Sessions</h3>
                          <div className="space-y-4">
                            {bookings
                              .filter(b => new Date(b.date) > new Date() && b.status !== 'cancelled')
                              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                              .map(booking => (
                                <Card key={booking.id}>
                                  <CardContent className="p-4">
                                    <div className="flex justify-between">
                                      <div>
                                        <p className="font-medium">{booking.serviceName || "Studio Session"}</p>
                                        <p className="text-sm text-muted-foreground">
                                          {format(new Date(booking.date), "EEEE, MMMM d, yyyy")}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                          {format(new Date(booking.date), "h:mm a")} ({booking.duration} hours)
                                        </p>
                                      </div>
                                      <Badge variant={
                                        booking.status === "confirmed" ? "success" : "outline"
                                      }>
                                        {booking.status === "pending" ? "Pending" :
                                        booking.status === "confirmed" ? "Confirmed" : booking.status}
                                      </Badge>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            {bookings.filter(b => new Date(b.date) > new Date() && b.status !== 'cancelled').length === 0 && (
                              <p className="text-muted-foreground">No upcoming sessions</p>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Past Sessions</h3>
                          <div className="space-y-4">
                            {bookings
                              .filter(b => new Date(b.date) <= new Date() || b.status === 'completed')
                              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                              .slice(0, 3)
                              .map(booking => (
                                <Card key={booking.id}>
                                  <CardContent className="p-4">
                                    <div className="flex justify-between">
                                      <div>
                                        <p className="font-medium">{booking.serviceName || "Studio Session"}</p>
                                        <p className="text-sm text-muted-foreground">
                                          {format(new Date(booking.date), "MMMM d, yyyy")} at {format(new Date(booking.date), "h:mm a")}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                          {booking.duration} hours
                                        </p>
                                      </div>
                                      <Badge variant={
                                        booking.status === "completed" ? "default" : 
                                        booking.status === "cancelled" ? "destructive" : "outline"
                                      }>
                                        {booking.status === "completed" ? "Completed" : 
                                         booking.status === "cancelled" ? "Cancelled" : booking.status}
                                      </Badge>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            {bookings.filter(b => new Date(b.date) <= new Date() || b.status === 'completed').length === 0 && (
                              <p className="text-muted-foreground">No past sessions</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="history" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Activity History</CardTitle>
                  <CardDescription>
                    View your account activity and transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loyaltyLoading ? (
                    <p className="text-muted-foreground">Loading activity history...</p>
                  ) : !loyaltyData?.records || loyaltyData.records.length === 0 ? (
                    <p className="text-muted-foreground">No activity history found</p>
                  ) : (
                    <ScrollArea className="h-[500px] rounded-md border">
                      <div className="p-4">
                        {loyaltyData.records.map((record) => (
                          <div key={record.id} className="mb-6 pb-6 border-b last:border-0 last:mb-0 last:pb-0">
                            <div className="flex justify-between">
                              <div>
                                <p className="font-medium">{record.reason}</p>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(record.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                                </p>
                                {record.bookingId && (
                                  <p className="text-sm text-muted-foreground">
                                    Booking ID: {record.bookingId}
                                  </p>
                                )}
                              </div>
                              <p className={`font-medium ${record.points > 0 ? 'text-green-600 dark:text-green-400' : ''}`}>
                                {record.points > 0 ? '+' : ''}{record.points} points
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="settings" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>
                    Update your personal information and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                      <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">Username</dt>
                          <dd className="mt-1">{user?.username}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                          <dd className="mt-1">{user?.email || "Not provided"}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">First Name</dt>
                          <dd className="mt-1">{user?.firstName || "Not provided"}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">Last Name</dt>
                          <dd className="mt-1">{user?.lastName || "Not provided"}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">Phone</dt>
                          <dd className="mt-1">{user?.phone || "Not provided"}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">Member Since</dt>
                          <dd className="mt-1">{user?.createdAt ? format(new Date(user.createdAt), "MMMM d, yyyy") : "-"}</dd>
                        </div>
                      </dl>
                      <div className="mt-6">
                        <Button variant="outline">
                          Update Profile
                        </Button>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Account Security</h3>
                      <Button variant="outline">
                        Change Password
                      </Button>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
                      <p className="text-muted-foreground mb-4">
                        Choose which notifications you'd like to receive
                      </p>
                      <div className="space-y-2">
                        {/* Notification preferences would go here */}
                        <p className="text-muted-foreground italic">Feature coming soon</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}