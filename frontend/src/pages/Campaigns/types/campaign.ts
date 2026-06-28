/**
 * Campaign TypeScript Type Definitions
 * Provides type safety for campaign-related data structures
 */

/**
 * Campaign Status enum
 * Represents the lifecycle state of a campaign
 */
export enum CampaignStatus {
  DRAFT = 'DRAFT',           // Initial state, not yet launched
  SCHEDULED = 'SCHEDULED',   // Scheduled for future sending
  RUNNING = 'RUNNING',       // Currently active and sending
  PAUSED = 'PAUSED',         // Temporarily paused by user
  COMPLETED = 'COMPLETED',   // Finished sending
  FAILED = 'FAILED'          // Failed to complete
}

/**
 * Campaign Type enum
 * Represents the type/frequency of campaign
 */
export enum CampaignType {
  ONE_TIME = 'ONE_TIME',       // Send once
  RECURRING = 'RECURRING',     // Send on schedule
  TRIGGERED = 'TRIGGERED'      // Send based on event
}

/**
 * Campaign Channel enum
 * Supported communication channels
 */
export enum CampaignChannel {
  WHATSAPP = 'WHATSAPP',
  INSTAGRAM = 'INSTAGRAM',
  SMS = 'SMS',
  EMAIL = 'EMAIL'
}

/**
 * Message Type enum
 * Type of message content
 */
export enum MessageType {
  TEXT = 'TEXT',
  TEMPLATE = 'TEMPLATE',
  INTERACTIVE = 'INTERACTIVE'
}

/**
 * Media Type enum
 * Type of media attachment if any
 */
export enum MediaType {
  NONE = 'none',
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
  AUDIO = 'audio'
}

/**
 * Target Audience interface
 * Defines who the campaign targets
 */
export interface TargetAudience {
  segments?: string[];         // Audience segments
  languages?: string[];        // Preferred languages
  loyaltyTiers?: string[];     // Customer loyalty tiers
  customFilters?: Record<string, any>; // Custom filtering criteria
}

/**
 * Campaign Metrics interface
 * Tracks campaign performance metrics
 */
export interface CampaignMetrics {
  totalTargets: number;        // Total recipients targeted
  totalSent: number;           // Messages sent
  totalDelivered: number;      // Messages delivered
  totalRead?: number;          // Messages read
  totalFailed?: number;        // Failed messages
  deliveryRate?: number;       // Delivery percentage
  readRate?: number;           // Read percentage
}

/**
 * Campaign interface
 * Main campaign data structure
 */
export interface Campaign extends CampaignMetrics {
  _id: string;                 // Database ID
  name: string;                // Campaign identifier/name
  topic: string;               // Campaign topic/title
  description?: string;        // Campaign description
  status: CampaignStatus;      // Current status
  type: CampaignType;          // Campaign type
  channels: CampaignChannel[]; // Communication channels
  
  // Message content
  messageTemplate: string;     // Message template ID or content
  messageType: MessageType;    // Type of message
  
  // Media
  mediaType: MediaType;        // Type of media (if any)
  mediaUrl?: string;           // URL to media file
  mediaPreviewData?: string;   // Base64 preview data
  mediaMimeType?: string;      // MIME type of media
  mediaFileName?: string;      // Original file name
  
  // Call-to-action
  buttonLabel?: string;        // CTA button text
  buttonUrl?: string;          // CTA button URL
  
  // Targeting
  targetAudience: TargetAudience;
  
  // Scheduling
  scheduledAt?: Date;          // When to send
  createdAt: Date;             // Creation timestamp
  updatedAt: Date;             // Last update timestamp
  completedAt?: Date;          // Completion timestamp
}

/**
 * Campaign Stats interface
 * Aggregated statistics
 */
export interface CampaignStats {
  total: number;               // Total campaigns
  active: number;              // Currently running
  completed: number;           // Finished
  draft: number;               // Draft state
  running?: number;            // Same as active
  paused?: number;             // Paused campaigns
}

/**
 * Create Campaign Payload interface
 * Data structure for creating a new campaign
 */
export interface CreateCampaignPayload {
  name: string;
  topic: string;
  description?: string;
  type: CampaignType;
  channels: CampaignChannel[];
  messageTemplate: string;
  messageType?: MessageType;
  mediaType?: MediaType;
  mediaUrl?: string;
  mediaPreviewData?: string;
  mediaMimeType?: string;
  mediaFileName?: string;
  buttonLabel?: string;
  buttonUrl?: string;
  targetAudience: TargetAudience;
  scheduledAt?: Date;
}

/**
 * Update Campaign Payload interface
 * Data structure for updating a campaign
 */
export interface UpdateCampaignPayload extends Partial<CreateCampaignPayload> {
  name?: string;
  topic?: string;
  channels?: CampaignChannel[];
  messageTemplate?: string;
}

/**
 * Campaign Filter interface
 * Query parameters for fetching campaigns
 */
export interface CampaignFilter {
  status?: CampaignStatus;
  type?: CampaignType;
  channel?: CampaignChannel;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'status';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated Campaigns Response interface
 */
export interface PaginatedCampaignsResponse {
  campaigns: Campaign[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Campaign Action Result interface
 * Result of campaign operations
 */
export interface CampaignActionResult {
  success: boolean;
  message?: string;
  error?: Error | string;
  campaign?: Campaign;
  data?: any;
}
