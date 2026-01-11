import { Link } from 'react-router-dom';
import { Camera, Scan, Sparkles, ChefHat, ArrowRight } from 'lucide-react';

export function HowItWorksPage() {
  const steps = [
    {
      number: '01',
      title: 'Scan Your Fridge & Pantry',
      description:
        'Take quick photos of your fridge and pantry contents. Our AI will detect ingredients from the images.',
      icon: Camera,
      color: '#2ECC71',
      tips: [
        'Ensure good lighting for best results',
        'Open containers so labels are visible',
        'Multiple angles capture more items',
      ],
    },
    {
      number: '02',
      title: 'Review & Adjust',
      description:
        'Check the detected ingredients and add any items we might have missed. You can also remove items or adjust quantities to ensure accuracy.',
      icon: Scan,
      color: '#F4D03F',
      tips: [
        'Review detected ingredients carefully',
        'Add any missed items manually',
        'Include spices and condiments',
        // TODO: Re-enable after we have these features
        // 'Add expiration dates for freshness tracking',
      ],
    },
    {
      number: '03',
      title: 'Get AI-Powered Meal Ideas',
      description:
        'Get 5 AI-generated meal suggestions using your available ingredients, complete with nutrition info and recipes.',
      icon: ChefHat,
      color: '#2ECC71',
      tips: [
        'Filter by dietary preferences',
        'Matches your training goals',
        'Complete nutrition info included',
        // TODO: Re-enable after we have these features
        // 'Choose your cooking skill level',
        // 'Save favorites for later',
      ],
    },
    {
      number: '04',
      title: 'Cook & Enjoy',
      description:
        'Follow the recipe to create a high-protein meal that supports your training. Track your nutrition and reduce food waste.',
      icon: Sparkles,
      color: '#F4D03F',
      tips: [
        'Use high-protein ingredients first',
        'Track nutrition over time',
        'Adjust portions for your goals',
        // TODO: Re-enable after we have these features
        // 'Share meals with family',
        // 'Build your recipe collection',
      ],
    },
  ];

  const features = [
    {
      title: 'Smart Ingredient Detection',
      description: 'AI-powered fridge scanning recognizes ingredients instantly',
    },
    {
      title: 'Goal-Based Meals',
      description: 'Choose maintain, bulk, or cut—meals match your training goals',
    },
    {
      title: 'Nutritional Analysis',
      description: 'Complete macro and calorie breakdown for every recipe',
    },
    {
      title: 'High-Protein Focus',
      description: 'Meal suggestions prioritize protein to support athletic performance',
    },
    {
      title: 'Zero Food Waste',
      description: 'Use ingredients before they expire with smart suggestions',
    },
    {
      title: 'Fast & Simple',
      description: 'Scan, review, cook—no complicated meal planning tools',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F9FAF7]">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 text-center">
        <h1
          className="text-4xl md:text-5xl lg:text-6xl mb-4"
          style={{ fontWeight: 700, color: '#2C2C2C' }}
        >
          How <span style={{ color: '#2ECC71' }}>PlatelyAI</span> Works
        </h1>
        <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          Scan your fridge, get meal ideas, and start cooking it's that simple.
        </p>
        <Link
          to="/upload"
          className="inline-flex items-center gap-2 px-8 py-4 bg-[#2ECC71] text-white rounded-xl hover:bg-[#1E8449] transition-all shadow-lg hover:shadow-xl"
          style={{ fontWeight: 600 }}
        >
          Try It Now
          <ArrowRight size={20} />
        </Link>
      </section>

      {/* Steps Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 md:pb-20">
        <div className="space-y-16 md:space-y-24">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isEven = index % 2 === 0;

            return (
              <div
                key={index}
                className={`grid md:grid-cols-2 gap-8 md:gap-12 items-center ${
                  isEven ? '' : 'md:grid-flow-col-dense'
                }`}
              >
                {/* Content */}
                <div className={isEven ? '' : 'md:col-start-2'}>
                  <div
                    className="text-6xl md:text-7xl mb-4 opacity-20"
                    style={{ fontWeight: 900, color: step.color }}
                  >
                    {step.number}
                  </div>
                  <h2
                    className="text-3xl md:text-4xl mb-4"
                    style={{ fontWeight: 700, color: '#2C2C2C' }}
                  >
                    {step.title}
                  </h2>
                  <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                    {step.description}
                  </p>

                  {/* Tips */}
                  <div className="bg-white rounded-2xl p-6 shadow-md">
                    <h4
                      className="text-sm mb-3"
                      style={{ fontWeight: 700, color: step.color }}
                    >
                      PRO TIPS:
                    </h4>
                    <ul className="space-y-2">
                      {step.tips.map((tip, tipIdx) => (
                        <li key={tipIdx} className="flex items-start gap-3 text-gray-700">
                          <div
                            className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                            style={{ backgroundColor: step.color }}
                          ></div>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Visual */}
                <div className={isEven ? '' : 'md:col-start-1'}>
                  <div
                    className="bg-white rounded-3xl p-12 shadow-2xl flex items-center justify-center aspect-square"
                    style={{ backgroundColor: `${step.color}10` }}
                  >
                    <div
                      className="w-full h-full rounded-2xl flex items-center justify-center"
                      style={{ backgroundColor: step.color + '20' }}
                    >
                      <Icon style={{ color: step.color }} size={120} strokeWidth={1.5} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-white py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            className="text-3xl md:text-4xl text-center mb-4"
            style={{ fontWeight: 700, color: '#2C2C2C' }}
          >
            Everything you need for smarter meals
          </h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">
            Built for athletes and fitness-focused people who want high-protein meals without wasting food
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-[#F9FAF7] rounded-2xl p-6 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 bg-[#2ECC71] bg-opacity-10 rounded-xl flex items-center justify-center mb-4">
                  <div className="w-6 h-6 bg-[#2ECC71] rounded"></div>
                </div>
                <h3 className="text-xl mb-2" style={{ fontWeight: 700, color: '#2C2C2C' }}>
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="bg-white rounded-2xl p-8 shadow-md text-center">
            <div className="text-4xl md:text-5xl mb-3" style={{ fontWeight: 700, color: '#2ECC71' }}>
              AI
            </div>
            <div className="text-lg mb-2" style={{ fontWeight: 600, color: '#2C2C2C' }}>Fridge Scan</div>
            <div className="text-sm text-gray-600">Detect ingredients from a photo in seconds</div>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-md text-center">
            <div className="text-4xl md:text-5xl mb-3" style={{ fontWeight: 700, color: '#2ECC71' }}>
              5
            </div>
            <div className="text-lg mb-2" style={{ fontWeight: 600, color: '#2C2C2C' }}>High-Protein Ideas</div>
            <div className="text-sm text-gray-600">Meals tailored for training and performance</div>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-md text-center">
            <div className="text-4xl md:text-5xl mb-3" style={{ fontWeight: 700, color: '#2ECC71' }}>
              ∞
            </div>
            <div className="text-lg mb-2" style={{ fontWeight: 600, color: '#2C2C2C' }}>Nutrition Built-In</div>
            <div className="text-sm text-gray-600">Macros and calories included with every suggestion</div>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-md text-center">
            <div className="text-4xl md:text-5xl mb-3" style={{ fontWeight: 700, color: '#2ECC71' }}>
              0
            </div>
            <div className="text-lg mb-2" style={{ fontWeight: 600, color: '#2C2C2C' }}>Less Waste, More Value</div>
            <div className="text-sm text-gray-600">Use what you already have before it expires</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-[#2ECC71] to-[#1E8449] py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2
            className="text-3xl md:text-4xl text-white mb-4"
            style={{ fontWeight: 700 }}
          >
            Ready to eat smarter?
          </h2>
          <p className="text-white text-lg mb-8 opacity-90">
            Join early access and start turning your fridge into high-protein meals
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/upload"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-[#2ECC71] rounded-xl hover:shadow-xl transition-all"
              style={{ fontWeight: 700 }}
            >
              <Camera size={20} />
              Start Scanning
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent text-white border-2 border-white rounded-xl hover:bg-white hover:text-[#2ECC71] transition-all"
              style={{ fontWeight: 600 }}
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
