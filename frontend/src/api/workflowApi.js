import apiClient from './client';

/**
 * Get all workflows or filter by status
 */
export const getWorkflows = async (status = null) => {
  try {
    const url = status ? `/workflows?status=${status}` : '/workflows';
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch workflows:', error);
    throw error;
  }
};

/**
 * Get a single workflow by ID
 */
export const getWorkflow = async (workflowId) => {
  try {
    const response = await apiClient.get(`/workflows/${workflowId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch workflow:', error);
    throw error;
  }
};

/**
 * Get LIST items from a Response Rule
 */
export const getResponseRuleListItems = async (ruleId) => {
  try {
    const response = await apiClient.get(`/response-rules/${ruleId}/list-items`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch LIST items:', error);
    throw error;
  }
};

/**
 * Get all Response Rules (for dropdown)
 */
export const getResponseRules = async () => {
  try {
    const response = await apiClient.get('/response-rules');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch response rules:', error);
    throw error;
  }
};

/**
 * Create a new conditional workflow
 */
export const createConditionalWorkflow = async (config) => {
  try {
    const response = await apiClient.post('/workflows/conditional', config);
    return response.data;
  } catch (error) {
    console.error('Failed to create workflow:', error);
    throw error;
  }
};

/**
 * Update an existing workflow
 */
export const updateWorkflow = async (workflowId, config) => {
  try {
    const response = await apiClient.put(`/workflows/${workflowId}`, config);
    return response.data;
  } catch (error) {
    console.error('Failed to update workflow:', error);
    throw error;
  }
};

/**
 * Test a workflow with specific input data
 */
export const testWorkflow = async (workflowId, testData) => {
  try {
    const response = await apiClient.post(`/workflows/${workflowId}/test`, testData);
    return response.data;
  } catch (error) {
    console.error('Failed to test workflow:', error);
    throw error;
  }
};

/**
 * Activate a workflow
 */
export const activateWorkflow = async (workflowId) => {
  try {
    const response = await apiClient.post(`/workflows/${workflowId}/activate`);
    return response.data;
  } catch (error) {
    console.error('Failed to activate workflow:', error);
    throw error;
  }
};

/**
 * Pause a workflow
 */
export const pauseWorkflow = async (workflowId) => {
  try {
    const response = await apiClient.post(`/workflows/${workflowId}/pause`);
    return response.data;
  } catch (error) {
    console.error('Failed to pause workflow:', error);
    throw error;
  }
};

/**
 * Delete a workflow
 */
export const deleteWorkflow = async (workflowId) => {
  try {
    const response = await apiClient.delete(`/workflows/${workflowId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to delete workflow:', error);
    throw error;
  }
};

/**
 * Get workflow execution stats
 */
export const getWorkflowStats = async (workflowId) => {
  try {
    const response = await apiClient.get(`/workflows/${workflowId}/stats`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch workflow stats:', error);
    throw error;
  }
};

/**
 * Get all Templates
 */
export const getTemplates = async () => {
  try {
    const response = await apiClient.get('/templates');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch templates:', error);
    throw error;
  }
};

/**
 * Get all Quick Replies
 */
export const getQuickReplies = async () => {
  try {
    const response = await apiClient.get('/quick-replies');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch quick replies:', error);
    throw error;
  }
};
