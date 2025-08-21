import { Upload, Edit3, Star, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const HowItWorksSection = () => {
  const { user, openAuthModal, openAddProjectModal } = useAuth();
  
  const handleAuthAction = () => {
    if (user) {
      openAddProjectModal();
    } else {
      openAuthModal('signup');
    }
  };

  const steps = [
    {
      icon: Upload,
      title: "Upload Your Product",
      description: "Share your product with images, description, and relevant tags",
      step: 1,
    },
    {
      icon: Edit3,
      title: "Add Details",
      description: "Provide compelling information about features and benefits",
      step: 2,
    },
    {
      icon: Star,
      title: "Get Featured",
      description: "Let the community discover and upvote your creation",
      step: 3,
    },
  ];

  return (
    <section className="py-20 bg-black relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 max-w-4xl mx-auto leading-tight">
            Join thousands of creators who have showcased their products to our community
          </h2>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <div
              key={step.step}
              className="group relative bg-brand-gray-darker/50 border border-brand-gray-dark rounded-2xl p-8 text-center hover:border-brand-green/30 hover:bg-brand-gray-darker/80 transition-all duration-300 hover:-translate-y-2"
            >
              {/* Background gradient effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-brand-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Content */}
              <div className="relative z-10 flex flex-col h-full">
                {/* Icon */}
                <div className="w-16 h-16 mx-auto mb-6 bg-brand-gray-dark rounded-xl flex items-center justify-center group-hover:bg-brand-green/20 transition-colors duration-300">
                  <step.icon className="w-8 h-8 text-white group-hover:text-brand-green transition-colors duration-300" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold mb-4 text-white">{step.title}</h3>

                {/* Description */}
                <p className="text-brand-gray-light text-sm leading-relaxed mb-8 flex-grow">
                  {step.description}
                </p>

                {/* Step Number */}
                <div className="flex justify-center">
                  <div className="w-8 h-8 bg-brand-green rounded-full flex items-center justify-center text-black font-bold text-sm">
                    {step.step}
                  </div>
                </div>
              </div>

              {/* Connecting Line (hidden on mobile) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-px bg-gradient-to-r from-brand-gray-dark to-transparent"></div>
              )}
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="text-center mb-8">
          <button onClick={handleAuthAction} className="inline-flex items-center gap-3 bg-gradient-to-r from-brand-green to-brand-green/90 text-black px-8 py-4 rounded-full font-bold text-lg hover:from-brand-green/90 hover:to-brand-green hover:shadow-green-glow transition-all duration-300 group">
            List My Product
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
          </button>
        </div>

        {/* Features */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-brand-gray-light text-sm">
            <span className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-brand-green rounded-full"></div>
              Free to list
            </span>
            <span className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-brand-green rounded-full"></div>
              No hidden fees
            </span>
            <span className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-brand-green rounded-full"></div>
              Community-driven
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
