import { ContentBlock } from "langchain";
import { Text } from "openai/resources/beta/threads/messages";

export enum CODIGO_ERROR {
  VALIDATION_ERROR,
  AGENT_ERROR,
  INTERNAL_ERROR,
}

export interface IChatDataDTO {
  respuesta: string | (ContentBlock | Text)[];
  toolsEjecutadas: (string | undefined)[];
  duracionMs: number;
  timestamp: string;
}

// 1. Request (lo que envía cliente)
export interface IChatRequest {
  userId: string;
  mensaje: string;
}

// 2. Success (respuesta exitosa)
export interface IChatResponseSuccess {
  success: true;
  data: IChatDataDTO;
  timestamp: string;
}

// 3. Error (respuesta con error)
export interface IChatResponseError {
  success: false;
  error: IErrorResponse;
  timestamp: string;
}

// 4. Union (cualquiera de las dos)
export type IChatResponse = IChatResponseSuccess | IChatResponseError;

// 5. Error details
export interface IErrorResponse {
  code: CODIGO_ERROR;
  message: string;
  details?: object;
}

// 6. Message (para historial)
export interface IMessage {
  role: "user" | "assistant";
  content: string;
}
