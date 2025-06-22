"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Plus, 
  User, 
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  Calendar,
  Star,
  BarChart3,
  Download
} from "lucide-react";

// Mock data for performance tracking
const performanceData = {
  summary: {
    avgPerformance: 87.5,
    topPerformers: 3,
    needsImprovement: 1,
    completedGoals: 24
  },
  employees: [
    {
      id: "PF001",
      name: "Sarah Johnson",
      role: "Farm Manager",
      overallScore: 94,
      trend: "up",
      trendValue: 5.2,
      goals: {
        completed: 8,
        total: 10,
        percentage: 80
      },
      metrics: {
        productivity: 96,
        quality: 92,
        teamwork: 95,
        punctuality: 98,
        initiative: 91
      },
      achievements: ["Employee of the Month", "Leadership Excellence", "Innovation Award"],
      lastReview: "2024-01-01",
      nextReview: "2024-04-01",
      feedback: "Exceptional leadership and team coordination. Consistently exceeds expectations."
    },
    {
      id: "PF002",
      name: "Mike Chen",
      role: "Growth Technician",
      overallScore: 89,
      trend: "up",
      trendValue: 3.1,
      goals: {
        completed: 7,
        total: 8,
        percentage: 87.5
      },
      metrics: {
        productivity: 91,
        quality: 95,
        teamwork: 85,
        punctuality: 92,
        initiative: 88
      },
      achievements: ["Technical Excellence", "Safety Champion"],
      lastReview: "2024-01-01",
      nextReview: "2024-04-01",
      feedback: "Strong technical skills and attention to detail. Great problem-solving abilities."
    },
    {
      id: "PF003",
      name: "Emily Davis",
      role: "Harvest Specialist",
      overallScore: 92,
      trend: "stable",
      trendValue: 0.5,
      goals: {
        completed: 6,
        total: 7,
        percentage: 85.7
      },
      metrics: {
        productivity: 94,
        quality: 98,
        teamwork: 89,
        punctuality: 90,
        initiative: 85
      },
      achievements: ["Quality Excellence", "Customer Satisfaction"],
      lastReview: "2024-01-01",
      nextReview: "2024-04-01",
      feedback: "Consistently delivers high-quality work. Excellent attention to harvest standards."
    },
    {
      id: "PF004",
      name: "James Wilson",
      role: "Maintenance Tech",
      overallScore: 78,
      trend: "down",
      trendValue: -2.3,
      goals: {
        completed: 4,
        total: 8,
        percentage: 50
      },
      metrics: {
        productivity: 75,
        quality: 82,
        teamwork: 78,
        punctuality: 80,
        initiative: 70
      },
      achievements: ["Safety Compliance"],
      lastReview: "2024-01-01",
      nextReview: "2024-04-01",
      feedback: "Good technical skills but needs improvement in time management and goal completion."
    },
    {
      id: "PF005",
      name: "Alex Rodriguez",
      role: "Data Analyst",
      overallScore: 86,
      trend: "up",
      trendValue: 4.8,
      goals: {
        completed: 5,
        total: 6,
        percentage: 83.3
      },
      metrics: {
        productivity: 88,
        quality: 90,
        teamwork: 82,
        punctuality: 94,
        initiative: 89
      },
      achievements: ["Data Innovation", "Process Improvement"],
      lastReview: "2024-01-01",
      nextReview: "2024-04-01",
      feedback: "Strong analytical skills and innovative approaches to data insights."
    }
  ]
};

export default function PerformanceView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [performanceFilter, setPerformanceFilter] = useState("all");

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    if (score >= 80) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    if (score >= 70) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "up") return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend === "down") return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <span className="h-4 w-4 text-gray-600">—</span>;
  };

  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return "excellent";
    if (score >= 80) return "good";
    if (score >= 70) return "average";
    return "needs-improvement";
  };

  const filteredEmployees = performanceData.employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.role.toLowerCase().includes(searchTerm.toLowerCase());
    const performanceLevel = getPerformanceLevel(employee.overallScore);
    const matchesPerformance = performanceFilter === "all" || performanceLevel === performanceFilter;
    return matchesSearch && matchesPerformance;
  });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Performance</p>
                <p className="text-2xl font-bold">{performanceData.summary.avgPerformance}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Top Performers</p>
                <p className="text-2xl font-bold">{performanceData.summary.topPerformers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Needs Improvement</p>
                <p className="text-2xl font-bold">{performanceData.summary.needsImprovement}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Completed Goals</p>
                <p className="text-2xl font-bold">{performanceData.summary.completedGoals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Team Performance</h3>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Reviews
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Goal
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search employees or roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <select
          value={performanceFilter}
          onChange={(e) => setPerformanceFilter(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background"
        >
          <option value="all">All Performance</option>
          <option value="excellent">Excellent (90+)</option>
          <option value="good">Good (80-89)</option>
          <option value="average">Average (70-79)</option>
          <option value="needs-improvement">Needs Improvement (&lt;70)</option>
        </select>
      </div>

      {/* Performance Cards */}
      <div className="grid gap-4">
        {filteredEmployees.map((employee) => (
          <Card key={employee.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-lg">{employee.name}</h4>
                    <Badge variant="outline">{employee.role}</Badge>
                    <Badge className={getPerformanceColor(employee.overallScore)}>
                      {employee.overallScore}% Overall
                    </Badge>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(employee.trend)}
                      <span className={`text-sm ${employee.trend === 'up' ? 'text-green-600' : employee.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                        {employee.trend === 'up' ? '+' : employee.trend === 'down' ? '' : ''}{employee.trendValue}%
                      </span>
                    </div>
                  </div>
                  
                  {/* Goals Progress */}
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Goal Completion</span>
                      <span className="text-sm">{employee.goals.completed}/{employee.goals.total} ({employee.goals.percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${employee.goals.percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {Object.entries(employee.metrics).map(([metric, score]) => (
                      <div key={metric} className="text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{metric}</p>
                        <p className="font-bold text-lg">{score}%</p>
                        <div className="w-full bg-gray-200 rounded-full h-1 mt-1 dark:bg-gray-700">
                          <div 
                            className={`h-1 rounded-full ${score >= 90 ? 'bg-green-500' : score >= 80 ? 'bg-blue-500' : score >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${score}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Achievements */}
                  <div>
                    <p className="text-sm font-medium mb-2">Achievements:</p>
                    <div className="flex flex-wrap gap-1">
                      {employee.achievements.map((achievement, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          <Award className="h-3 w-3 mr-1" />
                          {achievement}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Review Information */}
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p><span className="font-medium">Last Review:</span> {new Date(employee.lastReview).toLocaleDateString()}</p>
                    <p><span className="font-medium">Next Review:</span> {new Date(employee.nextReview).toLocaleDateString()}</p>
                    <p className="mt-2"><span className="font-medium">Feedback:</span> {employee.feedback}</p>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Calendar className="h-4 w-4 mr-1" />
                    Review
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 