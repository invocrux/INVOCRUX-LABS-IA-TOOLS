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
  chatHistory: IMessage[]
): Promise<void> {
  const { error } = await cliente
    .from("agent_sessions")
    .upsert(
      {
        user_id: userId,
        chat_history: chatHistory,
        fecha_actualizacion: new Date().toISOString(),
      },
      {
        onConflict: "user_id", // Especificar la columna con unique constraint
      }
    );

  if (error) {
    throw new Error(`Failed to save session: ${error.message}`);
  }
}

export async function clearSesion(userId: string): Promise<void> {
  const { error } = await cliente
    .from("agent_sessions")
    .delete()
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to clear session: ${error.message}`);
  }
}
