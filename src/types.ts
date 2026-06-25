export type RuleStatus = "active" | "draft" | "archived";
export type RuleLayer = "personal" | "repo";
export type Severity = "low" | "medium" | "high";
export type TaskKind =
  | "feature"
  | "fix"
  | "refactor"
  | "test"
  | "docs"
  | "review"
  | "chore";

export interface RuleScope {
  languages: string[];
  frameworks: string[];
  globs: string[];
  taskKinds: TaskKind[];
}

export interface RuleTriggers {
  keywords: string[];
}

export interface RuleMetadata {
  id: string;
  status: RuleStatus;
  layer: RuleLayer;
  severity: Severity;
  scope: RuleScope;
  triggers: RuleTriggers;
  conflictsWith: string[];
  includeExample?: "always" | "when-needed" | "never";
  createdAt?: string;
  updatedAt?: string;
}

export interface RuleBody {
  trigger: string;
  rule: string;
  prefer: string;
  rationale: string;
  example?: string;
}

export interface Rule {
  metadata: RuleMetadata;
  body: RuleBody;
  sourcePath: string;
}

export interface ConflictOverride {
  id: string;
  ruleIds: string[];
  decision: "prefer-rule" | "omit-rules";
  preferRuleId?: string;
  reason?: string;
  scope?: {
    globs?: string[];
    taskKinds?: TaskKind[];
  };
  createdAt: string;
}

export interface PreflightContext {
  cwd: string;
  gitRoot?: string;
  mentionedPaths: string[];
  languages: string[];
  frameworks: string[];
  taskKinds: TaskKind[];
  manifestFiles: string[];
}

export interface SelectionInput {
  task: string;
  cwd: string;
  tokenBudget: number;
}

export interface RuleMatch {
  rule: Rule;
  score: number;
  reasons: string[];
  estimatedTokens: number;
}

export interface RuleConflict {
  ruleIds: string[];
  reason: string;
  override?: ConflictOverride;
}

export interface SelectionResult {
  context: PreflightContext;
  selected: RuleMatch[];
  omitted: RuleMatch[];
  conflicts: RuleConflict[];
  overrides: ConflictOverride[];
}

export interface CompiledRulePack {
  core: string[];
  ruleIds: string[];
  instructions: string[];
  examples: Array<{
    ruleId: string;
    text: string;
  }>;
  conflicts: RuleConflict[];
  text: string;
  estimatedTokens: number;
}
