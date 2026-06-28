import { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../../../api/client';

/**
 * useCampaigns Hook
 * Custom hook for fetching and managing campaign data
 * 
 * Features:
 * - Automatic fetching on mount
 * - Auto-refresh interval (10 seconds)
 * - Search debouncing
 * - Real-time stats calculation
 * - Error handling
 * 
 * Returns:
 * - campaigns: array of campaign objects
 * - loading: boolean
 * - error: error message or null
 * - stats: object with total, active, completed, draft counts
 * - refetch: function to manually refresh data
 */
export const useCampaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    draft: 0
  });

  const refreshIntervalRef = useRef(null);

  // Fetch campaigns from API
  const fetchCampaigns = useCallback(async (searchQuery = '') => {
    try {
      setLoading(true);
      setError(null);

      const params = searchQuery ? { search: searchQuery } : {};
      const response = await apiClient.get('/campaigns', { params });

      const campaignList = response.data.campaigns || [];
      setCampaigns(campaignList);

      // Calculate stats
      const total = campaignList.length;
      const active = campaignList.filter(c => c.status === 'RUNNING').length;
      const completed = campaignList.filter(c => c.status === 'COMPLETED').length;
      const draft = campaignList.filter(c => c.status === 'DRAFT').length;

      setStats({ total, active, completed, draft });
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
      setError(err.message || 'Failed to fetch campaigns');
    } finally {
      setLoading(false);
    }
  }, []);

  // Set up auto-refresh
  useEffect(() => {
    // Initial fetch
    fetchCampaigns();

    // Auto-refresh every 10 seconds
    refreshIntervalRef.current = setInterval(() => {
      fetchCampaigns();
    }, 10000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchCampaigns]);

  return {
    campaigns,
    loading,
    error,
    stats,
    refetch: fetchCampaigns
  };
};

/**
 * useCampaignActions Hook
 * Custom hook for campaign-related actions
 * 
 * Returns:
 * - launchCampaign: function to launch a campaign
 * - pauseCampaign: function to pause a campaign
 * - completeCampaign: function to mark as complete
 * - deleteCampaign: function to delete a campaign
 * - updateCampaign: function to update a campaign
 * - createCampaign: function to create a new campaign
 * - loading: boolean
 * - error: error message or null
 */
export const useCampaignActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const launchCampaign = useCallback(async (campaignId) => {
    try {
      setLoading(true);
      setError(null);
      await apiClient.post(`/campaigns/${campaignId}/launch`);
      return true;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to launch campaign');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const pauseCampaign = useCallback(async (campaignId) => {
    try {
      setLoading(true);
      setError(null);
      await apiClient.post(`/campaigns/${campaignId}/pause`);
      return true;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to pause campaign');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const completeCampaign = useCallback(async (campaignId) => {
    try {
      setLoading(true);
      setError(null);
      await apiClient.post(`/campaigns/${campaignId}/complete`);
      return true;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to complete campaign');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCampaign = useCallback(async (campaignId) => {
    try {
      setLoading(true);
      setError(null);
      await apiClient.delete(`/campaigns/${campaignId}`);
      return true;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete campaign');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCampaign = useCallback(async (campaignId, data) => {
    try {
      setLoading(true);
      setError(null);
      await apiClient.put(`/campaigns/${campaignId}`, data);
      return true;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update campaign');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const createCampaign = useCallback(async (data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.post('/campaigns', data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create campaign');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    launchCampaign,
    pauseCampaign,
    completeCampaign,
    deleteCampaign,
    updateCampaign,
    createCampaign,
    loading,
    error
  };
};
