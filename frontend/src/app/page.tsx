import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle,
  BarChart2,
  Settings,
  Zap,
  Leaf,
  Users,
  BookOpen,
  Rss,
} from "lucide-react";

// Simple Nav for Landing Page
function LandingNav() {
  return (
    <nav className="w-full p-4 fixed top-0 left-0 bg-white dark:bg-gray-900 shadow-md z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" passHref className="flex items-center gap-2">
          <Image src="/farm-hero.svg" alt="VF Logo" width={40} height={40} />
          <span className="font-semibold text-xl text-green-700 dark:text-green-300">
            VerticalFarm OS
          </span>
        </Link>
        <div className="space-x-2 sm:space-x-4">
          <Link
            href="/#features"
            passHref
            className="text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 text-sm sm:text-base"
          >
            Features
          </Link>
          <Link
            href="/#audience"
            passHref
            className="text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 text-sm sm:text-base"
          >
            For Who?
          </Link>
          <Link href="/login" passHref>
            <Button variant="outline" size="sm">
              Log In
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}

const FeatureCard = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow duration-300 glass">
    <CardHeader className="flex flex-row items-center gap-4 pb-2">
      {icon}
      <CardTitle className="text-green-800 dark:text-green-300">
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-gray-600 dark:text-gray-300">{description}</p>
    </CardContent>
  </Card>
);

export default function Home() {
  return (
    <>
      <LandingNav />
      <div className="min-h-screen w-full flex flex-col items-center justify-center gradient-farm animate-pop pt-20 sm:pt-16">
        <main className="flex flex-col items-center justify-center flex-1 w-full px-4 py-12 sm:py-16 text-center">
          <div className="glass card-shadow max-w-2xl w-full flex flex-col items-center gap-6 sm:gap-8 p-6 sm:p-12 animate-pop">
            <Image
              src="/farm-hero.svg"
              alt="VerticalFarm OS Logo"
              width={100}
              height={100}
              className="mb-2"
              priority
            />
            <h1 className="text-4xl sm:text-6xl font-bold text-center text-green-900 dark:text-green-100 drop-shadow-lg">
              Your Farm, Smarter.
            </h1>
            <p className="text-lg sm:text-xl text-center text-gray-700 dark:text-gray-300 max-w-lg">
              Take control of your vertical farm with VerticalFarm OS: model
              layouts, automate grow recipes, track yields, and gain actionable
              insights. All powered by Home Assistant for local-first privacy.
            </p>
            <Link href="/login" passHref>
              <Button
                size="lg"
                variant="default"
                className="px-10 py-6 text-xl font-semibold shadow-xl hover:shadow-2xl transition-shadow duration-300 mt-4"
              >
                Start Growing
              </Button>
            </Link>
          </div>
        </main>

        <section
          id="features"
          className="w-full py-16 sm:py-24 bg-white dark:bg-gray-800/50 backdrop-blur-md"
        >
          <div className="container mx-auto text-center px-4">
            <h2 className="text-3xl sm:text-4xl font-bold mb-12 sm:mb-16 text-green-800 dark:text-green-200">
              Everything You Need to Grow
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              <FeatureCard
                icon={
                  <Settings className="w-10 h-10 text-green-600 dark:text-green-400" />
                }
                title="Layout & Device Modeling"
                description="Visually define farms, racks, and shelves. Assign lights, pumps, sensors, and actuators with ease using Home Assistant's entity system."
              />
              <FeatureCard
                icon={
                  <Leaf className="w-10 h-10 text-green-600 dark:text-green-400" />
                }
                title="Grow Recipes & Scheduling"
                description="Implement per-species grow recipes for watering, lighting, and environmental controls. Automate routine tasks and capture best-practice protocols."
              />
              <FeatureCard
                icon={
                  <Zap className="w-10 h-10 text-green-600 dark:text-green-400" />
                }
                title="Real-Time Monitoring & Alerts"
                description="Live dashboards for temperature, humidity, pH, CO₂, and more. Receive threshold alerts to prevent crop loss and ensure optimal conditions."
              />
              <FeatureCard
                icon={
                  <BarChart2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                }
                title="Analytics & Yield Tracking"
                description="Log harvest dates, weights, and quality notes. Analyze historical data, track resource usage, and export reports to optimize your operations."
              />
              <FeatureCard
                icon={
                  <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                }
                title="HACS Integration"
                description="Leverages Home Assistant's open-source ecosystem for local-first privacy and easy community updates via HACS."
              />
              <FeatureCard
                icon={
                  <BookOpen className="w-10 h-10 text-green-600 dark:text-green-400" />
                }
                title="Extensible & DIY-Friendly"
                description="Plugin hooks for new hardware and software integrations. Turn a Raspberry Pi into a microfarm, or scale up with containerized add-ons."
              />
            </div>
          </div>
        </section>

        <section
          id="audience"
          className="w-full py-16 sm:py-24 bg-gray-50 dark:bg-gray-900/60 backdrop-blur-md"
        >
          <div className="container mx-auto text-center px-4">
            <h2 className="text-3xl sm:text-4xl font-bold mb-12 sm:mb-16 text-green-800 dark:text-green-200">
              Built for Every Grower
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              <div className="p-6 rounded-lg glass card-shadow_light">
                <Users className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-green-800 dark:text-green-300">
                  Hobbyists
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Simple setup, visual plant health, and blueprint templates for
                  one-click automations.
                </p>
              </div>
              <div className="p-6 rounded-lg glass card-shadow_light">
                <Leaf className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-green-800 dark:text-green-300">
                  Urban Farms
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Achieve consistent yields and optimize resource usage with
                  centralized logs and dashboards.
                </p>
              </div>
              <div className="p-6 rounded-lg glass card-shadow_light">
                <Settings className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-green-800 dark:text-green-300">
                  AgTech Developers
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Rapidly prototype with modular APIs and publish new device
                  drivers or ML controls.
                </p>
              </div>
              <div className="p-6 rounded-lg glass card-shadow_light">
                <BookOpen className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-green-800 dark:text-green-300">
                  Researchers
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Access open data, run reproducible experiments, and share full
                  farm-control stacks.
                </p>
              </div>
            </div>
          </div>
        </section>

        <footer className="w-full flex flex-col items-center gap-4 py-8 text-gray-600 dark:text-gray-200 text-sm bg-gray-100 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">
          <div className="flex gap-4 sm:gap-6">
            <a
              href="https://github.com/eddie-rowe/vertical-farm"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link flex items-center gap-1"
            >
              <svg fill="currentColor" className="w-5 h-5" viewBox="0 0 16 16">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
              </svg>{" "}
              GitHub
            </a>
            <a
              href="https://eddie-rowe.github.io/vertical-farm/"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link flex items-center gap-1"
            >
              <BookOpen className="w-5 h-5" /> Docs
            </a>
            <a
              href="https://github.com/eddie-rowe/vertical-farm/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link flex items-center gap-1"
            >
              <Rss className="w-5 h-5" /> Report an Issue
            </a>
          </div>
          <div className="font-medium">
            © {new Date().getFullYear()} VerticalFarm OS. All rights reserved.
          </div>
        </footer>
      </div>
    </>
  );
}
