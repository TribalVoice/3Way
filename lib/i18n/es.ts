import type { MessageKey } from './en';

export const es: MessageKey = {
  app: {
    title: '3Way Lite',
    subtitle: 'Tú · {a} · {b}',
  },
  header: {
    exportJson: 'Exportar sala como JSON',
    exportMd: 'Exportar sala como Markdown',
    importRoom: 'Importar JSON de la sala',
    search: 'Buscar en la sala (Ctrl+F)',
    gettingStarted: 'Primeros pasos',
    settings: 'Ajustes',
    clearRoom: 'Vaciar sala',
    support: 'Apoyar',
  },
  welcome: {
    heading: 'Sala a tres',
    blurb:
      'Tú y dos asientos de IA comparten una transcripción. Cada asiento puede ser Gemini, Grok, Claude, Perplexity o NVIDIA Build. Adjunta documentos, recibe respuestas en streaming y exporta copias — tú controlas el ritmo.',
    configureSeats: 'Configurar asientos',
    gettingStarted: 'Primeros pasos',
    firstTimeSetup: 'Configuración inicial',
    step1: '1. Ajustes → guarda las claves API y define Asiento A y B',
    step2: '2. Opcional: clip para adjuntar PDF o archivos de texto',
    step3: '3. Elige Ambos / asiento y envía un mensaje',
    step4: '4. Exporta JSON cuando quieras una copia de seguridad',
    windowsTitle: 'Windows (escritorio)',
    windowsBody:
      'Tras instalar Node.js, ejecuta create-desktop-shortcut.cmd una vez y usa el icono 3Way Lite en el Escritorio. O usa launch-3way.cmd.',
    mobileTitle: 'Android e iPhone',
    mobileBody:
      'Abre el sitio en Chrome o Safari y usa Añadir a pantalla de inicio / Instalar app. Hace falta una URL alojada o el servidor del PC en la misma Wi‑Fi.',
  },
  composer: {
    nextReply: 'Siguiente respuesta',
    both: 'Ambos',
    invite: 'Invitar {who}',
    inviteBoth: 'ambos',
    routeByPrefix: 'Enrutar por 1.ª palabra',
    route: 'Enrutar',
    attachFile: 'Adjuntar archivo (texto extraído)',
    placeholderBoth: 'Mensaje a la sala — ambos responden…',
    placeholderSeat: 'Mensaje a la sala — {name} responde…',
    placeholderRoute: '{hint} — luego tu mensaje…',
    footer:
      'El clip adjunta texto/PDF · respuestas en streaming · la descarga exporta la sala',
    send: 'Enviar',
  },
  search: {
    placeholder: 'Buscar en esta sala…',
    prev: 'Coincidencia anterior',
    next: 'Siguiente coincidencia',
    close: 'Cerrar búsqueda',
  },
  toast: {
    routedTo: 'Enrutado a {label}',
    exportedJson: 'JSON exportado',
    exportedMd: 'Markdown exportado',
    nothingExport: 'Aún no hay nada que exportar.',
    importedTurns: 'Importados {n} mensajes',
    newProject: 'Nuevo proyecto creado',
    projectCleared: 'Proyecto vaciado',
    projectDeleted: 'Proyecto eliminado',
    attached: 'Adjunto {name}',
    attachedTruncated: 'Adjunto {name} (truncado)',
  },
  confirm: {
    clearProject: '¿Vaciar la transcripción de este proyecto?',
    replaceImport:
      '¿Reemplazar la transcripción del proyecto actual con los datos importados?',
    deleteProject: '¿Eliminar el proyecto “{title}”?',
    clearOnlyProject: '¿Vaciar la transcripción de este proyecto?',
  },
  message: {
    you: 'Tú',
    document: 'Documento',
    truncated: 'truncado',
    copy: 'Copiar',
    copied: 'Copiado',
    retry: 'Reintentar',
    starting: 'Iniciando…',
    requestFailed: 'Error en la solicitud.',
  },
  project: {
    project: 'Proyecto',
    active: 'activo',
    rename: 'Renombrar',
    delete: 'Eliminar proyecto',
    newProject: 'Nuevo proyecto',
    defaultName: 'Proyecto {n}',
    main: 'Principal',
    untitled: 'Sin título',
  },
  settings: {
    title: 'Claves y asientos',
    description:
      'Registra las claves API una vez por proveedor y luego asigna proveedor y modelo a cada asiento. Las claves solo permanecen en este navegador.',
    keyRegister: 'Registro de claves API',
    keyRegisterHint:
      'Guarda cada proveedor una vez. Los asientos reutilizan las claves al cambiar de modelo.',
    saved: 'Guardada',
    notSet: 'Sin definir',
    seatA: 'Asiento A',
    seatB: 'Asiento B',
    provider: 'Proveedor',
    model: 'Modelo',
    keyReady: 'Clave lista',
    addKeyAbove: 'Añade la clave arriba',
    useDropdown: 'Usar lista',
    customModel: 'Introducir nombre de modelo personalizado',
    routeByPrefix: 'Enrutar por la primera palabra',
    routeByPrefixHint:
      'Si el mensaje empieza por BOTH/AMBOS, {a}, {b}, Asiento A o Asiento B, selecciona automáticamente el destino y quita la palabra clave antes de enviar. Útil para turnos rápidos solo con teclado.',
    language: 'Idioma',
    languageHint:
      'Idioma de la interfaz. También se pide a los asientos de IA que respondan en este idioma.',
    save: 'Guardar ajustes',
    savedBtn: 'Guardado',
  },
  help: {
    title: 'Primeros pasos',
    description:
      '3Way Lite es una app web local (o alojada) con dos asientos de IA y varios proyectos. Los asientos pueden ser Gemini, Grok, Claude, Perplexity o NVIDIA Build — tú aportas tus propias claves API.',
    apiKeys: '1. Claves API',
    openSettings: 'Ajustes',
    openSettingsLead: 'Abre',
    openSettingsMid:
      'y el registro de claves (guarda cada proveedor una vez); luego define proveedor y modelo del Asiento A y B.',
    gemini: 'Gemini:',
    grok: 'Grok:',
    claude: 'Claude:',
    perplexity: 'Perplexity:',
    nvidia: 'NVIDIA Build (endpoints a menudo gratuitos):',
    nvidiaHint:
      '— usa el id exacto del modelo en la página del modelo → View code',
    saveThenSend: 'Guarda, elige Ambos / un asiento y envía un mensaje.',
    useProjects:
      'Usa el selector de proyectos (carpeta) para conversaciones separadas.',
    windows: '2. Windows PC (icono de escritorio)',
    windows1:
      'Una vez: instala Node.js LTS y, en la carpeta del proyecto, ejecuta npm install.',
    windows2:
      'Haz doble clic en create-desktop-shortcut.cmd para poner 3Way Lite en el Escritorio.',
    windows3:
      'O ejecuta launch-3way.cmd en cualquier momento: inicia el servidor y abre el navegador.',
    windows4: 'Mantén abierta la ventana negra de la consola mientras chateas.',
    mobile: '3. Android e iPhone (pantalla de inicio)',
    mobileIntro:
      'Los móviles no ejecutan el servidor Node. Usa una URL alojada (p. ej. Netlify) o el servidor del PC en la misma Wi‑Fi e instala como app:',
    android: 'Android (Chrome):',
    androidBody:
      'abre el sitio → menú ⋮ → Instalar app o Añadir a pantalla de inicio.',
    iphone: 'iPhone (Safari):',
    iphoneBody: 'abre el sitio → Compartir → Añadir a pantalla de inicio.',
    wifi:
      'Misma Wi‑Fi que el PC: abre http://IP-DE-TU-PC:3000 en el navegador del móvil (el firewall debe permitirlo) y añade a inicio. El launcher del PC debe seguir en marcha.',
    wifiNote:
      'Los iconos de inicio abren la web app; no sustituyen Node en el PC.',
    usingRoom: '4. Usar la sala',
    attach: 'Adjunta archivos para extraer texto a la sala.',
    invite: 'Invitar pide a los modelos que hablen otra vez sin reescribir.',
    exportJson:
      'Exportar JSON (o Markdown) guarda un archivo con la descarga del navegador — suele ser la carpeta Descargas. El nombre es como 3way-room-….json.',
    projectsActive:
      'Los proyectos (control de carpeta) mantienen conversaciones separadas; la exportación solo cubre el proyecto activo.',
    routeByPrefix:
      'Opcional Enrutar por 1.ª palabra (Ajustes o junto a Siguiente respuesta): empieza con BOTH/AMBOS, el nombre del proveedor del asiento, o Asiento A / Asiento B.',
    storage: '5. Dónde se guardan los datos (sin exportar)',
    storageIntro:
      'Las conversaciones y ajustes no se guardan como archivos normales en la carpeta de 3Way en disco. Viven en el almacenamiento local de este navegador para el sitio (p. ej. localhost:3000), solo en este equipo.',
    storageProjects: 'Lista de proyectos e id del proyecto activo',
    storageTranscript: 'Transcripción de cada proyecto',
    storageSettings: 'Registro de claves y elección de proveedor/modelo de asientos',
    storageNote:
      'Borrar datos del sitio, otro navegador/perfil u otro dispositivo no muestra los mismos proyectos. Exportar JSON es la copia de seguridad en archivo real.',
    support: 'Apoyo',
    supportBody:
      '3Way Lite es gratuito con tus propias claves. Si te ayuda, puedes apoyar en Ko-fi — sin cuenta en la app y nada bloqueado por pago.',
  },
  langName: {
    en: 'English',
    'pt-BR': 'Português (Brasil)',
    es: 'Español',
  },
};
