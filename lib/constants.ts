/**
 * Application-wide constants
 */

/**
 * Runway API Configuration
 */
export const RUNWAY_CONFIG = {
  /** Polling interval for checking generation status (milliseconds) */
  POLLING_INTERVAL_MS: 3000,

  /** Default video duration in seconds */
  DEFAULT_DURATION_SECONDS: 6,

  /** Valid duration values for Runway video generation */
  VALID_DURATIONS: [4, 6, 8] as const,

  /** Default aspect ratio in pixel format */
  DEFAULT_RATIO: '1280:720',

  /** Request timeout in milliseconds */
  REQUEST_TIMEOUT_MS: 30000,
} as const;

/**
 * React Query Configuration
 */
export const REACT_QUERY_CONFIG = {
  /** Time before data is considered stale (milliseconds) */
  STALE_TIME_MS: 10_000,

  /** Whether to refetch on window focus */
  REFETCH_ON_WINDOW_FOCUS: false,
} as const;

/**
 * Prompt Constraints
 */
export const PROMPT_CONSTRAINTS = {
  /** Maximum prompt length for Runway API */
  MAX_LENGTH: 1000,
} as const;
