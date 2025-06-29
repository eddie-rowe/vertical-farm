"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  AlertTriangle, 
  DollarSign,
  AlertCircle,
  Clock,
  RefreshCw,
  Loader2,
  Eye,
  CreditCard
} from "lucide-react";
import { businessManagementService, BusinessDispute } from "@/services/businessManagementService";

export default function DisputesView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [disputes, setDisputes] = useState<BusinessDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedDisputes = await businessManagementService.getDisputes(10);
      setDisputes(fetchedDisputes);
    } catch (err) {
      console.error('Failed to fetch disputes:', err);
      setError('Failed to load disputes from Square. Please check your Square integration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const filteredDisputes = disputes.filter(dispute => {
    const matchesSearch = dispute.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dispute.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dispute.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || dispute.status.toLowerCase() === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "under_review": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "won": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "lost": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "accepted": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "under_review": return <Clock className="h-4 w-4" />;
      case "won": return <AlertTriangle className="h-4 w-4" />;
      case "lost": return <AlertCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const totalDisputes = disputes.reduce((sum, dispute) => sum + dispute.amount, 0);
  const activeDisputes = disputes.filter(d => d.status.toLowerCase() === "under_review").length;
  const wonDisputes = disputes.filter(d => d.status.toLowerCase() === "won").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dispute Management</h2>
          <p className="text-gray-600 dark:text-gray-400">Track and manage payment disputes from Square ({disputes.length} disputes loaded)</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={fetchDisputes}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Disputes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{disputes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">${totalDisputes.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{activeDisputes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Won</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{wonDisputes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search disputes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="all">All Status</option>
          <option value="under_review">Under Review</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
          <option value="accepted">Accepted</option>
        </select>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">Loading disputes from Square...</p>
          </CardContent>
        </Card>
      )}

      {/* Disputes List */}
      {!loading && filteredDisputes.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
              No Disputes Found
            </h3>
            <p className="text-gray-500 dark:text-gray-500">
              {searchTerm || statusFilter !== "all" 
                ? "No disputes match your current filters."
                : "No payment disputes have been filed yet."}
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && filteredDisputes.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredDisputes.map((dispute) => (
            <Card key={dispute.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {dispute.id}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">{dispute.customer}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(dispute.status)}>
                      {getStatusIcon(dispute.status)}
                      <span className="ml-1">{dispute.status.replace('_', ' ')}</span>
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      ${dispute.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Reason:</span>
                    <span className="text-gray-900 dark:text-gray-100">{dispute.reason}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Created:</span>
                    <span className="text-gray-900 dark:text-gray-100">{dispute.createdAt}</span>
                  </div>
                  {dispute.dueDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Due Date:</span>
                      <span className="text-gray-900 dark:text-gray-100">{dispute.dueDate}</span>
                    </div>
                  )}
                  {dispute.cardBrand && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Card Brand:</span>
                      <div className="flex items-center gap-1">
                        <CreditCard className="h-4 w-4" />
                        <span className="text-gray-900 dark:text-gray-100">{dispute.cardBrand}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end mt-4">
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 