#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Directory per la comunicazione con Bob tramite file system
const COMMUNICATION_DIR = path.join(__dirname, "..", "..", "bob-communication");
const REQUEST_FILE = path.join(COMMUNICATION_DIR, "request.json");
const RESPONSE_FILE = path.join(COMMUNICATION_DIR, "response.json");
const LOCK_FILE = path.join(COMMUNICATION_DIR, ".lock");
// Schema per il tool generate_code
const GenerateCodeSchema = z.object({
    prompt: z.string().describe("Descrizione del codice da generare"),
    language: z
        .string()
        .optional()
        .describe("Linguaggio di programmazione (es: python, javascript, typescript, java)"),
    context: z
        .string()
        .optional()
        .describe("Contesto aggiuntivo o requisiti specifici"),
});
// Funzione per creare la directory di comunicazione
async function ensureCommunicationDir() {
    try {
        await fs.mkdir(COMMUNICATION_DIR, { recursive: true });
    }
    catch (error) {
        console.error("Errore nella creazione della directory di comunicazione:", error);
    }
}
// Funzione per comunicare con Bob tramite file system
async function communicateWithBob(request) {
    await ensureCommunicationDir();
    // Scrivi la richiesta
    await fs.writeFile(REQUEST_FILE, JSON.stringify(request, null, 2));
    await fs.writeFile(LOCK_FILE, "processing");
    console.error(`[Bob MCP] Richiesta scritta in ${REQUEST_FILE}`);
    console.error("[Bob MCP] In attesa della risposta di Bob...");
    console.error("[Bob MCP] ISTRUZIONI: Apri il file request.json, elabora la richiesta con Bob, e salva la risposta in response.json");
    // Attendi la risposta (polling ogni 2 secondi, max 5 minuti)
    const maxAttempts = 150; // 5 minuti
    let attempts = 0;
    while (attempts < maxAttempts) {
        try {
            // Controlla se il file di risposta esiste e il lock è stato rimosso
            const lockExists = await fs
                .access(LOCK_FILE)
                .then(() => true)
                .catch(() => false);
            if (!lockExists) {
                const responseContent = await fs.readFile(RESPONSE_FILE, "utf-8");
                const response = JSON.parse(responseContent);
                // Pulisci i file
                await fs.unlink(REQUEST_FILE).catch(() => { });
                await fs.unlink(RESPONSE_FILE).catch(() => { });
                console.error("[Bob MCP] Risposta ricevuta da Bob");
                return response.result || response.content || JSON.stringify(response);
            }
        }
        catch (error) {
            // File non ancora pronto
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
        attempts++;
    }
    throw new Error("Timeout: Bob non ha risposto entro 5 minuti. Assicurati di elaborare la richiesta e salvare la risposta.");
}
// Crea il server MCP
const server = new Server({
    name: "bob-mcp-server",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
// Handler per la lista dei tool
server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools = [
        {
            name: "generate_code",
            description: "Genera codice in base a una descrizione. Bob analizzerà il prompt e genererà codice di alta qualità nel linguaggio specificato.",
            inputSchema: {
                type: "object",
                properties: {
                    prompt: {
                        type: "string",
                        description: "Descrizione dettagliata del codice da generare",
                    },
                    language: {
                        type: "string",
                        description: "Linguaggio di programmazione (es: python, javascript, typescript, java, go, rust)",
                    },
                    context: {
                        type: "string",
                        description: "Contesto aggiuntivo, requisiti specifici, o vincoli da considerare",
                    },
                },
                required: ["prompt"],
            },
        },
    ];
    return { tools };
});
// Handler per l'esecuzione dei tool
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "generate_code") {
        try {
            const args = GenerateCodeSchema.parse(request.params.arguments);
            // Costruisci il prompt completo per Bob
            let fullPrompt = args.prompt;
            if (args.language) {
                fullPrompt = `Genera codice in ${args.language}:\n\n${args.prompt}`;
            }
            if (args.context) {
                fullPrompt += `\n\nContesto aggiuntivo:\n${args.context}`;
            }
            // Comunica con Bob
            const result = await communicateWithBob({
                tool: "generate_code",
                parameters: {
                    prompt: fullPrompt,
                    language: args.language,
                    context: args.context,
                },
            });
            return {
                content: [
                    {
                        type: "text",
                        text: result,
                    },
                ],
            };
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                throw new Error(`Parametri non validi: ${error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")}`);
            }
            throw error;
        }
    }
    throw new Error(`Tool sconosciuto: ${request.params.name}`);
});
// Avvia il server
async function main() {
    console.error("[Bob MCP] Avvio del server MCP per Bob...");
    console.error(`[Bob MCP] Directory di comunicazione: ${COMMUNICATION_DIR}`);
    await ensureCommunicationDir();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("[Bob MCP] Server MCP avviato con successo!");
    console.error("[Bob MCP] In attesa di richieste da watsonx Orchestrate...");
}
main().catch((error) => {
    console.error("[Bob MCP] Errore fatale:", error);
    process.exit(1);
});
// Made with Bob
//# sourceMappingURL=index.js.map