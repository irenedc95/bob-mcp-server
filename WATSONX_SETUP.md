# Guida alla Configurazione in watsonx Orchestrate

Questa guida ti aiuterà a configurare il Bob MCP Server in watsonx Orchestrate Agentic AI.

## Prerequisiti

1. Accesso a watsonx Orchestrate con permessi per aggiungere MCP servers
2. Node.js installato (versione 18 o superiore)
3. Bob MCP Server compilato e funzionante

## Passo 1: Preparare il Server MCP

### Opzione A: Uso Locale (Sviluppo/Test)

```bash
cd bob-mcp-server
npm install
npm run build
```

Verifica che il file `dist/index.js` sia stato creato.

### Opzione B: Pubblicazione su npm

```bash
# Login su npm
npm login

# Pubblica il package
npm publish
```

### Opzione C: Pubblicazione su GitHub

```bash
# Inizializza git (se non già fatto)
git init
git add .
git commit -m "Initial commit: Bob MCP Server"

# Crea repository su GitHub e pusha
git remote add origin https://github.com/your-username/bob-mcp-server.git
git push -u origin main
```

## Passo 2: Configurare in watsonx Orchestrate

### Per Connessione Locale

1. Accedi a **watsonx Orchestrate**
2. Naviga su **Settings** → **Integrations** → **MCP Servers**
3. Clicca su **Add MCP Server** → **Local Server**
4. Compila i campi:

```yaml
Name: Bob Code Generator
Description: Genera codice di alta qualità tramite Bob Agent
Command: node
Arguments: 
  - c:/Users/IreneDelCastello/Desktop/Project Bob/bob-mcp-server/dist/index.js
Working Directory: c:/Users/IreneDelCastello/Desktop/Project Bob/bob-mcp-server
Environment Variables: (opzionale)
  - NODE_ENV=production
```

5. Clicca su **Test Connection** per verificare
6. Salva la configurazione

### Per Connessione Remota (npm)

1. Accedi a **watsonx Orchestrate**
2. Naviga su **Settings** → **Integrations** → **MCP Servers**
3. Clicca su **Add MCP Server** → **Remote Server**
4. Compila i campi:

```yaml
Name: Bob Code Generator
Description: Genera codice di alta qualità tramite Bob Agent
Command: npx
Arguments:
  - -y
  - bob-mcp-server@latest
```

5. Clicca su **Test Connection**
6. Salva la configurazione

### Per Connessione da GitHub

```yaml
Name: Bob Code Generator
Description: Genera codice di alta qualità tramite Bob Agent
Command: npx
Arguments:
  - -y
  - github:your-username/bob-mcp-server
```

## Passo 3: Configurare l'Agente

1. Vai su **Agents** → **Create New Agent**
2. Configura l'agente:

```yaml
Name: Code Generation Agent
Description: Agente specializzato nella generazione di codice
Model: (seleziona il modello preferito)
```

3. Nella sezione **Tools**, aggiungi:
   - Seleziona **Bob Code Generator**
   - Abilita il tool **generate_code**

4. Configura il **System Prompt**:

```
Sei un assistente specializzato nella generazione di codice.
Quando l'utente richiede codice, usa il tool generate_code per creare soluzioni di alta qualità.

Linee guida:
- Analizza attentamente i requisiti dell'utente
- Specifica sempre il linguaggio di programmazione
- Fornisci contesto aggiuntivo quando necessario
- Spiega il codice generato all'utente
```

5. Salva l'agente

## Passo 4: Testare l'Integrazione

1. Apri la chat con l'agente appena creato
2. Prova con un prompt semplice:

```
Genera una funzione Python per calcolare il fattoriale di un numero
```

3. L'agente dovrebbe:
   - Invocare il tool `generate_code`
   - Il server MCP creerà `bob-communication/request.json`
   - **TU DEVI**: Leggere il file, elaborare con Bob, salvare in `response.json`, rimuovere `.lock`
   - L'agente riceverà il codice e lo presenterà

## Workflow Operativo

### Quando watsonx Orchestrate Invoca Bob:

1. **Notifica Console**: Il server MCP stamperà:
   ```
   [Bob MCP] Richiesta scritta in bob-communication/request.json
   [Bob MCP] In attesa della risposta di Bob...
   ```

2. **Leggi la Richiesta**:
   ```bash
   # Apri il file
   notepad bob-communication/request.json
   ```

3. **Elabora con Bob**:
   - Copia il contenuto del `prompt` dal file JSON
   - Incollalo nella chat di Bob in VS Code
   - Attendi la risposta di Bob

4. **Salva la Risposta**:
   ```json
   {
     "result": "// Il codice generato da Bob\nfunction example() {\n  // ...\n}"
   }
   ```
   Salva in `bob-communication/response.json`

5. **Rimuovi il Lock**:
   ```bash
   del bob-communication\.lock
   ```

6. **Risultato**: watsonx Orchestrate riceverà il codice

## Troubleshooting

### Errore: "Cannot find module"

```bash
cd bob-mcp-server
npm install
npm run build
```

### Errore: "Timeout: Bob non ha risposto"

- Verifica di aver salvato `response.json`
- Verifica di aver rimosso il file `.lock`
- Controlla che il formato JSON sia corretto

### Errore: "Tool sconosciuto"

- Verifica che il tool sia abilitato nell'agente
- Riavvia il server MCP
- Controlla i log del server

### Il server non si avvia

```bash
# Verifica Node.js
node --version  # Deve essere >= 18

# Verifica il build
npm run build

# Test manuale
node dist/index.js
```

## Monitoraggio

### Log del Server MCP

Il server stampa log su stderr:
```
[Bob MCP] Avvio del server MCP per Bob...
[Bob MCP] Server MCP avviato con successo!
[Bob MCP] In attesa di richieste da watsonx Orchestrate...
```

### File di Comunicazione

Monitora la directory `bob-communication/`:
- `request.json` - Richieste in arrivo
- `response.json` - Risposte da inviare
- `.lock` - Indica elaborazione in corso

## Best Practices

1. **Mantieni Bob Aperto**: Tieni VS Code con Bob sempre aperto durante l'uso
2. **Monitora la Directory**: Usa un file watcher per notifiche automatiche
3. **Backup delle Risposte**: Salva le risposte importanti
4. **Versioning**: Usa Git per tracciare modifiche al server
5. **Testing**: Testa sempre con prompt semplici prima di usare in produzione

## Prossimi Passi

- [ ] Automatizzare il processo con uno script di monitoraggio
- [ ] Aggiungere più tool (explain_code, refactor_code)
- [ ] Implementare caching delle risposte
- [ ] Creare dashboard di monitoraggio

## Supporto

Per problemi o domande:
1. Controlla i log del server MCP
2. Verifica la configurazione in watsonx Orchestrate
3. Testa il server manualmente con `node dist/index.js`