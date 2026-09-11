import type { MessageKey } from './en';

export const ptBR: MessageKey = {
  app: {
    title: '3Way Lite',
    subtitle: 'Você · {a} · {b}',
  },
  header: {
    exportJson: 'Exportar sala como JSON',
    exportMd: 'Exportar sala como Markdown',
    importRoom: 'Importar JSON da sala',
    search: 'Buscar na sala (Ctrl+F)',
    gettingStarted: 'Primeiros passos',
    settings: 'Configurações',
    clearRoom: 'Limpar sala',
    support: 'Apoiar',
  },
  welcome: {
    heading: 'Sala a três',
    blurb:
      'Você e dois assentos de IA compartilham uma transcrição. Cada assento pode ser Gemini, Grok, Claude, Perplexity ou NVIDIA Build. Anexe documentos, receba respostas em streaming e exporte backups — você controla o ritmo.',
    configureSeats: 'Configurar assentos',
    gettingStarted: 'Primeiros passos',
    firstTimeSetup: 'Configuração inicial',
    step1: '1. Configurações → salve as chaves de API e defina Assento A e B',
    step2: '2. Opcional: clipe para anexar PDF ou arquivos de texto',
    step3: '3. Escolha Ambos / assento e envie uma mensagem',
    step4: '4. Exporte JSON a qualquer momento para backup',
    windowsTitle: 'Windows (área de trabalho)',
    windowsBody:
      'Depois de instalar o Node.js, execute create-desktop-shortcut.cmd uma vez e use o ícone 3Way Lite na Área de trabalho. Ou use launch-3way.cmd.',
    mobileTitle: 'Android e iPhone',
    mobileBody:
      'Abra o site no Chrome ou Safari e use Adicionar à tela inicial / Instalar app. Precisa de URL hospedada ou do servidor do PC na mesma Wi‑Fi.',
  },
  composer: {
    nextReply: 'Próxima resposta',
    both: 'Ambos',
    invite: 'Convidar {who}',
    inviteBoth: 'ambos',
    routeByPrefix: 'Rotear pela 1ª palavra',
    route: 'Rotear',
    attachFile: 'Anexar arquivo (texto extraído)',
    placeholderBoth: 'Mensagem para a sala — ambos respondem…',
    placeholderSeat: 'Mensagem para a sala — {name} responde…',
    placeholderRoute: '{hint} — depois sua mensagem…',
    footer:
      'Clipe anexa texto/PDF · respostas em streaming · download exporta a sala',
    send: 'Enviar',
  },
  search: {
    placeholder: 'Buscar nesta sala…',
    prev: 'Ocorrência anterior',
    next: 'Próxima ocorrência',
    close: 'Fechar busca',
  },
  toast: {
    routedTo: 'Roteado para {label}',
    exportedJson: 'JSON exportado',
    exportedMd: 'Markdown exportado',
    nothingExport: 'Nada para exportar ainda.',
    importedTurns: 'Importadas {n} mensagens',
    newProject: 'Novo projeto criado',
    projectCleared: 'Projeto limpo',
    projectDeleted: 'Projeto excluído',
    attached: 'Anexado {name}',
    attachedTruncated: 'Anexado {name} (truncado)',
  },
  confirm: {
    clearProject: 'Limpar a transcrição deste projeto?',
    replaceImport:
      'Substituir a transcrição do projeto atual pelos dados importados?',
    deleteProject: 'Excluir o projeto “{title}”?',
    clearOnlyProject: 'Limpar a transcrição deste projeto?',
  },
  message: {
    you: 'Você',
    document: 'Documento',
    truncated: 'truncado',
    copy: 'Copiar',
    copied: 'Copiado',
    retry: 'Tentar de novo',
    starting: 'Iniciando…',
    requestFailed: 'Falha na solicitação.',
  },
  project: {
    project: 'Projeto',
    active: 'ativo',
    rename: 'Renomear',
    delete: 'Excluir projeto',
    newProject: 'Novo projeto',
    defaultName: 'Projeto {n}',
    main: 'Principal',
    untitled: 'Sem título',
  },
  settings: {
    title: 'Chaves e assentos',
    description:
      'Cadastre as chaves de API uma vez por provedor e depois atribua provedor e modelo a cada assento. As chaves ficam só neste navegador.',
    keyRegister: 'Registro de chaves de API',
    keyRegisterHint:
      'Salve cada provedor uma vez. Os assentos reutilizam as chaves ao trocar de modelo.',
    saved: 'Salva',
    notSet: 'Não definida',
    seatA: 'Assento A',
    seatB: 'Assento B',
    provider: 'Provedor',
    model: 'Modelo',
    keyReady: 'Chave pronta',
    addKeyAbove: 'Adicione a chave acima',
    useDropdown: 'Usar lista',
    customModel: 'Informar nome de modelo personalizado',
    routeByPrefix: 'Rotear pela primeira palavra',
    routeByPrefixHint:
      'Se a mensagem começar com BOTH/AMBOS, {a}, {b}, Assento A ou Assento B, seleciona automaticamente o alvo e remove a palavra-chave antes de enviar. Útil para respostas rápidas só com teclado.',
    language: 'Idioma',
    languageHint:
      'Idioma da interface. Os assentos de IA também são orientados a responder neste idioma.',
    save: 'Salvar configurações',
    savedBtn: 'Salvo',
  },
  help: {
    title: 'Primeiros passos',
    description:
      'O 3Way Lite é um app web local (ou hospedado) com dois assentos de IA e vários projetos. Os assentos podem ser Gemini, Grok, Claude, Perplexity ou NVIDIA Build — você usa suas próprias chaves de API.',
    apiKeys: '1. Chaves de API',
    openSettings: 'Configurações',
    openSettingsLead: 'Abra',
    openSettingsMid:
      'e o registro de chaves (salve cada provedor uma vez); depois defina provedor e modelo do Assento A e B.',
    gemini: 'Gemini:',
    grok: 'Grok:',
    claude: 'Claude:',
    perplexity: 'Perplexity:',
    nvidia: 'NVIDIA Build (endpoints frequentemente gratuitos):',
    nvidiaHint:
      '— use o id exato do modelo na página do modelo → View code',
    saveThenSend: 'Salve, escolha Ambos / um assento e envie uma mensagem.',
    useProjects:
      'Use o seletor de projetos (pasta) para conversas separadas.',
    windows: '2. Windows PC (ícone na área de trabalho)',
    windows1:
      'Uma vez: instale o Node.js LTS e, na pasta do projeto, execute npm install.',
    windows2:
      'Clique duas vezes em create-desktop-shortcut.cmd para colocar o 3Way Lite na Área de trabalho.',
    windows3:
      'Ou execute launch-3way.cmd a qualquer momento — inicia o servidor e abre o navegador.',
    windows4: 'Mantenha a janela preta do console aberta enquanto conversa.',
    mobile: '3. Android e iPhone (tela inicial)',
    mobileIntro:
      'Celulares não executam o servidor Node. Use uma URL hospedada (ex.: Netlify) ou o servidor do PC na mesma Wi‑Fi e instale como app:',
    android: 'Android (Chrome):',
    androidBody:
      'abra o site → menu ⋮ → Instalar app ou Adicionar à tela inicial.',
    iphone: 'iPhone (Safari):',
    iphoneBody: 'abra o site → Compartilhar → Adicionar à Tela de Início.',
    wifi:
      'Mesma Wi‑Fi do PC: abra http://IP-DO-SEU-PC:3000 no navegador do celular (firewall deve permitir) e adicione à tela inicial. O launcher do PC deve continuar em execução.',
    wifiNote:
      'Ícones na tela inicial abrem o app web; não substituem o Node no PC.',
    usingRoom: '4. Usando a sala',
    attach: 'Anexe arquivos para extrair texto para a sala.',
    invite: 'Convidar pede que os modelos falem de novo sem redigitar.',
    exportJson:
      'Exportar JSON (ou Markdown) salva um arquivo pelo download do navegador — em geral a pasta Downloads. O nome fica como 3way-room-….json.',
    projectsActive:
      'Projetos (controle de pasta) mantêm conversas separadas; a exportação cobre só o projeto ativo.',
    routeByPrefix:
      'Opcional Rotear pela 1ª palavra (Configurações ou ao lado de Próxima resposta): comece com BOTH/AMBOS, o nome do provedor do assento, ou Assento A / Assento B.',
    storage: '5. Onde os dados ficam (sem exportar)',
    storageIntro:
      'Conversas e configurações não são salvas como arquivos normais na pasta do 3Way no disco. Ficam no armazenamento local deste navegador para o site (ex.: localhost:3000), só nesta máquina.',
    storageProjects: 'Lista de projetos e id do projeto ativo',
    storageTranscript: 'Transcrição de cada projeto',
    storageSettings: 'Registro de chaves e escolhas de provedor/modelo dos assentos',
    storageNote:
      'Limpar dados do site, outro navegador/perfil ou outro dispositivo não mostra os mesmos projetos. Exportar JSON é o backup em arquivo real.',
    support: 'Apoio',
    supportBody:
      'O 3Way Lite é gratuito com suas próprias chaves. Se ajudar, você pode apoiar no Ko-fi — sem conta no app e nada bloqueado por pagamento.',
  },
  langName: {
    en: 'English',
    'pt-BR': 'Português (Brasil)',
    es: 'Español',
  },
};
