import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  FileText, 
  Map, 
  UserCheck,
  Zap,
  Lock,
  Activity,
  Search,
  Clock,
  BarChart 
} from 'lucide-react';
import { ConnectWalletCTASection } from '../LandingPage';

const FeaturePage = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  const features = [
    {
      icon: <ShieldCheck className="w-8 h-8" />,
      title: "Immutable Drug Records",
      description: "Secure, tamper-proof records of drug manufacturing and distribution history using advanced blockchain technology"
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: "Smart Contracts",
      description: "Automated compliance and verification through intelligent blockchain smart contracts"
    },
    {
      icon: <Map className="w-8 h-8" />,
      title: "Real-time Tracking",
      description: "Monitor pharmaceutical products throughout the entire supply chain with real-time updates"
    },
    {
      icon: <UserCheck className="w-8 h-8" />,
      title: "Patient Verification",
      description: "Ensure genuine medications reach verified patients safely and securely"
    }
  ];

  const additionalFeatures = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Fast Processing",
      description: "Lightning-fast transaction processing and verification"
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: "Enhanced Security",
      description: "Military-grade encryption for all transactions"
    },
    {
      icon: <Activity className="w-6 h-6" />,
      title: "Real-time Monitoring",
      description: "Live tracking and status updates"
    },
    {
      icon: <Search className="w-6 h-6" />,
      title: "Easy Verification",
      description: "Quick and simple authenticity checks"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "24/7 Availability",
      description: "Round-the-clock system operation"
    },
    {
      icon: <BarChart className="w-6 h-6" />,
      title: "Analytics",
      description: "Comprehensive supply chain analytics"
    }
  ];

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="relative py-32 overflow-hidden bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="absolute inset-0">
          <div className="absolute w-40 h-40 bg-white rounded-full -top-20 -right-20 opacity-5"></div>
          <div className="absolute w-56 h-56 bg-white rounded-full -bottom-32 -left-20 opacity-5"></div>
        </div>
        
        <motion.div 
          className="container relative px-6 mx-auto text-center text-white"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.h1 
            className="mb-6 text-4xl font-bold md:text-5xl"
            variants={itemVariants}
          >
            Powerful Features
          </motion.h1>
          <motion.p 
            className="max-w-3xl mx-auto text-xl text-blue-100"
            variants={itemVariants}
          >
            Discover the innovative features that make PharmaChain the leading solution 
            for pharmaceutical supply chain management
          </motion.p>
        </motion.div>
      </section>


<div className='mx-auto max-w-7xl '>
{/* Main Features Section */}
      <section className="py-20">
        <div className="container px-6 mx-auto">
          <motion.div 
            className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="p-6 transition-all duration-300 bg-white shadow-lg rounded-xl hover:shadow-xl"
                variants={itemVariants}
                whileHover={{ y: -5 }}
              >
                <div className="mb-4 text-blue-600">{feature.icon}</div>
                <h3 className="mb-3 text-xl font-semibold text-gray-800">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Additional Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container px-6 mx-auto">
          <motion.div
            className="mb-16 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            <motion.h2 
              className="mb-4 text-3xl font-bold text-gray-800"
              variants={itemVariants}
            >
              Additional Capabilities
            </motion.h2>
            <motion.p 
              className="max-w-2xl mx-auto text-gray-600"
              variants={itemVariants}
            >
              Explore the extended feature set that makes our platform comprehensive and powerful
            </motion.p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            {additionalFeatures.map((feature, index) => (
              <motion.div
                key={index}
                className="flex items-start p-6 transition-shadow duration-300 bg-white rounded-lg shadow-md hover:shadow-lg"
                variants={itemVariants}
              >
                <div className="flex-shrink-0 p-3 mr-4 rounded-lg bg-blue-50">
                  <div className="text-blue-600">{feature.icon}</div>
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-800">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

</div>
      

      {/* CTA Section */}
   <ConnectWalletCTASection/>
    </div>
  );
};

export default FeaturePage;