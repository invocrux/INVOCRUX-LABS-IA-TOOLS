import cliente from "../services/supabase";
import { IMessage } from "../types/api.types";

export async function cargarSesion(userId: string): Promise<IMessage[]> {
  try {
    const { data, error } = await cliente
      .from("agent_sessions")
      .select("chat_history")
      .eq("user_id", userId);

    if (error) {
      console.error(`Error loading session: ${error.message}`);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    const chatHistory = data[0].chat_history;
    // Si ya es objeto (JSONB), no necesita parse
    if (typeof chatHistory === "object") {
      return chatHistory;
    }
    return JSON.parse(chatHistory);
  } catch (err) {
    console.error(`Error in cargarSesion:`, err);
    return [];
  }
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
