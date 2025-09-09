# ⚽ API Times Brasileiros

API REST em **Node.js + Express** para listar **clubes brasileiros de futebol** (ativos e inativos), de A a Z, com dados históricos e integração com a Wikipedia.

## 🚀 Funcionalidades
- Listagem completa de clubes (nome, cidade, estado, fundação, status, hino).
- Filtros por nome, estado, status e letra inicial.
- Integração com a Wikipedia para trazer **resumo histórico** e **imagem do escudo**.
- Endpoint compatível com paginação.
- Documentação básica em OpenAPI.

## 📂 Estrutura do projeto
```

├── clubs.json      # Base inicial com times brasileiros
└── server.js       # Servidor Express (API REST)

````

## 🔧 Instalação e uso

1. Clone este repositório:
   ```bash
   git clone https://github.com/GbrlSouza/API-Times-Brasileiros.git
   cd API-Times-Brasileiros
    ```

2. Crie o `package.json` (ou copie este exemplo):

   ```json
   {
     "name": "API-Times-Brasileiros",
     "version": "1.0.0",
     "type": "module",
     "main": "server.js",
     "scripts": { "start": "node server.js" },
     "dependencies": {
       "express": "^4.19.2",
       "cors": "^2.8.5",
       "helmet": "^7.1.0",
       "node-fetch": "^3.3.2"
     }
   }
   ```

3. Instale as dependências:

   ```bash
   npm install
   ```

4. Inicie o servidor:

   ```bash
   npm start
   ```

## 🌍 Endpoints

* **`GET /`** → Status da API
* **`GET /clubs`** → Lista paginada de clubes

  * Filtros: `?q=`, `&state=UF`, `&status=active|inactive`, `&letter=A`, `&limit=`, `&offset=`
* **`GET /clubs/:slug`** → Detalhes de um clube + enriquecimento (escudo e resumo Wikipedia)
* **`GET /openapi.json`** → Documentação básica OpenAPI

## 🖼️ Exemplo de uso no Frontend

Veja o arquivo [`example.html`](example.html) incluído neste repo.
Ele mostra como consumir a API e listar clubes com **Bootstrap**.

## 📜 Licença

* Código: MIT
* Dados/textos/imagens da Wikipedia: **CC BY-SA 4.0** (com atribuição)
