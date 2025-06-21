import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, TrendingUp, Award } from 'lucide-react';
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

  const stats = [
    { icon: <Shield size={24} />, value: "100%", label: "Secure Transactions" },
    { icon: <Users size={24} />, value: "10K+", label: "Active Users" },
    { icon: <TrendingUp size={24} />, value: "50M+", label: "Products Tracked" },
    { icon: <Award size={24} />, value: "99.9%", label: "Accuracy Rate" }
  ];

  const timeline = [
    {
      year: "2023",
      title: "Project Inception",
      description: "PharmaTrace was conceived with the vision of revolutionizing pharmaceutical supply chains"
    },
    {
      year: "2024",
      title: "Platform Development",
      description: "Launched our blockchain-based solution with core tracking and verification features"
    },
    {
      year: "2025",
      title: "Global Expansion",
      description: "Expanded our services globally, partnering with major pharmaceutical companies"
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
            Transforming Pharmaceutical Supply Chain
          </motion.h1>
          <motion.p 
            className="max-w-3xl mx-auto text-xl text-blue-100"
            variants={itemVariants}
          >
            Building trust and transparency in the pharmaceutical industry through 
            innovative blockchain technology
          </motion.p>
        </motion.div>
      </section>

<div className='mx-auto max-w-7xl '>

  {/* Mission Section */}
      <section className="py-20">
        <div className="container px-6 mx-auto">
          <motion.div 
            className="grid items-center grid-cols-1 gap-12 md:grid-cols-2"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={containerVariants}
          >
            <motion.div variants={itemVariants}>
              <h2 className="mb-6 text-3xl font-bold text-gray-800">Our Mission</h2>
              <p className="mb-6 leading-relaxed text-gray-600">
               {` ${siteConfig?.siteName} is dedicated to revolutionizing the pharmaceutical supply chain 
                through blockchain technology. We aim to create a transparent, secure, and 
                efficient ecosystem that ensures the authenticity of medications from 
                manufacturer to patient.`}
              </p>
              <p className="leading-relaxed text-gray-600">
                By leveraging advanced blockchain solutions, we're building a future where 
                drug counterfeiting is eliminated, supply chain inefficiencies are minimized, 
                and patient safety is guaranteed.
              </p>
            </motion.div>
            <motion.div 
              className="grid grid-cols-2 gap-6"
              variants={containerVariants}
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  className="p-6 transition-shadow duration-300 bg-white shadow-lg rounded-xl hover:shadow-xl"
                  variants={itemVariants}
                >
                  <div className="mb-4 text-blue-600">{stat.icon}</div>
                  <div className="mb-1 text-2xl font-bold text-gray-800">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Timeline Section */}
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
              Our Journey
            </motion.h2>
            <motion.p 
              className="max-w-2xl mx-auto text-gray-600"
              variants={itemVariants}
            >
              From concept to reality, we're building the future of pharmaceutical supply chain management
            </motion.p>
          </motion.div>

          <motion.div 
            className="max-w-4xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            {timeline.map((item, index) => (
              <motion.div 
                key={index}
                className="relative flex gap-8 mb-12"
                variants={itemVariants}
              >
                <div className="w-24 pt-2 font-bold text-blue-600">{item.year}</div>
                <div className="flex-1 pb-12 relative before:absolute before:left-[-24px] before:top-3 before:w-4 before:h-4 before:bg-blue-600 before:rounded-full before:z-10 before:border-4 before:border-white after:absolute after:left-[-22px] after:top-3 after:w-0.5 after:h-full after:bg-gray-200">
                  <h3 className="mb-2 text-xl font-semibold text-gray-800">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
</div>
      
    </div>
  );
};

export default AboutPage;