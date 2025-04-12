import { MapPin, Mail, Phone, Clock } from "lucide-react";
import ContactForm from "@/components/forms/ContactForm";
import { STUDIO_INFO } from "@/lib/constants";

export default function ContactSection() {
  return (
    <section id="contact" className="py-20 bg-light">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-bold text-3xl md:text-4xl text-foreground mb-4">Get in Touch</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Have questions or want to discuss your project? Reach out and I'll get back to you promptly.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="col-span-1 md:col-span-2">
            <ContactForm />
          </div>
          
          <div>
            <div className="bg-white p-6 rounded-lg shadow-md h-full">
              <h3 className="font-semibold text-xl mb-6">Contact Info</h3>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-4 mt-1">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Studio Location</h4>
                    <p className="text-muted-foreground">{STUDIO_INFO.ADDRESS}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-4 mt-1">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Email</h4>
                    <p className="text-muted-foreground">{STUDIO_INFO.EMAIL}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-4 mt-1">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Phone</h4>
                    <p className="text-muted-foreground">{STUDIO_INFO.PHONE}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-4 mt-1">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Studio Hours</h4>
                    <p className="text-muted-foreground">
                      Monday - Friday: {STUDIO_INFO.HOURS.WEEKDAY}<br />
                      Saturday: {STUDIO_INFO.HOURS.SATURDAY}<br />
                      Sunday: {STUDIO_INFO.HOURS.SUNDAY}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
