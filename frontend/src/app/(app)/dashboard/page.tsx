"use client";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  FaDollarSign,
  FaChartLine,
  FaTasks,
  FaCalendarAlt,
  FaUsers,
  FaBrain,
  FaFlask,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaArrowUp,
  FaArrowDown,
  FaLightbulb,
  FaCog,
  FaFire,
  FaTrophy,
  FaBullseye,
  FaShieldAlt,
  FaRocket,
  FaHome,
  FaChevronRight,
  FaArrowLeft,
  FaEye,
  FaPhone,
  FaClipboardList,
  FaCalendarCheck,
  FaEnvelope,
  FaFileInvoiceDollar
} from "react-icons/fa";
import { useState, useEffect } from "react";

// Strategic Operations Data
const strategicData = {
  costs: {
    currentWeeklyCostPerTray: 2.87,
    targetCostPerTray: 2.50,
    lastMonthCostPerTray: 2.65,
    costBreakdown: [
      { category: "Labor", percentage: 60, amount: 1.72 },
      { category: "Utilities", percentage: 25, amount: 0.72 },
      { category: "Materials", percentage: 15, amount: 0.43 }
    ],
    suggestions: [
      { action: "Switch to single-operator harvest process for basil", savings: 0.14, urgency: "medium" },
      { action: "Reduce overwatering in Grow Room 2", savings: 0.08, urgency: "high" },
      { action: "Reuse 20% of trays (sanitized) instead of new", savings: 0.12, urgency: "low" }
    ],
    alerts: [
      { message: "Utilities cost increased 12% vs prior month", type: "warning" }
    ]
  },
  sales: {
    currentWeeklyRevenue: 1920,
    fourWeekAverage: 2120,
    lastWeekRevenue: 1850,
    customerMetrics: {
      dormantCustomers: 3,
      avgOrderSize: 240,
      targetOrderSize: 280
    },
    suggestions: [
      { action: "Reconnect with 3 dormant customers", impact: "+$180/week", urgency: "high" },
      { action: "Offer seasonal microgreen blends", impact: "+$40 avg order", urgency: "medium" },
      { action: "Add standing order option for high-frequency customers", impact: "+15% retention", urgency: "low" }
    ],
    alerts: [
      { message: "Revenue dipped for 2 consecutive weeks", type: "warning" }
    ]
  },
  todaysTasks: {
    totalLaborHours: 6,
    tasks: [
      { name: "Germinate sunflower trays", hours: 2, priority: "high", assigned: "John", status: "pending" },
      { name: "Clean 60 trays", hours: 2, priority: "medium", assigned: "Sarah", status: "in-progress" },
      { name: "Move radish to grow room", hours: 2, priority: "high", assigned: "Mike", status: "pending" }
    ],
    suggestions: [
      { action: "Assign 1 person to clean/transfer simultaneously", impact: "Save 0.5 hours" },
      { action: "Ensure trays prepped before 11 AM", impact: "Prevent bottlenecks" }
    ]
  },
  upcomingEvents: [
    {
      name: "Saturday Harvest: 24 trays of Pea Shoots",
      laborRequired: 12,
      daysAway: 2,
      preparations: [
        { task: "Confirm 2 team members assigned", status: "done" },
        { task: "Prep clamshells Friday afternoon", status: "pending" },
        { task: "Cold storage available", status: "verified" }
      ]
    },
    {
      name: "New client tasting with Chef Rivera",
      laborRequired: 3,
      daysAway: 4,
      preparations: [
        { task: "Prep Basil + Rainbow Radish samples", status: "pending" },
        { task: "Schedule delivery slot", status: "pending" }
      ]
    }
  ],
  customerTouchpoints: [
    {
      customer: "Chef Rivera",
      lastContact: "2 months ago",
      status: "dormant",
      suggestedAction: "Reach out with summer blend promo",
      urgency: "high",
      value: "High-value customer"
    },
    {
      customer: "Chef Lin",
      lastContact: "5 days ago",
      status: "engaged",
      suggestedAction: "Follow-up call (opened email but no response)",
      urgency: "medium",
      value: "Regular customer"
    },
    {
      customer: "Green Bistro",
      lastContact: "3 weeks ago",
      status: "at-risk",
      suggestedAction: "Check in on satisfaction",
      urgency: "medium",
      value: "Bulk buyer"
    }
  ],
  strategicNotes: [
    {
      note: "Pea Shoots have consistently 15% lower yield in Rack 4B",
      investigation: "investigate light intensity or airflow",
      priority: "medium",
      impact: "yield-optimization"
    },
    {
      note: "Labor costs up 15% vs last quarter",
      investigation: "consider cross-training team to reduce specialization bottlenecks",
      priority: "high",
      impact: "cost-reduction"
    },
    {
      note: "Haven't logged COGS breakdown since last month",
      investigation: "update for more accurate profit margin tracking",
      priority: "low",
      impact: "reporting"
    }
  ],
  rdOpportunities: [
    {
      experiment: "Try lower EC on radish next round",
      goal: "reduce purpling",
      status: "planned",
      impact: "quality-improvement"
    },
    {
      experiment: "Offset grow lights 30 mins",
      goal: "reduce grid load cost",
      status: "testing",
      impact: "cost-reduction"
    },
    {
      experiment: "Test new microgreen variety (Purple Radish)",
      goal: "expand product line",
      status: "research",
      impact: "revenue-growth"
    }
  ],
  systemAlerts: [
    {
      alert: "Sensor in Grow Room 3 has not reported in 12 hours",
      severity: "high",
      action: "Check sensor connection and battery"
    },
    {
      alert: "Tray washer filter may need replacement",
      severity: "medium",
      action: "Order replacement filter, check pressure readings"
    },
    {
      alert: "ESP32 #21 reported inconsistent temp spikes",
      severity: "medium",
      action: "Recalibrate sensor or replace unit"
    }
  ]
};

// Type definitions
type CategoryStatus = 'good' | 'warning' | 'attention' | 'critical';

type QuickAction = {
  text: string;
  icon: any;
  onClick: () => void;
};

// Executive Summary Data
const executiveSummaryData = {
  heroMetrics: {
    businessHealthScore: 78,
    weeklyPerformance: {
      current: 1920,
      target: 2120,
      trend: "down"
    },
    criticalItems: 5,
    cashPosition: 45
  },
  categories: [
    {
      id: "financial",
      title: "Financial Health",
      icon: FaDollarSign,
      status: "warning" as CategoryStatus,
      mainMetric: "Revenue -9.4%",
      trend: "down",
      keyInsights: [
        "2 weeks consecutive revenue decline",
        "Utility costs up 12% vs last month"
      ],
      alertCount: 2,
      quickActions: [
        { text: "Review Costs", icon: FaFileInvoiceDollar, onClick: () => {} },
        { text: "View P&L", icon: FaChartLine, onClick: () => {} }
      ]
    },
    {
      id: "operations",
      title: "Operational Excellence", 
      icon: FaTasks,
      status: "good" as CategoryStatus,
      mainMetric: "6hrs scheduled",
      trend: "stable",
      keyInsights: [
        "3 high-priority tasks today",
        "Labor efficiency stable"
      ],
      alertCount: 0,
      quickActions: [
        { text: "View Tasks", icon: FaClipboardList, onClick: () => {} },
        { text: "Schedule Review", icon: FaCalendarCheck, onClick: () => {} }
      ]
    },
    {
      id: "growth",
      title: "Growth & Strategy",
      icon: FaRocket,
      status: "attention" as CategoryStatus,
      mainMetric: "3 dormant customers",
      trend: "stable",
      keyInsights: [
        "Opportunity: +$180/week revenue",
        "New product R&D in progress"
      ],
      alertCount: 1,
      quickActions: [
        { text: "Contact Customers", icon: FaPhone, onClick: () => {} },
        { text: "View Pipeline", icon: FaEye, onClick: () => {} }
      ]
    },
    {
      id: "quality",
      title: "Quality & Compliance",
      icon: FaCheckCircle,
      status: "good" as CategoryStatus,
      mainMetric: "All systems green",
      trend: "stable",
      keyInsights: [
        "Quality metrics stable",
        "No compliance issues"
      ],
      alertCount: 0,
      quickActions: [
        { text: "Check Systems", icon: FaCog, onClick: () => {} },
        { text: "Review Alerts", icon: FaExclamationTriangle, onClick: () => {} }
      ]
    },
    {
      id: "risk",
      title: "Risk & Mitigation",
      icon: FaShieldAlt,
      status: "attention" as CategoryStatus,
      mainMetric: "3 system alerts",
      trend: "stable",
      keyInsights: [
        "1 high-severity sensor issue",
        "Equipment maintenance due"
      ],
      alertCount: 3,
      quickActions: [
        { text: "View Alerts", icon: FaExclamationTriangle, onClick: () => {} },
        { text: "Risk Report", icon: FaClipboardList, onClick: () => {} }
      ]
    },
    {
      id: "team",
      title: "Team & Capacity",
      icon: FaUsers,
      status: "good" as CategoryStatus, 
      mainMetric: "100% staffed",
      trend: "stable",
      keyInsights: [
        "Team productivity stable",
        "Cross-training opportunities"
      ],
      alertCount: 0,
      quickActions: [
        { text: "Team Status", icon: FaUsers, onClick: () => {} },
        { text: "Schedule View", icon: FaCalendarAlt, onClick: () => {} }
      ]
    }
  ]
};

// View Types
type DashboardView = 'executive' | 'financial' | 'operations' | 'growth' | 'quality' | 'risk' | 'team';

// Hero Metrics Component
const HeroMetrics = () => {
  const { heroMetrics } = executiveSummaryData;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-4">Business Health</p>
              <CircularProgress 
                value={heroMetrics.businessHealthScore} 
                size={80} 
                strokeWidth={6}
                className="mx-auto"
              />
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <FaTrophy className="text-white w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Weekly Revenue</p>
              <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                ${heroMetrics.weeklyPerformance.current.toLocaleString()}
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                Target: ${heroMetrics.weeklyPerformance.target.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              {heroMetrics.weeklyPerformance.trend === "down" ? 
                <FaArrowDown className="text-white w-6 h-6" /> :
                <FaArrowUp className="text-white w-6 h-6" />
              }
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Critical Items</p>
              <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">{heroMetrics.criticalItems}</p>
              <p className="text-sm text-orange-600 dark:text-orange-400">Need attention</p>
            </div>
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
              <FaExclamationTriangle className="text-white w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Cash Position</p>
              <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{heroMetrics.cashPosition}</p>
              <p className="text-sm text-purple-600 dark:text-purple-400">Days remaining</p>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
              <FaDollarSign className="text-white w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Category Card Component
const CategoryCard = ({ 
  category, 
  onClick 
}: { 
  category: typeof executiveSummaryData.categories[0];
  onClick: () => void;
}) => {
  const statusColors: Record<CategoryStatus, string> = {
    good: "border-green-200 dark:border-green-700 bg-green-50/50 dark:bg-green-900/10",
    warning: "border-yellow-200 dark:border-yellow-700 bg-yellow-50/50 dark:bg-yellow-900/10", 
    attention: "border-orange-200 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-900/10",
    critical: "border-red-200 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10"
  };

  const statusDots: Record<CategoryStatus, string> = {
    good: "bg-green-500",
    warning: "bg-yellow-500",
    attention: "bg-orange-500", 
    critical: "bg-red-500"
  };

  const handleQuickAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation(); // Prevent card click
    action();
  };

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${statusColors[category.status]}`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
              <category.icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{category.title}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${statusDots[category.status]}`}></div>
                <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{category.status}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {category.alertCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {category.alertCount}
              </Badge>
            )}
            <FaChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{category.mainMetric}</p>
          </div>
          
          <div className="space-y-1">
            {category.keyInsights.map((insight, index) => (
              <p key={index} className="text-sm text-gray-600 dark:text-gray-400">
                • {insight}
              </p>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2 mb-3">
            {category.quickActions.map((action, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className="flex-1 h-8 text-xs hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={(e) => handleQuickAction(e, action.onClick)}
              >
                <action.icon className="w-3 h-3 mr-1" />
                {action.text}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="w-full">
            View Details <FaChevronRight className="w-3 h-3 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Executive Summary Component  
const ExecutiveSummary = ({ 
  onCategoryClick 
}: { 
  onCategoryClick: (categoryId: string) => void;
}) => {
  return (
    <div className="space-y-8">
      {/* Hero Metrics */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Strategic Command Center
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Executive overview of your vertical farming operations
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Last updated: {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
        <HeroMetrics />
      </div>

      {/* Category Grid */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
          Strategic Areas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {executiveSummaryData.categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onClick={() => onCategoryClick(category.id)}
            />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Immediate Actions Required
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start h-auto p-4">
              <FaExclamationTriangle className="w-4 h-4 mr-3 text-orange-500" />
              <div className="text-left">
                <p className="font-medium">Check Sensor Issue</p>
                <p className="text-sm text-gray-600">Grow Room 3 offline 12h</p>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-auto p-4">
              <FaUsers className="w-4 h-4 mr-3 text-blue-500" />
              <div className="text-left">
                <p className="font-medium">Contact Dormant Customers</p>
                <p className="text-sm text-gray-600">Potential +$180/week</p>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-auto p-4">
              <FaCog className="w-4 h-4 mr-3 text-green-500" />
              <div className="text-left">
                <p className="font-medium">Optimize Overwatering</p>
                <p className="text-sm text-gray-600">Save $0.08/tray</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Strategic Card Component
const StrategicCard = ({ 
  title, 
  icon: Icon, 
  children, 
  priority = "normal",
  className = "" 
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
  priority?: "low" | "normal" | "high" | "urgent";
  className?: string;
}) => {
  const priorityStyles = {
    low: "border-gray-200 dark:border-gray-700",
    normal: "border-blue-200 dark:border-blue-800",
    high: "border-yellow-400 dark:border-yellow-600",
    urgent: "border-red-400 dark:border-red-600"
  };

  return (
    <Card className={`${priorityStyles[priority]} ${className} hover:shadow-lg transition-shadow duration-300`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  );
};

// Action Button Component
const ActionButton = ({ 
  action, 
  impact, 
  urgency,
  onClick = () => {} 
}: {
  action: string;
  impact: string;
  urgency: "low" | "medium" | "high";
  onClick?: () => void;
}) => {
  const urgencyColors = {
    low: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
    medium: "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100",
    high: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
  };

  return (
    <div className={`p-3 rounded-lg border ${urgencyColors[urgency]} cursor-pointer transition-colors`} onClick={onClick}>
      <p className="font-medium text-sm">{action}</p>
      <p className="text-xs opacity-75">{impact}</p>
    </div>
  );
};

// Progress Indicator Component
const ProgressIndicator = ({ 
  current, 
  target, 
  label,
  unit = "",
  inverse = false 
}: {
  current: number;
  target: number;
  label: string;
  unit?: string;
  inverse?: boolean;
}) => {
  const percentage = Math.min(100, (current / target) * 100);
  const isOnTrack = inverse ? current <= target : current >= target;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {current.toFixed(2)}{unit} / {target.toFixed(2)}{unit}
        </span>
      </div>
      <Progress 
        value={percentage} 
        className={`h-2 ${isOnTrack ? 'text-green-500' : 'text-red-500'}`}
      />
    </div>
  );
};

// Achievement Badge Component
const AchievementBadge = ({ 
  title, 
  description, 
  earned = false,
  streak = 0 
}: {
  title: string;
  description: string;
  earned?: boolean;
  streak?: number;
}) => {
  return (
    <div className={`p-3 rounded-lg border ${
      earned 
        ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20" 
        : "border-gray-300 bg-gray-50 dark:bg-gray-800"
    }`}>
      <div className="flex items-center gap-2 mb-1">
        {earned ? (
          <FaTrophy className="text-yellow-500 w-4 h-4" />
        ) : (
          <FaBullseye className="text-gray-400 w-4 h-4" />
        )}
        <span className={`font-semibold text-sm ${earned ? "text-yellow-700 dark:text-yellow-300" : "text-gray-600"}`}>
          {title}
        </span>
        {streak > 0 && (
          <div className="flex items-center gap-1">
            <FaFire className="text-orange-500 w-3 h-3" />
            <span className="text-xs font-bold text-orange-600">{streak}</span>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
};

// Trend Indicator Component
const TrendIndicator = ({ 
  value, 
  trend, 
  label 
}: {
  value: string;
  trend: "up" | "down" | "stable";
  label: string;
}) => {
  return (
    <div className="flex items-center gap-2">
      <span className="font-bold text-lg">{value}</span>
      {trend === "up" && <FaArrowUp className="text-green-500 w-4 h-4" />}
      {trend === "down" && <FaArrowDown className="text-red-500 w-4 h-4" />}
      {trend === "stable" && <div className="w-4 h-1 bg-gray-400 rounded"></div>}
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
    </div>
  );
};

// Navigation Header Component
const NavigationHeader = ({ 
  view, 
  onBackToExecutive,
  currentTime 
}: { 
  view: DashboardView;
  onBackToExecutive: () => void;
  currentTime: Date;
}) => {
  const viewTitles = {
    executive: 'Strategic Command Center',
    financial: 'Financial Health',
    operations: 'Operational Excellence', 
    growth: 'Growth & Strategy',
    quality: 'Quality & Compliance',
    risk: 'Risk & Mitigation',
    team: 'Team & Capacity'
  };

  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center space-x-4">
        {view !== 'executive' && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onBackToExecutive}
            className="flex items-center space-x-2"
          >
            <FaArrowLeft className="w-4 h-4" />
            <span>Back to Overview</span>
          </Button>
        )}
        <div>
          <h1 className="text-3xl font-bold text-green-900 dark:text-green-100">
            {viewTitles[view]}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {currentTime.toLocaleDateString()} • {currentTime.toLocaleTimeString()}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Badge variant="outline" className="text-green-600 dark:text-green-400">
          <FaBullseye className="w-3 h-3 mr-1" />
          Q4 Goals Active
        </Badge>
      </div>
    </div>
  );
};

// Detailed View Component
const DetailedView = ({ 
  view,
  onBackToExecutive 
}: { 
  view: DashboardView;
  onBackToExecutive: () => void;
}) => {
  // Filter sections based on current view
  const renderSectionsForView = (currentView: DashboardView) => {
    switch (currentView) {
      case 'financial':
        return (
          <>
            {/* Reduce Costs */}
            <StrategicCard 
              title="💸 Reduce Costs" 
              icon={FaDollarSign}
              priority="high"
              className="xl:col-span-1"
            >
              <div className="space-y-4">
                <ProgressIndicator 
                  current={strategicData.costs.currentWeeklyCostPerTray}
                  target={strategicData.costs.targetCostPerTray}
                  label="Current weekly cost/tray"
                  unit="$"
                  inverse={true}
                />
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Suggestions:</h4>
                  {strategicData.costs.suggestions.map((suggestion, index) => (
                    <ActionButton
                      key={index}
                      action={suggestion.action}
                      impact={`-$${suggestion.savings.toFixed(2)}/tray`}
                      urgency={suggestion.urgency as "low" | "medium" | "high"}
                    />
                  ))}
                </div>

                {strategicData.costs.alerts.map((alert, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-sm">
                    <FaExclamationTriangle className="text-yellow-500 w-4 h-4" />
                    <span>{alert.message}</span>
                  </div>
                ))}
              </div>
            </StrategicCard>

            {/* Increase Sales */}
            <StrategicCard 
              title="📈 Increase Sales" 
              icon={FaChartLine}
              priority="high"
              className="xl:col-span-2"
            >
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Current Weekly Revenue</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">${strategicData.sales.currentWeeklyRevenue.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">4-Week Average</p>
                    <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">${strategicData.sales.fourWeekAverage.toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Growth Opportunities:</h4>
                  {strategicData.sales.suggestions.map((suggestion, index) => (
                    <ActionButton
                      key={index}
                      action={suggestion.action}
                      impact={suggestion.impact}
                      urgency={suggestion.urgency as "low" | "medium" | "high"}
                    />
                  ))}
                </div>

                {strategicData.sales.alerts.map((alert, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-sm">
                    <FaExclamationTriangle className="text-yellow-500 w-4 h-4" />
                    <span>{alert.message}</span>
                  </div>
                ))}
              </div>
            </StrategicCard>
          </>
        );

      case 'operations':
        return (
          <>
            {/* Today's Tasks */}
            <StrategicCard 
              title="✅ Today's Tasks" 
              icon={FaTasks}
              priority="urgent"
              className="xl:col-span-1"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Labor required: <span className="text-lg font-bold">{strategicData.todaysTasks.totalLaborHours}</span> man-hours</p>
                </div>

                <div className="space-y-3">
                  {strategicData.todaysTasks.tasks.map((task, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{task.name}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{task.hours}h • {task.assigned}</p>
                      </div>
                      <Badge variant={task.status === "done" ? "default" : task.status === "in-progress" ? "secondary" : "outline"}>
                        {task.status}
                      </Badge>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Optimization:</h4>
                  {strategicData.todaysTasks.suggestions.map((suggestion, index) => (
                    <div key={index} className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                      <p className="font-medium">{suggestion.action}</p>
                      <p className="text-xs opacity-75">{suggestion.impact}</p>
                    </div>
                  ))}
                </div>
              </div>
            </StrategicCard>

            {/* Upcoming Events */}
            <StrategicCard 
              title="📅 Upcoming Events (Next 7 Days)" 
              icon={FaCalendarAlt}
              priority="normal"
              className="xl:col-span-2"
            >
              <div className="space-y-4">
                {strategicData.upcomingEvents.map((event, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold">{event.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">⏱️ {event.laborRequired} man-hours required • {event.daysAway} days away</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {event.preparations.map((prep, prepIndex) => (
                        <div key={prepIndex} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                          {prep.status === "done" ? (
                            <FaCheckCircle className="text-green-500 w-4 h-4" />
                          ) : prep.status === "verified" ? (
                            <FaCheckCircle className="text-blue-500 w-4 h-4" />
                          ) : (
                            <FaClock className="text-yellow-500 w-4 h-4" />
                          )}
                          <span className={prep.status === "done" ? "line-through opacity-75" : ""}>{prep.task}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </StrategicCard>
          </>
        );

      case 'growth':
        return (
          <>
            {/* Customer Touchpoints */}
            <StrategicCard 
              title="📞 Customer Touchpoints (CRM Lite)" 
              icon={FaUsers}
              priority="high"
              className="xl:col-span-1"
            >
              <div className="space-y-3">
                {strategicData.customerTouchpoints.map((customer, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-sm">{customer.customer}</h4>
                      <Badge variant={customer.status === "dormant" ? "destructive" : customer.status === "at-risk" ? "secondary" : "default"}>
                        {customer.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Last contact: {customer.lastContact} • {customer.value}</p>
                    
                    <ActionButton
                      action={customer.suggestedAction}
                      impact={customer.urgency === "high" ? "High Priority" : "Follow up"}
                      urgency={customer.urgency as "low" | "medium" | "high"}
                    />
                  </div>
                ))}

                <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-sm">
                  <FaExclamationTriangle className="text-yellow-500 w-4 h-4 inline mr-2" />
                  Top 5 customers haven't ordered in 30+ days
                </div>
              </div>
            </StrategicCard>

            {/* R&D Opportunities */}
            <StrategicCard 
              title="🧪 R&D / Improvement Opportunities" 
              icon={FaFlask}
              priority="normal"
              className="xl:col-span-1"
            >
              <div className="space-y-3">
                {strategicData.rdOpportunities.map((opportunity, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-sm">{opportunity.experiment}</h4>
                      <Badge variant={opportunity.status === "testing" ? "default" : opportunity.status === "planned" ? "secondary" : "outline"}>
                        {opportunity.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Goal: {opportunity.goal}</p>
                    <span className="text-xs text-gray-500">{opportunity.impact}</span>
                  </div>
                ))}
                
                <Button variant="outline" size="sm" className="w-full">
                  <FaLightbulb className="w-4 h-4 mr-2" />
                  Add New Experiment
                </Button>
              </div>
            </StrategicCard>
          </>
        );

      case 'quality':
        return (
          <StrategicCard 
            title="🌱 Quality & Compliance Dashboard" 
            icon={FaCheckCircle}
            priority="normal"
            className="xl:col-span-3"
          >
            <div className="text-center py-8">
              <FaCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">All Systems Green</h3>
              <p className="text-gray-600 dark:text-gray-400">Quality metrics and compliance indicators are performing within expected ranges.</p>
              <Button variant="outline" className="mt-4">
                View Detailed Quality Reports
              </Button>
            </div>
          </StrategicCard>
        );

      case 'risk':
        return (
          <StrategicCard 
            title="🔧 System/Hardware Alerts" 
            icon={FaCog}
            priority="urgent"
            className="xl:col-span-3"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {strategicData.systemAlerts.map((alert, index) => (
                <div key={index} className={`p-4 rounded-lg border-l-4 ${
                  alert.severity === "high" ? "border-red-500 bg-red-50 dark:bg-red-900/20" :
                  "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-sm">{alert.alert}</h4>
                    <Badge variant={alert.severity === "high" ? "destructive" : "secondary"}>
                      {alert.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{alert.action}</p>
                  <Button variant="outline" size="sm">
                    Resolve
                  </Button>
                </div>
              ))}
            </div>
          </StrategicCard>
        );

      case 'team':
        return (
          <>
            <StrategicCard 
              title="🧠 Strategic Notes" 
              icon={FaBrain}
              priority="normal"
              className="xl:col-span-2"
            >
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Important but not urgent items for weekly review</p>
                
                {strategicData.strategicNotes.map((note, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <p className="font-medium text-sm mb-1">{note.note}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{note.investigation}</p>
                    <div className="flex justify-between items-center">
                      <Badge variant={note.priority === "high" ? "destructive" : note.priority === "medium" ? "secondary" : "outline"}>
                        {note.priority} priority
                      </Badge>
                      <span className="text-xs text-gray-500">{note.impact}</span>
                    </div>
                  </div>
                ))}
              </div>
            </StrategicCard>

            <StrategicCard 
              title="👥 Team Performance" 
              icon={FaUsers}
              priority="normal"
              className="xl:col-span-1"
            >
              <div className="text-center py-8">
                <FaUsers className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Team at Full Capacity</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">All positions staffed and productivity metrics are stable.</p>
                <div className="space-y-2 text-sm">
                  <p>• Cross-training opportunities identified</p>
                  <p>• Performance reviews up to date</p>
                  <p>• No scheduling conflicts</p>
                </div>
              </div>
            </StrategicCard>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {renderSectionsForView(view)}
    </div>
  );
};

// Circular Progress Component
const CircularProgress = ({ 
  value, 
  size = 120, 
  strokeWidth = 8, 
  className = "",
  showLabel = true 
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showLabel?: boolean;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  
  // Color based on value
  const getColor = (val: number) => {
    if (val >= 71) return "#10b981"; // green
    if (val >= 41) return "#f59e0b"; // yellow  
    return "#ef4444"; // red
  };

  const color = getColor(value);
  
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg 
        width={size} 
        height={size} 
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {value}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              /100
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function StrategicDashboardPage() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [view, setView] = useState<DashboardView>('executive');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCategoryClick = (categoryId: string) => {
    setView(categoryId as DashboardView);
  };

  const handleBackToExecutive = () => {
    setView('executive');
  };

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading user data...</div>;
  }

  return (
    <div className="flex-1 flex flex-col">
      <main className="flex-1 p-6 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 min-h-screen">
        {/* Navigation Header - Only show for non-executive views */}
        {view !== 'executive' && (
          <NavigationHeader 
            view={view}
            onBackToExecutive={handleBackToExecutive}
            currentTime={currentTime}
          />
        )}

        {/* Main Content - Conditional Rendering */}
        {view === 'executive' ? (
          <ExecutiveSummary onCategoryClick={handleCategoryClick} />
        ) : (
          <DetailedView view={view} onBackToExecutive={handleBackToExecutive} />
        )}
      </main>
    </div>
  );
}
