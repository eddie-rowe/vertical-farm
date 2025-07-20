"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FaSearch,
  FaEye,
  FaChartLine,
  FaDollarSign,
  FaMapMarkerAlt,
  FaBuilding,
} from "@/lib/icons";

interface Competitor {
  id: string;
  name: string;
  type: "vertical-farm" | "greenhouse" | "traditional-farm" | "distributor";
  location: string;
  distance: string;
  size: string;
  establishedYear: number;
  website: string;
  pricing: {
    lettuce: string;
    herbs: string;
    microgreens: string;
  };
  strengths: string[];
  weaknesses: string[];
  marketShare: number;
  lastUpdated: string;
  status: "active" | "expanding" | "struggling" | "new";
}

interface MarketMetric {
  metric: string;
  value: string;
  change: number;
  period: string;
  icon: React.ReactNode;
}

interface CompetitiveIntelligence {
  category: string;
  insights: string[];
  priority: "high" | "medium" | "low";
  actionItems: string[];
}

export default function CompetitionAnalysisView() {
  const [searchRadius, setSearchRadius] = useState("25");
  const [competitorType, setCompetitorType] = useState("all");

  // Mock data - replace with actual API calls
  const competitors: Competitor[] = [
    {
      id: "comp-001",
      name: "GreenTech Farms",
      type: "vertical-farm",
      location: "Industrial District",
      distance: "12.5 miles",
      size: "15,000 sq ft",
      establishedYear: 2019,
      website: "greentechfarms.com",
      pricing: {
        lettuce: "$3.50/lb",
        herbs: "$8.00/lb",
        microgreens: "$12.00/lb",
      },
      strengths: [
        "Advanced automation",
        "Strong distribution network",
        "Consistent quality",
      ],
      weaknesses: ["Higher pricing", "Limited crop variety", "Energy costs"],
      marketShare: 35,
      lastUpdated: "2024-01-24",
      status: "expanding",
    },
    {
      id: "comp-002",
      name: "Fresh Harvest Co.",
      type: "greenhouse",
      location: "Suburban Area",
      distance: "8.2 miles",
      size: "25,000 sq ft",
      establishedYear: 2015,
      website: "freshharvestco.com",
      pricing: {
        lettuce: "$2.80/lb",
        herbs: "$6.50/lb",
        microgreens: "$10.00/lb",
      },
      strengths: [
        "Lower costs",
        "Established customer base",
        "Local reputation",
      ],
      weaknesses: [
        "Weather dependent",
        "Seasonal limitations",
        "Aging infrastructure",
      ],
      marketShare: 28,
      lastUpdated: "2024-01-23",
      status: "active",
    },
    {
      id: "comp-003",
      name: "Urban Greens",
      type: "vertical-farm",
      location: "Downtown",
      distance: "15.8 miles",
      size: "8,000 sq ft",
      establishedYear: 2021,
      website: "urbangreens.co",
      pricing: {
        lettuce: "$4.20/lb",
        herbs: "$9.50/lb",
        microgreens: "$15.00/lb",
      },
      strengths: [
        "Premium positioning",
        "Direct-to-consumer focus",
        "Innovation",
      ],
      weaknesses: ["Small scale", "High overhead", "Limited capacity"],
      marketShare: 12,
      lastUpdated: "2024-01-22",
      status: "new",
    },
  ];

  const marketMetrics: MarketMetric[] = [
    {
      metric: "Market Size",
      value: "$2.4M",
      change: 8.5,
      period: "vs last year",
      icon: <FaDollarSign className="h-5 w-5" />,
    },
    {
      metric: "Average Price",
      value: "$3.85/lb",
      change: -2.1,
      period: "vs last quarter",
      icon: <FaChartLine className="h-5 w-5" />,
    },
    {
      metric: "New Entrants",
      value: "3",
      change: 50,
      period: "vs last year",
      icon: <FaBuilding className="h-5 w-5" />,
    },
    {
      metric: "Market Growth",
      value: "12.8%",
      change: 3.2,
      period: "annual rate",
      icon: <FaChartLine className="h-5 w-5" />,
    },
  ];

  const competitiveIntelligence: CompetitiveIntelligence[] = [
    {
      category: "Pricing Strategy",
      insights: [
        "Premium positioning trend emerging in urban markets",
        "Traditional farms struggling with cost pressures",
        "Automation driving cost advantages for established players",
      ],
      priority: "high",
      actionItems: [
        "Review pricing strategy for premium segments",
        "Analyze automation ROI opportunities",
        "Monitor traditional farm market exits",
      ],
    },
    {
      category: "Market Positioning",
      insights: [
        "Sustainability messaging becoming key differentiator",
        "Direct-to-consumer channels gaining traction",
        "B2B partnerships with restaurants increasing",
      ],
      priority: "medium",
      actionItems: [
        "Strengthen sustainability credentials",
        "Explore D2C channel opportunities",
        "Develop restaurant partnership program",
      ],
    },
    {
      category: "Technology Trends",
      insights: [
        "AI-driven crop optimization becoming standard",
        "Energy efficiency critical for profitability",
        "Data analytics for yield prediction expanding",
      ],
      priority: "high",
      actionItems: [
        "Evaluate AI optimization platforms",
        "Conduct energy efficiency audit",
        "Implement advanced analytics systems",
      ],
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "expanding":
        return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700";
      case "active":
        return "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700";
      case "new":
        return "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-700";
      case "struggling":
        return "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-red-500 bg-red-50 dark:bg-red-950";
      case "medium":
        return "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950";
      case "low":
        return "border-l-green-500 bg-green-50 dark:bg-green-950";
      default:
        return "border-l-gray-500 bg-gray-50 dark:bg-gray-800";
    }
  };

  const filteredCompetitors =
    competitorType === "all"
      ? competitors
      : competitors.filter((comp) => comp.type === competitorType);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Competition Analysis
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor competitors and analyze market intelligence
          </p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={searchRadius}
            onChange={(e) => setSearchRadius(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="10">10 miles</option>
            <option value="25">25 miles</option>
            <option value="50">50 miles</option>
            <option value="100">100 miles</option>
          </select>
          <Button className="bg-green-600 hover:bg-green-700">
            <FaSearch className="mr-2" />
            Scan Market
          </Button>
        </div>
      </div>

      <Tabs defaultValue="competitors" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="competitors" className="flex items-center gap-2">
            <FaBuilding className="h-4 w-4" />
            Competitors
          </TabsTrigger>
          <TabsTrigger value="market" className="flex items-center gap-2">
            <FaChartLine className="h-4 w-4" />
            Market Metrics
          </TabsTrigger>
          <TabsTrigger value="intelligence" className="flex items-center gap-2">
            <FaEye className="h-4 w-4" />
            Intelligence
          </TabsTrigger>
        </TabsList>

        <TabsContent value="competitors" className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <select
              value={competitorType}
              onChange={(e) => setCompetitorType(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="vertical-farm">Vertical Farms</option>
              <option value="greenhouse">Greenhouses</option>
              <option value="traditional-farm">Traditional Farms</option>
              <option value="distributor">Distributors</option>
            </select>
          </div>

          <div className="grid gap-4">
            {filteredCompetitors.map((competitor) => (
              <Card
                key={competitor.id}
                className="border border-gray-200 dark:border-gray-700"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {competitor.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {competitor.type.replace("-", " ")} • {competitor.size}{" "}
                        • Est. {competitor.establishedYear}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={getStatusColor(competitor.status)}>
                        {competitor.status.toUpperCase()}
                      </Badge>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {competitor.marketShare}% market share
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <FaMapMarkerAlt className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <span>
                          {competitor.location} ({competitor.distance})
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500 dark:text-gray-400">
                          Website:{" "}
                        </span>
                        <span className="text-blue-600 dark:text-blue-400">
                          {competitor.website}
                        </span>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-semibold text-sm mb-2">Pricing</h5>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>Lettuce: {competitor.pricing.lettuce}</div>
                        <div>Herbs: {competitor.pricing.herbs}</div>
                        <div>Microgreens: {competitor.pricing.microgreens}</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h5 className="font-semibold text-sm mb-2 text-green-700 dark:text-green-400">
                        Strengths
                      </h5>
                      <ul className="text-sm space-y-1">
                        {competitor.strengths.map((strength, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-semibold text-sm mb-2 text-red-700 dark:text-red-400">
                        Weaknesses
                      </h5>
                      <ul className="text-sm space-y-1">
                        {competitor.weaknesses.map((weakness, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                            {weakness}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Last updated: {competitor.lastUpdated}
                    </span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <FaEye className="mr-2 h-3 w-3" />
                        View Profile
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Update Data
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="market" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {marketMetrics.map((metric, index) => (
              <Card
                key={index}
                className="border border-gray-200 dark:border-gray-700"
              >
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg text-green-600 dark:text-green-400">
                      {metric.icon}
                    </div>
                    <span
                      className={`text-sm font-semibold ${metric.change > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                    >
                      {metric.change > 0 ? "+" : ""}
                      {metric.change}%
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    {metric.metric}
                  </h4>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                    {metric.value}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {metric.period}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle>Market Trends</CardTitle>
              <CardDescription>
                Historical data and trend analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg h-64 flex items-center justify-center">
                <div className="text-center">
                  <FaChartLine className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Market Trend Charts Coming Soon
                  </h3>
                  <p className="text-gray-500 dark:text-gray-500">
                    Interactive charts and historical market data will be
                    available here
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="intelligence" className="space-y-4">
          <div className="grid gap-4">
            {competitiveIntelligence.map((intel, index) => (
              <Card
                key={index}
                className={`border-l-4 ${getPriorityColor(intel.priority)} border-gray-200 dark:border-gray-700`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{intel.category}</CardTitle>
                    <Badge
                      variant="outline"
                      className={`${intel.priority === "high" ? "border-red-500 text-red-700 dark:text-red-400" : intel.priority === "medium" ? "border-yellow-500 text-yellow-700 dark:text-yellow-400" : "border-green-500 text-green-700 dark:text-green-400"}`}
                    >
                      {intel.priority.toUpperCase()} PRIORITY
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-semibold text-sm mb-2">
                        Key Insights
                      </h5>
                      <ul className="text-sm space-y-2">
                        {intel.insights.map((insight, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-1 h-1 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-semibold text-sm mb-2">
                        Action Items
                      </h5>
                      <ul className="text-sm space-y-2">
                        {intel.actionItems.map((action, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-1 h-1 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle>Automated Intelligence</CardTitle>
              <CardDescription>
                AI-powered competitive analysis and alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg h-64 flex items-center justify-center">
                <div className="text-center">
                  <FaEye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    AI Intelligence Coming Soon
                  </h3>
                  <p className="text-gray-500 dark:text-gray-500">
                    Automated competitive intelligence and market monitoring
                    will be available here
                  </p>
                  <Button className="mt-4" variant="outline">
                    Configure AI Monitoring
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
