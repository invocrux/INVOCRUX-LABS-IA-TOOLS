FROM node:20-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar TODAS las dependencias (incluyendo devDependencies para compilar)
RUN npm ci

# Copiar código fuente
COPY . .

# Compilar TypeScript
RUN npm run build

# Remover devDependencies para imagen más liviana
RUN npm prune --production

# Exponer puerto
EXPOSE 3000

# Comando para iniciar
CMD ["node", "dist/server.js"]
