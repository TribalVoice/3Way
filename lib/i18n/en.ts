export const en = {
  app: {
    title: '3Way Lite',
    subtitle: 'You · {a} · {b}',
  },
  header: {
    exportJson: 'Export room as JSON',
    exportMd: 'Export room as Markdown',
    importRoom: 'Import room JSON',
    search: 'Search room (Ctrl+F)',
    gettingStarted: 'Getting started',
    settings: 'Settings',
    clearRoom: 'Clear room',
    support: 'Support',
  },
  welcome: {
    heading: 'Three-way room',
    blurb:
      'You and two AI seats share one transcript. Each seat can be Gemini, Grok, Claude, Perplexity, or NVIDIA Build. Attach docs, stream replies, export backups — you control the pace.',
    configureSeats: 'Configure seats',
    gettingStarted: 'Getting started',
    firstTimeSetup: 'First-time setup',
    step1: '1. Settings → save API keys, then set Seat A and Seat B',
    step2: '2. Optional: paperclip to attach PDF or text files',
    step3: '3. Choose Both / seat, then send a message',
    step4: '4. Export JSON anytime to back up the room',
    windowsTitle: 'Windows desktop',
    windowsBody:
      'After Node.js is installed, run create-desktop-shortcut.cmd once, then double-click 3Way Lite on the Desktop. Or use launch-3way.cmd.',
    mobileTitle: 'Android & iPhone',
    mobileBody:
      'Open this site in Chrome or Safari, then Add to Home Screen / Install app. Needs a hosted URL or your PC server on the same Wi‑Fi.',
  },
  composer: {
    nextReply: 'Next reply',
    both: 'Both',
    invite: 'Invite {who}',
    inviteBoth: 'both',
    routeByPrefix: 'Route by first word',
    route: 'Route',
    attachFile: 'Attach file (text extracted)',
    placeholderBoth: 'Message the room — both seats stream…',
    placeholderSeat: 'Message the room — {name} streams…',
    placeholderRoute: '{hint} — then your message…',
    footer:
      'Paperclip attaches text/PDF · replies stream live · download exports the room',
    send: 'Send',
  },
  search: {
    placeholder: 'Search this room…',
    prev: 'Previous match',
    next: 'Next match',
    close: 'Close search',
  },
  toast: {
    routedTo: 'Routed to {label}',
    exportedJson: 'Exported JSON',
    exportedMd: 'Exported Markdown',
    nothingExport: 'Nothing to export yet.',
    importedTurns: 'Imported {n} turns',
    newProject: 'New project created',
    projectCleared: 'Project cleared',
    projectDeleted: 'Project deleted',
    attached: 'Attached {name}',
    attachedTruncated: 'Attached {name} (truncated)',
  },
  confirm: {
    clearProject: 'Clear this project’s transcript?',
    replaceImport:
      'Replace the current project transcript with the imported data?',
    deleteProject: 'Delete project “{title}”?',
    clearOnlyProject: 'Clear this project’s transcript?',
  },
  message: {
    you: 'You',
    document: 'Document',
    truncated: 'truncated',
    copy: 'Copy',
    copied: 'Copied',
    retry: 'Retry',
    starting: 'Starting…',
    requestFailed: 'Request failed.',
  },
  project: {
    project: 'Project',
    active: 'active',
    rename: 'Rename',
    delete: 'Delete project',
    newProject: 'New project',
    defaultName: 'Project {n}',
    main: 'Main',
    untitled: 'Untitled',
  },
  settings: {
    title: 'Keys & seats',
    description:
      'Register API keys once per provider, then assign each seat a provider and model. Keys stay in this browser only.',
    keyRegister: 'API key register',
    keyRegisterHint:
      'Save each provider once. Seats reuse these when you switch models.',
    saved: 'Saved',
    notSet: 'Not set',
    seatA: 'Seat A',
    seatB: 'Seat B',
    provider: 'Provider',
    model: 'Model',
    keyReady: 'Key ready',
    addKeyAbove: 'Add key above',
    useDropdown: 'Use dropdown',
    customModel: 'Enter custom model name',
    routeByPrefix: 'Route by first word',
    routeByPrefixHint:
      'If a message starts with BOTH, {a}, {b}, Seat A, or Seat B, auto-select that Next reply target and remove the keyword before sending. Useful for fast keyboard-only turns.',
    language: 'Language',
    languageHint: 'App interface language. AI seats are also asked to reply in this language.',
    save: 'Save Settings',
    savedBtn: 'Saved',
  },
  help: {
    title: 'Getting started',
    description:
      '3Way Lite is a local (or hosted) web app with two AI seats and multiple projects. Seats can be Gemini, Grok, Claude, Perplexity, or NVIDIA Build — you bring your own API keys.',
    apiKeys: '1. API keys',
    openSettings: 'Settings',
    openSettingsLead: 'Open',
    openSettingsMid:
      'and open the API key register (save each provider once), then assign Seat A and Seat B providers and models.',
    gemini: 'Gemini:',
    grok: 'Grok:',
    claude: 'Claude:',
    perplexity: 'Perplexity:',
    nvidia: 'NVIDIA Build (often free endpoints):',
    nvidiaHint:
      '— use the exact model id from each model’s View code panel',
    saveThenSend: 'Save, then choose Both / a seat and send a message.',
    useProjects: 'Use the project switcher (folder) for separate conversations.',
    windows: '2. Windows PC (desktop icon)',
    windows1:
      'One-time: install Node.js LTS, then in the project folder run npm install.',
    windows2:
      'Double-click create-desktop-shortcut.cmd once to put 3Way Lite on your Desktop.',
    windows3:
      'Or run launch-3way.cmd anytime — it starts the server and opens the browser.',
    windows4: 'Keep the black console window open while you chat.',
    mobile: '3. Android & iPhone (home screen)',
    mobileIntro:
      'Phones cannot run the Node server themselves. Use a hosted URL (e.g. Netlify) or open your PC server on the same Wi‑Fi, then install as an app:',
    android: 'Android (Chrome):',
    androidBody: 'open the site → menu ⋮ → Install app or Add to Home screen.',
    iphone: 'iPhone (Safari):',
    iphoneBody: 'open the site → Share → Add to Home Screen.',
    wifi:
      'Same Wi‑Fi as your PC: open http://YOUR-PC-IP:3000 in the phone browser (firewall must allow it), then add to home screen. The PC launcher must stay running.',
    wifiNote:
      'Home-screen icons open the web app; they do not replace Node on a PC.',
    usingRoom: '4. Using the room',
    attach: 'Attach files to extract text into the room.',
    invite: 'Invite asks models to speak again without retyping.',
    exportJson:
      'Export JSON (or Markdown) saves a file via your browser’s download — usually your Downloads folder (or whatever folder you set for downloads). Filename looks like 3way-room-….json.',
    projectsActive:
      'Projects (folder control) keep separate conversations; export only covers the active project.',
    routeByPrefix:
      'Optional Route by first word (Settings or next to Next reply): start with BOTH, a seat’s provider name, or Seat A / Seat B to pick who answers without clicking.',
    storage: '5. Where data is stored (when not exported)',
    storageIntro:
      'Conversations and settings are not saved as normal files in the 3Way project folder on disk. They live in this browser’s local storage for the site (e.g. localhost:3000), on this machine only.',
    storageProjects: 'Project list and active project id',
    storageTranscript: 'Each project’s transcript',
    storageSettings: 'API key register and seat provider/model choices',
    storageNote:
      'Clearing site data, using another browser/profile, or a different device will not show the same projects. Export JSON is the way to back up a conversation as a real file.',
    support: 'Support',
    supportBody:
      '3Way Lite is free to use with your own API keys. If it helps you, you can optionally support on Ko-fi — no account required in the app, and nothing is locked behind payment.',
  },
  langName: {
    en: 'English',
    'pt-BR': 'Português (Brasil)',
    es: 'Español',
  },
};

type DeepStringify<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepStringify<T[K]>;
};

export type MessageKey = DeepStringify<typeof en>;
