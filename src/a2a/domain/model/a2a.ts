// A2A Protocol types 

export type TaskState =
  | "submitted"
  | "working"
  | "input-required"
  | "completed"
  | "failed"
  | "canceled"
  | "unknown";

export interface TextPart {
  type: "text";
  text: string;
}

export interface DataPart {
  type: "data";
  data: Record<string, unknown>;
}

export type Part = TextPart | DataPart;

export interface Message {
  role: "user" | "agent";
  parts: Part[];
}

export interface Artifact {
  name?: string;
  description?: string;
  parts: Part[];
}

export interface Task {
  id: string;
  sessionId?: string;
  status: {
    state: TaskState;
    message?: Message;
  };
  artifacts?: Artifact[];
  metadata?: Record<string, unknown>;
}

export interface AgentSkill {
  id: string;
  name: string;
  description: string;
  tags: string[];
  examples?: string[];
}

export interface AgentAuth {
  schemes: string[];
  credentials?: string;
}

export interface AgentCard {
  name: string;
  description: string;
  url: string;
  version: string;
  capabilities: {
    streaming: boolean;
    pushNotifications: boolean;
    stateTransitionHistory: boolean;
  };
  authentication: AgentAuth;
  defaultInputModes: string[];
  defaultOutputModes: string[];
  skills: AgentSkill[];
}

// JSON-RPC 2.0

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

export type JsonRpcSuccess = {
  jsonrpc: "2.0";
  id: string | number;
  result: unknown;
};

export type JsonRpcFailure = {
  jsonrpc: "2.0";
  id: string | number;
  error: JsonRpcError;
};

export type JsonRpcResponse = JsonRpcSuccess | JsonRpcFailure;