import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminDashboard from "@/components/admin/AdminDashboard";
import BookingManager from "@/components/admin/BookingManager";
import ContentManager from "@/components/admin/ContentManager";
import ScheduleManager from "@/components/admin/ScheduleManager";
import { Loader2, BarChart2 } from "lucide-react";

export default function Admin() {
  const [location, navigate] = useLocation();
  
  const { data: authData, isLoading } = useQuery({
    queryKey: ['/api/check-auth'],
  });
  
  useEffect(() => {
    if (!isLoading && authData && !authData.authenticated) {
      navigate('/admin/login');
    }
  }, [authData, isLoading, navigate]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }
  
  if (!authData || !authData.authenticated) {
    return null; // Will redirect in useEffect
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
            
            <a 
              href="/analytics" 
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors w-full md:w-auto"
            >
              <BarChart2 size={18} />
              <span className="font-medium">Business Analytics</span>
            </a>
          </div>
        </header>
        
        <Tabs defaultValue="dashboard" className="space-y-6">
          <div className="overflow-x-auto pb-2">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="dashboard" className="px-4">Dashboard</TabsTrigger>
              <TabsTrigger value="bookings" className="px-4">Bookings</TabsTrigger>
              <TabsTrigger value="content" className="px-4">Content Manager</TabsTrigger>
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
          
          <TabsContent value="schedule">
            <ScheduleManager />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
