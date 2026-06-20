import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Tooltip,
  Menu,
  MenuItem,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VariableIcon from '@mui/icons-material/Code';
import StorageIcon from '@mui/icons-material/Storage';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import CopyIcon from '@mui/icons-material/ContentCopy';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import apiClient from '../api/client';

/**
 * VariableInsertToolbar Component
 * 
 * Allows users to:
 * 1. Browse and insert variables from dropdown
 * 2. Create custom variables/shortcuts
 * 3. Insert into text at cursor position
 * 4. View all stored variables
 */

const VariableInsertToolbar = ({ 
  textFieldRef, 
  onVariableInserted,
  onUpdateContent 
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [variables, setVariables] = useState([]);
  const [customVariables, setCustomVariables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [newCustomVar, setNewCustomVar] = useState({ name: '', value: '', category: 'CUSTOM' });
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Fetch available variables
  useEffect(() => {
    fetchVariables();
    loadCustomVariables();
  }, []);

  const fetchVariables = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/templates/variables/available');
      const data = response.data;
      
      // Flatten variables for easier display
      const flatVariables = [];
      Object.entries(data.variables || {}).forEach(([category, vars]) => {
        Object.entries(vars).forEach(([name, info]) => {
          flatVariables.push({
            name,
            ...info,
            category: category.replace('Variables', '')
          });
        });
      });
      
      setVariables(flatVariables);
    } catch (error) {
      console.error('Error fetching variables:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomVariables = () => {
    try {
      const stored = localStorage.getItem('customVariables');
      if (stored) {
        setCustomVariables(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading custom variables:', error);
    }
  };

  const saveCustomVariables = (vars) => {
    try {
      localStorage.setItem('customVariables', JSON.stringify(vars));
      setCustomVariables(vars);
    } catch (error) {
      console.error('Error saving custom variables:', error);
    }
  };

  const handleAddCustomVariable = () => {
    if (!newCustomVar.name.trim() || !newCustomVar.value.trim()) {
      alert('Please fill in both name and value');
      return;
    }

    const customVar = {
      id: Date.now(),
      name: newCustomVar.name,
      value: newCustomVar.value,
      category: newCustomVar.category,
      description: `Custom variable: ${newCustomVar.value}`
    };

    const updated = [...customVariables, customVar];
    saveCustomVariables(updated);
    setNewCustomVar({ name: '', value: '', category: 'CUSTOM' });
    setShowCustomDialog(false);
  };

  const handleDeleteCustomVariable = (id) => {
    const updated = customVariables.filter(v => v.id !== id);
    saveCustomVariables(updated);
  };

  const handleVariableInsert = (variable) => {
    if (textFieldRef && textFieldRef.current) {
      const input = textFieldRef.current;
      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? input.value.length;
      const text = input.value;
      
      // Insert variable at cursor position
      const newText = text.substring(0, start) + variable.name + text.substring(end);
      
      // Update the input
      input.value = newText;
      input.selectionStart = input.selectionEnd = start + variable.name.length;
      input.focus();

      // Trigger change event if needed
      const event = new Event('input', { bubbles: true });
      input.dispatchEvent(event);

      // Notify parent component
      if (onVariableInserted) {
        onVariableInserted(variable);
      }
      if (onUpdateContent) {
        onUpdateContent(newText);
      }
    }

    setAnchorEl(null);
  };

  const filteredVariables = variables.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (v.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || v.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const allCategories = ['all', ...new Set(variables.map(v => v.category))];

  const categoryColors = {
    'store': '#FF6B6B',
    'pricing': '#4ECDC4',
    'customer': '#95E1D3',
    'order': '#F38181',
    'product': '#FFEAA7',
    'date': '#DFE6E9',
    'promotional': '#A29BFE',
    'conditional': '#74B9FF',
    'CUSTOM': '#6C5CE7'
  };

  const getCategoryEmoji = (category) => {
    const emojiMap = {
      'store': '🏪',
      'pricing': '💰',
      'customer': '👤',
      'order': '📦',
      'product': '💍',
      'date': '📅',
      'promotional': '🎉',
      'conditional': '⚡',
      'CUSTOM': '⭐'
    };
    return emojiMap[category.toLowerCase()] || '📝';
  };

  return (
    <>
      {/* Main Toolbar */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        {/* Insert Variable Button */}
        <Tooltip title="Insert dynamic variables">
          <Button
            variant="outlined"
            size="small"
            startIcon={<VariableIcon />}
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{ 
              borderColor: '#4ECDC4',
              color: '#4ECDC4',
              '&:hover': {
                borderColor: '#359999',
                backgroundColor: '#f0fffe'
              }
            }}
          >
            Insert Variable
          </Button>
        </Tooltip>

        {/* Create Custom Variable Button */}
        <Tooltip title="Create custom shortcuts">
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setShowCustomDialog(true)}
            sx={{ 
              borderColor: '#6C5CE7',
              color: '#6C5CE7',
              '&:hover': {
                borderColor: '#5F4FB0',
                backgroundColor: '#f5f3ff'
              }
            }}
          >
            Custom Variable
          </Button>
        </Tooltip>

        {/* View Stored Variables Button */}
        {customVariables.length > 0 && (
          <Chip
            icon={<StorageIcon />}
            label={`${customVariables.length} Stored`}
            onClick={() => setShowCustomDialog(true)}
            sx={{ backgroundColor: '#6C5CE7', color: 'white' }}
          />
        )}
      </Box>

      {/* Variable Dropdown Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          style: {
            maxHeight: '500px',
            width: '450px',
          },
        }}
      >
        {/* Search Box */}
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search variables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: '#999' }} />
            }}
          />
        </Box>

        <Divider />

        {/* Category Filter */}
        <Box sx={{ p: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Category</InputLabel>
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              label="Category"
            >
              {allCategories.map(cat => (
                <MenuItem key={cat} value={cat}>
                  {cat === 'all' ? '📋 All Variables' : `${getCategoryEmoji(cat)} ${cat.toUpperCase()}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Divider />

        {/* Variables List */}
        <Box sx={{ maxHeight: '300px', overflowY: 'auto' }}>
          {filteredVariables.length > 0 ? (
            filteredVariables.map((variable, idx) => (
              <MenuItem
                key={idx}
                onClick={() => handleVariableInsert(variable)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  py: 1.5,
                  px: 2,
                  borderBottom: '1px solid #eee',
                  '&:hover': {
                    backgroundColor: '#f5f5f5'
                  }
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {getCategoryEmoji(variable.category)} {variable.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>
                    {variable.description}
                  </Typography>
                  {variable.example && (
                    <Typography variant="caption" sx={{ color: '#999' }}>
                      Example: {variable.example}
                    </Typography>
                  )}
                </Box>
                <Tooltip title="Click to insert">
                  <InsertDriveFileIcon sx={{ ml: 1, color: '#4ECDC4', cursor: 'pointer' }} />
                </Tooltip>
              </MenuItem>
            ))
          ) : (
            <MenuItem disabled>
              <Typography variant="body2">No variables found</Typography>
            </MenuItem>
          )}
        </Box>

        <Divider />

        {/* Custom Variables Section */}
        {customVariables.length > 0 && (
          <>
            <Box sx={{ p: 2, backgroundColor: '#f9f9f9' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                ⭐ Your Custom Variables
              </Typography>
              {customVariables.map((variable) => (
                <MenuItem
                  key={variable.id}
                  onClick={() => handleVariableInsert(variable)}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    py: 0.5,
                    backgroundColor: '#fff9e6',
                    my: 0.5,
                    borderLeft: '3px solid #6C5CE7',
                  }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {variable.name}
                    </Typography>
                    <Typography variant="caption">{variable.value}</Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCustomVariable(variable.id);
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </MenuItem>
              ))}
            </Box>
          </>
        )}
      </Menu>

      {/* Custom Variable Dialog */}
      <Dialog
        open={showCustomDialog}
        onClose={() => setShowCustomDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <VariableIcon />
            Create Custom Variable
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Show Stored Variables */}
            {customVariables.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Stored Variables:
                </Typography>
                <Grid container spacing={1}>
                  {customVariables.map((variable) => (
                    <Grid item xs={12} key={variable.id}>
                      <Card variant="outlined">
                        <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {variable.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#666' }}>
                                Value: {variable.value}
                              </Typography>
                            </Box>
                            <Box display="flex" gap={0.5}>
                              <Tooltip title="Copy">
                                <IconButton
                                  size="small"
                                  onClick={() => navigator.clipboard.writeText(variable.name)}
                                >
                                  <CopyIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteCustomVariable(variable.id)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
                <Divider sx={{ my: 2 }} />
              </Box>
            )}

            {/* Create New Custom Variable */}
            <TextField
              fullWidth
              label="Variable Name"
              placeholder="e.g., {{greeting}}"
              value={newCustomVar.name}
              onChange={(e) => setNewCustomVar({ ...newCustomVar, name: e.target.value })}
              helperText="How you want to refer to this variable"
            />

            <TextField
              fullWidth
              label="Variable Value"
              placeholder="e.g., Hello there!"
              value={newCustomVar.value}
              onChange={(e) => setNewCustomVar({ ...newCustomVar, value: e.target.value })}
              helperText="What this variable will be replaced with"
              multiline
              rows={3}
            />

            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={newCustomVar.category}
                onChange={(e) => setNewCustomVar({ ...newCustomVar, category: e.target.value })}
                label="Category"
              >
                <MenuItem value="CUSTOM">⭐ Custom</MenuItem>
                <MenuItem value="GREETING">👋 Greeting</MenuItem>
                <MenuItem value="CLOSING">👋 Closing</MenuItem>
                <MenuItem value="OFFER">🎁 Offer</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCustomDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAddCustomVariable}
            variant="contained"
            sx={{ backgroundColor: '#6C5CE7' }}
          >
            Create Variable
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default VariableInsertToolbar;
