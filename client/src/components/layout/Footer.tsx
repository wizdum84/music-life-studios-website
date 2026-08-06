import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Music, 
  Send
} from "lucide-react";
import { STUDIO_INFO } from "@/lib/constants";

export default function Footer() {
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // This would normally submit to a newsletter API
    alert("Thanks for subscribing! This is a demo feature.");
  };
  
  return (
    <footer className="bg-[#1A1A1A] text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center mb-4">
              <span className="text-white font-bold text-2xl">Music Life</span>
              <span className="text-white/80 font-medium ml-1 text-lg">Studios</span>
            </Link>
            <p className="text-white/70 mb-6 max-w-md">
              Presented by Wiz. Recording, mixing, mastering, custom beats, and production support from the person working directly on your record.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-white/70 hover:text-white transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-white/70 hover:text-white transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-white/70 hover:text-white transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-white/70 hover:text-white transition-colors">
                <Music size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="#services" className="text-white/70 hover:text-white transition-colors">Services</a></li>
              <li><a href="#portfolio" className="text-white/70 hover:text-white transition-colors">Portfolio</a></li>
              <li><a href="#pricing" className="text-white/70 hover:text-white transition-colors">Pricing</a></li>
              <li><Link href="/booking" className="text-white/70 hover:text-white transition-colors">Book a Session</Link></li>
              <li><a href="#about" className="text-white/70 hover:text-white transition-colors">About</a></li>
              <li><a href="#contact" className="text-white/70 hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-lg mb-4">Subscribe</h4>
            <p className="text-white/70 mb-4">
              Join our newsletter for industry tips and special offers.
            </p>
            <form onSubmit={handleSubscribe} className="flex">
              <Input 
                type="email" 
                placeholder="Your email" 
                className="rounded-r-none bg-white text-black" 
                required
              />
              <Button type="submit" className="rounded-l-none bg-primary hover:bg-primary-600">
                <Send size={16} />
              </Button>
            </form>
          </div>
        </div>
        
        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-white/70 mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} {STUDIO_INFO.NAME}. All rights reserved.
          </p>
          <div className="flex space-x-4">
            <a href="#" className="text-white/70 hover:text-white transition-colors text-sm">Privacy Policy</a>
            <a href="#" className="text-white/70 hover:text-white transition-colors text-sm">Terms of Service</a>
            <Link href="/admin/login" className="text-white/70 hover:text-white transition-colors text-sm">Admin Login</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
