import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Booking from "@/pages/Booking";
import Beats from "@/pages/Beats";
import Admin from "@/pages/Admin";
import AdminLogin from "@/pages/AdminLogin";
import CompletePayment from "@/pages/CompletePayment";
import Analytics from "@/pages/Analytics";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Lazy-loaded account pages
const AccountLogin = lazy(() => import("@/pages/AccountLogin"));
const AccountRegister = lazy(() => import("@/pages/AccountRegister"));
const Account = lazy(() => import("@/pages/Account"));

function Router() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/booking" component={Booking} />
        <Route path="/beats" component={Beats} />
        <Route path="/complete-payment" component={CompletePayment} />
        <Route path="/account/login">
          {() => <AccountLogin />}
        </Route>
        <Route path="/account/register">
          {() => <AccountRegister />}
        </Route>
        <ProtectedRoute path="/account" component={() => <Account />} adminOnly={false} />
        <Route path="/admin/login" component={AdminLogin} />
        <ProtectedRoute path="/admin" component={Admin} adminOnly={true} />
        <ProtectedRoute path="/analytics" component={Analytics} adminOnly={true} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">
            <Router />
          </main>
          <Footer />
        </div>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
