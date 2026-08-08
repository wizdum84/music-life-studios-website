import { useEffect } from "react";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminDashboard from "@/components/admin/AdminDashboard";
import BookingManager from "@/components/admin/BookingManager";
import ContentManager from "@/components/admin/ContentManager";
import ScheduleManager from "@/components/admin/ScheduleManager";
import MembershipManager from "@/components/admin/MembershipManager";
import { Loader2, BarChart2, ExternalLink, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { scrollToTop } from "@/lib/utils";

export default function Admin() {
  const [location, navigate] = useLocation();
  const { user, isLoading, logoutMutation } = useAuth();
  
  // Scroll to top on component mount
  useEffect(() => {
    scrollToTop();
  }, []);
  
  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate('/');
        toast({
          title: "Logged out",
          description: "You have been successfully logged out.",
        });
      }
    });
  };
  
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/admin/login');
    }
  }, [user, isLoading, navigate]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }
  
  if (!user) {
    return null; // Will redirect in useEffect
  }
  
  if (user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p className="mt-2 text-gray-600">You don't have admin privileges to access this page.</p>
      </div>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>Admin Dashboard | Music Life Studios</title>
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-muted-foreground">
                Manage your bookings, messages, and content
              </p>
            </div>
            
            <div className="flex flex-col md:flex-row gap-2">
              <Button variant="outline" asChild className="inline-flex items-center justify-center gap-2 w-full md:w-auto">
                <a href="/" target="_blank" rel="noreferrer">
                  <ExternalLink size={18} />
                  <span className="font-medium">Preview Customer Site</span>
                </a>
              </Button>
              <Button variant="outline" asChild className="inline-flex items-center justify-center gap-2 w-full md:w-auto">
                <a href="/booking" target="_blank" rel="noreferrer">
                  <ExternalLink size={18} />
                  <span className="font-medium">Preview Booking</span>
                </a>
              </Button>
              <a 
                href="/analytics" 
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors w-full md:w-auto"
              >
                <BarChart2 size={18} />
                <span className="font-medium">Business Analytics</span>
              </a>
              
              <Button 
                variant="outline" 
                className="inline-flex items-center justify-center gap-2 w-full md:w-auto"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Logging out...</span>
                  </>
                ) : (
                  <>
                    <LogOut size={18} />
                    <span>Logout</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </header>
        
        <Tabs defaultValue="dashboard" className="space-y-6">
          <div className="overflow-x-auto pb-2">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="dashboard" className="px-4">Dashboard</TabsTrigger>
              <TabsTrigger value="bookings" className="px-4">Bookings</TabsTrigger>
              <TabsTrigger value="content" className="px-4">Content Manager</TabsTrigger>
              <TabsTrigger value="memberships" className="px-4">Memberships</TabsTrigger>
              <TabsTrigger value="schedule" className="px-4">Schedule Manager</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="dashboard">
            <AdminDashboard />
          </TabsContent>
          
          <TabsContent value="bookings">
            <BookingManager />
          </TabsContent>
          
          <TabsContent value="content">
            <ContentManager />
          </TabsContent>

          <TabsContent value="memberships">
            <MembershipManager />
          </TabsContent>
          
          <TabsContent value="schedule">
            <ScheduleManager />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
