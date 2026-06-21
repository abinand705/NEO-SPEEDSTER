/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TestStage = 'idle' | 'ping' | 'download' | 'upload' | 'complete';

export interface SpeedMetrics {
  ping: number;     // in ms
  jitter: number;   // in ms
  download: number; // in Mbps
  upload: number;   // in Mbps
}

export interface SpeedTestState {
  stage: TestStage;
  progress: number; // 0 to 1
  currentSpeed: number; // current real-time Mb/s or ms being measured
  metrics: SpeedMetrics;
  history: {
    download: { time: number; value: number }[];
    upload: { time: number; value: number }[];
    ping: { time: number; value: number }[];
  };
}

export interface ServerConfig {
  id: string;
  name: string;
  location: string;
  sponsor: string;
  host: string;
  pingUrl: string;
  downloadUrl: string;
  uploadUrl: string;
}

export interface GaugeTheme {
  primaryColor: string; // Hex color for active neon parts
  glowColor: string;    // Inner glow color
  accentColor: string;  // Accent/secondary color
  gradientArray: string[]; // Gradients for the arc
}
