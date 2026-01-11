import { Link } from 'react-router-dom';
import { Heart, Target, Users, Leaf, Mail, Linkedin, Twitter } from 'lucide-react';

export function AboutPage() {
  const values = [
    {
      icon: Target,
      title: 'Performance & Health',
      description:
        'Meals should support your training and your long-term health. We prioritize balanced options and clear nutrition breakdowns so you can make confident choices.',
    },
    {
      icon: Leaf,
      title: 'Sustainability',
      description:
        'Wasting food wastes money and energy. PlatelyAI is designed to help you use what you already have before it expires.',
    },
    {
      icon: Heart,
      title: 'Simplicity',
      description:
        'No complicated tracking. Scan your fridge, pick a goal, and get meal ideas fast.',
    },
    {
      icon: Users,
      title: 'Continuous Improvement',
      description:
        'We ship, learn, and iterate quickly. Early feedback drives what we build next.',
    },
  ];

  const milestones = [
    {
      year: '2024',
      title: 'Idea & Prototyping',
      description: 'Explored AI-powered fridge scanning and goal-based meal suggestions',
    },
    {
      year: '2025',
      title: 'MVP Launched',
      description: 'Released the first version and began testing with friends and family',
    },
    {
      year: '2026',
      title: 'Next Steps',
      description: 'Improve ingredient detection, expand recipe quality, and add goal-based features',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F9FAF7]">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1
              className="text-4xl md:text-5xl lg:text-6xl mb-6"
              style={{ fontWeight: 700, color: '#2C2C2C' }}
            >
              Helping athletes and fitness-focused people{' '}
              <span style={{ color: '#2ECC71' }}>eat smarter</span> with AI
            </h1>
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-8">
              PlatelyAI helps you turn the ingredients in your fridge into high-protein, goal-aligned meals—without wasting food or time figuring out what to cook.
            </p>
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#2ECC71] text-white rounded-xl hover:bg-[#1E8449] transition-all shadow-lg hover:shadow-xl"
              style={{ fontWeight: 600 }}
            >
              Try the MVP
            </Link>
          </div>

          {/* Stats Card */}
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl">
            <div className="grid grid-cols-2 gap-8">
              <div className="text-center">
                <div className="text-4xl md:text-5xl mb-2" style={{ fontWeight: 700, color: '#2ECC71' }}>
                  AI
                </div>
                <div className="text-gray-600 text-sm">Fridge Scan</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl mb-2" style={{ fontWeight: 700, color: '#2ECC71' }}>
                  5
                </div>
                <div className="text-gray-600 text-sm">High-Protein Ideas</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl mb-2" style={{ fontWeight: 700, color: '#2ECC71' }}>
                  ∞
                </div>
                <div className="text-gray-600 text-sm">Unlimited Recipes</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl mb-2" style={{ fontWeight: 700, color: '#2ECC71' }}>
                  100%
                </div>
                <div className="text-gray-600 text-sm">Nutrition Info</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="bg-white py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            className="text-3xl md:text-4xl text-center mb-8"
            style={{ fontWeight: 700, color: '#2C2C2C' }}
          >
            Our Story
          </h2>
          <div className="prose prose-lg max-w-none text-gray-600 space-y-6">
            <p className="text-lg leading-relaxed">
              PlatelyAI started with a simple problem: eating well is hard when you're busy training, studying, or working—and food in the fridge still ends up going bad.
            </p>
            <p className="text-lg leading-relaxed">
              I'm Timmy, the solo founder behind PlatelyAI. I built the first version to help athletes and fitness-focused people turn the ingredients they already have into high-protein meals that support their goals—without spending extra time figuring out what to cook.
            </p>
            <p className="text-lg leading-relaxed">
              Today, PlatelyAI is a newly launched MVP used by early testers (friends and family). We're improving the scan results and recipe quality every week based on real feedback.
            </p>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <h2
          className="text-3xl md:text-4xl text-center mb-12"
          style={{ fontWeight: 700, color: '#2C2C2C' }}
        >
          Our Values
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          {values.map((value, index) => {
            const Icon = value.icon;
            return (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all">
                <div className="w-16 h-16 bg-[#2ECC71] bg-opacity-10 rounded-2xl flex items-center justify-center mb-4">
                  <Icon className="text-[#2ECC71]" size={32} />
                </div>
                <h3 className="text-2xl mb-3" style={{ fontWeight: 700, color: '#2C2C2C' }}>
                  {value.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{value.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Team Section */}
      <section className="bg-white py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2
            className="text-3xl md:text-4xl mb-4"
            style={{ fontWeight: 700, color: '#2C2C2C' }}
          >
            Built by a Solo Founder
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed max-w-2xl mx-auto mb-8">
            PlatelyAI is built by Timmy, a student and athlete focused on making nutrition simpler with AI. The product is evolving quickly with feedback from early users.
          </p>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#2ECC71] text-white rounded-xl hover:bg-[#1E8449] transition-all shadow-lg hover:shadow-xl"
            style={{ fontWeight: 600 }}
          >
            <Mail size={20} />
            Have feedback? Try the MVP
          </Link>
        </div>
      </section>

      {/* Timeline */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <h2
          className="text-3xl md:text-4xl text-center mb-12"
          style={{ fontWeight: 700, color: '#2C2C2C' }}
        >
          Our Journey
        </h2>
        <div className="space-y-8">
          {milestones.map((milestone, index) => (
            <div key={index} className="flex gap-6 items-start">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 bg-[#2ECC71] rounded-full flex items-center justify-center text-white text-xl" style={{ fontWeight: 700 }}>
                  {milestone.year}
                </div>
              </div>
              <div className="flex-1 bg-white rounded-2xl p-6 shadow-md">
                <h3 className="text-xl mb-2" style={{ fontWeight: 700, color: '#2C2C2C' }}>
                  {milestone.title}
                </h3>
                <p className="text-gray-600">{milestone.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-gradient-to-br from-[#2ECC71] to-[#1E8449] py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2
            className="text-3xl md:text-4xl text-white mb-4"
            style={{ fontWeight: 700 }}
          >
            Get in Touch
          </h2>
          <p className="text-white text-lg mb-8 opacity-90">
            Have questions or want to partner with us? We'd love to hear from you!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <a
              href="mailto:hello@mealmaker.ai"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-[#2ECC71] rounded-xl hover:shadow-xl transition-all"
              style={{ fontWeight: 600 }}
            >
              <Mail size={20} />
              hello@mealmaker.ai
            </a>
          </div>

          {/* Social Links */}
          <div className="flex gap-4 justify-center">
            <a
              href="#"
              className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all"
            >
              <Twitter className="text-white" size={20} />
            </a>
            <a
              href="#"
              className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all"
            >
              <Linkedin className="text-white" size={20} />
            </a>
            <a
              href="#"
              className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all"
            >
              <Heart className="text-white" size={20} />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
