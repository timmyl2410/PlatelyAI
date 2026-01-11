import { Link } from 'react-router-dom';
import { Camera, Upload, Star, Sparkles, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';

export function HomePage() {
  const [hasSavedMeals, setHasSavedMeals] = useState(false);

  // Check if there are saved meals in sessionStorage
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('plately:lastMeals');
      const parsed = raw ? JSON.parse(raw) : null;
      setHasSavedMeals(Array.isArray(parsed) && parsed.length > 0);
    } catch {
      setHasSavedMeals(false);
    }
  }, []);
  // TODO: Re-enable post-launch when we have real testimonials
  /* const testimonials = [
    {
      name: 'Sarah M.',
      text: 'PlatelyAI helped me reduce food waste by 60%! I love how it turns random ingredients into delicious meals.',
      rating: 5,
    },
    {
      name: 'Mike T.',
      text: 'As someone trying to bulk up, the health metadata is a game changer. Perfect macros every time!',
      rating: 5,
    },
    {
      name: 'Emily R.',
      text: 'Super easy to use. Just snap a photo and get instant meal ideas. Saves me so much time meal planning.',
      rating: 5,
    },
  ]; */

  return (
    <div className="min-h-screen bg-[#F9FAF7]">
      {/* Saved Meals Banner */}
      {hasSavedMeals && (
        <div className="bg-gradient-to-r from-[#2ECC71] to-[#1E8449] py-3">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <FileText size={20} />
                <span style={{ fontWeight: 600 }}>You have saved meal results</span>
              </div>
              <Link
                to="/results"
                className="px-4 py-2 bg-white text-[#2ECC71] rounded-lg hover:shadow-lg transition-all"
                style={{ fontWeight: 600, fontSize: '0.875rem' }}
              >
                View Results
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 md:space-y-8">
            <h1
              className="text-4xl md:text-5xl lg:text-6xl leading-tight"
              style={{ fontWeight: 700, color: '#2C2C2C' }}
            >
              Turn what you have into{' '}
              <span style={{ color: '#2ECC71' }}>high-protein meals.</span>
            </h1>
            <p className="text-lg md:text-xl text-[#6b6b6b] leading-relaxed">
              Scan your fridge and get AI-powered meal ideas built for athletes and fitness-focused people. Complete nutrition info included—no guesswork, no wasted food.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/upload"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#2ECC71] text-white rounded-xl hover:bg-[#1E8449] transition-all shadow-lg hover:shadow-xl"
                style={{ fontWeight: 600 }}
              >
                <Camera size={20} />
                Scan Your Fridge
              </Link>
              <Link
                to="/upload"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-[#2C2C2C] rounded-xl hover:bg-gray-50 transition-all shadow-md hover:shadow-lg border border-border"
                style={{ fontWeight: 500 }}
              >
                <Upload size={20} />
                Upload Photos
              </Link>
            </div>
          </div>

          {/* Illustration Placeholder */}
          <div className="relative">
            <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl">
              <div className="space-y-6">
                {/* Fridge Icon */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-[#2ECC71] bg-opacity-10 rounded-2xl flex items-center justify-center">
                    <div className="w-10 h-12 bg-[#2ECC71] rounded-lg"></div>
                  </div>
                  <div className="flex-1 h-3 bg-gray-200 rounded-full"></div>
                </div>

                {/* Plus */}
                <div className="text-center text-2xl text-[#2ECC71]" style={{ fontWeight: 700 }}>
                  +
                </div>

                {/* Pantry Icon */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-[#F4D03F] bg-opacity-20 rounded-2xl flex items-center justify-center">
                    <div className="w-10 h-12 bg-[#F4D03F] rounded-lg"></div>
                  </div>
                  <div className="flex-1 h-3 bg-gray-200 rounded-full"></div>
                </div>

                {/* Arrow */}
                <div className="text-center text-3xl text-[#2C2C2C]">↓</div>

                {/* Meal Cards */}
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-gradient-to-br from-[#2ECC71] to-[#1E8449] rounded-xl p-4 aspect-square flex items-center justify-center">
                      <Sparkles className="text-white" size={24} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TODO: Re-enable post-launch when we have real testimonials from actual users */}
      {/* Testimonials Section */}
      {/* <section className="bg-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            className="text-3xl md:text-4xl text-center mb-12"
            style={{ fontWeight: 700, color: '#2C2C2C' }}
          >
            Loved by home cooks everywhere
          </h2>
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-[#F9FAF7] rounded-2xl p-6 md:p-8 space-y-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex gap-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={20} fill="#F4D03F" stroke="#F4D03F" />
                  ))}
                </div>
                <p className="text-[#2C2C2C] leading-relaxed">{testimonial.text}</p>
                <p className="text-[#2ECC71]" style={{ fontWeight: 600 }}>
                  — {testimonial.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Footer */}
      <footer className="bg-[#2C2C2C] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/PlatelyAI Logo.png" alt="PlatelyAI" className="h-8" />
                <span className="text-xl" style={{ fontWeight: 600 }}>
                  PlatelyAI
                </span>
              </div>
              <p className="text-gray-400 text-sm">
                Smart meal planning from your existing ingredients.
              </p>
            </div>
            <div>
              <h3 className="mb-4" style={{ fontWeight: 600 }}>
                Product
              </h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link to="/how-it-works" className="hover:text-[#2ECC71] transition-colors">
                    How it Works
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="hover:text-[#2ECC71] transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link to="/upload" className="hover:text-[#2ECC71] transition-colors">
                    Features
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4" style={{ fontWeight: 600 }}>
                Company
              </h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link to="/about" className="hover:text-[#2ECC71] transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-[#2ECC71] transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#2ECC71] transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4" style={{ fontWeight: 600 }}>
                Legal
              </h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link to="/privacy" className="hover:text-[#2ECC71] transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-[#2ECC71] transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 text-center text-sm text-gray-400">
            © 2026 PlatelyAI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
