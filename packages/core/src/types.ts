export type ContentMode = "content" | "structured" | "full" | "raw";

export type OutputFormat = "markdown" | "slml" | "json" | "text";

export type WaitStrategy =
  | "load"
  | "domcontentloaded"
  | "networkidle"
  | "commit";

export interface ExtractOptions {
  url: string;
  mode?: ContentMode;
  format?: OutputFormat;
  includeImages?: boolean;
  includeLinks?: boolean;
  timeout?: number;
  waitFor?: WaitStrategy;
}

export interface ExtractResult {
  success: boolean;
  url: string;
  resolvedUrl: string;
  protocolNative: boolean;
  mode: ContentMode;
  format: OutputFormat;
  renderEngine: string;
  timing: TimingInfo;
  content: string;
  metadata: ContentMetadata;
  links: LinkInfo[];
  errors: string[];
}

export interface TimingInfo {
  totalMs: number;
  renderMs: number;
  extractMs: number;
  formatMs: number;
}

export interface ContentMetadata {
  title: string;
  description: string;
  language: string;
  wordCount: number;
  estimatedTokens: number;
  originalTokensEstimate: number;
  tokenSavingsPercent: number;
  headings: HeadingInfo[];
  linksCount: number;
  imagesCount: number;
  codeBlocksCount: number;
  frameworkDetected: string | null;
  spaRendered: boolean;
}

export interface HeadingInfo {
  level: number;
  text: string;
  id?: string;
}

export interface LinkInfo {
  text: string;
  url: string;
  type: "internal" | "external";
}

export interface ImageInfo {
  alt: string;
  src: string;
  caption?: string;
}

export interface CodeBlockInfo {
  language: string;
  content: string;
}

export interface ExtractedContent {
  title: string;
  description: string;
  language: string;
  mainHtml: string;
  textContent: string;
  headings: HeadingInfo[];
  links: LinkInfo[];
  images: ImageInfo[];
  codeBlocks: CodeBlockInfo[];
  navigation: NavigationItem[];
  meta: MetaInfo;
}

export interface NavigationItem {
  text: string;
  url: string;
  children?: NavigationItem[];
}

export interface MetaInfo {
  title: string;
  description: string;
  keywords: string[];
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

export interface ProtocolDiscovery {
  version: string;
  name: string;
  description: string;
  defaultFormat: OutputFormat;
  endpoints: {
    content: string;
    sitemap?: string;
    search?: string;
  };
  supportedModes: ContentMode[];
  languages: string[];
  rateLimit?: {
    requestsPerMinute: number;
    burst?: number;
  };
}

export interface ProtocolCheckResult {
  supported: boolean;
  discovery?: ProtocolDiscovery;
  responseTimeMs: number;
}

export interface BrowserPoolOptions {
  maxInstances?: number;
  idleTimeoutMs?: number;
  headless?: boolean;
}

export interface SemanticLayerOptions {
  browser?: BrowserPoolOptions;
  logLevel?: LogLevel;
}

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

export interface SiteDiscoveryResult {
  url: string;
  pages: DiscoveredPage[];
  sitemapFound: boolean;
  protocolSupported: boolean;
  timing: { totalMs: number };
}

export interface DiscoveredPage {
  url: string;
  title?: string;
  lastModified?: string;
  priority?: number;
}
