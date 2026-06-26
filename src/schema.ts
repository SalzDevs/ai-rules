import type {
  ConflictOverride,
  RuleBody,
  RuleLayer,
  RuleMetadata,
  RuleScope,
  RuleStatus,
  RuleTriggers,
  Severity,
  TaskKind,
} from "./types.js";

const statuses = new Set<RuleStatus>(["active", "draft", "archived"]);
const layers = new Set<RuleLayer>(["personal"]);
const severities = new Set<Severity>(["low", "medium", "high"]);
const taskKinds = new Set<TaskKind>([
  "feature",
  "fix",
  "refactor",
  "test",
  "docs",
  "review",
  "chore",
]);

export function assertRuleMetadata(value: unknown, sourcePath: string): RuleMetadata {
  const record = asRecord(value, `Rule metadata in ${sourcePath}`);
  const scope = asRecord(record.scope, `scope in ${sourcePath}`);
  const triggers = asRecord(record.triggers, `triggers in ${sourcePath}`);

  return {
    id: readString(record.id, "id", sourcePath),
    status: readEnum(record.status, statuses, "status", sourcePath),
    layer: readEnum(record.layer, layers, "layer", sourcePath),
    severity: readEnum(record.severity, severities, "severity", sourcePath),
    scope: readScope(scope, sourcePath),
    triggers: readTriggers(triggers, sourcePath),
    conflictsWith: readStringArray(record.conflictsWith ?? [], "conflictsWith", sourcePath),
    includeExample:
      record.includeExample === undefined
        ? "when-needed"
        : readEnum(
            record.includeExample,
            new Set(["always", "when-needed", "never"] as const),
            "includeExample",
            sourcePath,
          ),
    createdAt: optionalString(record.createdAt, "createdAt", sourcePath),
    updatedAt: optionalString(record.updatedAt, "updatedAt", sourcePath),
  };
}

export function assertRuleBody(value: Partial<RuleBody>, sourcePath: string): RuleBody {
  return {
    trigger: readString(value.trigger, "Trigger section", sourcePath),
    rule: readString(value.rule, "Rule section", sourcePath),
    prefer: readString(value.prefer, "Prefer section", sourcePath),
    rationale: readString(value.rationale, "Rationale section", sourcePath),
    example: optionalString(value.example, "Example section", sourcePath),
  };
}

export function assertConflictOverride(value: unknown, sourcePath: string): ConflictOverride {
  const record = asRecord(value, `Conflict override in ${sourcePath}`);
  const decision = readEnum(
    record.decision,
    new Set(["prefer-rule", "omit-rules"] as const),
    "decision",
    sourcePath,
  );

  return {
    id: readString(record.id, "id", sourcePath),
    ruleIds: readStringArray(record.ruleIds, "ruleIds", sourcePath),
    decision,
    preferRuleId: optionalString(record.preferRuleId, "preferRuleId", sourcePath),
    reason: optionalString(record.reason, "reason", sourcePath),
    scope: readOverrideScope(record.scope, sourcePath),
    createdAt: readString(record.createdAt, "createdAt", sourcePath),
  };
}

function readScope(record: Record<string, unknown>, sourcePath: string): RuleScope {
  return {
    languages: readStringArray(record.languages ?? [], "scope.languages", sourcePath),
    frameworks: readStringArray(record.frameworks ?? [], "scope.frameworks", sourcePath),
    globs: readStringArray(record.globs ?? [], "scope.globs", sourcePath),
    taskKinds: readTaskKinds(record.taskKinds ?? [], "scope.taskKinds", sourcePath),
  };
}

function readTriggers(record: Record<string, unknown>, sourcePath: string): RuleTriggers {
  return {
    keywords: readStringArray(record.keywords ?? [], "triggers.keywords", sourcePath),
  };
}

function readOverrideScope(value: unknown, sourcePath: string): ConflictOverride["scope"] {
  if (value === undefined) {
    return undefined;
  }

  const record = asRecord(value, `override scope in ${sourcePath}`);
  return {
    globs: record.globs === undefined ? undefined : readStringArray(record.globs, "scope.globs", sourcePath),
    taskKinds: record.taskKinds === undefined ? undefined : readTaskKinds(record.taskKinds, "scope.taskKinds", sourcePath),
  };
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }

  return value as Record<string, unknown>;
}

function readString(value: unknown, field: string, sourcePath: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} in ${sourcePath} must be a non-empty string.`);
  }

  return value.trim();
}

function optionalString(value: unknown, field: string, sourcePath: string): string | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  return readString(value, field, sourcePath);
}

function readStringArray(value: unknown, field: string, sourcePath: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${field} in ${sourcePath} must be an array.`);
  }

  return value.map((item, index) => readString(item, `${field}[${index}]`, sourcePath));
}

function readTaskKinds(value: unknown, field: string, sourcePath: string): TaskKind[] {
  if (!Array.isArray(value)) {
    throw new Error(`${field} in ${sourcePath} must be an array.`);
  }

  return value.map((item, index) => readEnum(item, taskKinds, `${field}[${index}]`, sourcePath));
}

function readEnum<T extends string>(value: unknown, allowed: Set<T>, field: string, sourcePath: string): T {
  if (typeof value !== "string" || !allowed.has(value as T)) {
    throw new Error(`${field} in ${sourcePath} must be one of: ${Array.from(allowed).join(", ")}.`);
  }

  return value as T;
}
