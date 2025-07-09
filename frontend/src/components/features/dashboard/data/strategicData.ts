import { StrategicData, ExecutiveSummaryData } from '../types';

// Strategic Operations Data
export const strategicData: StrategicData = {
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

// Executive Summary Data
export const executiveSummaryData: ExecutiveSummaryData = {
  categories: [
    {
      id: "financial",
      title: "Financial",
      status: "attention",
      priority: "high",
      value: "$1,920",
      change: "-9.4%",
      trend: "down",
      description: "Weekly revenue down vs 4-week average",
      quickActions: [
        { text: "Call 3 dormant customers", onClick: () => {} },
        { text: "Review pricing strategy", onClick: () => {} }
      ]
    },
    {
      id: "operations",
      title: "Operations",
      status: "good",
      priority: "medium",
      value: "85%",
      change: "+2.1%",
      trend: "up",
      description: "Operational efficiency trending positive",
      quickActions: [
        { text: "Optimize harvest schedule", onClick: () => {} },
        { text: "Review task assignments", onClick: () => {} }
      ]
    },
    {
      id: "growth",
      title: "Growth",
      status: "warning",
      priority: "medium",
      value: "12",
      change: "0%",
      trend: "stable",
      description: "Active grows on track, expansion ready",
      quickActions: [
        { text: "Plan next batch", onClick: () => {} },
        { text: "Review grow cycles", onClick: () => {} }
      ]
    },
    {
      id: "quality",
      title: "Quality",
      status: "good",
      priority: "low",
      value: "94%",
      change: "+1.2%",
      trend: "up",
      description: "Quality metrics excellent across all batches",
      quickActions: [
        { text: "Document best practices", onClick: () => {} },
        { text: "Train team on standards", onClick: () => {} }
      ]
    },
    {
      id: "risk",
      title: "Risk",
      status: "attention",
      priority: "high",
      value: "3",
      change: "+1",
      trend: "up",
      description: "System alerts requiring immediate attention",
      quickActions: [
        { text: "Address sensor issues", onClick: () => {} },
        { text: "Review maintenance schedule", onClick: () => {} }
      ]
    },
    {
      id: "team",
      title: "Team",
      status: "good",
      priority: "medium",
      value: "6h",
      change: "-0.5h",
      trend: "down",
      description: "Daily labor hours optimized",
      quickActions: [
        { text: "Assign pending tasks", onClick: () => {} },
        { text: "Review workload distribution", onClick: () => {} }
      ]
    }
  ]
}; 