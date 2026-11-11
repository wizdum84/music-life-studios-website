import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { lazy, Suspense } from "react";
import { Loader2, Pause, Play, Volume2, VolumeX, X } from "lucide-react";
import { AudioProvider, useAudio } from "@/hooks/useAudio";

const NotFound = lazy(() => import("@/pages/not-found"));
const Home = lazy(() => import("@/pages/Home"));
const Booking = lazy(() => import("@/pages/Booking"));
const Beats = lazy(() => import("@/pages/Beats"));
const Deals = lazy(() => import("@/pages/Deals"));
const DesignPreview = lazy(() => import("@/pages/DesignPreview"));
const Admin = lazy(() => import("@/pages/Admin"));
const AdminLogin = lazy(() => import("@/pages/AdminLogin"));
const AdminSetup = lazy(() => import("@/pages/AdminSetup"));
const CompletePayment = lazy(() => import("@/pages/CompletePayment"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const AccountLogin = lazy(() => import("@/pages/AccountLogin"));
const AccountRegister = lazy(() => import("@/pages/AccountRegister"));
const Account = lazy(() => import("@/pages/Account"));
const AccountRecovery = lazy(() => import("@/pages/AccountRecovery").then((module) => ({ default: module.ForgotPassword })));
const ResetPassword = lazy(() => import("@/pages/AccountRecovery").then((module) => ({ default: module.ResetPassword })));
const VerifyEmail = lazy(() => import("@/pages/AccountRecovery").then((module) => ({ default: module.VerifyEmail })));
const Feedback = lazy(() => import("@/pages/Feedback"));

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
        <Route path="/deals" component={Deals} />
        <Route path="/design-preview" component={DesignPreview} />
        <Route path="/complete-payment" component={CompletePayment} />
        <Route path="/account/login">
          {() => <AccountLogin />}
        </Route>
        <Route path="/account/register">
          {() => <AccountRegister />}
        </Route>
        <Route path="/forgot-password" component={AccountRecovery} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/verify-email" component={VerifyEmail} />
        <Route path="/feedback" component={Feedback} />
        <ProtectedRoute path="/account" component={() => <Account />} adminOnly={false} />
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin/setup" component={AdminSetup} />
        <ProtectedRoute path="/admin" component={Admin} adminOnly={true} />
        <ProtectedRoute path="/analytics" component={Analytics} adminOnly={true} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function PersistentAudioDock() {
  const { audioSrc, activeTitle, playing, currentTime, duration, volume, muted, hasStarted, togglePlayPause, seek, setVolume, toggleMute, stop } = useAudio();
  if (!audioSrc || !hasStarted) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 border-2 border-[#8a5a1c] bg-[#141414] px-4 py-3 text-white shadow-[8px_8px_0_#6d4918] md:left-auto md:w-[34rem]">
      <div className="flex items-center gap-3">
        <button type="button" aria-label={playing ? "Pause audio" : "Play audio"} onClick={() => togglePlayPause()} className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#ff8a00] text-black hover:bg-[#ffac3d]">
          {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{activeTitle || "Audio preview"}</p>
          <input aria-label="Audio progress" type="range" min="0" max="100" step="0.1" value={progress} onChange={(event) => seek((Number(event.target.value) / 100) * duration)} className="mt-1 w-full accent-[#ff8a00]" />
        </div>
        <button type="button" aria-label={muted ? "Unmute audio" : "Mute audio"} onClick={toggleMute} className="text-[#ffb84d] hover:text-white">
          {muted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
        <input aria-label="Volume" type="range" min="0" max="1" step="0.01" value={muted ? 0 : volume} onChange={(event) => setVolume(Number(event.target.value))} className="hidden w-20 accent-[#ff8a00] sm:block" />
        <button type="button" aria-label="Close audio player" onClick={stop} className="text-white/60 hover:text-white"><X className="h-5 w-5" /></button>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AudioProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow">
              <Router />
            </main>
            <Footer />
            <PersistentAudioDock />
          </div>
        </AudioProvider>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
