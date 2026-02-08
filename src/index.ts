import dotenv from "dotenv";
import { orquestador } from "./agents/orquestador";
dotenv.config();

(async () => {
  const respuesta = await orquestador(
    "Quiero ver todas las manzanas que tengo en stock y actualizar el precio de la Manzana Verde a $8000",
  );
  console.log("\n🤖 IA:", respuesta);
})();
