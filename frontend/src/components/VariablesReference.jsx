import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import InfoIcon from '@mui/icons-material/Info';

/**
 * VariablesReference Component
 * 
 * Displays all available template variables grouped by category
 * Allows users to:
 * - Browse all available variables
 * - View descriptions and examples
 * - Copy variables to clipboard
 * - Preview template with variables
 * - Validate template content
 */

const VariablesReference = ({ open, onClose, onInsertVariable }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [variables, setVariables] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState('');
  const [previewResult, setPreviewResult] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [copiedVar, setCopiedVar] = useState(null);

  const categories = [
    { key: 'storeVariables', label: '🏪 Store Info', color: '#FF6B6B' },
    { key: 'priceVariables', label: '💰 Pricing', color: '#4ECDC4' },
    { key: 'customerVariables', label: '👤 Customer', color: '#95E1D3' },
    { key: 'orderVariables', label: '📦 Orders', color: '#F38181' },
    { key: 'productVariables', label: '💍 Products', color: '#FFEAA7' },
    { key: 'dateTimeVariables', label: '📅 Date/Time', color: '#DFE6E9' },
    { key: 'promotionalVariables', label: '🎉 Promotional', color: '#A29BFE' },
    { key: 'conditionalVariables', label: '⚡ Conditional', color: '#74B9FF' }
  ];

  // Fetch available variables on component mount
  useEffect(() => {
    if (open) {
      fetchVariables();
    }
  }, [open]);

  const fetchVariables = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/templates/variables/available');
      
      if (!response.ok) {
        throw new Error('Failed to fetch variables');
      }

      const data = await response.json();
      setVariables(data.variables);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching variables:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyVariable = (varName) => {
    navigator.clipboard.writeText(varName);
    setCopiedVar(varName);
    setTimeout(() => setCopiedVar(null), 2000);
  };

  const handleInsertVariable = (varName) => {
    if (onInsertVariable) {
      onInsertVariable(varName);
    }
  };

  const handlePreviewTemplate = async () => {
    if (!previewTemplate.trim()) {
      setError('Please enter template text');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/templates/sample-output', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ templateContent: previewTemplate })
      });

      if (!response.ok) {
        throw new Error('Failed to preview template');
      }

      const data = await response.json();
      setPreviewResult(data.sampleOutput);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleValidateTemplate = async () => {
    if (!previewTemplate.trim()) {
      setError('Please enter template text');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/templates/validate-variables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ templateContent: previewTemplate })
      });

      if (!response.ok) {
        throw new Error('Failed to validate template');
      }

      const data = await response.json();
      if (data.unknownVariables.length > 0) {
        setError(`Unknown variables: ${data.unknownVariables.join(', ')}`);
      } else {
        setError(null);
        alert(`✅ Template is valid! Found ${data.validVariables.length} variables.`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredVariables = variables ? categories.map(cat => ({
    ...cat,
    vars: Object.entries(variables[cat.key] || {}).filter(([key, value]) =>
      key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      value.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })) : [];

  const renderVariablesTable = (vars) => (
    <TableContainer component={Paper} sx={{ mb: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
            <TableCell><strong>Variable</strong></TableCell>
            <TableCell><strong>Description</strong></TableCell>
            <TableCell><strong>Example</strong></TableCell>
            <TableCell align="center" width={120}><strong>Actions</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {vars.map(([varName, varData]) => (
            <TableRow key={varName} hover>
              <TableCell>
                <code style={{ backgroundColor: '#f0f0f0', padding: '4px 8px', borderRadius: '4px' }}>
                  {varName}
                </code>
              </TableCell>
              <TableCell>{varData.description}</TableCell>
              <TableCell>
                <code style={{ backgroundColor: '#fffbea', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                  {varData.example}
                </code>
              </TableCell>
              <TableCell align="center">
                <Tooltip title={copiedVar === varName ? 'Copied!' : 'Copy'}>
                  <IconButton
                    size="small"
                    onClick={() => handleCopyVariable(varName)}
                    sx={{ color: copiedVar === varName ? 'success.main' : 'inherit' }}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Button
                  size="small"
                  onClick={() => handleInsertVariable(varName)}
                  sx={{ ml: 1 }}
                >
                  Insert
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <span>📋 Template Variables Reference</span>
          <Tooltip title="Available variables for dynamic template content">
            <InfoIcon fontSize="small" />
          </Tooltip>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        )}

        {!loading && variables && (
          <>
            {/* Search Box */}
            <TextField
              fullWidth
              placeholder="Search variables by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ mb: 3 }}
              size="small"
            />

            {/* Category Tabs */}
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ mb: 2, borderBottom: '1px solid #ddd' }}
            >
              {filteredVariables.map((cat, idx) => (
                <Tab
                  key={cat.key}
                  label={`${cat.label} (${cat.vars.length})`}
                  sx={{
                    textTransform: 'none',
                    fontSize: '14px',
                    fontWeight: cat.vars.length > 0 ? 'bold' : 'normal',
                    color: cat.vars.length === 0 ? '#ccc' : 'inherit'
                  }}
                />
              ))}
            </Tabs>

            {/* Variables Table */}
            <Box sx={{ maxHeight: '400px', overflowY: 'auto', mb: 3 }}>
              {filteredVariables[activeTab]?.vars.length > 0 ? (
                renderVariablesTable(filteredVariables[activeTab].vars)
              ) : (
                <Alert severity="info">No variables found in this category</Alert>
              )}
            </Box>

            {/* Preview Section */}
            <Box sx={{ borderTop: '2px solid #eee', pt: 3 }}>
              <h3>🔍 Preview & Validate</h3>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="Paste your template text here to preview or validate variables..."
                value={previewTemplate}
                onChange={(e) => setPreviewTemplate(e.target.value)}
                variant="outlined"
                sx={{ mb: 2 }}
              />
              <Box display="flex" gap={1} mb={2}>
                <Button
                  variant="contained"
                  onClick={handlePreviewTemplate}
                  disabled={loading}
                >
                  Preview with Sample Data
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleValidateTemplate}
                  disabled={loading}
                >
                  Validate Variables
                </Button>
              </Box>

              {previewResult && (
                <Paper sx={{ p: 2, backgroundColor: '#f9f9f9', borderLeft: '4px solid #4ECDC4' }}>
                  <strong>Preview Result:</strong>
                  <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', marginTop: '8px' }}>
                    {previewResult}
                  </pre>
                </Paper>
              )}
            </Box>

            {/* Usage Tips */}
            <Box sx={{ borderTop: '2px solid #eee', pt: 3, mt: 3 }}>
              <h3>💡 Usage Tips</h3>
              <ul style={{ fontSize: '14px', lineHeight: '1.8' }}>
                <li><strong>Format:</strong> Use double curly braces: <code>{{'{{'}}variable{{'}}'}}</code></li>
                <li><strong>Store Info:</strong> Automatically pulls from your Shop Configuration</li>
                <li><strong>Pricing:</strong> Rates update automatically when you change them in settings</li>
                <li><strong>Conditional:</strong> Hide/show content based on customer type</li>
                <li><strong>Preview:</strong> Test your template before sending to customers</li>
              </ul>
            </Box>

            {/* Examples */}
            <Box sx={{ backgroundColor: '#f0f8ff', p: 2, borderRadius: '8px', mt: 2 }}>
              <strong>📝 Example Templates:</strong>
              <div style={{ fontSize: '13px', marginTop: '8px', fontFamily: 'monospace' }}>
                <div>Welcome to {'{{'}}shop_name{{'}}'}}, {{'{{'}}customer_name{{'}}'}}! 👋</div>
                <div style={{ marginTop: '8px' }}>Today's 22K rate: {'{{'}}gold_rate_22k{{'}}'}} per gram</div>
                <div style={{ marginTop: '8px' }}>Order {'{{'}}order_id{{'}}'}} confirmed! Delivery: {'{{'}}delivery_date{{'}}'}</div>
              </div>
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VariablesReference;
