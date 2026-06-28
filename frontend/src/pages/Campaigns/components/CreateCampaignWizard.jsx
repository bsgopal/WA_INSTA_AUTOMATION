import React, { useState, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  LinearProgress,
  Typography,
  Stack,
  Alert,
  CircularProgress,
  Grid,
  Stepper,
  Step,
  StepButton
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import BasicInfoStep from './steps/BasicInfoStep';
import MessageStep from './steps/MessageStep';
import AudienceStep from './steps/AudienceStep';
import MediaStep from './steps/MediaStep';
import ScheduleStep from './steps/ScheduleStep';
import ReviewStep from './steps/ReviewStep';

/**
 * MobilePreview Component
 * Renders a simulated WhatsApp screen for message content verification
 */
const MobilePreview = ({ data }) => {
  let content = data.messageContent || '';

  // Simple formatting helper: *bold* -> <strong>, _italic_ -> <em>
  const formatMessageText = (text) => {
    if (!text) return 'Type a message to preview...';
    let formatted = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    
    // Bold: *text*
    formatted = formatted.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
    // Italics: _text_
    formatted = formatted.replace(/_([^_]+)_/g, '<em>$1</em>');
    // Monospace: `text`
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <Box sx={{
      width: '100%',
      maxWidth: '300px',
      height: '520px',
      bgcolor: '#efeae2',
      backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
      backgroundSize: 'cover',
      border: '10px solid #1e293b',
      borderRadius: '24px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative',
      margin: '0 auto'
    }}>
      {/* Notch */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100px',
        height: '14px',
        bgcolor: '#1e293b',
        borderBottomLeftRadius: '10px',
        borderBottomRightRadius: '10px',
        zIndex: 5
      }} />

      {/* WhatsApp Header */}
      <Box sx={{
        bgcolor: '#075E54',
        color: '#FFFFFF',
        pt: 2,
        pb: 1,
        px: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        zIndex: 2
      }}>
        <Box sx={{
          width: '26px',
          height: '26px',
          borderRadius: '50%',
          bgcolor: '#128C7E',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: '11px',
          color: '#ffffff'
        }}>
          WA
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#FFFFFF', fontSize: '11.5px', lineHeight: 1.1 }}>
            WhatsApp Business
          </Typography>
          <Typography variant="caption" sx={{ color: '#d1fae5', fontSize: '9px', display: 'block', lineHeight: 1 }}>
            online
          </Typography>
        </Box>
      </Box>

      {/* Chat Area */}
      <Box sx={{
        flex: 1,
        p: 1.5,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        overflowY: 'auto'
      }}>
        {/* Message bubble */}
        <Box sx={{
          alignSelf: 'flex-start',
          maxWidth: '90%',
          bgcolor: '#E2F9CB',
          color: '#1f2937',
          borderRadius: '8px',
          borderTopLeftRadius: 0,
          p: 1.2,
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
          position: 'relative',
          mb: 1
        }}>
          {/* Media preview */}
          {data.mediaUrl && (
            <Box sx={{ mb: 1, borderRadius: '4px', overflow: 'hidden', border: '1px solid #C0DFB0', bgcolor: '#F3F4F6' }}>
              {data.mediaType === 'image' ? (
                <Box
                  component="img"
                  src={data.mediaUrl}
                  alt="Media upload"
                  sx={{ width: '100%', maxHeight: '120px', objectFit: 'cover', display: 'block' }}
                />
              ) : data.mediaType === 'video' ? (
                <Box sx={{ width: '100%', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#000000', color: '#FFFFFF' }}>
                  <Typography variant="caption" sx={{ fontSize: '10px' }}>▶ Video Preview</Typography>
                </Box>
              ) : (
                <Box sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ fontSize: '16px' }}>📄</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '10px', wordBreak: 'break-all' }}>
                    {data.mediaFileName || 'Document.pdf'}
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Text Content */}
          <Typography variant="body2" sx={{ fontSize: '12px', wordBreak: 'break-word', whiteSpace: 'pre-wrap', pb: 0.5, lineHeight: 1.35 }}>
            {formatMessageText(content)}
          </Typography>

          {/* Timestamp & receipt */}
          <Box sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 0.2,
            mt: -0.2
          }}>
            <Typography variant="caption" sx={{ fontSize: '8px', color: '#6b7280' }}>
              {timeString}
            </Typography>
            <Typography variant="caption" sx={{ color: '#34B7F1', fontWeight: 700, fontSize: '10px', lineHeight: 1 }}>
              ✓✓
            </Typography>
          </Box>
        </Box>

        {/* Buttons */}
        {data.buttonLabel && (
          <Box sx={{
            alignSelf: 'flex-start',
            width: '90%',
            bgcolor: '#FFFFFF',
            borderRadius: '8px',
            border: '1px solid #E4E4E4',
            textAlign: 'center',
            py: 0.6,
            boxShadow: '0 1px 1px rgba(0,0,0,0.05)',
            mb: 1
          }}>
            <Typography variant="body2" sx={{ color: '#2563eb', fontSize: '11px', fontWeight: 600 }}>
              🔗 {data.buttonLabel}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

/**
 * CreateCampaignWizard Component
 * Step-by-step campaign creation wizard (6 steps)
 * Features Google/Microsoft-level split screen preview and progress stepper
 */
const CreateCampaignWizard = React.memo(({
  open = false,
  onClose = () => {},
  onComplete = () => {},
  loading = false,
  estimatedReach = 0
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    topic: '',
    description: '',
    type: 'ONE_TIME',
    messageType: 'TEXT',
    messageContent: '',
    messageTemplate: '',
    buttonLabel: '',
    buttonUrl: '',
    targetSegment: 'ALL',
    selectedLanguages: [],
    customFilter: '',
    mediaType: 'none',
    mediaUrl: '',
    mediaPreviewData: '',
    mediaMimeType: '',
    mediaFileName: '',
    scheduledAt: '',
    scheduledTime: '12:00'
  });
  const [errors, setErrors] = useState({});
  const [stepError, setStepError] = useState('');

  const steps = [
    { label: 'Basic Info', component: BasicInfoStep },
    { label: 'Message', component: MessageStep },
    { label: 'Audience', component: AudienceStep },
    { label: 'Media', component: MediaStep },
    { label: 'Schedule', component: ScheduleStep },
    { label: 'Review', component: ReviewStep }
  ];

  // Validation logic
  const validateStep = useCallback(() => {
    const newErrors = {};
    setStepError('');

    switch (currentStep) {
      case 0: // Basic Info
        if (!formData.name?.trim()) newErrors.name = 'Campaign name is required';
        if (!formData.topic?.trim()) newErrors.topic = 'Campaign topic is required';
        break;
      case 1: // Message
        if (!formData.messageContent?.trim() && formData.messageType === 'TEXT') {
          newErrors.messageContent = 'Message content is required';
        }
        break;
      case 2: // Audience
        if (!formData.targetSegment) {
          newErrors.targetSegment = 'Target segment is required';
        }
        break;
      case 3: // Media - Optional, no validation needed
        break;
      case 4: // Schedule
        if (formData.scheduledAt && new Date(formData.scheduledAt) < new Date()) {
          newErrors.scheduledAt = 'Scheduled time must be in the future';
        }
        break;
      case 5: // Review - Final check
        if (!formData.name?.trim()) newErrors.name = 'Campaign name is required';
        if (!formData.messageContent?.trim()) newErrors.messageContent = 'Message content is required';
        break;
      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [currentStep, formData]);

  const handleNext = useCallback(() => {
    if (validateStep()) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  }, [currentStep, steps.length, validateStep]);

  const handleBack = useCallback(() => {
    setStepError('');
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleStepClick = useCallback((stepIndex) => {
    if (stepIndex < currentStep) {
      setCurrentStep(stepIndex);
      setStepError('');
    } else {
      // Validate up to the clicked step
      let isValid = true;
      for (let i = currentStep; i < stepIndex; i++) {
        if (!validateStep()) {
          isValid = false;
          break;
        }
      }
      if (isValid) {
        setCurrentStep(stepIndex);
        setStepError('');
      }
    }
  }, [currentStep, validateStep]);

  const handleComplete = useCallback(async () => {
    if (!validateStep()) {
      setStepError('Please correct the errors before launching');
      return;
    }
    onComplete(formData);
  }, [formData, validateStep, onComplete]);

  const handleClose = useCallback(() => {
    setCurrentStep(0);
    setFormData({
      name: '',
      topic: '',
      description: '',
      type: 'ONE_TIME',
      messageType: 'TEXT',
      messageContent: '',
      messageTemplate: '',
      buttonLabel: '',
      buttonUrl: '',
      targetSegment: 'ALL',
      selectedLanguages: [],
      customFilter: '',
      mediaType: 'none',
      mediaUrl: '',
      mediaPreviewData: '',
      mediaMimeType: '',
      mediaFileName: '',
      scheduledAt: '',
      scheduledTime: '12:00'
    });
    setErrors({});
    setStepError('');
    onClose();
  }, [onClose]);

  const handleFormDataChange = useCallback((newData) => {
    setFormData(newData);
    setErrors({});
  }, []);

  const CurrentStepComponent = useMemo(
    () => steps[currentStep]?.component || BasicInfoStep,
    [currentStep, steps]
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          boxShadow: '0 24px 48px -12px rgba(0,0,0,0.18)'
        }
      }}
    >
      {/* Header with Google-style Stepper */}
      <Box sx={{
        p: 2.5,
        borderBottom: '1px solid #E5E7EB',
        bgcolor: '#F9FAFB'
      }}>
        <Stack spacing={2}>
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <DialogTitle sx={{ p: 0, fontSize: '18px', fontWeight: 700, color: '#1F2937' }}>
              Create New Campaign
            </DialogTitle>
            <Typography variant="caption" sx={{ color: '#4B5563', fontWeight: 600 }}>
              Step {currentStep + 1} of {steps.length}
            </Typography>
          </Box>
          <Stepper nonLinear activeStep={currentStep} alternativeLabel sx={{
            '& .MuiStepLabel-label': { fontSize: '11px', mt: 0.5 },
            '& .MuiStepLabel-label.Mui-active': { fontWeight: 700, color: '#2563eb' }
          }}>
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepButton onClick={() => handleStepClick(index)}>
                  {step.label}
                </StepButton>
              </Step>
            ))}
          </Stepper>
        </Stack>
      </Box>

      {/* Content */}
      <DialogContent sx={{ py: 3, px: { xs: 2, md: 4 } }}>
        {stepError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {stepError}
          </Alert>
        )}

        <Grid container spacing={4} alignItems="flex-start">
          {/* Inputs Section */}
          <Grid item xs={12} md={7.5}>
            <Box sx={{ minHeight: '420px' }}>
              <CurrentStepComponent
                data={formData}
                onChange={handleFormDataChange}
                errors={errors}
                estimatedReach={estimatedReach}
              />
            </Box>
          </Grid>

          {/* Simulated Mobile Device Preview */}
          <Grid item xs={12} md={4.5} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Box sx={{ position: 'sticky', top: '10px' }}>
              <Typography variant="subtitle2" sx={{ textAlign: 'center', mb: 1.5, fontWeight: 700, color: '#4B5563' }}>
                Live Message Preview
              </Typography>
              <MobilePreview data={formData} />
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      {/* Actions */}
      <DialogActions sx={{
        p: 2.5,
        borderTop: '1px solid #E5E7EB',
        display: 'flex',
        justifyContent: 'space-between',
        bgcolor: '#F9FAFB'
      }}>
        <Button
          onClick={handleBack}
          disabled={currentStep === 0 || loading}
          startIcon={<ChevronLeftIcon />}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Back
        </Button>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            onClick={handleClose}
            disabled={loading}
            sx={{ textTransform: 'none', color: '#4B5563', fontWeight: 600 }}
          >
            Cancel
          </Button>
          {currentStep < steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={loading}
              endIcon={<ChevronRightIcon />}
              sx={{ textTransform: 'none', fontWeight: 600, px: 3, borderRadius: '8px' }}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleComplete}
              disabled={loading}
              startIcon={loading && <CircularProgress size={18} />}
              sx={{ textTransform: 'none', fontWeight: 700, px: 4, borderRadius: '8px', bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' } }}
            >
              {loading ? 'Launching...' : 'Launch Campaign'}
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
});

CreateCampaignWizard.displayName = 'CreateCampaignWizard';

export default CreateCampaignWizard;
