import cliente from "../services/supabase";
import { IMessage } from "../types/api.types";

export async function cargarSesion(userId: string): Promise<IMessage[]> {
  const { data, error } = await cliente
    .from("agent_sessions")
    .select("chat_history")
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to load session: ${error.message}`);
  }

  if (!data || data.length === 0 ) {
    return []
  }

  const chatHistory = data[0].chat_history
  return JSON.parse(chatHistory);
}

export async function saveSesion(
  userId: string,
  chatHistory: any,
): Promise<void> {
  const { data, error } = await cliente
    .from("agent_sessions")
    .upsert({ user_id: userId, chat_history: chatHistory });

  if (error) {
    throw new Error(`Failed to save session: ${error.message}`);
  }
}
