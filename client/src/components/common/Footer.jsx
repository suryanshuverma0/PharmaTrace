import React from 'react';
import { Facebook, Twitter, Linkedin, Instagram, Mail, MapPin, Phone } from 'lucide-react';
import { PharmaChainLogo } from '../../pages/LandingPage';
import { siteConfig } from '../../constants/data';

const Footer = () => {
  return (
     <footer className="py-12 bg-gray-900">
        <div className="px-6 mx-auto max-w-7xl lg:px-8">
          <div className="flex items-center justify-center">
            <PharmaChainLogo className="w-8 h-8 mr-3 text-blue-400" />
            <span className="text-lg font-semibold text-white">{siteConfig?.siteName}</span>
          </div>
          <p className="mt-4 text-center text-gray-400">
            {`© 2025 .${siteConfig?.siteName} Securing pharmaceutical supply chains with blockchain technology.`}
          </p>
        </div>
      </footer>
  );
};

export default Footer;