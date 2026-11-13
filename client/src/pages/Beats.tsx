import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Beat } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pause, Play, Search, ShoppingCart, Volume2, VolumeX } from "lucide-react";
import { formatPrice, scrollToTop } from "@/lib/utils";
import { useAudio } from "@/hooks/useAudio";
import { ContractRequirement } from "@/components/contracts";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
};

const coverArt = [
  "/assets/beats/covers/cover-character.png",
  "/assets/beats/covers/cover-mascot.png",
  "/assets/beats/covers/cover-city.png",
  "/assets/beats/covers/cover-profile.png",
  "/assets/beats/covers/cover-car.png",
  "/assets/beats/covers/cover-neon.png",
  "/assets/beats/covers/cover-chrome.png",
  "/assets/beats/covers/cover-cartoon.png",
  "/assets/beats/covers/cover-sculpture.png",
  "/assets/beats/covers/cover-masked.png",
];

type CommerceConfig = {
  beatCheckoutEnabled: boolean;
  membershipEnrollmentEnabled: boolean;
};

type CatalogBeat = Beat & {
  deliveryAvailability?: Partial<Record<"basic" | "premium" | "exclusive", boolean>>;
};

// Every beat row uses the same audio element as the persistent player dock.
const BeatPlayer = ({ beat }: { beat: Beat }) => {
  const { audioSrc, playing, currentTime, duration, volume, muted, play, pause, seek, setVolume, toggleMute } = useAudio();
  const isActive = audioSrc === beat.previewUrl;
  const displayDuration = isActive && duration > 0 ? duration : (beat.durationSeconds || 45);
  const progress = displayDuration > 0 && isActive ? Math.min(100, (currentTime / displayDuration) * 100) : 0;

  const handleToggle = () => {
    if (isActive && playing) {
      pause();
    } else {
      void play(beat.previewUrl || undefined, beat.title);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-none border border-[#6b481b] bg-[#11100f] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <button type="button" aria-label={isActive && playing ? `Pause ${beat.title}` : `Play ${beat.title}`} onClick={handleToggle} className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition-all ${isActive && playing ? "border-primary bg-primary text-black shadow-[0_0_0_4px_rgba(255,138,0,0.12)]" : "border-[#8a5a1c] bg-[#231d16] text-primary hover:border-primary hover:bg-[#2a2117]"}`}>
        {isActive && playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
      </button>
      <div className="min-w-[12rem] flex-1">
        <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-[#8d806f]">
          <span>{isActive && playing ? "Now playing" : "Preview"}</span>
          <span>{formatTime(displayDuration)} sample</span>
        </div>
        <div className="relative h-1.5 overflow-hidden bg-[#3e3020]">
          <div className="absolute inset-y-0 left-0 bg-primary transition-[width]" style={{ width: `${progress}%` }} />
          <input aria-label={`Seek ${beat.title}`} type="range" min="0" max={displayDuration} step="0.1" value={isActive ? Math.min(currentTime, displayDuration) : 0} onChange={(event) => seek(Number(event.target.value))} className="beat-range absolute inset-0 h-full w-full cursor-pointer" />
        </div>
        <div className="mt-2 flex justify-between text-xs text-[#c9bca9]">
          <span>{isActive ? formatTime(currentTime) : "0:00"}</span>
          <span>{formatTime(displayDuration)}</span>
        </div>
      </div>
      <button type="button" aria-label={muted || volume === 0 ? "Unmute audio" : "Mute audio"} onClick={toggleMute} className="flex h-9 w-9 items-center justify-center rounded-full border border-transparent text-[#ffb84d] transition-colors hover:border-[#6b481b] hover:bg-[#231d16] hover:text-white">
        {muted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </button>
      <input aria-label={`Volume for ${beat.title}`} type="range" min="0" max="1" step="0.01" value={muted ? 0 : volume} onChange={(event) => setVolume(Number(event.target.value))} className="beat-range w-20" />
    </div>
  );
};

const BeatCover = ({ beat, index, playing, onPlay }: { beat: Beat; index: number; playing: boolean; onPlay: () => void }) => {
  const artwork = beat.imageUrl || coverArt[Math.abs(beat.id || index) % coverArt.length];
 return (
    <div className="group relative aspect-square overflow-hidden border-b border-[#6b481b] bg-[#1b1713]">
      <img src={artwork} alt={`${beat.title} cover art`} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/20" />
      <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
        <span className="border border-white/50 bg-black/30 px-2 py-1 backdrop-blur-sm">ML {String(index + 1).padStart(2, "0")}</span>
      </div>
      <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs uppercase tracking-[0.16em] text-white/70">{beat.genre}</p>
          <p className="mt-1 truncate text-sm font-semibold text-white">{beat.catalogNumber || "Original cut"}</p>
        </div>
        <button type="button" aria-label={playing ? `Pause ${beat.title}` : `Play ${beat.title}`} onClick={onPlay} className={playing ? "flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-white bg-primary text-black shadow-xl" : "flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-white/80 bg-black/60 text-white shadow-xl transition hover:scale-105 hover:bg-primary hover:text-black"}>
          {playing ? <Pause className="h-6 w-6" /> : <Play className="ml-1 h-6 w-6" />}
        </button>
      </div>
    </div>
    );
};
// Catalog row for displaying an individual beat and its license paths.
const BeatCard = ({ beat, index }: { beat: CatalogBeat; index: number }) => {
  const { data: commerceConfig } = useQuery<CommerceConfig>({ queryKey: ["/api/commerce-config"] });
  const beatCheckoutEnabled = commerceConfig?.beatCheckoutEnabled === true;
  const [selectedLicense, setSelectedLicense] = useState("basic");
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [contractStep, setContractStep] = useState(false);
  const [contractSigningToken, setContractSigningToken] = useState<string | null>(null);
  const [licenseContractId, setLicenseContractId] = useState<number | null>(null);
  const [contractSigned, setContractSigned] = useState(false);
  const [contentIdAcknowledged, setContentIdAcknowledged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const purchaseDialogRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { audioSrc, playing, play, pause } = useAudio();
  const isBeatPlaying = audioSrc === beat.previewUrl && playing;
  const selectedTierAvailable = beat.deliveryAvailability?.[selectedLicense as "basic" | "premium" | "exclusive"] === true;
  const handleCoverPlay = () => {
    if (isBeatPlaying) pause();
    else void play(beat.previewUrl || undefined, beat.title);
  };
  
  const getLicensePrice = (type: string) => {
    const options = beat.licensingOptions as any;
    const option = options?.[type];
    if (typeof option === "number") return option * 100;
    return option?.price || beat.price;
  };

  // Get price based on selected license
  const getPrice = () => {
    return getLicensePrice(selectedLicense);
  };
  
  // Get features based on license type 
  const getLicenseFeatures = (type: string) => {
    const features = [];
    const options = beat.licensingOptions as any;
    
    if (type === "basic") {
      features.push("MP3 format only");
      features.push("Limited to 1,000 streams");
      features.push("Personal use only");
    } else if (type === "premium") {
      features.push("WAV + MP3 formats");
      features.push("Up to 5,000 streams");
      features.push("Commercial use");
      features.push("Can be sold with credit");
    } else if (type === "exclusive") {
      features.push("All audio formats + stems");
      features.push("Unlimited streams");
      features.push("Exclusive use, subject to prior licenses");
      features.push("No credit required");
    }
    
    return features;
  };
  
  const handlePurchaseClick = () => {
    setPurchaseDialogOpen(true);
  };

  useEffect(() => {
    if (!purchaseDialogOpen) return;
    const frame = requestAnimationFrame(() => {
      purchaseDialogRef.current?.scrollTo({ top: 0, behavior: "instant" });
      purchaseDialogRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [contractStep, purchaseDialogOpen]);

  const handleContinueToContract = async () => {
    if (!customerName || !customerEmail) {
      toast({
        title: "Missing information",
        description: "Please provide your name and email to continue.",
        variant: "destructive"
      });
      return;
    }

    // Basic email validation
    if (!/^\S+@\S+\.\S+$/.test(customerEmail)) {
      toast({
        title: "Invalid email",
        description: "Please provide a valid email address.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await apiRequest("POST", "/api/beat-license/contract-preview", {
        beatId: beat.id,
        licenseType: selectedLicense,
        customerName,
        customerEmail,
      });
      const data = await response.json();
      if (!response.ok || !data.signingToken || !data.contract?.id) throw new Error(data.error || data.message || "Unable to prepare the license agreement");
      setLicenseContractId(data.contract.id);
      setContractSigningToken(data.signingToken);
      setContractStep(true);
    } catch (error: any) {
      toast({ title: "Agreement unavailable", description: error.message || "Please try again.", variant: "destructive" });
    }
  };

  const handleContractSigned = () => {
    setContractSigned(true);
  };

  const handleCompletePurchase = async () => {
    if (!contractSigned) {
      toast({
        title: "Contract required",
        description: "Please sign the license agreement to complete your purchase.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // In a real application, this would integrate with Stripe or another payment processor
      // For now, we'll just create a beat purchase record
      const response = await apiRequest("POST", "/api/beat-purchases", {
        beatId: beat.id,
        customerName,
        customerEmail,
        licenseType: selectedLicense,
        price: getPrice(),
        contractId: licenseContractId,
        contentIdAcknowledged,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to process purchase");
      }

      const purchase = await response.json();
      if (purchase.checkoutUrl) {
        window.location.assign(purchase.checkoutUrl);
        return;
      }

      toast({
        title: "License request recorded",
        description: "Your signed license request is recorded. Secure checkout is being prepared.",
        variant: "default"
      });

      // Close dialog and reset state
      setPurchaseDialogOpen(false);
      setContractStep(false);
      setContractSigned(false);
      setLicenseContractId(null);
      setContractSigningToken(null);
      setCustomerName("");
      setCustomerEmail("");
    } catch (err: any) {
      console.error("Error processing purchase:", err);
      toast({
        title: "Purchase failed",
        description: err.message || "There was an error processing your purchase. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <>
      <article className="group flex h-full flex-col overflow-hidden border border-[#463019] bg-[#171513] text-[#f6efe3] transition-colors hover:border-primary/80">
        <BeatCover beat={beat} index={index} playing={isBeatPlaying} onPlay={handleCoverPlay} />
       <div className="flex min-w-0 flex-1 flex-col">
        <CardHeader className="p-4 pb-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.18em] text-primary">Music Life beat {String(index + 1).padStart(2, "0")}</p>
              <h3 className="truncate text-lg font-black tracking-tight">{beat.title}</h3>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-[#c9bca9]">
                <span className="border border-[#6b481b] px-2 py-1 text-xs font-medium uppercase tracking-[0.12em] text-primary">{beat.genre}</span>
                <span>{beat.bpm} BPM{beat.musicalKey ? ` · ${beat.musicalKey}` : ""}</span>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#8d806f]">Licenses from</p>
              <p className="mt-1 text-xl font-black text-primary">{formatPrice(beat.price)}</p>
            </div>
          </div>
          {beat.availabilityStatus !== "available_nonexclusive" && (
            <p className="mt-3 border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-200">
              {beat.availabilityStatus === "pending_exclusive" ? "New licenses are temporarily paused while an exclusive sale is reviewed." : "This beat is exclusively sold. Existing licenses remain governed by their signed terms."}
            </p>
          )}
        </CardHeader>
        
        <CardContent className="p-4">
          <div className="mt-4 flex items-center justify-between border-y border-[#3e3020] py-3 text-xs uppercase tracking-[0.12em] text-[#8d806f]">
            <span>{beat.bpm} BPM{beat.musicalKey ? ` / ${beat.musicalKey}` : ""}</span>
            <span>{formatTime(beat.durationSeconds || 45)} preview</span>
          </div>
          
          <div className="mt-4">
            <Tabs defaultValue="basic" onValueChange={(license) => {
              setSelectedLicense(license);
              setContractStep(false);
              setContractSigned(false);
              setLicenseContractId(null);
              setContractSigningToken(null);
            }} className="border-t border-[#6b481b] pt-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.18em] text-[#c9bca9]">Choose your rights</p>
                <p className="text-xs text-[#8d806f]">One beat. Three paths.</p>
              </div>
              <TabsList className="mb-2 grid w-full grid-cols-3 rounded-none border-y border-[#6b481b] bg-transparent p-0">
                <TabsTrigger value="basic" disabled={!beat.deliveryAvailability?.basic} className="rounded-none border-r border-[#3e3020] py-3 text-[#8d806f] transition-colors data-[state=active]:bg-[#f6efe3] data-[state=active]:text-[#11100f] data-[state=active]:shadow-none">Basic</TabsTrigger>
                <TabsTrigger value="premium" disabled={!beat.deliveryAvailability?.premium} className="rounded-none border-r border-[#3e3020] py-3 text-[#8d806f] transition-colors data-[state=active]:bg-[#f6efe3] data-[state=active]:text-[#11100f] data-[state=active]:shadow-none">Premium</TabsTrigger>
                <TabsTrigger value="exclusive" disabled={!beat.deliveryAvailability?.exclusive} className="rounded-none py-3 text-[#8d806f] transition-colors data-[state=active]:bg-[#f6efe3] data-[state=active]:text-[#11100f] data-[state=active]:shadow-none">Exclusive</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="mt-2 space-y-2 text-sm text-[#d9cdbd]">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Basic License</h4>
                  <p className="font-semibold text-primary">{formatPrice(getLicensePrice("basic"))}</p>
                </div>
                <ul className="text-sm space-y-1">
                  {getLicenseFeatures("basic").map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </TabsContent>
              
              <TabsContent value="premium" className="mt-2 space-y-2 text-sm text-[#d9cdbd]">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Premium License</h4>
                  <p className="font-semibold text-primary">{formatPrice(getLicensePrice("premium"))}</p>
                </div>
                <ul className="text-sm space-y-1">
                  {getLicenseFeatures("premium").map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </TabsContent>
              
              <TabsContent value="exclusive" className="mt-2 space-y-2 text-sm text-[#d9cdbd]">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Exclusive License</h4>
                  <p className="font-semibold text-primary">{formatPrice(getLicensePrice("exclusive"))}</p>
                </div>
                <ul className="text-sm space-y-1">
                  {getLicenseFeatures("exclusive").map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
        
        <CardFooter className="mt-auto p-4 pt-0">
          <Button className="w-full rounded-none border border-primary bg-primary px-5 text-primary-foreground shadow-[4px_4px_0_#6d4918] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-primary/90 hover:shadow-[2px_2px_0_#6d4918]" onClick={handlePurchaseClick} disabled={!beatCheckoutEnabled || beat.availabilityStatus !== "available_nonexclusive" || !selectedTierAvailable}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            {beatCheckoutEnabled
              ? selectedTierAvailable
                ? `Purchase ${selectedLicense.charAt(0).toUpperCase() + selectedLicense.slice(1)} License`
                : "Delivery Package Not Available"
              : "Licensing Checkout Coming Soon"}
          </Button>
        </CardFooter>
        </div>
      </article>

      {/* Purchase Dialog */}
      <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
        <DialogContent
          ref={purchaseDialogRef}
          className="top-[50dvh] max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] overflow-y-auto overscroll-contain sm:top-1/2 sm:max-h-[calc(100dvh-2rem)] sm:max-w-[640px]"
          onOpenAutoFocus={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              Purchase {selectedLicense.charAt(0).toUpperCase() + selectedLicense.slice(1)} License
            </DialogTitle>
            <DialogDescription>
              {contractStep ? 
                "Please review and agree to the licensing terms." :
                "Fill in your details to purchase this beat license."
              }
            </DialogDescription>
          </DialogHeader>

          {!contractStep ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input 
                  id="name" 
                  value={customerName} 
                  onChange={(e) => setCustomerName(e.target.value)} 
                  placeholder="Enter your full name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={customerEmail} 
                  onChange={(e) => setCustomerEmail(e.target.value)} 
                  placeholder="Enter your email address"
                />
                <p className="text-xs text-muted-foreground">
                  License updates and fulfillment instructions will be sent to this email after payment is verified.
                </p>
              </div>
              
              <div className="bg-muted/30 p-4 rounded-md border space-y-2">
                <div className="flex justify-between">
                  <span>Beat:</span>
                  <span className="font-medium">{beat.title}</span>
                </div>
                <div className="flex justify-between">
                  <span>License Type:</span>
                  <span className="font-medium">{selectedLicense.charAt(0).toUpperCase() + selectedLicense.slice(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Price:</span>
                  <span className="font-medium">{formatPrice(getPrice())}</span>
                </div>
              </div>
              {selectedLicense !== "exclusive" && (
                <label className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs">
                  <input type="checkbox" checked={contentIdAcknowledged} onChange={(event) => setContentIdAcknowledged(event.target.checked)} className="mt-0.5" />
                  <span>This is nonexclusive. Other artists may license the same beat, and I understand the Content ID restriction.</span>
                </label>
              )}
              
              <DialogFooter className="pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setPurchaseDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleContinueToContract}
                  disabled={selectedLicense !== "exclusive" && !contentIdAcknowledged}
                >
                  Continue to License Agreement
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="py-4">
              {/* Contract requirement component */}
              {licenseContractId && contractSigningToken ? <ContractRequirement
                contractId={licenseContractId}
                entityType="beat_license"
                entityId={beat.id}
                email={customerEmail}
                name={customerName}
                signingToken={contractSigningToken || undefined}
                onContractSigned={handleContractSigned}
                onCheckExistingSignature={false}
              /> : <p className="text-sm text-destructive">The selected license agreement could not be prepared. Go back and try again.</p>}
              
              <DialogFooter className="pt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setContractStep(false)}
                >
                  Back
                </Button>
                <Button 
                  onClick={handleCompletePurchase} 
                  disabled={!contractSigned || isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></span>
                      Processing...
                    </span>
                  ) : (
                    <>Submit License Request</>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

// Filter sidebar
const FilterSidebar = ({ 
  selectedGenre, 
  onGenreChange, 
  genres 
}: { 
  selectedGenre: string | null; 
  onGenreChange: (genre: string | null) => void; 
  genres: string[] 
}) => {
  return (
    <div className="w-full lg:w-64 p-5 bg-muted/30 rounded-lg border border-muted-foreground/10 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Find Your Beat</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs"
          onClick={() => onGenreChange(null)}
        >
          Reset Filters
        </Button>
      </div>
      
      <div className="space-y-6">
        <div>
          <div className="flex items-center mb-3">
            <div className="w-1 h-4 bg-primary rounded mr-2"></div>
            <h4 className="font-medium">Genre</h4>
          </div>
          <div className="space-y-1.5 pl-3">
            <button
              className={`block w-full text-left py-1.5 px-3 rounded-md transition-colors 
                ${selectedGenre === null 
                  ? 'bg-primary text-primary-foreground font-medium' 
                  : 'hover:bg-muted text-foreground/80'}`}
              onClick={() => onGenreChange(null)}
            >
              All Genres
            </button>
            {genres.map(genre => (
              <button
                key={genre}
                className={`block w-full text-left py-1.5 px-3 rounded-md transition-colors
                  ${selectedGenre === genre 
                    ? 'bg-primary text-primary-foreground font-medium' 
                    : 'hover:bg-muted text-foreground/80'}`}
                onClick={() => onGenreChange(genre)}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <div className="flex items-center mb-3">
            <div className="w-1 h-4 bg-primary rounded mr-2"></div>
            <h4 className="font-medium">BPM Range</h4>
          </div>
          <div className="px-3 py-2">
            <Slider defaultValue={[60, 180]} min={60} max={180} step={1} className="mb-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>60</span>
              <span>180</span>
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs font-medium">Selected: 60 - 180 BPM</span>
            </div>
          </div>
        </div>
        
        <div>
          <div className="flex items-center mb-3">
            <div className="w-1 h-4 bg-primary rounded mr-2"></div>
            <h4 className="font-medium">Price Range</h4>
          </div>
          <div className="px-3 py-2">
            <Slider defaultValue={[50]} min={0} max={100} step={1} className="mb-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>$0</span>
              <span>$500+</span>
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs font-medium">Max: $250</span>
            </div>
          </div>
        </div>
        
        <div className="pt-2">
          <Button className="w-full" variant="outline">
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function Beats() {
 const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
 const [searchTerm, setSearchTerm] = useState("");
 
 // Scroll to top when page loads
  useEffect(() => {
    scrollToTop();
  }, []);
  
  // Fetch all beats
  const { data: beats = [], isLoading } = useQuery<Beat[]>({
    queryKey: ['/api/beats'],
    enabled: true,
  });
  
  // Get unique genres from beats
  const genres = Array.from(new Set(beats.map(beat => beat.genre)));
  
  // Filter beats by selected genre
  const filteredBeats = beats.filter((beat) => {
    const matchesGenre = !selectedGenre || beat.genre === selectedGenre;
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch = !query || `${beat.title} ${beat.genre} ${beat.producerName || ""} ${(beat.tags || []).join(" ")}`.toLowerCase().includes(query);
    return matchesGenre && matchesSearch;
  });
  
  return (
    <div className="beat-page min-h-screen bg-[#11100f] pb-24 pt-6 text-[#f6efe3] sm:pb-32 sm:pt-10">
      <div className="container mx-auto max-w-7xl px-3 sm:px-4">
        <header className="mb-8 border-b border-[#6b481b] pb-8 sm:mb-12 sm:pb-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="max-w-3xl">
              <div className="mb-5 flex items-center gap-3 text-xs uppercase tracking-[0.22em] text-primary">
                <span className="h-px w-10 bg-primary" />
                <span>The Music Life beat shelf</span>
              </div>
              <h1 className="max-w-2xl text-4xl font-black leading-[0.95] tracking-tight sm:text-5xl md:text-7xl">Find the pocket.</h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-[#c9bca9]">Original cuts from Wiz. Press play, catch the feeling, then choose the license that fits the record.</p>
            </div>
            <div className="flex items-end gap-4 border-l border-[#6b481b] pl-4 sm:gap-5 sm:pl-5 lg:pb-1">
              <span className="text-5xl font-black leading-none text-primary sm:text-6xl">{beats.length}</span>
              <div className="pb-1 text-xs uppercase leading-5 tracking-[0.18em] text-[#c9bca9]">sounds<br />in the catalog</div>
            </div>
          </div>
        </header>

        <div className="mb-10 grid gap-7 border-b border-[#3e3020] pb-7 lg:grid-cols-[12rem_minmax(0,1fr)]">
          <aside>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Browse by sound</p>
            <div className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1">
              <button type="button" onClick={() => setSelectedGenre(null)} className={`whitespace-nowrap border px-3 py-2 text-left text-sm transition-colors lg:block lg:w-full ${!selectedGenre ? "border-primary bg-primary text-primary-foreground" : "border-[#463019] text-[#c9bca9] hover:border-primary hover:text-primary"}`}>All sounds</button>
              {genres.map((genre) => (
                <button type="button" key={genre} onClick={() => setSelectedGenre(genre)} className={`whitespace-nowrap border px-3 py-2 text-left text-sm transition-colors lg:block lg:w-full ${selectedGenre === genre ? "border-primary bg-primary text-primary-foreground" : "border-[#463019] text-[#c9bca9] hover:border-primary hover:text-primary"}`}>{genre}</button>
              ))}
            </div>
          </aside>
          <div className="min-w-0">
            <div className="relative max-w-xl">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
              <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search beats, genres, or producers" className="h-12 rounded-none border-[#6b481b] bg-[#1a1815] pl-10 text-[#f6efe3] placeholder:text-[#8d806f]" />
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.16em] text-[#8d806f]">
              <span>{selectedGenre || "All sounds"} / {filteredBeats.length} cuts</span>
              <span>Preview up to 45 seconds / licenses available at checkout</span>
            </div>
          </div>
       </div>

        <section>
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-primary">The catalog</p>
              <h2 className="mt-1 text-2xl font-bold">Choose a cut</h2>
            </div>
            <span className="text-sm text-[#8d806f]">{filteredBeats.length} shown</span>
          </div>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse rounded-none border-[#3e3020] bg-[#1a1815]">
                  <div className="h-48 bg-[#261f17]"></div>
                  <CardContent className="p-5">
                    <div className="mb-2 h-4 w-3/4 bg-[#3e3020]"></div>
                    <div className="h-4 w-1/2 bg-[#3e3020]"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredBeats.length === 0 ? (
            <p className="border border-[#6b481b] py-16 text-center text-[#c9bca9]">
              Nothing on the shelf matches that search yet.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
             {filteredBeats.map((beat: Beat, index: number) => (
               <BeatCard key={beat.id} beat={beat} index={index} />
             ))}
           </div>
          )}
        </section>
      </div>
    </div>
  );
}
