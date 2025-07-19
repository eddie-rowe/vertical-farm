export interface Integration {
  name: string;
  icon: string;
  benefit: string;
  setupTime?: string;
  status: "available" | "connected" | "coming-soon";
  difficulty?: "easy" | "medium" | "advanced";
  category: string;
}

export const BUSINESS_INTEGRATIONS: Integration[] = [
  {
    name: "Square",
    icon: "/icons/integrations/square.svg",
    benefit: "Accept in-person payments and track sales automatically",
    setupTime: "2 min",
    status: "available",
    difficulty: "easy",
    category: "payment",
  },
  {
    name: "Stripe",
    icon: "/icons/integrations/stripe.svg",
    benefit: "Online payments, subscriptions, and revenue analytics",
    setupTime: "3 min",
    status: "available",
    difficulty: "easy",
    category: "payment",
  },
  {
    name: "PayPal Business",
    icon: "/icons/integrations/paypal.svg",
    benefit: "Global payment processing with buyer protection",
    setupTime: "3 min",
    status: "available",
    difficulty: "easy",
    category: "payment",
  },
  {
    name: "QuickBooks Online",
    icon: "/icons/integrations/quickbooks.svg",
    benefit: "Automated expense tracking and financial reporting",
    setupTime: "5 min",
    status: "available",
    difficulty: "medium",
    category: "accounting",
  },
  {
    name: "Xero",
    icon: "/icons/integrations/xero.svg",
    benefit: "Cloud accounting with real-time financial insights",
    setupTime: "5 min",
    status: "available",
    difficulty: "medium",
    category: "accounting",
  },
  {
    name: "HubSpot",
    icon: "/icons/integrations/hubspot.svg",
    benefit: "Customer relationship management and sales tracking",
    setupTime: "10 min",
    status: "available",
    difficulty: "medium",
    category: "crm",
  },
];

export const DEVICE_INTEGRATIONS: Integration[] = [
  {
    name: "Home Assistant",
    icon: "/icons/integrations/home-assistant.svg",
    benefit: "Control lights, pumps, fans, and sensors throughout your farm",
    setupTime: "5 min",
    status: "available",
    difficulty: "medium",
    category: "smart-home",
  },
  {
    name: "SmartThings",
    icon: "/icons/integrations/smartthings.svg",
    benefit: "Samsung IoT platform for device automation",
    setupTime: "8 min",
    status: "available",
    difficulty: "medium",
    category: "smart-home",
  },
  {
    name: "Arduino Cloud",
    icon: "/icons/integrations/arduino.svg",
    benefit: "Connect custom sensors and control systems",
    setupTime: "15 min",
    status: "available",
    difficulty: "advanced",
    category: "hardware",
  },
  {
    name: "AWS IoT Core",
    icon: "/icons/integrations/aws-iot.svg",
    benefit: "Industrial-grade IoT device management",
    setupTime: "20 min",
    status: "available",
    difficulty: "advanced",
    category: "industrial",
  },
  {
    name: "Raspberry Pi Connect",
    icon: "/icons/integrations/raspberry-pi.svg",
    benefit: "Remote access to Pi-based control systems",
    setupTime: "10 min",
    status: "available",
    difficulty: "medium",
    category: "hardware",
  },
];

export const AI_INTEGRATIONS: Integration[] = [
  {
    name: "OpenAI",
    icon: "/icons/integrations/openai.svg",
    benefit: "AI-powered crop analysis and yield predictions",
    setupTime: "3 min",
    status: "available",
    difficulty: "easy",
    category: "ai-platform",
  },
  {
    name: "Anthropic Claude",
    icon: "/icons/integrations/anthropic.svg",
    benefit: "Advanced AI for growth optimization and problem solving",
    setupTime: "3 min",
    status: "available",
    difficulty: "easy",
    category: "ai-platform",
  },
  {
    name: "Google AI",
    icon: "/icons/integrations/google-ai.svg",
    benefit: "Computer vision for plant health monitoring",
    setupTime: "10 min",
    status: "available",
    difficulty: "medium",
    category: "ai-platform",
  },
  {
    name: "Perplexity AI",
    icon: "/icons/integrations/perplexity.svg",
    benefit: "Research assistant for agricultural best practices",
    setupTime: "2 min",
    status: "available",
    difficulty: "easy",
    category: "research",
  },
  {
    name: "Azure Computer Vision",
    icon: "/icons/integrations/azure-cv.svg",
    benefit: "Automated plant disease detection and monitoring",
    setupTime: "15 min",
    status: "available",
    difficulty: "medium",
    category: "computer-vision",
  },
];

export const ENVIRONMENTAL_INTEGRATIONS: Integration[] = [
  {
    name: "OpenWeatherMap",
    icon: "/icons/integrations/openweather.svg",
    benefit: "Comprehensive weather data for grow optimization",
    setupTime: "2 min",
    status: "available",
    difficulty: "easy",
    category: "weather",
  },
  {
    name: "AccuWeather API",
    icon: "/icons/integrations/accuweather.svg",
    benefit: "Precise local weather forecasting and alerts",
    setupTime: "3 min",
    status: "available",
    difficulty: "easy",
    category: "weather",
  },
  {
    name: "Purple Air",
    icon: "/icons/integrations/purple-air.svg",
    benefit: "Real-time air quality monitoring",
    setupTime: "5 min",
    status: "available",
    difficulty: "easy",
    category: "air-quality",
  },
  {
    name: "ThingSpeak",
    icon: "/icons/integrations/thingspeak.svg",
    benefit: "IoT sensor data collection and analysis",
    setupTime: "10 min",
    status: "available",
    difficulty: "medium",
    category: "sensors",
  },
  {
    name: "Adafruit IO",
    icon: "/icons/integrations/adafruit.svg",
    benefit: "Easy sensor data logging and visualization",
    setupTime: "8 min",
    status: "available",
    difficulty: "medium",
    category: "sensors",
  },
];

export const INVENTORY_INTEGRATIONS: Integration[] = [
  {
    name: "Johnny's Seeds",
    icon: "/icons/integrations/johnnys-seeds.svg",
    benefit: "Automated seed ordering and variety tracking",
    setupTime: "10 min",
    status: "coming-soon",
    difficulty: "medium",
    category: "suppliers",
  },
  {
    name: "Hydrofarm",
    icon: "/icons/integrations/hydrofarm.svg",
    benefit: "Hydroponic supplies and nutrient management",
    setupTime: "10 min",
    status: "coming-soon",
    difficulty: "medium",
    category: "suppliers",
  },
  {
    name: "FedEx API",
    icon: "/icons/integrations/fedex.svg",
    benefit: "Automated shipping and tracking for deliveries",
    setupTime: "15 min",
    status: "available",
    difficulty: "medium",
    category: "shipping",
  },
  {
    name: "UPS API",
    icon: "/icons/integrations/ups.svg",
    benefit: "Package tracking and shipping rate calculations",
    setupTime: "15 min",
    status: "available",
    difficulty: "medium",
    category: "shipping",
  },
  {
    name: "TradeGecko",
    icon: "/icons/integrations/tradegecko.svg",
    benefit: "Comprehensive inventory management and tracking",
    setupTime: "20 min",
    status: "available",
    difficulty: "advanced",
    category: "inventory",
  },
];

// Page-specific messaging
export const INTEGRATION_MESSAGES = {
  business:
    "Connect Square or Stripe to automatically track revenue, customer payments, and sales trends from your farm sales.",
  devices:
    "Connect Home Assistant to control lights, pumps, fans, and sensors throughout your vertical farm.",
  ai: "Connect OpenAI or Anthropic to enable AI-powered crop analysis, yield predictions, and automated growth recommendations.",
  environmental:
    "Connect weather and sensor APIs to automatically track environmental conditions and optimize growing parameters.",
  inventory:
    "Connect supplier APIs to automate seed ordering, track inventory levels, and manage supply chain logistics.",
};

export const INTEGRATION_CONTEXTS = {
  business: "business management",
  devices: "device automation",
  ai: "AI insights",
  environmental: "environmental monitoring",
  inventory: "inventory management",
};
