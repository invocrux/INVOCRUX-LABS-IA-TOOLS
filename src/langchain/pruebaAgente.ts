import * as readline from "readline";
import { crearAgente } from "./agente";

async function main() {
  console.log("🍎 Frutería Invocrux - Chat Interactivo");
  console.log("Escribí tu mensaje o 'salir' para terminar.\n");

  const agente = await crearAgente();
  let chatHistory: any[] = [];

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const preguntar = () => {
    rl.question("Vos: ", async (input) => {
      const mensaje = input.trim();

      if (mensaje.toLowerCase() === "salir") {
        console.log("\n👋 ¡Hasta luego!");
        rl.close();
        return;
      }

      if (!mensaje) {
        preguntar();
        return;
      }

      try {
        const resultado = await agente.invoke(mensaje, chatHistory);
        console.log(`\n🤖 Agente: ${resultado.output}\n`);
        
        // Guardar en historial
        chatHistory = resultado.messages;
      } catch (error) {
        console.error("❌ Error:", error);
      }
      preguntar();
    });
  };

  preguntar();
}

main();
