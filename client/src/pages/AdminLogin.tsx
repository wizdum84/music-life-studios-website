import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff } from "lucide-react";
import { Helmet } from "react-helmet";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { scrollToTop } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  username: z.string().min(3, {
    message: "Username must be at least 3 characters.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
});

export default function AdminLogin() {
  const [location, navigate] = useLocation();
  const { user, isLoading, loginMutation } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [mfaToken, setMfaToken] = useState(() => sessionStorage.getItem("adminMfaToken") || "");
  const [mfaCode, setMfaCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();
  
  // Scroll to top on component mount
  useEffect(() => {
    scrollToTop();
  }, []);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const result = await loginMutation.mutateAsync(values);
    if ("mfaRequired" in result) {
      sessionStorage.setItem("adminMfaToken", result.mfaToken);
      setMfaToken(result.mfaToken);
      return;
    }
    navigate("/admin");
  }

  async function verifyMfa() {
    setIsVerifying(true);
    try {
      const response = await apiRequest("POST", "/api/login/mfa", { mfaToken, code: mfaCode });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Verification failed");
      sessionStorage.removeItem("adminMfaToken");
      queryClient.setQueryData(["/api/user"], data.user);
      navigate("/admin");
    } catch (error: any) {
      toast({ title: "Verification failed", description: error.message, variant: "destructive" });
    } finally { setIsVerifying(false); }
  }
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/admin');
    }
  }, [user, navigate]);
  
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
        <title>Admin Login | Music Life Studios</title>
      </Helmet>
      
      <div className="flex items-center justify-center pt-16 pb-16">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md dark:bg-gray-800">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Admin Login</h1>
            <p className="mt-2 text-muted-foreground">
              Sign in to access your admin dashboard
            </p>
          </div>
          
          {mfaToken ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Enter the six-digit code from your authenticator app.</p>
              <Input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={mfaCode} onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, ""))} placeholder="000000" />
              <Button className="w-full" onClick={verifyMfa} disabled={mfaCode.length !== 6 || isVerifying}>{isVerifying ? "Verifying..." : "Verify and sign in"}</Button>
              <Button variant="ghost" className="w-full" onClick={() => { sessionStorage.removeItem("adminMfaToken"); setMfaToken(""); }}>Use password again</Button>
            </div>
          ) : <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="admin" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type={showPassword ? "text" : "password"} placeholder="********" className="pr-10" {...field} />
                        <button
                          type="button"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          title={showPassword ? "Hide password" : "Show password"}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowPassword((visible) => !visible)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
            </form>
          </Form>}

          <p className="text-center text-sm text-muted-foreground">
            <Link href="/forgot-password" className="text-primary hover:underline">Forgot password?</Link>
          </p>
          <p className="text-center text-sm text-muted-foreground">
            First setup? <Link href="/admin/setup" className="text-primary hover:underline">Create the first administrator</Link>
          </p>
        </div>
      </div>
    </>
  );
}
