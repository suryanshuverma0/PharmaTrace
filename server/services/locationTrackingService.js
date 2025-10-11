const axios = require('axios');
const UAParser = require('ua-parser-js');

class LocationTrackingService {
  constructor() {
    // You can add API keys for more accurate location services
    this.ipLocationAPIs = [
      {
        name: 'ipapi.co',
        url: (ip) => `https://ipapi.co/${ip}/json/`,
        parser: (data) => ({
          country: data.country_name,
          countryCode: data.country_code,
          region: data.region,
          city: data.city,
          zipCode: data.postal,
          latitude: parseFloat(data.latitude),
          longitude: parseFloat(data.longitude),
          timezone: data.timezone,
          isp: data.org,
          organization: data.org
        })
      },
      {
        name: 'ip-api.com',
        url: (ip) => `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,proxy,query`,
        parser: (data) => ({
          country: data.country,
          countryCode: data.countryCode,
          region: data.regionName,
          city: data.city,
          zipCode: data.zip,
          latitude: parseFloat(data.lat),
          longitude: parseFloat(data.lon),
          timezone: data.timezone,
          isp: data.isp,
          organization: data.org,
          isProxy: data.proxy || false
        })
      }
    ];
  }

  // Extract IP address from request
  extractIPAddress(req) {
    const xForwardedFor = req.headers['x-forwarded-for'];
    const xRealIP = req.headers['x-real-ip'];
    const cfConnectingIP = req.headers['cf-connecting-ip']; // Cloudflare
    const xClientIP = req.headers['x-client-ip'];
    
    let ip = req.connection?.remoteAddress || 
             req.socket?.remoteAddress || 
             req.connection?.socket?.remoteAddress ||
             req.ip;

    // Handle forwarded IPs (take the first one)
    if (xForwardedFor) {
      ip = xForwardedFor.split(',')[0].trim();
    } else if (xRealIP) {
      ip = xRealIP;
    } else if (cfConnectingIP) {
      ip = cfConnectingIP;
    } else if (xClientIP) {
      ip = xClientIP;
    }

    // Clean up IPv6 mapped IPv4 addresses
    if (ip && ip.substr(0, 7) === '::ffff:') {
      ip = ip.substr(7);
    }

    // Handle localhost
    if (ip === '127.0.0.1' || ip === '::1' || !ip) {
      ip = '127.0.0.1'; // Default for development
    }

    return ip;
  }

  // Get location data from IP address
  async getLocationFromIP(ip) {
    // Skip location detection for localhost
    if (ip === '127.0.0.1' || ip === 'localhost' || !ip) {
      return {
        ipAddress: ip,
        country: 'Unknown',
        countryCode: 'XX',
        region: 'Unknown',
        city: 'Unknown',
        latitude: null,
        longitude: null,
        locationSource: 'ip',
        isp: 'localhost',
        timezone: 'UTC'
      };
    }

    // Try multiple IP location services for reliability
    for (const api of this.ipLocationAPIs) {
      try {
        const response = await axios.get(api.url(ip), {
          timeout: 5000,
          headers: {
            'User-Agent': 'PharmaTrace-LocationService/1.0'
          }
        });

        if (response.data && (response.data.status !== 'fail')) {
          const locationData = api.parser(response.data);
          return {
            ipAddress: ip,
            locationSource: 'ip',
            ...locationData
          };
        }
      } catch (error) {
        console.warn(`Failed to get location from ${api.name}:`, error.message);
        continue;
      }
    }

    // Fallback if all services fail
    return {
      ipAddress: ip,
      country: 'Unknown',
      countryCode: 'XX',
      region: 'Unknown',
      city: 'Unknown',
      latitude: null,
      longitude: null,
      locationSource: 'ip',
      timezone: 'UTC'
    };
  }

  // Parse device information from User-Agent
  parseDeviceInfo(userAgent) {
    if (!userAgent) {
      return {
        userAgent: '',
        browser: { name: 'Unknown', version: 'Unknown' },
        os: { name: 'Unknown', version: 'Unknown' },
        device: { type: 'unknown', vendor: 'Unknown', model: 'Unknown' },
        platform: 'web'
      };
    }

    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    // Determine device type more accurately
    let deviceType = 'desktop';
    if (result.device.type === 'mobile') {
      deviceType = 'mobile';
    } else if (result.device.type === 'tablet') {
      deviceType = 'tablet';
    } else if (/mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
      deviceType = 'mobile';
    }

    return {
      userAgent,
      browser: {
        name: result.browser.name || 'Unknown',
        version: result.browser.version || 'Unknown'
      },
      os: {
        name: result.os.name || 'Unknown',
        version: result.os.version || 'Unknown'
      },
      device: {
        type: deviceType,
        vendor: result.device.vendor || 'Unknown',
        model: result.device.model || 'Unknown'
      },
      platform: this.detectPlatform(userAgent)
    };
  }

  // Detect platform (web, mobile app, API, etc.)
  detectPlatform(userAgent) {
    if (!userAgent) return 'unknown';
    
    // Check for mobile app signatures
    if (userAgent.includes('PharmaTrace-Mobile')) return 'mobile_app';
    if (userAgent.includes('PharmaTrace-API')) return 'api';
    
    // Check for common mobile browsers
    if (/mobile|android|iphone|ipad/i.test(userAgent)) return 'web';
    
    return 'web';
  }

  // Detect security flags (VPN, Proxy, etc.)
  async detectSecurityFlags(ip, userAgent) {
    const flags = {
      isVpn: false,
      isProxy: false,
      isTor: false,
      isBot: false,
      riskScore: 0
    };

    // Skip detection for localhost
    if (ip === '127.0.0.1' || ip === 'localhost') {
      return flags;
    }

    try {
      // Check for bot signatures in User-Agent
      const botPatterns = [
        /bot/i, /crawler/i, /spider/i, /scraper/i,
        /curl/i, /wget/i, /python/i, /requests/i,
        /postman/i, /insomnia/i, /httpie/i
      ];

      flags.isBot = botPatterns.some(pattern => pattern.test(userAgent));

      // You can integrate with VPN/Proxy detection services like:
      // - IPQualityScore
      // - MaxMind
      // - ProxyCheck.io
      // For now, basic detection based on known patterns

      // Basic proxy detection (can be enhanced)
      if (userAgent && /proxy|vpn/i.test(userAgent)) {
        flags.isProxy = true;
      }

      // Calculate basic risk score
      if (flags.isBot) flags.riskScore += 30;
      if (flags.isProxy) flags.riskScore += 20;
      if (flags.isVpn) flags.riskScore += 15;
      if (flags.isTor) flags.riskScore += 40;

    } catch (error) {
      console.warn('Error detecting security flags:', error.message);
    }

    return flags;
  }

  // Create comprehensive tracking data from request
  async createTrackingData(req, trackingOptions = {}) {
    const ip = this.extractIPAddress(req);
    const userAgent = req.headers['user-agent'] || '';
    
    // Get location data
    const locationData = await this.getLocationFromIP(ip);
    
    // Parse device information
    const deviceInfo = this.parseDeviceInfo(userAgent);
    
    // Detect security flags
    const securityFlags = await this.detectSecurityFlags(ip, userAgent);

    // Extract additional headers and metadata
    const trackingData = {
      location: locationData,
      deviceInfo: {
        ...deviceInfo,
        language: req.headers['accept-language']?.split(',')[0] || 'en',
        screen: {
          width: trackingOptions.screenWidth || null,
          height: trackingOptions.screenHeight || null
        }
      },
      securityFlags,
      scanContext: {
        method: trackingOptions.method || 'manual_entry',
        referrer: req.headers.referer || req.headers.referrer || '',
        sessionId: req.sessionID || req.session?.id || '',
        qrCode: trackingOptions.qrCode || {},
        purpose: trackingOptions.purpose || 'consumer_verification'
      },
      apiDetails: {
        endpoint: req.originalUrl || req.url,
        method: req.method,
        apiVersion: req.headers['api-version'] || '1.0',
        clientVersion: req.headers['client-version'] || '1.0'
      },
      analytics: {
        source: req.query.utm_source || req.headers['x-source'],
        medium: req.query.utm_medium || req.headers['x-medium'],
        campaignId: req.query.utm_campaign || req.headers['x-campaign'],
        isFirstScan: trackingOptions.isFirstScan || false
      }
    };

    return trackingData;
  }

  // Validate GPS coordinates
  validateGPSCoordinates(lat, lng, accuracy = null) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return null;
    }
    
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return null;
    }
    
    return {
      latitude,
      longitude,
      accuracy: accuracy ? parseFloat(accuracy) : null,
      timestamp: new Date()
    };
  }

  // Calculate distance between two coordinates (Haversine formula)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  }

  toRad(deg) {
    return deg * (Math.PI/180);
  }
}

module.exports = new LocationTrackingService();