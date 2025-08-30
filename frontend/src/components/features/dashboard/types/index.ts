export type CategoryStatus = "good" | "warning" | "attention" | "critical";

export type QuickAction = {
  text: string;
  onClick: () => void;
};

export type DashboardView =
  | "executive"
  | "financial"
  | "operations"
  | "growth"
  | "quality"
  | "risk"
  | "team";

export interface CostBreakdown {
  category: string;
  percentage: number;
  amount: number;
}

export interface CostSuggestion {
  id?: string;
  action: string;
  savings: number;
  urgency: "low" | "medium" | "high";
}

export interface Alert {
  message: string;
  type: "warning" | "error" | "info";
}

export interface SalesSuggestion {
  id?: string;
  action: string;
  impact: string;
  urgency: "low" | "medium" | "high";
}

export interface CustomerMetrics {
  dormantCustomers: number;
  avgOrderSize: number;
  targetOrderSize: number;
}

export interface Task {
  id?: string;
  name: string;
  hours: number;
  priority: "low" | "medium" | "high";
  assigned: string;
  status: "pending" | "in-progress" | "completed";
}

export interface TaskSuggestion {
  action: string;
  impact: string;
}

export interface Preparation {
  id?: string;
  task: string;
  status: "pending" | "done" | "verified";
}

export interface UpcomingEvent {
  id?: string;
  name: string;
  laborRequired: number;
  daysAway: number;
  preparations: Preparation[];
}

export interface CustomerTouchpoint {
  customer: string;
  lastContact: string;
  status: "dormant" | "engaged" | "at-risk";
  suggestedAction: string;
  urgency: "low" | "medium" | "high";
  value: string;
}

export interface StrategicNote {
  id?: string;
  note: string;
  investigation: string;
  priority: "low" | "medium" | "high";
  impact: string;
}

export interface RDOpportunity {
  experiment: string;
  goal: string;
  status: "planned" | "testing" | "research";
  impact: string;
}

export interface SystemAlert {
  id?: string;
  alert: string;
  severity: "low" | "medium" | "high";
  action: string;
}

export interface CostsData {
  currentWeeklyCostPerTray: number;
  targetCostPerTray: number;
  lastMonthCostPerTray: number;
  costBreakdown: CostBreakdown[];
  suggestions: CostSuggestion[];
  alerts: Alert[];
}

export interface SalesData {
  currentWeeklyRevenue: number;
  fourWeekAverage: number;
  lastWeekRevenue: number;
  customerMetrics: CustomerMetrics;
  suggestions: SalesSuggestion[];
  alerts: Alert[];
}

export interface TodaysTasksData {
  totalLaborHours: number;
  tasks: Task[];
  suggestions: TaskSuggestion[];
}

export interface StrategicData {
  costs: CostsData;
  sales: SalesData;
  todaysTasks: TodaysTasksData;
  upcomingEvents: UpcomingEvent[];
  customerTouchpoints: CustomerTouchpoint[];
  strategicNotes: StrategicNote[];
  rdOpportunities: RDOpportunity[];
  systemAlerts: SystemAlert[];
}

export interface Category {
  id: string;
  title: string;
  status: CategoryStatus;
  priority: "low" | "medium" | "high" | "urgent";
  value: string;
  change: string;
  trend: "up" | "down" | "stable";
  description: string;
  quickActions: QuickAction[];
}

export interface ExecutiveSummaryData {
  categories: Category[];
}

export interface ProgressIndicatorProps {
  current: number;
  target: number;
  label: string;
  unit?: string;
  inverse?: boolean;
}

export interface TrendIndicatorProps {
  value: string;
  trend: "up" | "down" | "stable";
  label: string;
}

export interface AchievementBadgeProps {
  title: string;
  description: string;
  earned?: boolean;
  streak?: number;
}

export interface ActionButtonProps {
  action: string;
  impact: string;
  urgency: "low" | "medium" | "high";
  onClick?: () => void;
}

export interface StrategicCardProps {
  title: string;
  icon: any;
  children: React.ReactNode;
  priority?: "low" | "normal" | "high" | "urgent";
  className?: string;
}

export interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showLabel?: boolean;
}

export interface NavigationHeaderProps {
  view: DashboardView;
  onBackToExecutive: () => void;
  currentTime: Date;
}

export interface CategoryCardProps {
  category: Category;
  onClick: () => void;
}

export interface ExecutiveSummaryProps {
  onCategoryClick: (categoryId: string) => void;
}

export interface DetailedViewProps {
  view: DashboardView;
  onBackToExecutive: () => void;
}
