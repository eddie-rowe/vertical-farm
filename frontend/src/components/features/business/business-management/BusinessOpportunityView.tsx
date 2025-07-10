'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FaSearch, FaMapMarkerAlt, FaDollarSign, FaChartLine, FaBuilding, FaUser } from '@/lib/icons';

interface BusinessOpportunity {
  id: string;
  title: string;
  description: string;
  type: 'restaurant' | 'retail' | 'wholesale' | 'institutional' | 'direct';
  potentialValue: number;
  confidence: number;
  location: string;
  distance: string;
  contactInfo: {
    name: string;
    role: string;
    email: string;
    phone: string;
  };
  requirements: string[];
  status: 'new' | 'contacted' | 'negotiating' | 'closed-won' | 'closed-lost';
  dateFound: string;
  estimatedVolume: string;
}

interface MarketInsight {
  category: string;
  trend: 'up' | 'down' | 'stable';
  growth: number;
  description: string;
  icon: React.ReactNode;
}

export default function BusinessOpportunityView() {
  const [searchRadius, setSearchRadius] = useState('10');
  const [opportunityType, setOpportunityType] = useState('all');
  
  // Mock data - replace with actual API calls
  const opportunities: BusinessOpportunity[] = [
    {
      id: 'opp-001',
      title: 'Green Leaf Bistro',
      description: 'Farm-to-table restaurant looking for local organic produce supplier',
      type: 'restaurant',
      potentialValue: 15000,
      confidence: 85,
      location: 'Downtown District',
      distance: '2.3 miles',
      contactInfo: {
        name: 'Sarah Martinez',
        role: 'Head Chef',
        email: 'sarah@greenleafbistro.com',
        phone: '(555) 123-4567'
      },
      requirements: ['Organic certification', 'Daily delivery', 'Variety pack'],
      status: 'new',
      dateFound: '2024-01-24',
      estimatedVolume: '50-75 lbs/week'
    },
    {
      id: 'opp-002',
      title: 'Fresh Market Chain',
      description: 'Regional grocery chain expanding local produce section',
      type: 'retail',
      potentialValue: 45000,
      confidence: 72,
      location: 'Suburban Plaza',
      distance: '5.8 miles',
      contactInfo: {
        name: 'Mike Johnson',
        role: 'Produce Manager',
        email: 'mjohnson@freshmarket.com',
        phone: '(555) 987-6543'
      },
      requirements: ['Consistent supply', 'Competitive pricing', 'GAP certification'],
      status: 'contacted',
      dateFound: '2024-01-22',
      estimatedVolume: '200-300 lbs/week'
    },
    {
      id: 'opp-003',
      title: 'University Dining Services',
      description: 'Large university looking for sustainable food suppliers',
      type: 'institutional',
      potentialValue: 75000,
      confidence: 68,
      location: 'University Campus',
      distance: '8.2 miles',
      contactInfo: {
        name: 'Dr. Lisa Chen',
        role: 'Sustainability Director',
        email: 'l.chen@university.edu',
        phone: '(555) 456-7890'
      },
      requirements: ['Sustainability certification', 'Large volume capacity', 'Contract terms'],
      status: 'negotiating',
      dateFound: '2024-01-20',
      estimatedVolume: '500-800 lbs/week'
    }
  ];

  const marketInsights: MarketInsight[] = [
    {
      category: 'Local Restaurant Market',
      trend: 'up',
      growth: 12.5,
      description: 'Growing demand for locally sourced ingredients',
      icon: <FaBuilding className="h-5 w-5" />
    },
    {
      category: 'Organic Retail',
      trend: 'up',
      growth: 8.3,
      description: 'Increased consumer preference for organic produce',
      icon: <FaChartLine className="h-5 w-5" />
    },
    {
      category: 'Direct Sales',
      trend: 'stable',
      growth: 3.1,
      description: 'Steady growth in farmers market and CSA programs',
      icon: <FaUser className="h-5 w-5" />
    },
    {
      category: 'Institutional Sales',
      trend: 'up',
      growth: 15.2,
      description: 'Schools and hospitals prioritizing local sourcing',
      icon: <FaBuilding className="h-5 w-5" />
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'contacted':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'negotiating':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'closed-won':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'closed-lost':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return '📈';
      case 'down':
        return '📉';
      case 'stable':
        return '➡️';
      default:
        return '📊';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredOpportunities = opportunityType === 'all' 
    ? opportunities 
    : opportunities.filter(opp => opp.type === opportunityType);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Business Opportunity Finder
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Discover and track new business opportunities in your area
          </p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={searchRadius}
            onChange={(e) => setSearchRadius(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="5">5 miles</option>
            <option value="10">10 miles</option>
            <option value="25">25 miles</option>
            <option value="50">50 miles</option>
          </select>
          <Button className="bg-green-600 hover:bg-green-700">
            <FaSearch className="mr-2" />
            Find Opportunities
          </Button>
        </div>
      </div>

      <Tabs defaultValue="opportunities" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="opportunities" className="flex items-center gap-2">
            <FaSearch className="h-4 w-4" />
            Opportunities
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <FaChartLine className="h-4 w-4" />
            Market Insights
          </TabsTrigger>
          <TabsTrigger value="leads" className="flex items-center gap-2">
            <FaUser className="h-4 w-4" />
            Lead Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="opportunities" className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <select
              value={opportunityType}
              onChange={(e) => setOpportunityType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="restaurant">Restaurants</option>
              <option value="retail">Retail</option>
              <option value="wholesale">Wholesale</option>
              <option value="institutional">Institutional</option>
              <option value="direct">Direct Sales</option>
            </select>
          </div>

          <div className="grid gap-4">
            {filteredOpportunities.map((opportunity) => (
              <Card key={opportunity.id} className="border border-gray-200 dark:border-gray-700">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{opportunity.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {opportunity.description}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={getStatusColor(opportunity.status)}>
                        {opportunity.status.replace('-', ' ').toUpperCase()}
                      </Badge>
                      <span className={`text-sm font-semibold ${getConfidenceColor(opportunity.confidence)}`}>
                        {opportunity.confidence}% confidence
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <FaDollarSign className="h-4 w-4 text-green-600" />
                      <span className="font-semibold">
                        ${opportunity.potentialValue.toLocaleString()}/year
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaMapMarkerAlt className="h-4 w-4 text-gray-500" />
                      <span>{opportunity.location} ({opportunity.distance})</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Volume: {opportunity.estimatedVolume}
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-4">
                    <h5 className="font-semibold text-sm mb-2">Contact Information</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div>{opportunity.contactInfo.name} - {opportunity.contactInfo.role}</div>
                      <div>{opportunity.contactInfo.email}</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h5 className="font-semibold text-sm mb-2">Requirements</h5>
                    <div className="flex flex-wrap gap-2">
                      {opportunity.requirements.map((req, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {req}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      Found on {opportunity.dateFound}
                    </span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        Contact Lead
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {marketInsights.map((insight, index) => (
              <Card key={index} className="border border-gray-200 dark:border-gray-700">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                        {insight.icon}
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                        {insight.category}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getTrendIcon(insight.trend)}</span>
                      <span className={`font-semibold ${insight.trend === 'up' ? 'text-green-600' : insight.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                        {insight.growth > 0 ? '+' : ''}{insight.growth}%
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {insight.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle>Market Analysis</CardTitle>
              <CardDescription>
                Detailed market trends and opportunity analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg h-64 flex items-center justify-center">
                <div className="text-center">
                  <FaChartLine className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Advanced Analytics Coming Soon
                  </h3>
                  <p className="text-gray-500 dark:text-gray-500">
                    Detailed market analysis and trend forecasting will be available here
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leads" className="space-y-4">
          <Card className="border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle>Lead Pipeline</CardTitle>
              <CardDescription>
                Manage and track your sales pipeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg h-64 flex items-center justify-center">
                <div className="text-center">
                  <FaUser className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    CRM Integration Coming Soon
                  </h3>
                  <p className="text-gray-500 dark:text-gray-500">
                    Lead management and pipeline tracking will be available here
                  </p>
                  <Button className="mt-4" variant="outline">
                    Configure CRM Integration
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