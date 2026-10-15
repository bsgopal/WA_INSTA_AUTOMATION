import { Snackbar, Alert, Box } from '@mui/material';

export default function CustomSnackbar({ 
  open, 
  onClose, 
  message, 
  severity = 'info',
  autoHideDuration = 5000,
  anchorOrigin = { vertical: 'bottom', horizontal: 'right' },
  action = null 
}) {
  const isCentered = (anchorOrigin?.horizontal === 'center' && (anchorOrigin?.vertical === 'center' || anchorOrigin?.vertical === 'top'));

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={anchorOrigin}
      sx={{
        ...(anchorOrigin?.horizontal === 'center' && anchorOrigin?.vertical === 'center' ? {
          top: '50% !important',
          left: '50% !important',
          transform: 'translate(-50%, -50%) !important',
          bottom: 'auto !important',
          right: 'auto !important',
          position: 'fixed !important',
          zIndex: 9999
        } : anchorOrigin?.horizontal === 'center' && anchorOrigin?.vertical === 'top' ? {
          top: '10% !important',
          left: '50% !important',
          transform: 'translateX(-50%) !important',
          position: 'fixed !important',
          zIndex: 9999
        } : {})
      }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        sx={{
          minWidth: { xs: 300, sm: 440 },
          maxWidth: 600,
          py: 2,
          px: 2.5,
          borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.15)',
          fontSize: '0.96rem',
          fontWeight: 600,
          background: severity === 'success' ? '#15803d !important' : 
                      severity === 'error' ? '#b91c1c !important' :
                      severity === 'warning' ? '#c2410c !important' :
                      '#0369a1 !important',
          color: '#ffffff !important',
          '& .MuiAlert-icon': {
            fontSize: '2rem',
            color: '#ffffff !important',
            alignSelf: 'center'
          },
          '& .MuiAlert-message': {
            color: '#ffffff !important',
            lineHeight: 1.5
          },
          '& .MuiIconButton-root': {
            color: '#ffffff !important',
          }
        }}
        action={action}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
