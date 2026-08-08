import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STUDIO_INFO } from "@/lib/constants";
import { useAuth } from "@/hooks/use-auth";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth();
  
  // Handle scroll event to add shadow to navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  // Close mobile menu when location changes or when any navigation link is clicked
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);
  
  // Function to close mobile menu when any link is clicked
  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };
  
  const isHomePage = location === "/";
  
  return (
    <header className={`sticky top-0 z-50 bg-white ${scrolled ? 'shadow-md' : ''} transition-shadow duration-300`}>
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <span className="text-[#ff8a00] font-bold text-2xl">Music Life</span>
            <span className="text-foreground font-medium ml-1 text-lg">Studios</span>
            <span className="hidden lg:inline text-muted-foreground text-xs font-medium ml-3">by Wiz</span>
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          {isHomePage ? (
            <>
              <a href="#services" className="font-medium hover:text-primary transition-colors">Services</a>
              <a href="#portfolio" className="font-medium hover:text-primary transition-colors">Portfolio</a>
              <a href="#pricing" className="font-medium hover:text-primary transition-colors">Pricing</a>
              <Link href="/deals" className="font-medium hover:text-primary transition-colors">Memberships</Link>
              <a href="#about" className="font-medium hover:text-primary transition-colors">About</a>
              <a href="#contact" className="font-medium hover:text-primary transition-colors">Contact</a>
              <Link href="/beats" className="font-medium hover:text-primary transition-colors">Beats & Licensing</Link>
            </>
          ) : (
            <>
              <Link href="/#services" className="font-medium hover:text-primary transition-colors">Services</Link>
              <Link href="/#portfolio" className="font-medium hover:text-primary transition-colors">Portfolio</Link>
              <Link href="/#pricing" className="font-medium hover:text-primary transition-colors">Pricing</Link>
              <Link href="/deals" className="font-medium hover:text-primary transition-colors">Memberships</Link>
              <Link href="/#about" className="font-medium hover:text-primary transition-colors">About</Link>
              <Link href="/#contact" className="font-medium hover:text-primary transition-colors">Contact</Link>
              <Link href="/beats" className="font-medium hover:text-primary transition-colors">Beats & Licensing</Link>
            </>
          )}
          
          <div className="flex items-center space-x-2">
            {user ? (
              <Button variant="outline" size="sm" asChild className="flex items-center">
                <Link href={user.role === "admin" ? "/admin" : "/account"}>
                  <User className="h-4 w-4 mr-2" />
                  {user.role === "admin" ? "Admin Dashboard" : "My Account"}
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" asChild>
                <Link href="/account/login">Member Login</Link>
              </Button>
            )}
            
            <Button asChild className="bg-[#ff8a00] text-black hover:bg-[#ffac3d]">
              <Link href="/booking">Book Now</Link>
            </Button>
          </div>
        </div>
        
        {/* Mobile menu button */}
        <button 
          className="md:hidden text-foreground focus:outline-none"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </nav>
      
      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-muted">
          <div className="container mx-auto px-4 py-3 flex flex-col space-y-3">
            {isHomePage ? (
              <>
                <a href="#services" className="font-medium py-2 hover:text-primary transition-colors" onClick={handleLinkClick}>Services</a>
                <a href="#portfolio" className="font-medium py-2 hover:text-primary transition-colors" onClick={handleLinkClick}>Portfolio</a>
                <a href="#pricing" className="font-medium py-2 hover:text-primary transition-colors" onClick={handleLinkClick}>Pricing</a>
                <Link href="/deals" className="font-medium py-2 hover:text-primary transition-colors" onClick={handleLinkClick}>Memberships</Link>
                <a href="#about" className="font-medium py-2 hover:text-primary transition-colors" onClick={handleLinkClick}>About</a>
                <a href="#contact" className="font-medium py-2 hover:text-primary transition-colors" onClick={handleLinkClick}>Contact</a>
                <Link href="/beats" className="font-medium py-2 hover:text-primary transition-colors" onClick={handleLinkClick}>Beats & Licensing</Link>
              </>
            ) : (
              <>
                <Link href="/#services" className="font-medium py-2 hover:text-primary transition-colors" onClick={handleLinkClick}>Services</Link>
                <Link href="/#portfolio" className="font-medium py-2 hover:text-primary transition-colors" onClick={handleLinkClick}>Portfolio</Link>
                <Link href="/#pricing" className="font-medium py-2 hover:text-primary transition-colors" onClick={handleLinkClick}>Pricing</Link>
                <Link href="/deals" className="font-medium py-2 hover:text-primary transition-colors" onClick={handleLinkClick}>Memberships</Link>
                <Link href="/#about" className="font-medium py-2 hover:text-primary transition-colors" onClick={handleLinkClick}>About</Link>
                <Link href="/#contact" className="font-medium py-2 hover:text-primary transition-colors" onClick={handleLinkClick}>Contact</Link>
                <Link href="/beats" className="font-medium py-2 hover:text-primary transition-colors" onClick={handleLinkClick}>Beats & Licensing</Link>
              </>
            )}
            {user ? (
              <Link 
                href={user.role === "admin" ? "/admin" : "/account"}
                className="flex items-center font-medium py-2 hover:text-primary transition-colors" 
                onClick={handleLinkClick}
              >
                <User className="h-4 w-4 mr-2" />
                {user.role === "admin" ? "Admin Dashboard" : "My Account"}
              </Link>
            ) : (
              <Link 
                href="/account/login" 
                className="font-medium py-2 hover:text-primary transition-colors" 
                onClick={handleLinkClick}
              >
                Member Login
              </Link>
            )}
            <div className="pt-2">
              <Button asChild className="w-full justify-center bg-[#ff8a00] text-black hover:bg-[#ffac3d]">
                <Link href="/booking">Book Now</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
