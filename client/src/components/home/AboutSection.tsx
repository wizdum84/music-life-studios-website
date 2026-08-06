import { Check, MapPin, Mail, Phone, Clock, Instagram, Music, Linkedin } from "lucide-react";

export default function AboutSection() {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div 
                className="rounded-lg shadow-lg w-full h-auto overflow-hidden"
                style={{ 
                  backgroundImage: "url('https://images.unsplash.com/photo-1589903308904-1010c2294adc?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=750&q=80')",
                  paddingBottom: "125%", // Maintain aspect ratio
                  backgroundSize: "cover",
                  backgroundPosition: "center"
                }}
              />
            </div>
            
            <div>
              <h2 className="font-bold text-3xl md:text-4xl text-foreground mb-6">About Me</h2>
              <p className="text-muted-foreground mb-4">
                Music Life Studios is the business, but Wiz is the person you are booking. I work directly with artists to set up sessions, capture clean vocals, shape ideas, produce records, and keep the project moving toward a finished release.
              </p>
              <p className="text-muted-foreground mb-6">
                I can bring recording support to your home setup, help arrange a rental location for the right session, and handle mixing or mastering remotely. As Wizdum the Lionheart, I also understand the artist side of the process, so the work stays technical without losing the feeling.
              </p>
              
              <div className="mb-8">
                <h3 className="font-semibold text-xl mb-4">What I Bring</h3>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <li className="flex items-center text-muted-foreground">
                    <Check className="h-4 w-4 text-[#FF8C00] mr-2" />
                    <span>Mobile recording setup</span>
                  </li>
                  <li className="flex items-center text-muted-foreground">
                    <Check className="h-4 w-4 text-[#FF8C00] mr-2" />
                    <span>Session prep</span>
                  </li>
                  <li className="flex items-center text-muted-foreground">
                    <Check className="h-4 w-4 text-[#FF8C00] mr-2" />
                    <span>Vocal production</span>
                  </li>
                  <li className="flex items-center text-muted-foreground">
                    <Check className="h-4 w-4 text-[#FF8C00] mr-2" />
                    <span>Mix/master delivery</span>
                  </li>
                  <li className="flex items-center text-muted-foreground">
                    <Check className="h-4 w-4 text-[#FF8C00] mr-2" />
                    <span>Custom beats</span>
                  </li>
                  <li className="flex items-center text-muted-foreground">
                    <Check className="h-4 w-4 text-[#FF8C00] mr-2" />
                    <span>Release guidance</span>
                  </li>
                </ul>
              </div>
              
              <div className="flex space-x-4">
                <a href="#" className="text-foreground hover:text-primary transition-colors">
                  <Instagram className="h-6 w-6" />
                </a>
                <a href="#" className="text-foreground hover:text-primary transition-colors">
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                    <path d="M19.098 10.638c-3.868-2.297-10.248-2.508-13.941-1.387-.593.18-1.22-.155-1.399-.748-.18-.593.154-1.22.748-1.4 4.239-1.287 11.285-1.038 15.738 1.605.533.317.708 1.005.392 1.538-.316.533-1.005.709-1.538.392zm-.126 3.403c-.272.44-.847.578-1.287.308-3.225-1.982-8.142-2.557-11.958-1.399-.494.15-1.017-.129-1.167-.623-.149-.495.13-1.016.624-1.167 4.358-1.322 9.776-.682 13.48 1.595.44.27.578.847.308 1.286zm-1.469 3.267c-.215.354-.676.465-1.028.249-2.818-1.722-6.365-2.111-10.542-1.157-.402.092-.803-.16-.895-.562-.092-.403.159-.804.562-.896 4.571-1.045 8.492-.595 11.655 1.338.353.215.464.676.248 1.028zm-5.503-17.308c-6.627 0-12 5.373-12 12 0 6.628 5.373 12 12 12 6.628 0 12-5.372 12-12 0-6.627-5.372-12-12-12z"/>
                  </svg>
                </a>
                <a href="#" className="text-foreground hover:text-primary transition-colors">
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                    <path d="M7 17.939h-1v-8.068c.308-.231.639-.429 1-.566v8.634zm3 0h1v-9.224c-.229.265-.443.548-.621.857l-.379-.184v8.551zm-2 0h1v-8.848c-.508-.079-.623-.05-1-.01v8.858zm-4 0h1v-7.02c-.312.458-.555.971-.692 1.535l-.308-.182v5.667zm-3-5.25c-.606.547-1 1.354-1 2.268 0 .914.394 1.721 1 2.268v-4.536zm18.879-.671c-.204-2.837-2.404-5.079-5.117-5.079-1.022 0-1.964.328-2.762.877v10.123h9.089c1.607 0 2.911-1.393 2.911-3.106 0-2.233-2.168-3.772-4.121-2.815zm-16.879-.027c-.302-.024-.526-.03-1 .122v5.689c.446.143.636.138 1 .138v-5.949z"/>
                  </svg>
                </a>
                <a href="#" className="text-foreground hover:text-primary transition-colors">
                  <Linkedin className="h-6 w-6" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
