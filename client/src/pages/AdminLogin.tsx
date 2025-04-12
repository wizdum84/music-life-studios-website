import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet";
import LoginForm from "@/components/admin/LoginForm";
import { Loader2 } from "lucide-react";

export default function AdminLogin() {
  const [location, navigate] = useLocation();
  
  const { data: authData, isLoading } = useQuery({
    queryKey: ['/api/check-auth'],
  });
  
  useEffect(() => {
    if (!isLoading && authData && authData.authenticated) {
      navigate('/admin');
    }
  }, [authData, isLoading, navigate]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>Admin Login | SoundCraft Studios</title>
      </Helmet>
      
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Admin Login</h1>
            <p className="mt-2 text-muted-foreground">
              Sign in to access your admin dashboard
            </p>
          </div>
          
          <LoginForm />
        </div>
      </div>
    </>
  );
}
