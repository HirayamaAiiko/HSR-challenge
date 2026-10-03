# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [1.11.0] - 2026-10-04

### Added
- **Inspección de Amigo en Vivo (Ruleta, Gachapón y Expedición)**:
  - Ventana modal interactiva (`#friendInspectModal`) para auditar la actividad del amigo conectado en tiempo real.
  - **Pestaña Ruleta**: Visualización de la escuadra de 4 combatientes generada por el amigo, con arquetipo, rol, rareza, comandante y semilla de salto.
  - **Pestaña Gachapón**: Monitoreo de su escuadra activa de 4 personajes, tiradas realizadas vs límite, estado de pity de 5★, semilla de auditoría e historial de personajes de 4★ y 5★ obtenidos.
  - **Pestaña Expedición**: Modo activo, escuadra de partida, puntuación acumulada y checklist de objetivos cumplidos en vivo con insignias de estado.
  - Botón de refresco forzado (`#refreshFriendDataBtn`) con animación de giro (`#refreshFriendIcon`) para solicitar una sincronización completa instantánea (`REQUEST_FULL_STATE` / `FULL_STATE_RESPONSE`) vía WebRTC DataChannel.
  - Botones de acceso directo desde el banner de sala (`#openFriendInspectBannerBtn`) y las barras de acción de la Ruleta (`#rouletteFriendViewBtn`), Gachapón (`#gachaFriendViewBtn`) y Expedición (`#expeditionFriendViewBtn`).
- **Sincronización Bidireccional Automática**:
  - Difusión automática de eventos (`ROULETTE_SYNC`, `GACHA_SYNC`, `EXPEDITION_SYNC`) ante cualquier giro de ruleta, cambio de escuadra, tirada de gachapón o avance de expedición.
  - Handshake extendido en WebRTC para intercambiar el snapshot completo del estado tan pronto se establece la conexión P2P.

### Removed
- Removido el texto del pie de página descriptivo (`"Honkai: Star Rail — Herramienta de consulta y modos de juego para jugar con amigos. Cálculo 100% determinista y sin servidores. Compatible con GitHub Pages."`) para mantener una interfaz limpia y minimalista.

## [1.10.0] - 2026-10-04

### Added
- **Sala Multijugador Independiente & Panel de Compartir**:
  - Modal dedicado e intuitivo (`#shareRoomModal`) para gestionar salas y partidas compartidas sin copiado a ciegas.
  - Tarjeta de identidad activa con avatar seleccionado, apodo y UID de Honkai: Star Rail del usuario.
  - Generador de enlace directo con inspección previa en campo copiable (`#shareModalFullUrlInput`) y botón de un solo toque.
  - Desglose contextual de datos compartidos (`#shareSummaryChips`): modo de juego activo, semilla de RNG, anfitrión, UID y estado P2P.
- **Sincronización en Tiempo Real WebRTC Peer-to-Peer (PeerJS)**:
  - Conexión directa P2P mediante códigos de sala legibles (`HSR-XXXX`), sin servidores de datos ni bases de datos intermedias.
  - Panel para **Generar Sala en Vivo** (anfitrión) o **Conectar en Vivo** (invitado mediante código).
  - Sincronización bidireccional instantánea:
    - **Duelos Endgame 1v1**: Transmisión en vivo de puntuaciones/ciclos, cálculo sincronizado de ganador y regeneración de salas con semillas idénticas.
    - **Expediciones RNG**: Checklist interactivo sincronizado en milisegundos (casillas de objetivos y bonificación cósmica) y cálculo de resultados en vivo.
    - **Gachapón**: Notificaciones flotantes en tiempo real cuando un amigo obtiene un personaje de 4★ o 5★.
- **Identidad de Jugador y Soporte para Pestañas Privadas**:
  - Campo **UID de Jugador** (`#profileUidInput`) en el perfil con persistencia en almacenamiento local y transporte en URLs compartidas (`host`, `uid`, `avatar`, `room`).
  - Banner superior de sala compartida (`#sharedRoomBanner`) que se despliega al abrir enlaces en pestañas privadas u otros dispositivos, mostrando avatar, nombre y UID del anfitrión.
  - Asignación automática de roles: el anfitrión se posiciona en la Columna 1 y el jugador local en la Columna 2, con nombres personalizados en las actas de resultados.
  - Auto-conexión WebRTC P2P en segundo plano al abrir enlaces con parámetro de sala.

## [1.9.0] - 2026-10-04

### Added
- **Simulador Real de Gachapón Canónico con Cinemática Hiperespacial**:
  - Salto Astral Universal (`UNIVERSAL_WARP_BANNER`): Banner integral con todos los personajes de 5★ y 4★ reunidos sin restricciones de temporada ni exclusiones artificiales.
  - Cinemática interactiva completa sobre lienzo HTML5 Canvas (`#gachaWarpCanvas`) a 60 FPS con túnel hiperespacial de estrellas y aceleración visual.
  - Resonancia cromática y auras radiantes según la rareza más alta de la tirada:
    - 5★: Oro estelar radiante (`#fde047`) con destello cósmico y fanfarria triunfal polifónica.
    - 4★: Púrpura cósmico (`#c084fc`) con estela de partículas y campanas armónicas de cristal.
    - 3★: Azul astral (`#38bdf8`) para conos de luz de soporte.
  - Onda de choque circular en expansión (`#warpBurstRing`) y vibración 3D del boleto Star Rail Special Pass al detonar la energía del salto.
  - Botón táctil **Omitir Salto** (`#skipWarpAnimationBtn`) para cancelar la animación en cualquier instante y pasar inmediatamente al resultado.
  - Botón **✦ Saltar de Nuevo** (`#gachaRevealPullAgainBtn`) en la pantalla de revelación para repetir tiradas x1 o x10 sin salir de la vista de resultados.
- **Filtros Configurables de Rareza del Salto**:
  - Selector táctil de píldoras (`#gachaRarityFilterPills`):
    - `✦ Todos (5★ y 4★)`: Universo canónico completo.
    - `✦ Solo 5★`: Todos los saltos de personajes otorgan exclusivamente combatientes de 5 estrellas.
    - `✦ Solo 4★`: Todos los saltos de personajes otorgan exclusivamente combatientes de 4 estrellas (modo F2P).
- **Sincronización con el Roster Personal de Colección**:
  - Conmutador táctil (`#gachaSyncRosterToggle`) para restringir el universo de salto únicamente a los personajes que el usuario ha marcado como obtenidos en su perfil.
  - Insignia de estado en tiempo real (`#gachaPoolStatusBadge` y `#gachaActivePoolBadge`) indicando la cantidad exacta de personajes sorteables en el pool activo.
- **Meta de Pity 5★ Personalizable y Erradicación del 50/50**:
  - Pity duro configurable con píldoras predefinidas (50, 70, 80, 90) e input numérico personalizado (10 a 300 tiradas).
  - Eliminado por completo el sistema 50/50: al obtener un 5★ se entrega directamente un personaje 5★ del pool configurado, sin fallar en personajes no deseados.
  - Escalamiento suave de Soft Pity dinámico calculado proporcionalmente al 82% del umbral de Pity fijado hasta garantizar el 100% de probabilidad en el tiro meta.

## [1.8.2] - 2026-10-04

### Fixed
- **Visuales Canónicos de Personajes y Conos de Luz en el Gachapón**:
  - Reemplazados los iconos de Vías genéricas (`icon/path/...`) en conos de luz de 3 estrellas por las ilustraciones canónicas de `StarRailRes` (`image/light_cone_portrait/...` e `image/light_cone_preview/...`), validadas con CDN jsDelivr en código HTTP 200.
  - Corregida la extracción de retratos de personajes en `pullStarterSquad`, `pullSingle` y el modal de revelación para acceder rigurosamente a las propiedades `c.images?.icon_cdn` y `c.images?.preview_cdn`, eliminando la aparición errónea de iconos de Vías en personajes sorteados.
  - Distinción visual auténtica en el modal de revelación (`.reveal-card-visual`): los personajes se muestran con orbe circular iluminado con halo de rareza (`.char-visual`), y los conos de luz con tarjeta vertical estilizada de proporción 3:4 (`.cone-visual`).
- **Diseño Responsive y Corrección de Desborde Lateral Derecho en Pantallas 1366x768**:
  - Homologado `#pageGacha` con la clase `.mode-page` y estilos específicos (`overflow-x: hidden; box-sizing: border-box; width: 100%; min-width: 0;`).
  - Rediseñada la barra de telemetría HUD (`.gacha-hud-bar`) con pistas flexibles `minmax(0, 1fr)` y `min-width: 0` en estadísticas para impedir que el código de verificación o los textos de Pity desborden el ancho de pantalla.
  - Ajustada la tarjeta del banner (`.gacha-banner-card`) a `grid-template-columns: minmax(0, 1fr) 280px` con quiebre de texto en títulos largos (`word-break: break-word`) y envoltura de etiquetas destacadas.
  - Añadidas reglas de adaptación responsive para laptops compactas y tablets (`@media (max-width: 1080px)` y `@media (max-width: 920px)`), colapsando el banner a 1 columna y la grilla de escuadra a 2 columnas antes de llegar a móvil.
  - Blindada la tabla del historial de saltos (`.gacha-history-table-wrap`) con desplazamiento horizontal interno (`overflow-x: auto`) para garantizar navegación táctil fluida sin romper el viewport global.

## [1.8.1] - 2026-10-04

### Fixed
- **Desbloqueo Global de Clics y Navegación**:
  - Solucionado el fallo crítico donde un error de inicialización anticipada (`ReferenceError: Cannot access 'currentGachaSession' before initialization`) en `app.js` abortaba el registro de escuchadores de eventos en `setupEventListeners()`, dejando inoperantes las pestañas de navegación y los botones interactivos.
  - Centralizadas todas las declaraciones de estado y elementos del DOM en el encabezado de `app.js` y diferida la invocación de `init()` al cierre de la carga de la página.
  - Blindaje de seguridad en `.modal-overlay` (`style.css`): se incorporó `pointer-events: none !important;` y `display: none !important;` en reposo para impedir que capas modales ocultas intercepten pulsaciones o clics en el viewport.
  - Comprobaciones defensivas con encadenamiento opcional (`c.images?.icon_cdn`) en el selector de avatares para evitar excepciones por datos atípicos de personajes.

### Added
- **Presupuesto Personalizado de Tiradas en el Gachapón**:
  - Nuevo control de entrada numérica (`#gachaCustomLimitInput`) para fijar cantidades personalizadas de saltos (ej. 35, 75, 120, 250, 500 tiros).
  - Botón táctil **Fijar** (`#applyGachaCustomLimitBtn`) y soporte nativo para la tecla Enter en el campo de entrada.
  - Botón táctil **+ Añadir** (`#addGachaCustomPullsBtn`) para ampliar el presupuesto actual sumando tiradas adicionales sobre la marcha sin reiniciar el contador ni el pity acumulado.
  - Sincronización automática con el HUD de tiradas (`gachaPullsCounterDisplay`), el guardado local y el acta de auditoría compartible.

## [1.8.0] - 2026-10-04

### Added
- **Modo Gachapón Canónico (Simulador de Salto & Squad Draft)**:
  - Motor probabilístico matemáticamente fiel al sistema oficial de Honkai: Star Rail:
    - Pity de 5★: Base 0.6%, Soft Pity a partir de la tirada 74 (+6% por tirada) y Hard Pity en la tirada 90 (100% garantizado).
    - Mecánica 50/50 y seguimiento de estado Asegurado: al perder un 50/50 contra un 5★ estándar (Himeko, Welt, Bronya, Gepard, Clara, Yanqing, Bailu), el siguiente 5★ es 100% promocional garantizado.
    - Pity de 4★: Garantiza al menos un elemento de 4★ o superior cada 10 tiradas, con 50/50 para los personajes destacados del banner activo.
    - Conos de luz estándar de 3★ como relleno realista del salto.
  - **Salto Inicial Gratis (10 Tiros)**: Primeras 10 tiradas 100% gratuitas (costo 0 pases) que garantizan los 4 roles de combate necesarios para un equipo operativo (1 DPS, 1 Sub-DPS, 1 Soporte, 1 Sustento) más 6 conos de luz 3★, poblando de inmediato la Escuadra Activa.
  - **Banners Promocionales Seleccionables**:
    - *Florecimiento Floral* (Ruan Mei 5★ con Gallagher, Pela, Tingyun).
    - *Palabras de un Pasado* (Acheron 5★ con Gallagher, Pela, Guinaifen).
    - *Lirio Ígneo en Cenizas* (Luciérnaga 5★ con Gallagher, Xueyi, Hanya).
    - *Tempestad de la Caza* (Feixiao 5★ con Moze, Lynx, Tingyun).
    - *Salto Estelar Permanente* (Pool estándar de 5★ y 4★).
  - **Presupuesto de Tiradas Configurable**: Píldoras selectoras para limitar el gasto a 10, 50, 90 (1 Pity 5★), 160 (Pity Asegurado), 200 tiradas o modo Ilimitado / Sandbox.
  - **Gestor de Escuadra Activa y Reemplazo de Combatientes**:
    - 4 ranuras tácticas interactivas con avatares, nombres, rareza, elemento, vía e insignias de Eidolones (E0..E6).
    - Selector modal (`#squadSwapModal`) para reemplazar cualquier combatiente en cualquier momento por personajes obtenidos en el gacha.
    - Botones de transferencia rápida para cargar la escuadra armada directamente en las **Expediciones Orbitales** (Universo Diferenciado, Guerra de Divisas) o en el **Nodo 1 del Duelo Endgame**.
  - **Auditoría Justa y Verificable (Fair Play)**:
    - Registro pormenorizado de todas las tiradas con índice (#), tipo, nombre, rareza, pity y nota del resultado canónico.
    - Código criptográfico de verificación determinista (`#WARP-XXXXXX`) que garantiza la misma secuencia de tiradas entre amigos.
    - Botón **Copiar Acta** para exportar el reporte formal al portapapeles y compartirlo en Discord o mensajería.
  - **Pantalla de Revelación Astral (10-Pull Reveal Screen)**: Modal cinemático (`#gachaRevealModal`) con efectos de resplandor áureo para 5★, púrpura para 4★ y azul para 3★.
- **Temporadas Oficiales en Duelo Endgame (Rotaciones Rotativas)**:
  - Selector de temporadas oficiales (`#endgameSeasonPills`) para Caos del Recuerdo (MoC 12), Pura Ficción (PF 4) y Sombra Apocalíptica (AS 4).
  - Carga automática de la turbulencia mnemónica o cacofonía de temporada y la alineación canónica de jefes por cada nodo (ej. Réquiem del Sueño Quebrantado, Cuento de Ráfaga en Cadena, Firmeza Hendida del Estelaron), manteniendo la opción de rotación aleatoria/procedimental.

### Changed
- **Enrutamiento y Estado Compartido**: Soporte completo para navegación mediante hash `#tab=gacha` y generación de enlaces de sala con banner y semilla del gachapón.
- **Copia de Seguridad y Migración**: El archivo de respaldo `.json` exporta e importa ahora el estado completo de la sesión de gacha (`gachaSession`: tiradas, inventario, eidolones y escuadra activa).
- **Control de Versiones**: Actualización de versión del sistema a `v1.8.0`.

## [1.7.1] - 2026-10-04

### Fixed
- **Apertura y Visualización de Modales y Fichas de Personaje**:
  - Corrección crítica de visualización: `.modal-overlay` ahora responde a las clases `.open` y `.active`, resolviendo el bloqueo donde no se abrían la Vista de Perfil (`#profileModal` / "Trazacaminos"), el Filtro de Colección (`#rosterModal` / "Colección" y "Ajustar") y la Ficha Técnica de Personajes (`#characterModal`).
  - Sincronización de estados en modales: se añadieron selectores `.avatar-pick-item.active.selected` para el selector de avatares y `.roster-tile.is-owned.selected` / `.not-owned` (con atenuación y tachado rojo) para el catálogo de colección excluida.
  - Compatibilidad de tarjetas de catálogo: soporte unificado para clases `.char-card` y `.character-card` con hover suave, badges de rareza y animación de escala.

### Changed
- **Identidad Visual Ruan Mei (Silk Jade Teal & Acento Ciruelo Sutil)**:
  - Renovación completa de la paleta de acentos hacia el estilo de Ruan Mei: jade teal elegante (`#0d9488`, `#14b8a6`, `#2dd4bf`), fondo de obsidiana profunda con resplandores tenues y sutiles toques ciruelo (`#f472b6`).
  - Botones principales con gradientes jade silk, pestañas de navegación activas con resplandor cyan y píldoras de filtro luminosas sin perder rendimiento.
  - Mantenimiento estricto del oro astral (`#eab308`) únicamente para rareza 5★ canónica.

### Added
- **Controles Tácticos de Ranura en Ruleta (Fijar & Re-tirar)**:
  - Rediseño de proporciones en ranuras de escuadra: avatares circulares de 76px perfectamente enmarcados y separados de las etiquetas de posición para evitar colisiones visuales.
  - Botón **Fijar / Fijado**: permite bloquear combatientes individuales para que se mantengan estables mientras se vuelven a sortear las ranuras restantes.
  - Botón **Re-tirar**: genera un nuevo personaje aleatorio válido para esa ranura específica respetando los filtros de colección.
  - Botón **Ficha** y acceso directo con clic sobre la ranura para consultar la información del personaje.

## [1.7.0] - 2026-10-04

### Added
- **Soporte Móvil Dedicado y Adaptabilidad Total**:
  - Nuevo encabezado móvil de dos filas: marca con botones de acción compactos (iconos táctiles) y pestañas con desplazamiento horizontal suave (*touch swipe*).
  - Grilla móvil de dos columnas (`repeat(2, 1fr)`) en catálogo de personajes y ruleta de escuadras.
  - Filas de filtros con deslizamiento horizontal táctil (*touch swipe chips*) para no saturar el espacio vertical en pantallas pequeñas.
  - Modales adaptados a pantallas táctiles tipo *bottom sheet*, con áreas de pulsación cómodas (44px) para uso con el pulgar.
  - Detección automática de dispositivo: en móviles se selecciona por defecto la vista en tarjetas.

### Changed
- **Calibración Óptima de Escala para Pantallas 1366×768 (Laptops)**:
  - Ajuste de la escala base a `14.5px` (reemplazando el anterior `13px` que generaba sensación de "zoom alejado").
  - Tarjetas de catálogo re-escaladas a `185px` de ancho y `175px` de altura de arte, mostrando 6 personajes por fila en 1366×768.
  - Avatares de ruleta y arena endgame equilibrados a `72px` y `40px` para máxima nitidez y presencia visual.
  - Filas de la tabla de personajes con espaciado cómodo (`7px 12px`) y avatares de `38px`.

## [1.6.1] - 2026-10-04

### Fixed
- **Corrección de Tamaño Desmedido en Iconos de Vías (512px Bug)**:
  - Se corrigió el problema crítico donde los iconos de vías de jefes de combate (`BOSS_ROSTER`) e insignias de modo de expedición (`Universo Diferenciado`, `Guerra de Divisas`, `La Plaga`) se renderizaban a su resolución nativa de 512px por falta de delimitación CSS, devorando la pantalla.
  - Asignación estricta de dimensiones acotadas (`22px` - `36px`) y regla global `img { max-width: 100%; object-fit: contain; }`.
- **Eliminación de Cortes Laterales y Desbordamientos en Pantalla**:
  - Encabezado principal ahora con `flex-wrap: wrap` y espaciado compacto para evitar que los botones derechos (`Compartir`, `Tema`, `Colección`) se desborden de la ventana.
  - Tabla fluida con scroll horizontal interno protegido (`min-width: 680px`), impidiendo que el contenedor expulse elementos a la derecha.
  - Reestructuración de la arena de Duelo Endgame 1v1 con colapso vertical en pantallas medianas (< 1080px), asegurando visibilidad total del Jugador 2.
- **Optimización Radical de Rendimiento (60+ FPS)**:
  - Eliminación de filtros pesados `backdrop-filter: blur(16px)` en contenedores de contenido, tarjetas y tablas, reemplazándolos por fondos sólidos de obsidiana de alto rendimiento.
  - Erradicación de capas difusas `filter: blur(40px)` en las 98 tarjetas y eliminación de `background-attachment: fixed` en `body` para terminar con el repintado continuo de la GPU.
- **Re-escalado Compacto de la Interfaz (Anti-Enorme UI)**:
  - Reducción de la escala base tipográfica de `15px` a `13px` para densidad pro de escritorio.
  - Altura de arte en tarjetas reducida de `220px` a `130px`, avatares de ruleta de `100px` a `54px` y padding optimizado en todos los paneles.

## [1.6.0] - 2026-10-04

### Changed
- **Rediseño Integral de UI/UX Elegante y Minimalista**:
  - Abandono total de la estética pesada diegética/HUD (se eliminaron los cortes poligonales a 45°, los biseles agresivos `clip-path`, la cuadrícula de telemetría y las fuentes monospaced saturadas).
  - Implementación de un sistema de diseño limpio, moderno, fluido y sin saturación (estilo Fluent / Linear / Obsidian):
    - Paleta de colores obsidiana refinada (`#0a0d14`, `#101522`, `#161d2f`) con glassmorphism sutil (`backdrop-filter: blur(16px)`).
    - Radios de curvatura orgánicos y suaves (`border-radius: 8px`, `12px`, `16px`, `24px`) y líneas tenues de contraste (`rgba(255, 255, 255, 0.08)`).
    - Tipografía moderna, equilibrada y de máxima legibilidad (`Inter`, `-apple-system`, `Segoe UI`, `sans-serif`) con jerarquía clara y natural.
    - Navegación por pestañas tipo pill (`Catálogo`, `Ruleta`, `Duelo Endgame`, `Expediciones`) con transiciones fluidas y alta respuesta táctil.
    - Tarjetas de personajes y ranuras de ruleta con elevación suave en hover, iluminación ambiental contenida y microinteracciones naturales.
  - Textos de interfaz limpios, humanos y directos (anti-AI slop), eliminando adornos superfluos.
  - Mantenimiento estricto del estándar de **Cero Emojis**, empleando exclusivamente iconos vectoriales SVG integrados y glifos tipográficos `✦`.

## [1.5.0] - 2026-10-04

### Changed
- **Rediseño Integral de UI estilo Honkai: Star Rail (Diegetic Tactical HUD)**:
  - Transformación visual completa inspirada en la interfaz diegética del juego: terminal del Expreso Astral, geometría biselada con cortes poligonales a 45° (`clip-path`), fondo cósmico oscuro con cuadrícula táctil de telemetría y acentos en Oro Astral (`#d3b374`) y Cian Cuántico (`#00f0ff`).
  - Tarjetas de combatientes con marcos y gradientes oficiales de rareza: resplandor dorado para 5★ con estrellas de diamante `✦✦✦✦✦` y gradiente amatista imperial para 4★ con `✦✦✦✦`.
  - Pestañas de navegación táctica con indicadores angulares, brackets técnicos `[01]`, `[02]`, `[03]`, `[04]` y barra de resplandor activa.
- **Eliminación Total de Emojis (Adopción de Vector Icons SVG)**:
  - Se eliminaron todos los emojis de la plataforma (HTML, CSS y JavaScript), reemplazándolos al 100% por iconos vectoriales SVG nítidos y glifos tipográficos canónicos (`✦`, `◆`, `//`, `[ ]`).
  - Nuevo motor de resolución de iconos SVG en notificaciones Toast (`success`, `error`, `warn`, `info`, `download`, `upload`, `refresh`, `sound`).
- **Erradicación de Clichés y Textos Genéricos de IA (Anti-AI Slop)**:
  - Eliminación de textos promocionales, descripciones superfluas y frases genéricas que delataban contenido sintético.
  - Adopción de terminología técnica y diegética del Banco de Datos del Expreso Astral: *BANCO DE DATOS*, *SALTO TÁCTICO*, *ARENA ENDGAME*, *EXPEDICIÓN ORBITAL*, *INVENTARIO VERIFICADO*, *DICTAMEN DE VICTORIA*, *ACTA TÁCTICA*.

## [1.4.0] - 2026-10-04

### Added
- **Modo Guerra de Divisas (Operación Financiera CPI)**:
  - Integración del modo auto-battler y estrategia económica de Honkai: Star Rail: selección de estrategias corporativas (Monopolio de Jade, Apuesta de Aventurino, Bonos de Topaz, Préstamo Fijo CPI) y fluctuaciones de mercado.
- **Rediseño Canónico de Universo Diferenciado (Respeto al RNG)**:
  - Eliminación de jefes prefijados irreales: la plataforma reconoce que en el Universo Diferenciado y Guerra de Divisas los jefes finales y encuentros son 100% procedimentales.
  - Asignación de Protocolos de Umbral (Umbral 1 a 6), Ecuaciones iniciales de 2 vías y Modificadores de Umbral.
- **Tablero Interactivo de Criterios y Puntuación 1v1 (Checklist de Cumplimiento)**:
  - Sistema de evaluación competitiva para amigos en modos con alto RNG: los jugadores inician con la misma semilla y al terminar su partida marcan qué objetivos y criterios canónicos lograron cumplir.
  - Conteo de puntos en tiempo real para Jugador 1 y Jugador 2, inputs de divisas o fragmentos cósmicos con multiplicador, y calculadora de victoria con acta de expedición.
- **Soporte para Desastre del Enjambre (La Plaga)**:
  - Modos de dificultad de tortura, entrelazamiento de resonancias y penalizaciones por alerta del enjambre.

### Fixed
- **Corrección de Escala de Iconos en la Interfaz (Anti-Bloat UI)**:
  - Se corrigió el problema donde los iconos de vías y jefes se renderizaban a resolución nativa desmedida ocupando media pantalla.
  - Nuevo contenedor de icono compacto con dimensiones acotadas (44px) y diseño Windows 11 Fluent de alta densidad.

## [1.3.0] - 2026-10-04

### Added
- **Modos de Juego Endgame Oficiales (Salón Olvidado, Pura Ficción y Sombra Apocalíptica)**:
  - Generación de escuadras con **Doble Nodo estricto (Nodo 1 y Nodo 2)**: 8 personajes únicos sin repetición por jugador, adaptado a la mecánica real de los desafíos por turnos de Honkai: Star Rail.
  - Soporte de los 3 modos competitivos:
    - *Salón Olvidado (MoC 12)* con turbulencias mnemónicas y presupuesto de ciclos.
    - *Pura Ficción (PF 4)* con cacofonías de oleadas y meta de 60,000+ puntos.
    - *Sombra Apocalíptica (AS 4)* con mecánicas de firmeza/superruptura y meta de 6,600+ puntos de acción.
  - Visualización completa de jefes para Nodo 1 y Nodo 2 con iconos oficiales, debilidades elementales, nivel de dificultad y mecánicas de combate.
  - **Marcador y Calculadora de Victoria**: Comparación automática de ciclos/puntos entre amigos, cálculo de margen de ventaja y generación de acta de duelo para compartir en redes.
- **Perfil de Usuario Persistente y Copia de Seguridad JSON**:
  - Modal de personalización con nombre de Trazacaminos y selector de avatares canónicos oficiales.
  - Sincronización automática de perfil con el encabezado Fluent y el panel de combate 1v1.
  - **Exportación JSON (`.json`)**: Descarga íntegra de perfil, colección de personajes obtenidos, estado de filtros y preferencias.
  - **Restauración JSON**: Lector de archivos para migrar datos entre navegadores o dispositivos sin pérdida.
- **Efectos de Sonido Táctiles (Web Audio API)**:
  - Generador sintetizado en tiempo real para clics de interfaz, giros de ruleta con ticks progresivos y acordes de victoria (*fanfare*).
  - Interruptor de sonido en el encabezado para silenciar o activar en cualquier momento con persistencia local.
- **Rastreador Interactivo de Migas de Pan (Breadcrumb Bar)**:
  - Indicador contextual en tiempo real de la sección activa, número de filtros y semillas de partida.

## [1.2.0] - 2026-10-04

### Added
- **Filtro de Personajes Obtenidos / Mi Colección (Exclusiones para Juego Justo)**:
  - Nuevo modal interactivo "Mi Colección" accesible desde la barra superior y desde el panel de la ruleta.
  - Interruptor maestro (*Master Toggle*): activa o desactiva con un clic la restricción de que los modos de juego únicamente elijan personajes que el jugador posea en su cuenta.
  - Buscador integrado en la colección para localizar y marcar/desmarcar personajes rápidamente.
  - Botones de acción masiva: "Marcar Todos", "Desmarcar Todos" y "Solo 4 Estrellas (F2P)".
  - Botón de alternancia rápida directa ("✓ Tengo" / "+ Añadir") en cada fila de la tabla y tarjeta del catálogo.
  - Persistencia total del inventario del usuario en `localStorage` (`hsr_owned_characters` y `hsr_roster_filter_active`).
  - Integración en todos los generadores (`generateCoherentTeam`, `generateThematicTeam`, `generateChaosTeam`, `generateDuelMatch`, `generateUniverseChallenge`).
- **Animaciones Táctiles de Ruleta (Slot Reels)**:
  - Animación física de giro rápido con desenfoque de movimiento en los 4 casilleros de equipo al pulsar "Girar Ruleta".
  - Revelación secuencial escalonada (*staggered flip & snap*) con destello de luz según el elemento canónico de cada personaje.

### Changed
- **Rediseño Visual Anti-AI Slop**:
  - Eliminación de patrones genéricos de interfaces de IA (sobreuso de degradados violeta/neón, emojis decorativos superfluos y tarjetas vacías de baja densidad).
  - Adopción de la paleta astral genuina de Honkai: Star Rail combinada con Windows 11 Fluent Design (fondos de titanio oscuro, bordes de 1px sutiles, microinteracciones y colores de resplandor funcionales por elemento).
  - Barra de resumen de estadísticas de alta densidad (*compact inline strip*) que maximiza el espacio útil en pantalla.
  - Jerarquía visual más limpia y navegación libre de saturación visual.

## [1.1.0] - 2026-10-04

### Added
- **Modos de Juego Interactivos para Amigos (`game_modes.js`)**:
  - Ruleta de Equipos Inteligente (Coherente/Meta, Temático y Caos Total).
  - Arena Draft 1v1 (Duelo entre amigos con jefe de batalla y reglas).
  - Desafíos del Universo Simulado & Universo Diferenciado.
- **Sincronización Multijugador sin Servidor (GitHub Pages Ready)**:
  - Codificación y decodificación de semillas y estados en la URL (`#tab=duel&seed=...`, `#tab=roulette&team=...`, `#tab=universe&seed=...`).
  - Navegación por pestañas segmentadas.

## [1.0.0] - 2026-10-04

### Added
- **Base de datos compilada de personajes**: Catálogo completo de 98 personajes de Honkai: Star Rail con nombres en español e inglés, rareza (5★ y 4★), elementos, vías, iconos de avatar, retratos de cuerpo entero e ilustraciones oficiales.
- **Clasificación táctica de combate**: Mapeo riguroso de funciones principales en `DPS`, `SUB-DPS` y `SUPPORT`, junto con sub-roles especializados.
- **Interfaz web moderna estilo Windows 11 Fluent**:
  - Materiales Mica y Acrílico translúcido (`backdrop-filter: blur`), temas Claro/Oscuro y vista dual (Tabla / Tarjetas).
  - Ficha técnica detallada (modal) y exportación CSV.
- **Herramientas de backend y despliegue**:
  - Script `compile_hsr_data.py` y servidor `server.py` con sus archivos de documentación técnica `.md`.
  - Acceso directo ejecutable `Abrir_Catalogo.bat`.
