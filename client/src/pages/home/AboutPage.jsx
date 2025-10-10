import React from 'react';
import { motion } from 'framer-motion';
import { QrCode, Scan, Shield, Eye, CheckCircle, ArrowRight, Factory, Truck, Building, User } from 'lucide-react';
import { siteConfig } from '../../constants/data';

const AboutPage = () => {
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

  const supplyChainSteps = [
    {
      icon: <Factory size={32} />,
      title: "Manufacturer",
      description: "Creates product with unique QR code and blockchain record"
    },
    {
      icon: <Truck size={32} />,
      title: "Distributor", 
      description: "Receives and transfers products with verified authenticity"
    },
    {
      icon: <Building size={32} />,
      title: "Pharmacy",
      description: "Final verification before dispensing to patients"
    },
    {
      icon: <User size={32} />,
      title: "Consumer",
      description: "Scans QR code to verify complete supply chain history"
    }
  ];

  const verificationFeatures = [
    {
      icon: <QrCode size={24} />,
      title: "QR Code Generation",
      description: "Each product gets a unique QR code linked to blockchain"
    },
    {
      icon: <Scan size={24} />,
      title: "Instant Scanning", 
      description: "Scan any product to view its complete journey"
    },
    {
      icon: <Shield size={24} />,
      title: "Tamper Detection",
      description: "Blockchain ensures no data can be altered or faked"
    },
    {
      icon: <Eye size={24} />,
      title: "Full Transparency",
      description: "See every step from manufacturing to your hands"
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
          className="container relative px-4 mx-auto text-center text-white"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.h1 
            className="mb-6 text-3xl font-bold md:text-5xl"
            variants={itemVariants}
          >
            How PharmaTrace Works
          </motion.h1>
          <motion.p 
            className="max-w-3xl mx-auto text-lg text-blue-100 md:text-xl"
            variants={itemVariants}
          >
            Scan any product QR code to instantly verify its authenticity and 
            track its complete journey through the supply chain
          </motion.p>
        </motion.div>
      </section>

      <div className='px-4 mx-auto max-w-7xl'>

        {/* How It Works Section */}
        <section className="py-16 md:py-20">
          <motion.div
            className="mb-12 text-center md:mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            <motion.h2 
              className="mb-4 text-2xl font-bold text-gray-800 md:text-3xl"
              variants={itemVariants}
            >
              Supply Chain Flow
            </motion.h2>
            <motion.p 
              className="max-w-2xl mx-auto text-sm text-gray-600 md:text-base"
              variants={itemVariants}
            >
              Track your product's journey from manufacturer to your hands
            </motion.p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 gap-8 md:grid-cols-4 md:gap-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            {supplyChainSteps.map((step, index) => (
              <motion.div
                key={index}
                className="relative text-center"
                variants={itemVariants}
              >
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center w-16 h-16 mb-4 text-blue-600 bg-blue-100 rounded-full md:w-20 md:h-20">
                    {step.icon}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-800">{step.title}</h3>
                  <p className="max-w-xs text-sm text-gray-600">{step.description}</p>
                </div>
                {index < supplyChainSteps.length - 1 && (
                  <div className="absolute hidden w-full md:block top-10 left-full">
                    <ArrowRight className="mx-auto text-gray-300" size={20} />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Verification Features */}
        <section className="py-16 -mx-4 md:py-20 bg-gray-50">
          <div className="px-4">
            <motion.div
              className="mb-12 text-center md:mb-16"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={containerVariants}
            >
              <motion.h2 
                className="mb-4 text-2xl font-bold text-gray-800 md:text-3xl"
                variants={itemVariants}
              >
                Verification Process
              </motion.h2>
              <motion.p 
                className="max-w-2xl mx-auto text-sm text-gray-600 md:text-base"
                variants={itemVariants}
              >
                Simple steps to verify product authenticity and supply chain transparency
              </motion.p>
            </motion.div>

            <motion.div 
              className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 md:gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={containerVariants}
            >
              {verificationFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  className="p-6 transition-shadow bg-white shadow-lg rounded-xl hover:shadow-xl"
                  variants={itemVariants}
                >
                  <div className="mb-4 text-blue-600">{feature.icon}</div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-800">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* How to Scan Section */}
        <section className="py-16 md:py-20">
          <motion.div 
            className="grid items-center grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            <motion.div variants={itemVariants}>
              <h2 className="mb-6 text-2xl font-bold text-gray-800 md:text-3xl">
                How to Verify Products
              </h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-sm font-bold text-white bg-blue-600 rounded-full">
                    1
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-gray-800">Find the QR Code</h3>
                    <p className="text-sm text-gray-600">Look for the unique QR code on the product packaging</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-sm font-bold text-white bg-blue-600 rounded-full">
                    2
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-gray-800">Scan with Your Phone</h3>
                    <p className="text-sm text-gray-600">Use our scanner or any QR code reader app</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-sm font-bold text-white bg-blue-600 rounded-full">
                    3
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-gray-800">View Supply Chain</h3>
                    <p className="text-sm text-gray-600">See the complete journey and verify authenticity</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-white bg-green-600 rounded-full">
                    <CheckCircle size={16} />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-gray-800">Confirmed Authentic</h3>
                    <p className="text-sm text-gray-600">Get instant confirmation of product authenticity</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="p-8 text-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl"
              variants={itemVariants}
            >
              <QrCode size={64} className="mx-auto mb-6 text-blue-600" />
              <h3 className="mb-4 text-xl font-semibold text-gray-800">
                Try Scanning Now
              </h3>
              <p className="mb-6 text-sm text-gray-600">
                Experience transparency in pharmaceutical supply chain
              </p>
              <div className="p-4 bg-white border-2 border-blue-300 border-dashed rounded-lg">
                <p className="text-sm font-medium text-blue-600">Scan any product QR code</p>
                <p className="mt-1 text-xs text-gray-500">Instant verification & history</p>
              </div>
            </motion.div>
          </motion.div>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;