import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, LinearProgress, IconButton, Button,
  Slide, Stack, Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const BackgroundMessagingContext = createContext(null);

export const useBackgroundMessaging = () => {
  const context = useContext(BackgroundMessagingContext);
  if (!context) {
    throw new Error('useBackgroundMessaging must be used within a BackgroundMessagingProvider');
  }
  return context;
};

export const BackgroundMessagingProvider = ({ children }) => {
  // Active background jobs (running, minimized, completed)
  const [activeJobs, setActiveJobs] = useState(() => {
    try {
      const saved = sessionStorage.getItem('renic_bg_jobs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persistent message notifications / delivery logs
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('renic_msg_notifications');
      return saved ? JSON.parse(saved) : [
        {
          id: 'welcome_init',
          title: 'System Ready',
          message: 'WhatsApp & Instagram automation dispatcher active.',
          recipient: 'All Channels',
          status: 'DELIVERED',
          timestamp: new Date().toISOString(),
          read: true
        }
      ];
    } catch {
      return [];
    }
  });

  // Top Toast Notification state
  const [topToast, setTopToast] = useState({
    open: false,
    title: '',
    message: '',
    severity: 'success', // success | error | warning | info
    duration: 5000,
    actionLabel: null,
    onAction: null
  });

  // Save to storage
  useEffect(() => {
    try {
      sessionStorage.setItem('renic_bg_jobs', JSON.stringify(activeJobs));
    } catch {}
  }, [activeJobs]);

  useEffect(() => {
    try {
      localStorage.setItem('renic_msg_notifications', JSON.stringify(notifications.slice(0, 100)));
    } catch {}
  }, [notifications]);

  // Live Message Activity Poller: Sync all real inbound/outbound messages, rules, & deliveries
  useEffect(() => {
    let cancelled = false;
    const fetchLatestActivity = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await apiClient.get('/messages?limit=15');
        if (cancelled || !res.data?.messages) return;

        const rawList = res.data.messages;
        const readIds = new Set(JSON.parse(localStorage.getItem('renic_read_msg_ids') || '[]'));

        const liveEntries = rawList.map(msg => {
          const isIncoming = msg.tags?.includes('incoming') || msg.messageType === 'INCOMING';
          const isFailed = msg.status === 'FAILED';
          const custName = msg.customerId?.firstName ? `${msg.customerId.firstName} ${msg.customerId.lastName || ''}`.trim() : (msg.recipient || 'Customer');
          const phone = msg.customerId?.whatsappNumber || msg.customerId?.phone || '';

          return {
            id: String(msg._id),
            title: isIncoming ? 'Incoming WhatsApp' : msg.aiGenerated ? 'AI Auto-Response' : 'WhatsApp Delivery',
            message: msg.content || (msg.mediaUrl ? '[Media File]' : 'No message content'),
            recipient: custName,
            phone,
            channel: msg.channel || 'whatsapp',
            status: isIncoming ? 'RECEIVED' : (msg.status || 'DELIVERED'),
            error: isFailed ? (msg.failureReason || 'Failed to deliver') : null,
            timestamp: msg.createdAt || new Date().toISOString(),
            read: readIds.has(String(msg._id))
          };
        });

        setNotifications(prev => {
          const merged = [...prev];
          for (const entry of liveEntries) {
            const existingIdx = merged.findIndex(x => x.id === entry.id);
            if (existingIdx >= 0) {
              merged[existingIdx] = { ...merged[existingIdx], ...entry, read: merged[existingIdx].read || entry.read };
            } else {
              merged.push(entry);
            }
          }
          return merged.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 50);
        });
      } catch (err) {
        // Silently skip polling errors
      }
    };

    fetchLatestActivity();
    const interval = setInterval(fetchLatestActivity, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Show top toast notification
  const showTopToast = useCallback(({ title, message, severity = 'success', duration = 5000, actionLabel, onAction }) => {
    setTopToast({
      open: true,
      title: title || (severity === 'success' ? 'Message Sent' : 'Notice'),
      message: message || '',
      severity,
      duration,
      actionLabel,
      onAction
    });
  }, []);

  const hideTopToast = useCallback(() => {
    setTopToast(prev => ({ ...prev, open: false }));
  }, []);

  // Add a delivery/activity log entry
  const addNotification = useCallback((item) => {
    const entry = {
      id: item.id || 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      title: item.title || 'Message Delivery',
      message: item.message || '',
      recipient: item.recipient || 'Customer',
      phone: item.phone || '',
      channel: item.channel || 'whatsapp',
      status: item.status || 'DELIVERED', // DELIVERED | READ | FAILED | SENT | RECEIVED
      error: item.error || null,
      timestamp: item.timestamp || new Date().toISOString(),
      read: false
    };

    setNotifications(prev => [entry, ...prev.filter(x => x.id !== entry.id)].slice(0, 100));
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      const allIds = prev.map(n => n.id);
      try {
        localStorage.setItem('renic_read_msg_ids', JSON.stringify(allIds));
      } catch {}
      return prev.map(n => ({ ...n, read: true }));
    });
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    try {
      localStorage.removeItem('renic_read_msg_ids');
    } catch {}
    setNotifications([]);
  }, []);

  // Start a background sending job
  const startBackgroundJob = useCallback(async ({
    title = 'Sending Messages...',
    total = 1,
    taskFn, // async function that receives (progressCallback)
    onComplete
  }) => {
    const jobId = 'job_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    
    const newJob = {
      id: jobId,
      title,
      total,
      sent: 0,
      failed: 0,
      progress: 0,
      status: 'RUNNING',
      minimized: false,
      detail: 'Starting dispatch...',
      startedAt: new Date().toISOString()
    };

    setActiveJobs(prev => [newJob, ...prev]);

    const updateProgress = (sent, failed, detail) => {
      setActiveJobs(prev => prev.map(j => {
        if (j.id !== jobId) return j;
        const currentTotal = j.total || 1;
        const progress = Math.min(100, Math.round(((sent + failed) / currentTotal) * 100));
        return {
          ...j,
          sent,
          failed,
          progress,
          detail: detail || ('Sent ' + sent + '/' + currentTotal + (failed > 0 ? (' (' + failed + ' failed)') : ''))
        };
      }));
    };

    try {
      // Execute the provided async background task
      const result = await taskFn(updateProgress);

      const finalSent = result?.sentCount ?? total;
      const finalFailed = result?.failCount ?? 0;
      const isSuccess = finalFailed === 0;

      setActiveJobs(prev => prev.map(j => {
        if (j.id !== jobId) return j;
        return {
          ...j,
          status: isSuccess ? 'COMPLETED' : 'FAILED',
          progress: 100,
          sent: finalSent,
          failed: finalFailed,
          detail: 'Finished: ' + finalSent + ' delivered' + (finalFailed > 0 ? (', ' + finalFailed + ' failed') : ''),
          completedAt: new Date().toISOString()
        };
      }));

      // Trigger Top Toast Notification
      showTopToast({
        title: isSuccess ? '✅ Messages Delivered Successfully!' : '⚠️ Broadcast Completed with Errors',
        message: title + ': ' + finalSent + ' delivered' + (finalFailed > 0 ? (', ' + finalFailed + ' failed') : '') + '.',
        severity: isSuccess ? 'success' : 'warning',
        duration: 6000
      });

      // Log into persistent message activity list
      addNotification({
        title: title,
        message: finalSent + ' delivered, ' + finalFailed + ' failed',
        recipient: total + ' Customer' + (total !== 1 ? 's' : ''),
        status: isSuccess ? 'DELIVERED' : 'FAILED',
        error: finalFailed > 0 ? (finalFailed + ' messages failed to deliver') : null
      });

      if (onComplete) onComplete(result);
      return result;
    } catch (err) {
      console.error('Background send error:', err);

      setActiveJobs(prev => prev.map(j => {
        if (j.id !== jobId) return j;
        return {
          ...j,
          status: 'FAILED',
          detail: err.message || 'Dispatch failed',
          completedAt: new Date().toISOString()
        };
      }));

      showTopToast({
        title: '❌ Message Dispatch Failed',
        message: err.message || 'An error occurred while sending messages in the background.',
        severity: 'error',
        duration: 7000
      });

      addNotification({
        title: title,
        message: err.message || 'Sending failed',
        recipient: 'Recipients',
        status: 'FAILED',
        error: err.message
      });

      throw err;
    }
  }, [showTopToast, addNotification]);

  const minimizeJob = useCallback((jobId) => {
    setActiveJobs(prev => prev.map(j => j.id === jobId ? { ...j, minimized: true } : j));
    showTopToast({
      title: '🗕 Minimized to Background',
      message: 'Sending is continuing in the background. You can keep working freely!',
      severity: 'info',
      duration: 3500
    });
  }, [showTopToast]);

  const restoreJob = useCallback((jobId) => {
    setActiveJobs(prev => prev.map(j => j.id === jobId ? { ...j, minimized: false } : j));
  }, []);

  const dismissJob = useCallback((jobId) => {
    setActiveJobs(prev => prev.filter(j => j.id !== jobId));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  const runningJobs = activeJobs.filter(j => j.status === 'RUNNING');
  const minimizedJobs = runningJobs.filter(j => j.minimized);

  return (
    <BackgroundMessagingContext.Provider
      value={{
        activeJobs,
        runningJobs,
        minimizedJobs,
        notifications,
        unreadCount,
        topToast,
        showTopToast,
        hideTopToast,
        addNotification,
        markAllAsRead,
        clearNotifications,
        startBackgroundJob,
        minimizeJob,
        restoreJob,
        dismissJob
      }}
    >
      {children}

      {/* ── Top Toast Notification Banner ── */}
      <Slide direction="down" in={topToast.open} mountOnEnter unmountOnExit>
        <Box
          sx={{
            position: 'fixed',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%) !important',
            zIndex: 99999,
            minWidth: { xs: '90%', sm: '460px' },
            maxWidth: '600px'
          }}
        >
          <Paper
            elevation={12}
            sx={{
              p: 1.5,
              borderRadius: '12px',
              bgcolor: topToast.severity === 'success' ? '#0f172a' : topToast.severity === 'error' ? '#450a0a' : topToast.severity === 'warning' ? '#422006' : '#0f172a',
              color: '#ffffff',
              border: '1px solid ' + (topToast.severity === 'success' ? '#22c55e' : topToast.severity === 'error' ? '#ef4444' : topToast.severity === 'warning' ? '#f59e0b' : '#38bdf8'),
              boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1.5
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  bgcolor: topToast.severity === 'success' ? 'rgba(34, 197, 94, 0.2)' : topToast.severity === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                  color: topToast.severity === 'success' ? '#4ade80' : topToast.severity === 'error' ? '#f87171' : '#fbbf24',
                  p: 0.8,
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {topToast.severity === 'success' && <CheckCircleIcon fontSize="small" />}
                {topToast.severity === 'error' && <ErrorIcon fontSize="small" />}
                {topToast.severity === 'warning' && <WarningAmberIcon fontSize="small" />}
                {topToast.severity === 'info' && <InfoIcon fontSize="small" />}
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#ffffff', fontSize: '0.85rem', lineHeight: 1.2 }}>
                  {topToast.title}
                </Typography>
                <Typography variant="caption" sx={{ color: '#cbd5e1', fontSize: '0.75rem', display: 'block' }}>
                  {topToast.message}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {topToast.actionLabel && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={topToast.onAction}
                  sx={{
                    color: '#84cc16',
                    borderColor: '#84cc16',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    py: 0.2,
                    px: 1,
                    '&:hover': { bgcolor: 'rgba(132, 204, 22, 0.1)', borderColor: '#a3e635' }
                  }}
                >
                  {topToast.actionLabel}
                </Button>
              )}
              <IconButton size="small" onClick={hideTopToast} sx={{ color: '#94a3b8', '&:hover': { color: '#ffffff' } }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Paper>
        </Box>
      </Slide>

      {/* ── Minimized Floating Sending Dock ── */}
      {minimizedJobs.length > 0 && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            maxWidth: '380px',
            width: '100%'
          }}
        >
          {minimizedJobs.map(job => (
            <Paper
              key={job.id}
              elevation={8}
              sx={{
                p: 1.8,
                bgcolor: '#0f172a',
                color: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #334155',
                boxShadow: '0 12px 30px rgba(0,0,0,0.35)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: '#84cc16',
                      boxShadow: '0 0 8px #84cc16'
                    }}
                  />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.8rem', color: '#ffffff' }}>
                    {job.title}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={0.5}>
                  <Tooltip title="Expand sending details">
                    <IconButton size="small" onClick={() => restoreJob(job.id)} sx={{ color: '#94a3b8', '&:hover': { color: '#84cc16' } }}>
                      <OpenInFullIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Dismiss dock preview">
                    <IconButton size="small" onClick={() => dismissJob(job.id)} sx={{ color: '#94a3b8', '&:hover': { color: '#ef4444' } }}>
                      <CloseIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                  {job.detail}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#84cc16', fontSize: '0.75rem' }}>
                  {job.progress}%
                </Typography>
              </Box>

              <LinearProgress
                variant="determinate"
                value={job.progress}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: 'rgba(255,255,255,0.1)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: '#84cc16',
                    borderRadius: 3
                  }
                }}
              />
            </Paper>
          ))}
        </Box>
      )}
    </BackgroundMessagingContext.Provider>
  );
};

export default BackgroundMessagingContext;
