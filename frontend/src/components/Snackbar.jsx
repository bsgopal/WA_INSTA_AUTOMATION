import { Snackbar, Alert, Box } from '@mui/material';

export default function CustomSnackbar({ 
  open, 
  onClose, 
  message, 
  severity = 'info',
  autoHideDuration = 4000,
  action = null 
}) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      sx={{
        '& .MuiSnackbar-root': {
          bottom: { xs: 16, sm: 24 },
          right: { xs: 16, sm: 24 },
        }
      }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        sx={{
          width: '100%',
          borderRadius: 2,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
          fontSize: '0.95rem',
          fontWeight: 600,
          background: severity === 'success' ? '#2e7d32 !important' : 
                      severity === 'error' ? '#d32f2f !important' :
                      severity === 'warning' ? '#ed6c02 !important' :
                      '#0288d1 !important',
          color: '#ffffff !important',
          '& .MuiAlert-icon': {
            fontSize: '1.5rem',
            color: '#ffffff !important',
          },
          '& .MuiAlert-message': {
            color: '#ffffff !important',
          },
          '& .MuiAlert-action': {
            color: '#ffffff !important',
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
