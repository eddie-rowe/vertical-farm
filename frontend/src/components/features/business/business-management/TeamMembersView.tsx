"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  UserCheck, 
  Users,
  AlertCircle,
  Crown,
  RefreshCw,
  Loader2,
  Eye,
  Mail,
  Phone,
  MapPin
} from "lucide-react";
import { businessManagementService, BusinessTeamMember } from "@/services/businessManagementService";
import { FarmSearchAndFilter } from '@/components/ui/farm-search-and-filter';
import { useFarmSearch, useFarmFilters } from '@/hooks';
import type { FilterDefinition } from '@/components/ui/farm-search-and-filter';

export default function TeamMembersView() {
  const [teamMembers, setTeamMembers] = useState<BusinessTeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Standardized search and filter hooks
  const { searchTerm, setSearchTerm, clearSearch, hasSearch, filterItems: searchFilterItems } = useFarmSearch<BusinessTeamMember>({
    searchFields: ['name', 'email', 'role'],
    caseSensitive: false
  });
  
  const {
    filters,
    setFilter,
    removeFilter,
    clearAllFilters,
    getActiveFilterChips,
    filterItems: filterFilterItems,
    hasActiveFilters
  } = useFarmFilters<BusinessTeamMember>();

  // Filter definitions
  const filterDefinitions: FilterDefinition[] = [
    {
      id: 'status',
      label: 'Member Status',
      placeholder: 'Filter by status...',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'pending', label: 'Pending' }
      ]
    }
  ];

  // Filter change handlers
  const handleFilterChange = useCallback((filterId: string, value: string) => {
    setFilter(filterId, value);
  }, [setFilter]);

  const handleRemoveFilter = useCallback((filterId: string) => {
    removeFilter(filterId);
  }, [removeFilter]);

  // Combined filtering
  const filteredMembers = useMemo(() => {
    let result = teamMembers;
    
    // Apply search filter
    if (hasSearch) {
      result = searchFilterItems(result);
    }
    
    // Apply other filters
    if (hasActiveFilters) {
      result = filterFilterItems(result);
    }
    
    return result;
  }, [teamMembers, hasSearch, searchFilterItems, hasActiveFilters, filterFilterItems]);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedMembers = await businessManagementService.getTeamMembers(10);
      setTeamMembers(fetchedMembers);
    } catch (err) {
      console.error('Failed to fetch team members:', err);
      setError('Failed to load team members from Square. Please check your Square integration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "inactive": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "pending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case "owner": return <Crown className="h-4 w-4" />;
      case "admin": return <UserCheck className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const activeMembers = teamMembers.filter(m => m.status.toLowerCase() === "active").length;
  const owners = teamMembers.filter(m => m.role.toLowerCase() === "owner").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Team Management</h2>
          <p className="text-gray-600 dark:text-gray-400">Manage team members and roles from Square ({teamMembers.length} members loaded)</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={fetchTeamMembers}
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
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Members</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{teamMembers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{activeMembers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Owners</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{owners}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Locations</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {new Set(teamMembers.flatMap(m => m.locations)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Standardized Search and Filters */}
      <FarmSearchAndFilter
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search team members by name, email, or role..."
        filters={filterDefinitions}
        activeFilters={getActiveFilterChips(filterDefinitions)}
        onFilterChange={handleFilterChange}
        onRemoveFilter={handleRemoveFilter}
        onClearAllFilters={clearAllFilters}
      />

      {/* Results Summary */}
      {!loading && (
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>
            Showing {filteredMembers.length} of {teamMembers.length} members
          </span>
          {(hasSearch || hasActiveFilters) && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                clearSearch();
                clearAllFilters();
              }}
            >
              Clear all filters
            </Button>
          )}
        </div>
      )}

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
            <p className="text-gray-600 dark:text-gray-400">Loading team members from Square...</p>
          </CardContent>
        </Card>
      )}

      {/* Team Members List */}
      {!loading && filteredMembers.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
              No Team Members Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {teamMembers.length === 0 
                ? "No team members available in your Square account." 
                : "No members match your current search and filters."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Team Members List */}
      {!loading && filteredMembers.length > 0 && (
        <div className="space-y-4">
          {filteredMembers.map((member) => (
            <Card key={member.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{member.name}</h3>
                      <Badge className={getStatusColor(member.status)}>
                        {member.status}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        {getRoleIcon(member.role)}
                        {member.role}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Email</p>
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <p className="font-medium">{member.email || 'N/A'}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Phone</p>
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <p className="font-medium">{member.phone || 'N/A'}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Role</p>
                        <p className="font-medium">{member.role}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Locations</p>
                        <p className="font-medium">{member.locations.length} assigned</p>
                      </div>
                    </div>

                    {/* Locations */}
                    {member.locations && member.locations.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Assigned Locations</p>
                        <div className="flex gap-1 flex-wrap">
                          {member.locations.map((location, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              <MapPin className="h-3 w-3 mr-1" />
                              {location}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}


                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 