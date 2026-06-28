import React from 'react';
import {
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography
} from '@mui/material';

/**
 * BasicInfoStep Component
 * Step 1 of the campaign creation wizard
 * Collects: Campaign Name, Topic, Description, Type
 */
const BasicInfoStep = React.memo(({
  data = {},
  onChange = () => {},
  errors = {}
}) => {
  const campaignTypes = [
    { value: 'ONE_TIME', label: 'One-Time Campaign' },
    { value: 'RECURRING', label: 'Recurring Campaign' },
    { value: 'AUTOMATED', label: 'Automated Campaign' },
    { value: 'TRIGGERED', label: 'Triggered Campaign' }
  ];

  return (
    <Stack spacing={2.5}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Start by providing basic information about your campaign.
      </Typography>

      <TextField
        label="Campaign Name"
        fullWidth
        required
        value={data.name || ''}
        onChange={(e) => onChange({ ...data, name: e.target.value })}
        error={!!errors.name}
        helperText={errors.name}
        placeholder="e.g., Summer Sale 2024"
        size="small"
      />

      <TextField
        label="Campaign Topic"
        fullWidth
        required
        value={data.topic || ''}
        onChange={(e) => onChange({ ...data, topic: e.target.value })}
        error={!!errors.topic}
        helperText={errors.topic}
        placeholder="e.g., Product Promotion"
        size="small"
      />

      <TextField
        label="Description (Optional)"
        fullWidth
        multiline
        rows={3}
        value={data.description || ''}
        onChange={(e) => onChange({ ...data, description: e.target.value })}
        placeholder="Add details about your campaign..."
        size="small"
      />

      <FormControl fullWidth size="small" required>
        <InputLabel>Campaign Type</InputLabel>
        <Select
          label="Campaign Type"
          value={data.type || 'ONE_TIME'}
          onChange={(e) => onChange({ ...data, type: e.target.value })}
        >
          {campaignTypes.map((type) => (
            <MenuItem key={type.value} value={type.value}>
              {type.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>
  );
});

BasicInfoStep.displayName = 'BasicInfoStep';

export default BasicInfoStep;
