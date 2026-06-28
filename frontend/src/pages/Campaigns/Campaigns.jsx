import { useState, useEffect, useCallback, useMemo } from 'react';
import { Box } from '@mui/material';
import CustomSnackbar from '../../components/Snackbar';
import apiClient from '../../api/client';

// Import redesigned components
import CampaignHeader from './components/CampaignHeader';
import CampaignList from './components/CampaignList';
import CampaignDetailsPanel from './components/CampaignDetailsPanel';
import CreateCampaignWizard from './components/CreateCampaignWizard';
import EditCampaignForm from './components/EditCampaignForm';
import ManualSendDialog from './components/ManualSendDialog';
import {
  DeleteConfirmationDialog,
  LaunchConfirmationDialog,
  ScheduleConfirmationDialog
} from './components/ConfirmationDialogs';
import { createCampaignHandlers, estimateReach } from './integrationHelpers';

/**
 * Main Campaigns Container Component
 * 
 * Integrates all Phase 1-3 components for complete campaign management UI
 * Features:
 * - Clean card-based layout with virtual scrolling
 * - Step-by-step campaign creation wizard (6 steps)
 * - Modular campaign editing form
 * - Confirmation dialogs for critical actions
 * - Real-time search and filtering
 * - Responsive design (mobile/tablet/desktop)
 * - 60fps smooth scrolling and interactions
 * - Accessibility compliant (WCAG AA)
 */
export default function Campaigns() {
  // ============ STATE MANAGEMENT ============

  // Campaign data management
  const [campaigns, setCampaigns] = useState([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    draft: 0
  });

  // UI state for modals and panels
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [detailsPanelOpen, setDetailsPanelOpen] = useState(false);
  const [createWizardOpen, setCreateWizardOpen] = useState(false);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [manualSendOpen, setManualSendOpen] = useState(false);
  
  // Confirmation dialogs
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [launchConfirmOpen, setLaunchConfirmOpen] = useState(false);
  const [scheduleConfirmOpen, setScheduleConfirmOpen] = useState(false);

  // Search and filter
  const [searchValue, setSearchValue] = useState('');
  const [filterValue, setFilterValue] = useState('');

  // Notification
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Estimated reach for launch confirmation
  const [estimatedReachValue, setEstimatedReachValue] = useState(0);

  // ============ DATA FETCHING ============

  /**
   * Fetch all campaigns from API
   */
  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/campaigns');
      const campaignsList = response.data.campaigns || [];
      setCampaigns(campaignsList);

      // Calculate stats
      const total = campaignsList.length;
      const active = campaignsList.filter(c => c.status === 'RUNNING').length;
      const completed = campaignsList.filter(c => c.status === 'COMPLETED').length;
      const draft = campaignsList.filter(c => c.status === 'DRAFT').length;

      setStats({ total, active, completed, draft });
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load campaigns',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // ============ API HANDLERS ============

  // Create campaign handlers using integration helpers
  const handlers = useMemo(
    () => createCampaignHandlers(setSnackbar, fetchCampaigns, setLoading),
    [fetchCampaigns]
  );

  // Auto-refresh campaigns every 10 seconds for status updates
  useEffect(() => {
    fetchCampaigns();
    const refreshInterval = setInterval(() => {
      fetchCampaigns();
    }, 10000);
    return () => clearInterval(refreshInterval);
  }, [fetchCampaigns]);

  // ============ SEARCH AND FILTERING ============

  /**
   * Apply search and filter to campaigns
   */
  useEffect(() => {
    let result = campaigns;

    // Apply status filter
    if (filterValue) {
      result = result.filter(c => c.status === filterValue);
    }

    // Apply search filter
    if (searchValue.trim()) {
      const searchLower = searchValue.toLowerCase();
      result = result.filter(c =>
        (c.name && c.name.toLowerCase().includes(searchLower)) ||
        (c.topic && c.topic.toLowerCase().includes(searchLower)) ||
        (c.description && c.description.toLowerCase().includes(searchLower))
      );
    }

    setFilteredCampaigns(result);
  }, [campaigns, searchValue, filterValue]);

  // ============ EVENT HANDLERS ============

  /**
   * Handle search input (debounced)
   */
  const handleSearch = useCallback((value) => {
    setSearchValue(value);
  }, []);

  /**
   * Handle filter change
   */
  const handleFilterChange = useCallback((value) => {
    setFilterValue(value);
  }, []);

  /**
   * Open campaign details panel
   */
  const handleViewCampaign = useCallback((campaign) => {
    setSelectedCampaign(campaign);
    setDetailsPanelOpen(true);
  }, []);

  /**
   * Open campaign edit form
   */
  const handleEditCampaign = useCallback((campaign) => {
    setSelectedCampaign(campaign);
    setEditFormOpen(true);
  }, []);

  /**
   * Open launch confirmation dialog and calculate estimated reach
   */
  const handleLaunchCampaign = useCallback(async (campaign) => {
    setSelectedCampaign(campaign);
    
    // Estimate reach based on target segment
    const segment = campaign.targetAudience?.segments?.[0] || 'ALL';
    const reach = await estimateReach(segment);
    setEstimatedReachValue(reach);
    
    setLaunchConfirmOpen(true);
  }, []);

  /**
   * Pause running campaign
   */
  const handlePauseCampaign = useCallback(async (campaign) => {
    try {
      await handlers.onPauseCampaign(campaign._id);
      setDetailsPanelOpen(false);
    } catch (error) {
      console.error('Failed to pause campaign:', error);
    }
  }, [handlers]);

  /**
   * Resume paused campaign
   */
  const handleResumeCampaign = useCallback(async (campaign) => {
    try {
      await handlers.onResumeCampaign(campaign._id);
      setDetailsPanelOpen(false);
    } catch (error) {
      console.error('Failed to resume campaign:', error);
    }
  }, [handlers]);

  /**
   * Mark campaign as completed
   */
  const handleCompleteCampaign = useCallback(async (campaign) => {
    try {
      await handlers.onCompleteCampaign(campaign._id);
      setDetailsPanelOpen(false);
    } catch (error) {
      console.error('Failed to complete campaign:', error);
    }
  }, [handlers]);

  /**
   * Open delete confirmation dialog
   */
  const handleDeleteCampaign = useCallback((campaign) => {
    setSelectedCampaign(campaign);
    setDeleteConfirmOpen(true);
  }, []);

  /**
   * Open manual send bulk dialog
   */
  const handleManualSendCampaign = useCallback((campaign) => {
    setSelectedCampaign(campaign);
    setManualSendOpen(true);
  }, []);

  /**
   * Open schedule confirmation dialog
   */
  const handleScheduleCampaign = useCallback(async (campaign) => {
    const scheduledAt = campaign?.scheduledAt;

    if (!scheduledAt) {
      setSnackbar({
        open: true,
        message: 'Set a future schedule time before scheduling this campaign.',
        severity: 'warning'
      });
      return;
    }

    const segment = campaign.targetAudience?.segments?.[0] || 'ALL';
    const reach = await estimateReach(segment);

    setSelectedCampaign(campaign);
    setEstimatedReachValue(reach);
    setScheduleConfirmOpen(true);
  }, []);

  // ============ FORM HANDLERS ============

  /**
   * Handle campaign creation from wizard
   */
  const handleCreateCampaign = useCallback(async (formData) => {
    try {
      await handlers.onCreateCampaign(formData);
      setCreateWizardOpen(false);
      setSnackbar({
        open: true,
        message: 'Campaign created successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Failed to create campaign:', error);
    }
  }, [handlers]);

  /**
   * Handle campaign update from edit form
   */
  const handleUpdateCampaign = useCallback(async (formData) => {
    try {
      if (!selectedCampaign) return;
      await handlers.onUpdateCampaign(selectedCampaign._id, formData);
      setEditFormOpen(false);
      setDetailsPanelOpen(false);
      setSnackbar({
        open: true,
        message: 'Campaign updated successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Failed to update campaign:', error);
    }
  }, [handlers, selectedCampaign]);

  // ============ CONFIRMATION HANDLERS ============

  /**
   * Handle delete confirmation
   */
  const handleConfirmDelete = useCallback(async () => {
    try {
      if (!selectedCampaign) return;
      await handlers.onDeleteCampaign(selectedCampaign._id);
      setDeleteConfirmOpen(false);
      setDetailsPanelOpen(false);
      setSnackbar({
        open: true,
        message: 'Campaign deleted successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Failed to delete campaign:', error);
    }
  }, [handlers, selectedCampaign]);

  /**
   * Handle launch confirmation
   */
  const handleConfirmLaunch = useCallback(async () => {
    try {
      if (!selectedCampaign) return;
      await handlers.onLaunchCampaign(selectedCampaign._id);
      setLaunchConfirmOpen(false);
      setDetailsPanelOpen(false);
      setSnackbar({
        open: true,
        message: 'Campaign launched successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Failed to launch campaign:', error);
    }
  }, [handlers, selectedCampaign]);

  /**
   * Handle schedule confirmation
   */
  const handleConfirmSchedule = useCallback(async () => {
    try {
      if (!selectedCampaign) return;
      await handlers.onScheduleCampaign(selectedCampaign._id, selectedCampaign.scheduledAt);
      setScheduleConfirmOpen(false);
      setDetailsPanelOpen(false);
    } catch (error) {
      console.error('Failed to schedule campaign:', error);
    }
  }, [handlers, selectedCampaign]);

  // ============ RENDER ============

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Main Content Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Header with Stats, Search, Filter, and Create Button */}
        <Box sx={{ p: { xs: 2, sm: 3 }, overflow: 'auto', flexShrink: 0 }}>
          <CampaignHeader
            stats={stats}
            onSearch={handleSearch}
            onFilterChange={handleFilterChange}
            onCreate={() => setCreateWizardOpen(true)}
            searchValue={searchValue}
            filterValue={filterValue}
            loading={loading}
          />
        </Box>

        {/* Campaign List with Virtual Scrolling */}
        <Box sx={{ flex: 1, overflow: 'hidden', px: { xs: 2, sm: 3 }, pb: 3 }}>
          <CampaignList
            campaigns={filteredCampaigns}
            loading={loading}
            onView={handleViewCampaign}
            onEdit={handleEditCampaign}
            onDelete={handleDeleteCampaign}
            onLaunch={handleLaunchCampaign}
            onPause={handlePauseCampaign}
            onResume={handleResumeCampaign}
            onComplete={handleCompleteCampaign}
            onSchedule={handleScheduleCampaign}
            onManualSend={handleManualSendCampaign}
          />
        </Box>
      </Box>

      {/* Details Panel (Right Side) */}
      <CampaignDetailsPanel
        campaign={selectedCampaign}
        open={detailsPanelOpen}
        onClose={() => {
          setDetailsPanelOpen(false);
          setSelectedCampaign(null);
        }}
        onEdit={handleEditCampaign}
        onLaunch={handleLaunchCampaign}
        onPause={handlePauseCampaign}
        onResume={handleResumeCampaign}
        onComplete={handleCompleteCampaign}
        onDelete={handleDeleteCampaign}
        onSchedule={handleScheduleCampaign}
        loading={loading}
      />

      {/* Modals */}

      {/* Create Campaign Wizard (6 steps) */}
      <CreateCampaignWizard
        open={createWizardOpen}
        onClose={() => {
          setCreateWizardOpen(false);
        }}
        onComplete={handleCreateCampaign}
        loading={loading}
      />

      {/* Edit Campaign Form (Collapsible sections) */}
      <EditCampaignForm
        campaign={selectedCampaign}
        open={editFormOpen}
        onClose={() => {
          setEditFormOpen(false);
          setSelectedCampaign(null);
        }}
        onSave={handleUpdateCampaign}
        loading={loading}
      />

      {/* Confirmation Dialogs */}

      {/* Delete Confirmation */}
      <DeleteConfirmationDialog
        open={deleteConfirmOpen}
        campaign={selectedCampaign}
        loading={loading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
      />

      {/* Launch Confirmation */}
      <LaunchConfirmationDialog
        open={launchConfirmOpen}
        campaign={selectedCampaign}
        estimatedReach={estimatedReachValue}
        loading={loading}
        onConfirm={handleConfirmLaunch}
        onCancel={() => setLaunchConfirmOpen(false)}
      />

      <ScheduleConfirmationDialog
        open={scheduleConfirmOpen}
        campaign={selectedCampaign}
        estimatedReach={estimatedReachValue}
        scheduledTime={selectedCampaign?.scheduledAt || ''}
        loading={loading}
        onConfirm={handleConfirmSchedule}
        onCancel={() => setScheduleConfirmOpen(false)}
      />

      {/* Manual Bulk Send Dialog */}
      <ManualSendDialog
        open={manualSendOpen}
        campaign={selectedCampaign}
        onClose={() => {
          setManualSendOpen(false);
          setSelectedCampaign(null);
        }}
        onSuccess={fetchCampaigns}
      />

      {/* Snackbar Notifications */}
      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        autoHideDuration={4000}
      />
    </Box>
  );
}
