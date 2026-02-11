import * as readline from "readline";
import { crearAgente } from "./agente";

async function main() {
  console.log("🍎 Frutería Invocrux - Chat Interactivo");
  console.log("Escribí tu mensaje o 'salir' para terminar.\n");

  const executor = await crearAgente();

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
        const resultado = await executor.invoke({ input: mensaje });
        console.log(`\n🤖 Agente: ${resultado.output}\n`);
      } catch (error) {
        console.error("❌ Error:", error);
      }
      preguntar();
    });
  };

  preguntar();
}

main();
