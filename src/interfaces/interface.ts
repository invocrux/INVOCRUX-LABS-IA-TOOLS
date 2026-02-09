export interface IToolCall {
  type: string;
  function: IFunctionDefinition;
}

export interface IFunctionDefinition {
  name: string;
  description: string;
  parameters: IParameters;
}

export interface IParameters {
  type: string;
  properties: {
    [key: string]: {
      type: "string" | "number" | "boolean";
      description: string;
    };
  };
  required: string[];
}

export interface ILLMMessage {
    model: string;
    messages: IMessagesInput[];
    tools: IToolCall[];
    tool_choice: string;
}

export interface IMessagesInput {
    role: "user" | "system" | "assistant" | "tool";
    content?: string;
    tool_call_id?: string;
    name?: string;
    tool_calls?: ToolCall[];
}

export interface ILLMResponse {
    id:                 string;
    object:             string;
    created:            number;
    model:              string;
    choices:            Choice[];
    usage:              Usage;
    stats:              Stats;
    system_fingerprint: string;
}

export interface Choice {
    index:         number;
    message:       Message;
    logprobs:      null;
    finish_reason: string;
}

export interface Message {
    role:       string;
    content:    string;
    tool_calls: ToolCall[];
}

export interface ToolCall {
    type:     string;
    id:       string;
    function: Function;
}

export interface Function {
    name:      string;
    arguments: string;
}

export interface Stats {
}

export interface Usage {
    prompt_tokens:     number;
    completion_tokens: number;
    total_tokens:      number;
}

export interface IMetadataAgente{
    nombre: string;
    descripcion: string;
    tools: string[];
    systemPrompt: string;
}