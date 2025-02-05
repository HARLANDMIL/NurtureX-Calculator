import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  BarChart3, 
  Target,
  Heart,
  Construction,
  Sun,
  Building2,
  Mail,
  Calendar,
  HelpCircle,
  Info,
  ChevronRight
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { supabase } from './lib/supabase';

interface BusinessData {
  industry: string;
  saleValue: number;
  currentLeads: number;
  closeRate: number;
  marketingBudget: number;
}

const INDUSTRY_AI_LIFT = {
  'Health & Wellness': 1.8, // 80% increase - high engagement industry
  'Construction': 1.65, // 65% increase - project-based sales
  'Renewable Energy': 1.75, // 75% increase - growing sector
  'Other': 1.6 // 60% increase - baseline improvement
};

const INDUSTRY_CLOSE_RATE_BOOST = {
  'Health & Wellness': 1.4, // 40% improvement
  'Construction': 1.35, // 35% improvement
  'Renewable Energy': 1.45, // 45% improvement
  'Other': 1.3 // 30% improvement
};

const INDUSTRY_ICONS = {
  'Health & Wellness': Heart,
  'Construction': Construction,
  'Renewable Energy': Sun,
  'Other': Building2
};

const PACKAGE_COSTS = {
  standard: 19000,
  premium: 35000
};

const PREMIUM_BENEFITS = {
  leadMultiplier: 1.3, // 30% more leads than standard
  closeRateBoost: 1.15 // 15% better close rate than standard
};

function App() {
  const [businessData, setBusinessData] = useState<BusinessData>({
    industry: '',
    saleValue: 0,
    currentLeads: 0,
    closeRate: 0,
    marketingBudget: 0
  });

  const [calculations, setCalculations] = useState({
    newLeads: 0,
    newCloseRate: 0,
    currentRevenue: 0,
    projectedRevenue: 0,
    roi: 0,
    extraRevenue: 0,
    recommendedPackage: '',
    standardLeadCost: 0,
    premiumLeadCost: 0,
    standardProjection: {
      leads: 0,
      revenue: 0,
      closeRate: 0
    },
    premiumProjection: {
      leads: 0,
      revenue: 0,
      closeRate: 0
    },
    yearlyExtraRevenue: 0,
    yearlyROI: 0
  });

  const [isCalculated, setIsCalculated] = useState(false);
  const [email, setEmail] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);

  const getPackageRecommendation = (monthlyRevenue: number, leads: number) => {
    if (monthlyRevenue > PACKAGE_COSTS.premium * 10 || leads > 40) {
      return 'premium';
    }
    return 'standard';
  };

  useEffect(() => {
    if (businessData.industry && businessData.saleValue && businessData.currentLeads && businessData.closeRate) {
      const industry = businessData.industry as keyof typeof INDUSTRY_AI_LIFT;
      const aiLift = INDUSTRY_AI_LIFT[industry] || 1.6;
      const closeRateBoost = INDUSTRY_CLOSE_RATE_BOOST[industry] || 1.3;

      const standardLeads = Math.floor(businessData.currentLeads * aiLift);
      const standardCloseRate = Math.min(businessData.closeRate * closeRateBoost, 100);
      const standardRevenue = standardLeads * (standardCloseRate / 100) * businessData.saleValue;

      const premiumLeads = Math.floor(standardLeads * PREMIUM_BENEFITS.leadMultiplier);
      const premiumCloseRate = Math.min(standardCloseRate * PREMIUM_BENEFITS.closeRateBoost, 100);
      const premiumRevenue = premiumLeads * (premiumCloseRate / 100) * businessData.saleValue;

      const currentRevenue = businessData.currentLeads * (businessData.closeRate / 100) * businessData.saleValue;

      const recommendedPackage = getPackageRecommendation(premiumRevenue, premiumLeads);
      const projectedRevenue = recommendedPackage === 'premium' ? premiumRevenue : standardRevenue;
      const extraRevenue = projectedRevenue - currentRevenue;
      const yearlyExtraRevenue = extraRevenue * 12;
      
      const packageCost = recommendedPackage === 'premium' ? PACKAGE_COSTS.premium : PACKAGE_COSTS.standard;
      const yearlyROI = ((yearlyExtraRevenue - (packageCost * 12)) / (packageCost * 12)) * 100;

      const standardLeadCost = PACKAGE_COSTS.standard / standardLeads;
      const premiumLeadCost = PACKAGE_COSTS.premium / premiumLeads;

      setCalculations({
        newLeads: recommendedPackage === 'premium' ? premiumLeads : standardLeads,
        newCloseRate: recommendedPackage === 'premium' ? premiumCloseRate : standardCloseRate,
        currentRevenue,
        projectedRevenue,
        roi: yearlyROI,
        extraRevenue,
        recommendedPackage,
        standardLeadCost,
        premiumLeadCost,
        standardProjection: {
          leads: standardLeads,
          revenue: standardRevenue,
          closeRate: standardCloseRate
        },
        premiumProjection: {
          leads: premiumLeads,
          revenue: premiumRevenue,
          closeRate: premiumCloseRate
        },
        yearlyExtraRevenue,
        yearlyROI
      });
    }
  }, [businessData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBusinessData(prev => ({
      ...prev,
      [name]: name === 'industry' ? value : Number(value)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCalculated(true);
  };

  const handleSaveResults = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase.from('calculator_results').insert({
        email,
        industry: businessData.industry,
        sale_value: businessData.saleValue,
        current_leads: businessData.currentLeads,
        close_rate: businessData.closeRate,
        marketing_budget: businessData.marketingBudget,
        projected_revenue: calculations.projectedRevenue,
        extra_revenue: calculations.extraRevenue,
        roi: calculations.yearlyROI,
        recommended_package: calculations.recommendedPackage
      });

      if (error) throw error;

      // Send email
      const mailtoLink = `mailto:${email}?subject=AI ROI Calculator Results&body=Here are your AI ROI calculator results:%0D%0A%0D%0AProjected Monthly Revenue: R${calculations.projectedRevenue.toLocaleString()}%0D%0AExtra Monthly Revenue: R${calculations.extraRevenue.toLocaleString()}%0D%0AAnnual ROI: ${calculations.yearlyROI.toFixed(0)}%25%0D%0ARecommended Package: ${calculations.recommendedPackage === 'premium' ? 'Premium' : 'Standard'} Campaign`;
      window.location.href = mailtoLink;

      toast.success('Results saved and email sent!');
      setShowEmailModal(false);
    } catch (error) {
      console.error('Error saving results:', error);
      toast.error('Failed to save results. Please try again.');
    }
  };

  const IndustryIcon = businessData.industry 
    ? INDUSTRY_ICONS[businessData.industry as keyof typeof INDUSTRY_ICONS] 
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-600">
            AI ROI Calculator
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover how AI can transform your business metrics and accelerate growth
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Input Section */}
            <div className="p-8 lg:p-12 bg-white">
              <h2 className="text-2xl font-semibold text-gray-900 mb-8 flex items-center">
                <Calculator className="mr-3 text-indigo-600" />
                Business Details
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    Industry
                    <div className="group relative ml-2">
                      <HelpCircle className="w-4 h-4 text-gray-400 hover:text-indigo-500 transition-colors" />
                      <div className="hidden group-hover:block absolute z-10 w-64 p-3 bg-gray-900 text-white text-sm rounded-xl -right-2 top-6 shadow-xl">
                        Different industries see varying levels of AI impact based on market dynamics
                      </div>
                    </div>
                  </label>
                  <div className="relative">
                    {IndustryIcon && (
                      <IndustryIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-500" />
                    )}
                    <select
                      name="industry"
                      value={businessData.industry}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                        IndustryIcon ? 'pl-10' : ''
                      }`}
                      required
                    >
                      <option value="">Select Industry</option>
                      <option value="Health & Wellness">Health & Wellness</option>
                      <option value="Construction">Construction</option>
                      <option value="Renewable Energy">Renewable Energy</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Input Fields with Modern Styling */}
                {[
                  {
                    label: 'Average Sale Value (ZAR)',
                    name: 'saleValue',
                    tooltip: 'The average amount a customer spends with you'
                  },
                  {
                    label: 'Current Monthly Leads',
                    name: 'currentLeads',
                    tooltip: 'Number of potential customers you interact with monthly'
                  },
                  {
                    label: 'Current Close Rate (%)',
                    name: 'closeRate',
                    tooltip: 'Percentage of leads that become paying customers'
                  },
                  {
                    label: 'Monthly Marketing Budget (ZAR)',
                    name: 'marketingBudget',
                    tooltip: 'Your current monthly marketing spend'
                  }
                ].map((field) => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      {field.label}
                      <div className="group relative ml-2">
                        <Info className="w-4 h-4 text-gray-400 hover:text-indigo-500 transition-colors" />
                        <div className="hidden group-hover:block absolute z-10 w-64 p-3 bg-gray-900 text-white text-sm rounded-xl -right-2 top-6 shadow-xl">
                          {field.tooltip}
                        </div>
                      </div>
                    </label>
                    <input
                      type="number"
                      name={field.name}
                      value={businessData[field.name as keyof BusinessData]}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      required
                      min="0"
                      max={field.name === 'closeRate' ? 100 : undefined}
                    />
                  </div>
                ))}

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-4 px-6 rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center group"
                >
                  <span>Calculate AI Impact</span>
                  <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
            </div>

            {/* Results Section */}
            <div className="p-8 lg:p-12 bg-gradient-to-br from-indigo-50/50 to-blue-50/50">
              <h2 className="text-2xl font-semibold text-gray-900 mb-8 flex items-center">
                <TrendingUp className="mr-3 text-indigo-600" />
                Your AI Growth Potential
              </h2>

              {isCalculated && (
                <div className="space-y-8">
                  {/* Metrics Cards */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                      <div className="text-sm text-gray-600 mb-2">Monthly Leads</div>
                      <div className="text-3xl font-bold text-green-600">
                        {calculations.newLeads}
                      </div>
                      <div className="text-sm text-green-600 flex items-center mt-1">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        +{((calculations.newLeads / businessData.currentLeads - 1) * 100).toFixed(0)}% increase
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                      <div className="text-sm text-gray-600 mb-2">Close Rate</div>
                      <div className="text-3xl font-bold text-blue-600">
                        {calculations.newCloseRate.toFixed(1)}%
                      </div>
                      <div className="text-sm text-blue-600 flex items-center mt-1">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        +{((calculations.newCloseRate / businessData.closeRate - 1) * 100).toFixed(0)}% improvement
                      </div>
                    </div>
                  </div>

                  {/* Revenue Impact Card */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                      <DollarSign className="mr-2 text-green-600" />
                      Revenue Impact
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50">
                        <span className="text-gray-600">Current Monthly Revenue</span>
                        <span className="text-lg font-semibold">
                          R{calculations.currentRevenue.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 rounded-xl bg-green-50">
                        <span className="text-gray-600">Projected Monthly Revenue</span>
                        <span className="text-lg font-semibold text-green-600">
                          R{calculations.projectedRevenue.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 rounded-xl bg-green-50">
                        <span className="text-gray-600">Extra Monthly Revenue</span>
                        <span className="text-lg font-semibold text-green-600">
                          +R{calculations.extraRevenue.toLocaleString()}
                        </span>
                      </div>
                      <div className="pt-4 border-t border-gray-100">
                        <div className="flex justify-between items-center p-3 rounded-xl bg-green-100">
                          <span className="text-gray-700">Extra Yearly Revenue</span>
                          <span className="text-xl font-bold text-green-600">
                            +R{calculations.yearlyExtraRevenue.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ROI Card */}
                  <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-8 rounded-2xl shadow-lg text-white">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Target className="mr-2" />
                      Return on Investment
                    </h3>
                    <div className="text-4xl font-bold mb-3">
                      {calculations.yearlyROI.toFixed(0)}% Annual ROI
                    </div>
                    <p className="text-indigo-100 text-lg">
                      For every R1 invested annually, you get R{(calculations.yearlyROI / 100 + 1).toFixed(2)} back
                    </p>
                  </div>

                  {/* Package Comparison */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">
                      Package Comparison
                    </h3>
                    <div className="space-y-6">
                      {/* Premium Package */}
                      <div className={`p-6 rounded-2xl transition-all duration-200 ${
                        calculations.recommendedPackage === 'premium' 
                          ? 'bg-indigo-50 border-2 border-indigo-500 shadow-lg' 
                          : 'bg-gray-50 border border-gray-200'
                      }`}>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-semibold text-lg mb-1">Premium Campaign</h4>
                            <p className="text-gray-600">R35,000 per month</p>
                          </div>
                          {calculations.recommendedPackage === 'premium' && (
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                              Recommended
                            </span>
                          )}
                        </div>
                        <div className="space-y-3">
                          <p className="text-sm text-gray-600 flex items-center">
                            <ChevronRight className="w-4 h-4 mr-2 text-indigo-500" />
                            {calculations.premiumProjection.leads} leads per month
                          </p>
                          <p className="text-sm text-gray-600 flex items-center">
                            <ChevronRight className="w-4 h-4 mr-2 text-indigo-500" />
                            {calculations.premiumProjection.closeRate.toFixed(1)}% close rate
                          </p>
                          <p className="text-sm text-gray-600 flex items-center">
                            <ChevronRight className="w-4 h-4 mr-2 text-indigo-500" />
                            R{calculations.premiumLeadCost.toFixed(0)} per lead
                          </p>
                          <p className="text-sm font-semibold text-indigo-600 mt-4">
                            Monthly Revenue: R{calculations.premiumProjection.revenue.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      {/* Standard Package */}
                      <div className={`p-6 rounded-2xl transition-all duration-200 ${
                        calculations.recommendedPackage === 'standard' 
                          ? 'bg-indigo-50 border-2 border-indigo-500 shadow-lg' 
                          : 'bg-gray-50 border border-gray-200'
                      }`}>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-semibold text-lg mb-1">Standard Campaign</h4>
                            <p className="text-gray-600">R19,000 per month</p>
                          </div>
                          {calculations.recommendedPackage === 'standard' && (
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                              Recommended
                            </span>
                          )}
                        </div>
                        <div className="space-y-3">
                          <p className="text-sm text-gray-600 flex items-center">
                            <ChevronRight className="w-4 h-4 mr-2 text-indigo-500" />
                            {calculations.standardProjection.leads} leads per month
                          </p>
                          <p className="text-sm text-gray-600 flex items-center">
                            <ChevronRight className="w-4 h-4 mr-2 text-indigo-500" />
                            {calculations.standardProjection.closeRate.toFixed(1)}% close rate
                          </p>
                          <p className="text-sm text-gray-600 flex items-center">
                            <ChevronRight className="w-4 h-4 mr-2 text-indigo-500" />
                            R{calculations.standardLeadCost.toFixed(0)} per lead
                          </p>
                          <p className="text-sm font-semibold text-indigo-600 mt-4">
                            Monthly Revenue: R{calculations.standardProjection.revenue.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-6">
                    <button
                      onClick={() => setShowEmailModal(true)}
                      className="flex items-center justify-center gap-2 bg-white border border-indigo-200 text-indigo-600 py-4 px-6 rounded-xl hover:bg-indigo-50 transition-all duration-200 group"
                    >
                      <Mail className="w-5 h-5" />
                      <span>Email Results</span>
                    </button>
                    <a
                      href="#"
                      className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-6 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 group"
                    >
                      <Calendar className="w-5 h-5" />
                      <span>Book a Call</span>
                    </a>
                  </div>
                </div>
              )}

              {!isCalculated && (
                <div className="h-full flex items-center justify-center py-20">
                  <div className="text-center text-gray-500">
                    <BarChart3 className="w-20 h-20 mx-auto mb-6 text-gray-400 animate-pulse" />
                    <p className="text-lg">Fill out the form to see your AI-powered growth projections</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Get Your Results</h3>
            <form onSubmit={handleSaveResults} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                  placeholder="Enter your email"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  Send Results
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;