# Guida alla Pubblicazione su GitHub e Integrazione con watsonx Orchestrate

Questa guida ti aiuterà a pubblicare il Bob MCP Server su GitHub e configurarlo in watsonx Orchestrate.

## Passo 1: Preparare il Repository GitHub

### 1.1 Creare il Repository su GitHub

1. Vai su [GitHub](https://github.com)
2. Clicca su **New Repository**
3. Compila i campi:
   - **Repository name**: `bob-mcp-server`
   - **Description**: `MCP Server per esporre Bob come tool in watsonx Orchestrate`
   - **Visibility**: Public (o Private se preferisci)
   - **NON** inizializzare con README, .gitignore o license (li abbiamo già)
4. Clicca su **Create repository**

### 1.2 Inizializzare Git Localmente

```bash
cd bob-mcp-server

# Inizializza git (se non già fatto)
git init

# Aggiungi tutti i file
git add .

# Crea il primo commit
git commit -m "Initial commit: Bob MCP Server per watsonx Orchestrate"

# Collega al repository remoto (sostituisci YOUR-USERNAME)
git remote add origin https://github.com/YOUR-USERNAME/bob-mcp-server.git

# Pusha il codice
git branch -M main
git push -u origin main
```

## Passo 2: Configurare GitHub Actions per Build Automatico (Opzionale)

Crea il file `.github/workflows/build.yml`:

```yaml
name: Build and Test

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build
      run: npm run build
      
    - name: Upload build artifacts
      uses: actions/upload-artifact@v3
      with:
        name: dist
        path: dist/
```

## Passo 3: Creare un Release (Opzionale ma Raccomandato)

### 3.1 Creare un Tag

```bash
# Crea un tag per la versione
git tag -a v1.0.0 -m "Release v1.0.0: Prima versione stabile"

# Pusha il tag
git push origin v1.0.0
```

### 3.2 Creare un Release su GitHub

1. Vai sul tuo repository GitHub
2. Clicca su **Releases** → **Create a new release**
3. Compila:
   - **Tag**: v1.0.0 (seleziona il tag appena creato)
   - **Release title**: v1.0.0 - Prima Release
   - **Description**: 
     ```markdown
     ## Funzionalità
     - Tool `generate_code` per generazione codice
     - Supporto per watsonx Orchestrate via MCP
     - Comunicazione tramite file system
     
     ## Installazione
     ```bash
     npx -y github:YOUR-USERNAME/bob-mcp-server
     ```
     ```
4. Clicca su **Publish release**

## Passo 4: Configurare in watsonx Orchestrate

### Metodo 1: Usando npx con GitHub (Raccomandato)

1. Accedi a **watsonx Orchestrate**
2. Vai su **Settings** → **Integrations** → **MCP Servers**
3. Clicca su **Add MCP Server** → **Remote Server**
4. Configura:

```yaml
Name: Bob Code Generator
Description: Genera codice tramite Bob Agent da GitHub
Command: npx
Arguments:
  - -y
  - github:YOUR-USERNAME/bob-mcp-server
Environment Variables: (opzionale)
  - NODE_ENV=production
```

5. Clicca su **Test Connection**
6. Salva

### Metodo 2: Usando un Tag Specifico

Per usare una versione specifica:

```yaml
Arguments:
  - -y
  - github:YOUR-USERNAME/bob-mcp-server#v1.0.0
```

### Metodo 3: Usando un Branch Specifico

Per usare un branch di sviluppo:

```yaml
Arguments:
  - -y
  - github:YOUR-USERNAME/bob-mcp-server#develop
```

## Passo 5: Testare l'Integrazione

### 5.1 Test Manuale Locale

Prima di testare in watsonx, verifica localmente:

```bash
# Installa e testa da GitHub
npx -y github:YOUR-USERNAME/bob-mcp-server
```

### 5.2 Test in watsonx Orchestrate

1. Crea un nuovo agente o usa uno esistente
2. Aggiungi il tool **Bob Code Generator**
3. Testa con un prompt:
   ```
   Genera una funzione JavaScript per ordinare un array di oggetti
   ```

## Vantaggi dell'Approccio GitHub

✅ **Gratuito**: Nessun costo per repository pubblici
✅ **Controllo Versioni**: Git nativo per tracking modifiche
✅ **CI/CD**: GitHub Actions per build automatici
✅ **Collaborazione**: Pull requests e issues
✅ **Sicurezza**: Controllo accessi granulare
✅ **Documentazione**: README e Wiki integrati
✅ **No npm Account**: Non serve account npm

## Workflow di Sviluppo

### Aggiornare il Server

```bash
# Fai modifiche al codice
# ...

# Commit e push
git add .
git commit -m "feat: aggiungi supporto per più linguaggi"
git push

# Crea nuovo tag per release
git tag -a v1.1.0 -m "Release v1.1.0"
git push origin v1.1.0
```

### Aggiornare in watsonx Orchestrate

watsonx Orchestrate scaricherà automaticamente l'ultima versione quando:
- Usi `github:YOUR-USERNAME/bob-mcp-server` (senza tag)
- Riavvii il server MCP
- Usi un nuovo tag: `github:YOUR-USERNAME/bob-mcp-server#v1.1.0`

## Repository Privato

Se usi un repository privato:

### 1. Crea un Personal Access Token (PAT)

1. GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. **Generate new token**
3. Seleziona scope: `repo` (full control)
4. Copia il token

### 2. Configura in watsonx Orchestrate

```yaml
Command: npx
Arguments:
  - -y
  - github:YOUR-USERNAME/bob-mcp-server
Environment Variables:
  - GITHUB_TOKEN=ghp_your_token_here
```

Oppure usa l'URL con token:

```yaml
Arguments:
  - -y
  - https://ghp_your_token_here@github.com/YOUR-USERNAME/bob-mcp-server
```

## Struttura Repository Consigliata

```
bob-mcp-server/
├── .github/
│   └── workflows/
│       └── build.yml          # CI/CD
├── src/
│   └── index.ts               # Codice sorgente
├── dist/                      # Build output (gitignored)
├── .gitignore
├── package.json
├── tsconfig.json
├── README.md                  # Documentazione principale
├── GITHUB_SETUP.md           # Questa guida
├── WATSONX_SETUP.md          # Setup watsonx
└── LICENSE                    # Licenza (MIT raccomandato)

```

## Best Practices

1. **Usa Semantic Versioning**: v1.0.0, v1.1.0, v2.0.0
2. **Scrivi CHANGELOG**: Documenta ogni release
3. **Tag per Release**: Sempre crea tag per versioni stabili
4. **Branch Strategy**: 
   - `main` per produzione
   - `develop` per sviluppo
   - `feature/*` per nuove funzionalità
5. **GitHub Actions**: Automatizza build e test
6. **Proteggi main**: Richiedi pull request per modifiche

## Troubleshooting

### Errore: "Cannot find module"

```bash
# Verifica che il build sia committato
git add dist/
git commit -m "chore: add build artifacts"
git push
```

Oppure aggiungi GitHub Action per build automatico.

### Errore: "Permission denied"

- Verifica che il repository sia pubblico
- O configura GITHUB_TOKEN per repository privati

### watsonx non scarica l'ultima versione

```bash
# Forza un nuovo tag
git tag -a v1.0.1 -m "Force update"
git push origin v1.0.1

# In watsonx, usa il nuovo tag
github:YOUR-USERNAME/bob-mcp-server#v1.0.1
```

## Prossimi Passi

- [ ] Pubblica su GitHub
- [ ] Crea primo release (v1.0.0)
- [ ] Configura in watsonx Orchestrate
- [ ] Testa l'integrazione
- [ ] Documenta eventuali problemi
- [ ] Pianifica prossime funzionalità

## Risorse

- [GitHub Docs](https://docs.github.com)
- [npx Documentation](https://docs.npmjs.com/cli/v7/commands/npx)
- [Semantic Versioning](https://semver.org)
- [watsonx Orchestrate Docs](https://www.ibm.com/docs/en/watsonx/watson-orchestrate)