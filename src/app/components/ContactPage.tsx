import { Mail, MessageSquare, Send } from 'lucide-react';
import { useState } from 'react';

export function ContactPage() {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    // Netlify handles the form submission automatically
    // We just show a success message
    setStatus('success');
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setStatus('idle');
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-[#F9FAF7]">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#2ECC71] to-[#1E8449] text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl mb-6" style={{ fontWeight: 700 }}>
            Get in Touch
          </h1>
          <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto">
            Have questions, feedback, or want to collaborate? We'd love to hear from you!
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl mb-4" style={{ fontWeight: 700, color: '#2C2C2C' }}>
                Contact Information
              </h2>
              <p className="text-gray-600 text-lg mb-8">
                Feel free to reach out directly or use the contact form. We typically respond within 24-48 hours.
              </p>
            </div>

            {/* Email Card */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#2ECC71] bg-opacity-10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail className="text-[#2ECC71]" size={24} />
                </div>
                <div>
                  <h3 className="text-lg mb-2" style={{ fontWeight: 600, color: '#2C2C2C' }}>
                    Email
                  </h3>
                  <a
                    href="mailto:timmyl2410@gmail.com"
                    className="text-[#2ECC71] hover:underline text-lg"
                    style={{ fontWeight: 500 }}
                  >
                    timmyl2410@gmail.com
                  </a>
                  <p className="text-gray-500 text-sm mt-1">We'll respond within 24-48 hours</p>
                </div>
              </div>
            </div>

            {/* Support Card */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#F4D03F] bg-opacity-20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="text-[#F4D03F]" size={24} />
                </div>
                <div>
                  <h3 className="text-lg mb-2" style={{ fontWeight: 600, color: '#2C2C2C' }}>
                    Support
                  </h3>
                  <p className="text-gray-600">
                    For technical issues, account questions, or billing inquiries, email us with your account details.
                  </p>
                </div>
              </div>
            </div>

            {/* FAQ Card */}
            <div className="bg-gradient-to-br from-[#2ECC71] to-[#1E8449] rounded-2xl p-6 text-white">
              <h3 className="text-xl mb-3" style={{ fontWeight: 600 }}>
                Quick Questions?
              </h3>
              <p className="mb-4 opacity-90">
                Check out our About page for common questions about how PlatelyAI works, pricing, and features.
              </p>
              <a
                href="/about"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#2ECC71] rounded-lg hover:shadow-lg transition-all"
                style={{ fontWeight: 600 }}
              >
                Visit About Page
              </a>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
            <h2 className="text-2xl mb-6" style={{ fontWeight: 700, color: '#2C2C2C' }}>
              Send us a Message
            </h2>

            <form 
              name="contact" 
              method="POST" 
              data-netlify="true"
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              {/* Hidden field for Netlify */}
              <input type="hidden" name="form-name" value="contact" />
              
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm mb-2" style={{ fontWeight: 600, color: '#2C2C2C' }}>
                  Your Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2ECC71] focus:border-transparent transition-all"
                  placeholder="John Doe"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm mb-2" style={{ fontWeight: 600, color: '#2C2C2C' }}>
                  Your Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2ECC71] focus:border-transparent transition-all"
                  placeholder="john@example.com"
                />
              </div>

              {/* Subject */}
              <div>
                <label htmlFor="subject" className="block text-sm mb-2" style={{ fontWeight: 600, color: '#2C2C2C' }}>
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2ECC71] focus:border-transparent transition-all"
                  placeholder="How can we help?"
                />
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm mb-2" style={{ fontWeight: 600, color: '#2C2C2C' }}>
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2ECC71] focus:border-transparent transition-all resize-none"
                  placeholder="Tell us more about your inquiry..."
                />
              </div>

              {/* Success Message */}
              {status === 'success' && (
                <div className="bg-[#2ECC71] bg-opacity-10 border border-[#2ECC71] text-[#1E8449] px-4 py-3 rounded-lg">
                  ✓ Message sent successfully! We will respond within 24-48 hours.
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-[#2ECC71] text-white rounded-xl hover:bg-[#1E8449] transition-all shadow-lg hover:shadow-xl"
                style={{ fontWeight: 600 }}
              >
                <Send size={20} />
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
