import { useState } from "react";
import { Link, useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import PageHeader from "@/components/layout/PageHeader";

const formSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function AccountLogin() {
  const [_, navigate] = useLocation();
  const { loginMutation } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      await loginMutation.mutateAsync(values);
      toast({
        title: "Login successful",
        description: "Welcome back to Music Life Studios!",
      });
      navigate("/account");
    } catch (error: any) {
      // Error handling is already done in the mutation
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-10">
      <PageHeader 
        title="Member Login" 
        subtitle="Access your account and loyalty rewards"
        centered
      />
      
      <div className="flex flex-col md:flex-row gap-8 mt-8 max-w-5xl mx-auto">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your username" {...field} />
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
                        <Input type="password" placeholder="Enter your password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                  <span>Don't have an account? </span>
                  <Link href="/account/register">
                    <a className="text-primary hover:underline">Sign up</a>
                  </Link>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <div className="flex-1 flex flex-col justify-center">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Member Benefits</h2>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5">✓</span>
                <span>Earn loyalty points with every booking</span>
              </li>
              <li className="flex items-start">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5">✓</span>
                <span>Get a free 3-hour session after every 5 paid sessions</span>
              </li>
              <li className="flex items-start">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5">✓</span>
                <span>Access exclusive member discounts and promotions</span>
              </li>
              <li className="flex items-start">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5">✓</span>
                <span>Track your booking history and session count</span>
              </li>
              <li className="flex items-start">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5">✓</span>
                <span>Receive priority booking for popular time slots</span>
              </li>
            </ul>

            <blockquote className="border-l-4 border-primary p-4 italic bg-muted/50 rounded-sm mt-6">
              "Join our loyalty program today and experience the best that Music Life Studios has to offer. Where Music is Life!"
            </blockquote>
          </div>
        </div>
      </div>
    </div>
  );
}