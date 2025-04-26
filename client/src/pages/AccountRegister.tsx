import { useState } from "react";
import { Link, useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import PageHeader from "@/components/layout/PageHeader";

const formSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(2, "First name must be at least 2 characters").optional(),
  lastName: z.string().min(2, "Last name must be at least 2 characters").optional(),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

export default function AccountRegister() {
  const [_, navigate] = useLocation();
  const { registerMutation } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      phone: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      // Remove confirmPassword as it's not part of our API
      const { confirmPassword, ...registerData } = values;
      
      // Set role explicitly to customer
      await registerMutation.mutateAsync({
        ...registerData,
        role: "customer"
      });
      
      toast({
        title: "Registration successful",
        description: "Welcome to Music Life Studios!",
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
        title="Create Account" 
        subtitle="Join the Music Life Studios family"
        centered
      />
      
      <div className="flex flex-col md:flex-row gap-8 mt-8 max-w-5xl mx-auto">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>
              Create your member account to access exclusive benefits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your first name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your last name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Create a username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Your email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Your phone number" {...field} />
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
                        <Input type="password" placeholder="Create a password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirm your password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                  <span>Already have an account? </span>
                  <Link href="/account/login">
                    <a className="text-primary hover:underline">Login</a>
                  </Link>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <div className="flex-1 flex flex-col justify-center">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Why Join Us?</h2>
            <p className="text-muted-foreground">
              Becoming a member of Music Life Studios gives you access to exclusive benefits and helps us provide you with a personalized experience.
            </p>
            
            <div className="space-y-4 mt-6">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold text-primary mb-2">Loyalty Program</h3>
                <p>Earn points with every session and get your 5th session free!</p>
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold text-primary mb-2">Special Promotions</h3>
                <p>Access member-only discounts and special offers throughout the year.</p>
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold text-primary mb-2">Track Your Progress</h3>
                <p>Keep track of your bookings, session history, and manage your appointments easily.</p>
              </div>
            </div>

            <blockquote className="border-l-4 border-primary p-4 italic bg-muted/50 rounded-sm mt-6">
              "At Music Life Studios, we're more than just a studio - we're a community of passionate musicians and creators. Join us today!"
            </blockquote>
          </div>
        </div>
      </div>
    </div>
  );
}