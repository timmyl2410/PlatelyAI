import { ChevronDown, HelpCircle } from 'lucide-react';
import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  icon: string;
  questions: FAQItem[];
}

export function FAQPage() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const faqCategories: FAQCategory[] = [
    {
      title: 'Getting Started',
      icon: '🚀',
      questions: [
        {
          question: 'How does PlatelyAI work?',
          answer: 'Simply snap a photo of your fridge or pantry, and our AI scans your ingredients. Within seconds, you will get personalized meal suggestions with complete nutrition info tailored to your fitness goals.',
        },
        {
          question: 'Do I need to create an account?',
          answer: 'You can try PlatelyAI without an account, but creating one unlocks saved meal history, inventory tracking, and higher generation limits. Sign up is free and takes less than a minute.',
        },
        {
          question: 'What kinds of foods can I scan?',
          answer: 'You can scan fresh produce, meats, dairy, grains, canned goods, condiments, and more. Our AI recognizes thousands of ingredients including whole foods and packaged items.',
        },
        {
          question: 'How accurate is the food recognition?',
          answer: 'Our AI achieves 95%+ accuracy on common ingredients. After scanning, you can review and edit the detected foods before generating meals, ensuring 100% accuracy.',
        },
      ],
    },
    {
      title: 'Meal Generation',
      icon: '🍽️',
      questions: [
        {
          question: 'Are the meals actually real recipes?',
          answer: 'Yes! We only suggest real, well-known recipes that exist in cookbooks and cooking sites. No made-up fusion dishes, just proven meals you can actually make.',
        },
        {
          question: 'Can I filter by dietary preferences?',
          answer: 'Absolutely. You can filter for vegetarian, vegan, gluten-free, dairy-free, low-carb, high-protein, and other dietary needs before generating meals.',
        },
        {
          question: 'What if I am missing an ingredient?',
          answer: 'Our meals primarily use your scanned ingredients, but may suggest 1-3 common pantry staples (like salt, oil, or water). Each recipe shows exactly what you need.',
        },
        {
          question: 'How many meal ideas will I get?',
          answer: 'Each generation provides 5 diverse meal options with complete nutrition data, prep times, and difficulty ratings so you can choose what fits your schedule.',
        },
      ],
    },
    {
      title: 'Nutrition & Health',
      icon: '💪',
      questions: [
        {
          question: 'Is the nutrition information accurate?',
          answer: 'Yes. We calculate calories, protein, carbs, and fat based on standard USDA nutrition data. Values are estimates but highly reliable for meal planning.',
        },
        {
          question: 'Can I use this for specific fitness goals?',
          answer: 'Definitely. Select your goal (lose weight, maintain, or bulk up) and we will prioritize meals that match your needs, whether high-protein for muscle gain or balanced macros for weight loss.',
        },
        {
          question: 'Does PlatelyAI provide medical advice?',
          answer: 'No. PlatelyAI is a meal planning tool, not medical advice. Always consult healthcare professionals for dietary restrictions or health conditions.',
        },
      ],
    },
    {
      title: 'Pricing & Plans',
      icon: '💳',
      questions: [
        {
          question: 'Is there a free plan?',
          answer: 'Yes! Free users get 25 meal generations per month. Perfect for trying out the service or occasional meal planning.',
        },
        {
          question: 'What do I get with Premium?',
          answer: 'Premium ($4.99/month) includes 150 meal generations, saved inventory, priority support, and advanced filters. Ideal for regular users and fitness enthusiasts.',
        },
        {
          question: 'Can I cancel anytime?',
          answer: 'Yes. Cancel anytime from your Account Settings. You will keep Premium access until the end of your billing period, with no hidden fees or penalties.',
        },
        {
          question: 'Do meal generations reset monthly?',
          answer: 'Yes. Your generation count resets on the 1st of each month, giving you a fresh allowance to plan your meals.',
        },
      ],
    },
    {
      title: 'Privacy & Security',
      icon: '🔒',
      questions: [
        {
          question: 'What happens to my food photos?',
          answer: 'Photos are processed by our AI and immediately deleted. We do not store your images, only the ingredient list you approve. Your privacy is our priority.',
        },
        {
          question: 'Is my payment information secure?',
          answer: 'Absolutely. All payments are processed by Stripe, a PCI-compliant payment processor trusted by millions. We never see or store your card details.',
        },
        {
          question: 'Can I delete my account?',
          answer: 'Yes. You can permanently delete your account and all associated data from Account Settings. This action is immediate and irreversible.',
        },
      ],
    },
    {
      title: 'Technical Support',
      icon: '🛠️',
      questions: [
        {
          question: 'What if the AI misidentifies a food?',
          answer: 'After scanning, you will see a review page where you can edit, remove, or add ingredients before generating meals. You have full control over the final list.',
        },
        {
          question: 'Why did my photo not scan properly?',
          answer: 'Ensure good lighting, a clear view of ingredients, and avoid extreme angles. If issues persist, try uploading individual photos of each shelf or section.',
        },
        {
          question: 'Which devices are supported?',
          answer: 'PlatelyAI works on any modern web browser, including desktop, tablet, or mobile. For best camera results, we recommend using a smartphone with a recent browser.',
        },
        {
          question: 'How do I contact support?',
          answer: 'Visit our Contact page or email timmyl2410@gmail.com. We typically respond within 24-48 hours for all inquiries.',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#F9FAF7]">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#2ECC71] to-[#1E8449] text-white py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full mb-6">
            <HelpCircle size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl mb-4" style={{ fontWeight: 700 }}>
            Frequently Asked Questions
          </h1>
          <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto">
            Everything you need to know about PlatelyAI. Cannot find what you are looking for? Contact us anytime.
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="space-y-12">
          {faqCategories.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              {/* Category Header */}
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">{category.icon}</span>
                <h2 className="text-2xl md:text-3xl" style={{ fontWeight: 700, color: '#2C2C2C' }}>
                  {category.title}
                </h2>
              </div>

              {/* Questions */}
              <div className="space-y-4">
                {category.questions.map((item, questionIndex) => {
                  const itemId = `${categoryIndex}-${questionIndex}`;
                  const isOpen = openItems[itemId];

                  return (
                    <div
                      key={itemId}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md"
                    >
                      <button
                        onClick={() => toggleItem(itemId)}
                        className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left transition-colors hover:bg-gray-50"
                      >
                        <span
                          className="text-lg"
                          style={{ fontWeight: 600, color: '#2C2C2C' }}
                        >
                          {item.question}
                        </span>
                        <ChevronDown
                          size={20}
                          className={`flex-shrink-0 text-[#2ECC71] transition-transform ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      
                      {isOpen && (
                        <div className="px-6 pb-5 pt-1">
                          <p className="text-gray-700 leading-relaxed">
                            {item.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Still Have Questions CTA */}
        <div className="mt-16 bg-gradient-to-br from-[#2ECC71] to-[#1E8449] rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-2xl md:text-3xl mb-4" style={{ fontWeight: 700 }}>
            Still have questions?
          </h2>
          <p className="text-lg mb-6 opacity-90">
            Our team is here to help. Get in touch and we will respond within 24-48 hours.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#2ECC71] rounded-xl hover:shadow-xl transition-all"
            style={{ fontWeight: 600 }}
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
