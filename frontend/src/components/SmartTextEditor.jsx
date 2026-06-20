import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  Paper,
  TextField,
  Typography
} from '@mui/material';
import VariableInsertToolbar from './VariableInsertToolbar';

const SmartTextEditor = ({
  label = 'Response Message',
  value = '',
  onChange,
  placeholder = "Type your response here. Use 'Insert Variable' to add dynamic content.",
  multiline = true,
  rows = 6,
  error = false,
  helperText = '',
  showPreview = true,
  onValidate
}) => {
  const textFieldRef = useRef(null);
  const [insertedVariables, setInsertedVariables] = useState([]);
  const [content, setContent] = useState(value);

  useEffect(() => {
    setContent(value);
  }, [value]);

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    onChange?.(e);
  };

  const handleVariableInserted = (variable) => {
    if (!insertedVariables.find(v => v.name === variable.name)) {
      setInsertedVariables(prev => [...prev, variable]);
    }
    onValidate?.(content);
  };

  const handleUpdateContent = (newContent) => {
    setContent(newContent);
    onChange?.({ target: { value: newContent } });
  };

  const variablesInContent = [...new Set(content.match(/{{[^}]+}}/g) || [])];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <VariableInsertToolbar
        textFieldRef={textFieldRef}
        onVariableInserted={handleVariableInserted}
        onUpdateContent={handleUpdateContent}
      />

      <TextField
        inputRef={textFieldRef}
        fullWidth
        multiline={multiline}
        rows={rows}
        label={label}
        value={content}
        onChange={handleContentChange}
        placeholder={placeholder}
        error={error}
        helperText={helperText}
        variant="outlined"
        sx={{
          '& .MuiOutlinedInput-root': {
            fontFamily: 'monospace',
            fontSize: '14px',
            '& fieldset': { borderColor: '#e0e0e0' }
          }
        }}
      />

      {showPreview && variablesInContent.length > 0 && (
        <Paper sx={{ p: 1.5, backgroundColor: '#f0f8ff', borderLeft: '4px solid #4ECDC4' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            Variables used in this response
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {variablesInContent.map((varName) => (
              <Chip
                key={varName}
                label={varName}
                variant="outlined"
                size="small"
                sx={{
                  fontFamily: 'monospace',
                  borderColor: '#4ECDC4',
                  color: '#00897b',
                  backgroundColor: '#fff'
                }}
              />
            ))}
          </Box>
          <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#666' }}>
            These variables will be replaced automatically when sending responses.
          </Typography>
        </Paper>
      )}

      {variablesInContent.length === 0 && (
        <Alert severity="info">
          Click "Insert Variable" above to add dynamic content like {'{{customer_name}}'}.
        </Alert>
      )}
    </Box>
  );
};

export default SmartTextEditor;
