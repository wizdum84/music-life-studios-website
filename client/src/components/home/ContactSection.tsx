import { MapPin, Mail, Phone, Clock } from "lucide-react";
import ContactForm from "@/components/forms/ContactForm";
import { STUDIO_INFO } from "@/lib/constants";

export default function ContactSection() {
  return (
    <section id="contact" className="bg-[#1d1d1d] py-20 text-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="mb-4 text-3xl font-black md:text-4xl">Start with the real details.</h2>
          <p className="mx-auto max-w-2xl text-lg text-white/65">
              Have questions or want to discuss your project? Reach out to WIZ and start with the real details.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="col-span-1 md:col-span-2">
            <ContactForm />
          </div>
          
          <div>
            <div className="h-full border-2 border-black bg-white p-6 shadow-[8px_8px_0_#ff8a00]">
              <h3 className="mb-6 text-xl font-black">Contact Info</h3>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="mr-4 mt-1 flex h-10 w-10 items-center justify-center border-2 border-black bg-[#ff8a00]">
                    <MapPin className="h-5 w-5 text-black" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Session Location</h4>
                    <p className="text-black/60">{STUDIO_INFO.ADDRESS}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mr-4 mt-1 flex h-10 w-10 items-center justify-center border-2 border-black bg-[#ff8a00]">
                    <Mail className="h-5 w-5 text-black" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Email</h4>
                    <p className="text-black/60">{STUDIO_INFO.EMAIL}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mr-4 mt-1 flex h-10 w-10 items-center justify-center border-2 border-black bg-[#ff8a00]">
                    <Phone className="h-5 w-5 text-black" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Phone</h4>
                    <p className="text-black/60">{STUDIO_INFO.PHONE}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mr-4 mt-1 flex h-10 w-10 items-center justify-center border-2 border-black bg-[#ff8a00]">
                    <Clock className="h-5 w-5 text-black" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Availability</h4>
                    <p className="text-black/60">
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
