/**
 * Honkai: Star Rail — Game Modes Engine (game_modes.js)
 * Implements:
 * 1. Trio of Official Endgame Modes:
 *    - Salón Olvidado: Caos del Recuerdo (Memory of Chaos / MoC) - Double Node & Cycles
 *    - Pura Ficción (Pure Fiction / PF) - Wave Rush & 60,000 Points Goal
 *    - Sombra Apocalíptica (Apocalyptic Shadow / AS) - Boss Toughness Race & 6,600 Points
 *    - Universo Diferenciado & La Plaga (Divergent & Simulated Universe)
 * 2. Coherent Team Roulette & Thematic Synergies
 * 3. Double-Node Team Generator (Node 1 + Node 2 without overlapping characters)
 * 4. 1v1 Asynchronous Endgame Battle Report & Victory Calculator
 * 5. URL State & Seed Synchronization
 */

const HSR_GAME_MODES = (() => {

  // Boss Roster for Challenges and Endgames
  const BOSS_ROSTER = [
    {
      id: "swarm_sting",
      name: "Enjambre: Escaraviejo Verdadero",
      subtitle: "Amenaza de la Plaga del Enjambre",
      element: "Viento / Cuántico / Imaginario",
      weaknesses: ["Quantum", "Imaginary", "Wind"],
      difficulty: "Difícil (Oleadas continuas)",
      icon: "https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/icon/path/Destruction.png",
      gimmick: "Se multiplica al recibir ataques. Requiere daño de área masivo y ruptura antes de la detonación."
    },
    {
      id: "aventurine_boss",
      name: "Aventurino de las Estratagemas",
      subtitle: "Apuesta Fatal en Colonipenal",
      element: "Físico / Rayo / Hielo",
      weaknesses: ["Physical", "Thunder", "Ice"],
      difficulty: "Épico (Juegos de dados)",
      icon: "https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/icon/path/Preservation.png",
      gimmick: "Fase de dados: los personajes deben golpear múltiples dados para ganar el juego y recargar su Habilidad Definitiva."
    },
    {
      id: "sunday_boss",
      name: "Coro del Sepulcro de la Filosofía",
      subtitle: "Emanador del Orden y la Armonía",
      element: "Fuego / Rayo / Imaginario",
      weaknesses: ["Fire", "Thunder", "Imaginary"],
      difficulty: "Supremo (3 Fases con Escudo)",
      icon: "https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/icon/path/Harmony.png",
      gimmick: "Barrera indestructible de tres capas. Destruye la firmeza de sus acólitos para infligir Superruptura masiva."
    },
    {
      id: "cocolia",
      name: "Cocolia, Madre del Engaño",
      subtitle: "Gélido Eco del Estelaron",
      element: "Fuego / Rayo / Cuántico",
      weaknesses: ["Fire", "Thunder", "Quantum"],
      difficulty: "Clásico (Congelación)",
      icon: "https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/icon/path/Remembrance.png",
      gimmick: "Invoca lanzas de hielo y congela a aliados. Requiere purificadores o sostenimiento veloz."
    },
    {
      id: "sam_boss",
      name: "Cazador de Estelaron: Sam",
      subtitle: "Armadura Estratégica IV - Luciérnaga",
      element: "Cuántico / Rayo / Imaginario",
      weaknesses: ["Quantum", "Thunder", "Imaginary"],
      difficulty: "Frenético (Combustión Secundaria)",
      icon: "https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/icon/path/Destruction.png",
      gimmick: "Reduce la eficacia de curación e incendia los puntos de habilidad. Romper su firmeza cancela la combustión."
    },
    {
      id: "hoolay_boss",
      name: "Hoolay, Señor de la Guerra Borisin",
      subtitle: "Lupus Furioso de la Prisión de los Grilletes",
      element: "Fuego / Hielo / Imaginario",
      weaknesses: ["Fire", "Ice", "Imaginary"],
      difficulty: "Furia (Acelera turnos)",
      icon: "https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/icon/path/Hunt.png",
      gimmick: "Aumenta permanentemente su velocidad y lanza persecuciones incesantes. Es crucial controlarlo o resistir sus zarpazos."
    },
    {
      id: "kafka_boss",
      name: "Cazadora de Estelaron: Kafka",
      subtitle: "Dominio Mental y Ráfaga Eléctrica",
      element: "Físico / Viento / Imaginario",
      weaknesses: ["Physical", "Wind", "Imaginary"],
      difficulty: "Control Mental (Hipnosis)",
      icon: "https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/icon/path/Nihility.png",
      gimmick: "Hipnotiza a un aliado para que ataque al equipo. Requiere purificadores de estados negativos."
    },
    {
      id: "argenti_boss",
      name: "Argenti, Caballero de la Belleza",
      subtitle: "Juicio de Lanzas Sagradas",
      element: "Fuego / Hielo / Físico",
      weaknesses: ["Fire", "Ice", "Physical"],
      difficulty: "Oleada de Escudos y Lanzas",
      icon: "https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/icon/path/Erudition.png",
      gimmick: "Invoca estatuas de lanzas y escudos que le otorgan inmunidad y potencian su Habilidad Definitiva."
    }
  ];

  // Official Endgame Modes Metadata
  const ENDGAME_MODES = {
    moc: {
      id: "moc",
      name: "Salón Olvidado: Caos del Recuerdo",
      abbr: "MoC 12",
      type: "Ciclos de Combate",
      targetMetric: "Gastar ≤ 10 ciclos totales (Terminar con ≥ 20 ciclos restantes)",
      turbulences: [
        {
          name: "Turbulencia: Fervor de Ruptura",
          effect: "Al causar Ruptura de Debilidad, los aliados avanzan su acción un 30% y acumulan 1 acumulación de Recuerdo. Al inicio de cada ciclo, cada acumulación inflige daño proporcional a la barra de vida enemiga."
        },
        {
          name: "Turbulencia: Cadencia de Definitivas",
          effect: "Cada vez que un personaje lanza su Habilidad Definitiva, todo el equipo recupera 1 Punto de Habilidad Básica y gana un 40% de Daño de Habilidad Básica acumulable."
        },
        {
          name: "Turbulencia: Resonancia de Persecución",
          effect: "Los ataques adicionales infligen un 50% más de daño e imbuyen una marca que detona un golpe de Daño Verdadero al inicio del turno del objetivo."
        }
      ]
    },
    pure_fiction: {
      id: "pure_fiction",
      name: "Pura Ficción",
      abbr: "PF 4",
      type: "Puntuación de Oleadas",
      targetMetric: "Obtener ≥ 60,000 puntos combinados (Máximo: 80,000 pts)",
      turbulences: [
        {
          name: "Cacofonía: Ráfaga en Cadena",
          effect: "Al derrotar a un enemigo, su daño excedente se transfiere en un 100% como daño de rebote a todos los enemigos restantes en el campo."
        },
        {
          name: "Cacofonía: Festín de Erudición",
          effect: "Los ataques que golpean a 3 o más objetivos acumulan 'Euforia'. Con 10 cargas, desata una explosión que limpia la oleada actual."
        },
        {
          name: "Cacofonía: Propagación de DoT",
          effect: "Cuando un enemigo con Daño con el Tiempo cae en combate, todos sus estados negativos se replican en el siguiente grupo de refuerzos."
        }
      ]
    },
    apocalyptic_shadow: {
      id: "apocalyptic_shadow",
      name: "Sombra Apocalíptica",
      abbr: "AS 4",
      type: "Carrera de Firmeza y Acción",
      targetMetric: "Obtener ≥ 6,600 puntos de acción combinados",
      turbulences: [
        {
          name: "Rasgo Apocalíptico: Tenacidad Hendida",
          effect: "La barra de firmeza del jefe es un 50% mayor, pero al romperla sufre un 150% más de daño de Superruptura y retrasa su recuperación al 100%."
        },
        {
          name: "Rasgo Apocalíptico: Vínculo de Sombras",
          effect: "Derrotar a las invocaciones o piezas secundarias del jefe reduce su barra de firmeza principal en un 25% instantáneamente."
        }
      ]
    },
    divergent_universe: {
      id: "divergent_universe",
      name: "Universo Diferenciado: Protocolo de Umbral",
      abbr: "UD 6",
      type: "Ecuaciones y Curiosidades",
      targetMetric: "Superar el jefe de la Comedia Humana con ecuaciones combinadas",
      turbulences: [
        {
          name: "Protocolo de Umbral: Sobrecarga Aritmética",
          effect: "Los enemigos élite infligen un 30% más de daño por cada ecuación inactiva, pero las ecuaciones activadas duplican sus multiplicadores."
        }
      ]
    }
  };

  // Divergent Universe Equations
  const EQUATIONS = [
    {
      name: "Ecuación: Cazador Silente",
      paths: "Cacería + Nihilidad",
      effect: "Cada vez que un personaje asesta un golpe crítico, aplica 2 acumulaciones de Sospecha y avanza la acción del equipo un 15%."
    },
    {
      name: "Ecuación: Núcleo de Combustión",
      paths: "Destrucción + Erudición",
      effect: "Cuando el daño de Ruptura supera el 100% de la firmeza del objetivo, genera una explosión en AdE del 80% del daño infligido."
    },
    {
      name: "Ecuación: Orquesta Inmortal",
      paths: "Armonía + Abundancia",
      effect: "Cualquier curación sobrante se convierte en un escudo acumulable y otorga un 30% de Daño CRIT durante 2 turnos."
    },
    {
      name: "Ecuación: Espejismo Mnemónico",
      paths: "Reminiscencia + Preservación",
      effect: "Los personajes con escudo aumentan su probabilidad de congelar a los enemigos atacantes al 100%."
    },
    {
      name: "Ecuación: Ruleta de la Risa",
      paths: "Exultación + Cacería",
      effect: "Cada ataque adicional tiene un 50% de probabilidad de lanzarse nuevamente de forma gratuita contra un objetivo aleatorio."
    }
  ];

  // Specific Social Challenge Conditions
  const CHALLENGE_RESTRICTIONS = [
    "[CONDICIÓN] Victoria Impecable: Superar el combate sin que caiga ningún miembro del equipo.",
    "[CONDICIÓN] Límite de Ciclos: Gastar ≤ 4 ciclos en el Nodo 1 y ≤ 5 ciclos en el Nodo 2.",
    "[CONDICIÓN] Restricción Técnica: Prohibido usar Técnicas activas antes de iniciar el combate.",
    "[CONDICIÓN] Economía de Acción: No consumir más de 2 Puntos de Habilidad Básica en el primer turno.",
    "[CONDICIÓN] Protocolo de Escudos: Vencer al jefe sin personajes de Abundancia (Solo Preservación permitida).",
    "[CONDICIÓN] Escuadra F2P: Llevar al menos 2 personajes de 4 estrellas en cada nodo."
  ];

  // Thematic Archetypes
  const ARCHETYPES = {
    dot: {
      name: "Sinergia de DoT (Daño con el Tiempo)",
      dps: ["1005", "1307"],
      sub: ["1210", "1108", "1111", "1218"],
      support: ["1303", "1101", "1009", "1202"],
      sustain: ["1217", "1222", "1301", "1203"]
    },
    fua: {
      name: "Sinergia FUA (Ataques Adicionales / Persecución)",
      dps: ["1220", "1305", "1107", "1221"],
      sub: ["1112", "1224", "1223", "1314", "1013", "1003"],
      support: ["1309", "1306", "1303", "1313", "1207"],
      sustain: ["1304", "1208", "1222", "1301"]
    },
    break: {
      name: "Sinergia de Superruptura & Efecto de Ruptura",
      dps: ["1310", "1315", "1317", "1214"],
      sub: ["1225", "1210", "1224"],
      support: ["8005", "8006", "1303", "1215", "1009"],
      sustain: ["1301", "1222", "1203", "1104"]
    },
    hypercarry: {
      name: "Sinergia Clásica Hypercarry (Daño Concentrado)",
      dps: ["1308", "1213", "1212", "1102", "1302", "1204", "1205", "1201"],
      sub: ["1218", "1106", "1006", "1224"],
      support: ["1306", "1101", "1309", "1313", "1202", "1215"],
      sustain: ["1304", "1208", "1217", "1203", "1104"]
    }
  };

  function getCatalog() {
    if (typeof HSR_CHARACTERS !== 'undefined' && Array.isArray(HSR_CHARACTERS) && HSR_CHARACTERS.length > 0) {
      return HSR_CHARACTERS;
    }
    if (typeof window !== 'undefined' && window.HSR_CHARACTERS && Array.isArray(window.HSR_CHARACTERS)) {
      return window.HSR_CHARACTERS;
    }
    try {
      if (typeof require !== 'undefined') {
        return require('./characters.json');
      }
    } catch (e) {}
    return [];
  }

  function getCharacterById(cid) {
    return getCatalog().find(c => String(c.id) === String(cid));
  }

  function createRandom(seedStr) {
    if (!seedStr) return Math.random;
    if (typeof seedStr !== 'string') {
      if (typeof seedStr === 'number') {
        seedStr = String(seedStr);
      } else {
        return Math.random;
      }
    }
    let h = 1779033703 ^ seedStr.length;
    for (let i = 0; i < seedStr.length; i++) {
      h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return function() {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      return ((h ^= h >>> 16) >>> 0) / 4294967296;
    };
  }

  function pickRandom(arr, rng = Math.random) {
    if (!arr || arr.length === 0) return null;
    return arr[Math.floor(rng() * arr.length)];
  }

  function filterCandidates(pool, options = {}) {
    const { blacklist = [], whitelist = null, maxRarity = null, onlyFourStars = false } = options;
    return pool.filter(c => {
      const cid = String(c.id);
      if (whitelist) {
        if (typeof whitelist.has === 'function') {
          if (!whitelist.has(cid)) return false;
        } else if (Array.isArray(whitelist) && whitelist.length > 0) {
          if (!whitelist.includes(cid)) return false;
        }
      }
      if (blacklist.includes(cid)) return false;
      if (onlyFourStars && c.rarity !== 4) return false;
      if (maxRarity && c.rarity > maxRarity) return false;
      return true;
    });
  }

  /**
   * 1. GENERATE COHERENT TEAM
   * 1 DPS + 1 Sub-DPS/Buffer + 1 Support + 1 Sustain
   */
  function generateCoherentTeam(options = {}) {
    const rng = createRandom(options.seed);
    const catalog = getCatalog();
    const blacklist = options.blacklist || [];
    const whitelist = options.whitelist || null;
    const onlyFourStars = !!options.onlyFourStars;
    const lockedCaptain = options.lockedCaptainId ? getCharacterById(options.lockedCaptainId) : null;

    let available = filterCandidates(catalog, { blacklist, whitelist, onlyFourStars });
    if (available.length < 4) {
      available = filterCandidates(catalog, { blacklist, onlyFourStars });
      if (available.length < 4) available = catalog;
    }

    const team = [];
    const chosenIds = new Set();

    if (lockedCaptain && !chosenIds.has(lockedCaptain.id) && available.some(c => c.id === lockedCaptain.id)) {
      team.push(lockedCaptain);
      chosenIds.add(lockedCaptain.id);
    }

    // Slot 1: DPS
    if (!team.some(c => c.role === 'DPS')) {
      const dpsPool = available.filter(c => c.role === 'DPS' && !chosenIds.has(c.id));
      const chosenDps = pickRandom(dpsPool.length > 0 ? dpsPool : available.filter(c => !chosenIds.has(c.id)), rng);
      if (chosenDps) {
        team.push(chosenDps);
        chosenIds.add(chosenDps.id);
      }
    }

    // Slot 2: Sub-DPS / Buffer
    const subPool = available.filter(c => (c.role === 'SUB-DPS' || (c.role === 'SUPPORT' && c.path.id === 'Shaman')) && !chosenIds.has(c.id));
    const chosenSub = pickRandom(subPool.length > 0 ? subPool : available.filter(c => !chosenIds.has(c.id)), rng);
    if (chosenSub) {
      team.push(chosenSub);
      chosenIds.add(chosenSub.id);
    }

    // Slot 3: Dedicated Support (Buffer/Debuffer)
    const suppPool = available.filter(c => c.role === 'SUPPORT' && ['Shaman', 'Warlock'].includes(c.path.id) && !chosenIds.has(c.id));
    const chosenSupp = pickRandom(suppPool.length > 0 ? suppPool : available.filter(c => !chosenIds.has(c.id)), rng);
    if (chosenSupp) {
      team.push(chosenSupp);
      chosenIds.add(chosenSupp.id);
    }

    // Slot 4: Sustain (Preservation or Abundance)
    const sustainPool = available.filter(c => ['Knight', 'Priest'].includes(c.path.id) && !chosenIds.has(c.id));
    const chosenSustain = pickRandom(sustainPool.length > 0 ? sustainPool : available.filter(c => !chosenIds.has(c.id)), rng);
    if (chosenSustain) {
      team.push(chosenSustain);
      chosenIds.add(chosenSustain.id);
    }

    // Fill remaining if needed
    while (team.length < 4) {
      const rest = available.filter(c => !chosenIds.has(c.id));
      if (rest.length === 0) break;
      const pick = pickRandom(rest, rng);
      team.push(pick);
      chosenIds.add(pick.id);
    }

    return team;
  }

  /**
   * 2. GENERATE DOUBLE-NODE TEAMS (NODE 1 & NODE 2 WITHOUT CHARACTER OVERLAP)
   * Essential for Honkai: Star Rail's endgame (MoC, PF, AS require 2 distinct squads)
   */
  function generateDoubleNodeTeams(options = {}) {
    const seed = options.seed || 'DBL-' + Math.floor(100000 + Math.random() * 900000);
    const rng = createRandom(seed);

    // Node 1 team
    const teamNode1 = generateCoherentTeam({
      seed: seed + '-N1',
      whitelist: options.whitelist,
      blacklist: options.blacklist || [],
      onlyFourStars: options.onlyFourStars
    });

    // Node 2 team must strictly exclude all characters already assigned to Node 1
    const node1Ids = teamNode1.map(c => String(c.id));
    const combinedBlacklist = Array.from(new Set([...(options.blacklist || []), ...node1Ids]));

    const teamNode2 = generateCoherentTeam({
      seed: seed + '-N2',
      whitelist: options.whitelist,
      blacklist: combinedBlacklist,
      onlyFourStars: options.onlyFourStars
    });

    return {
      seed: seed,
      node1: teamNode1,
      node2: teamNode2
    };
  }

  /**
   * 3. GENERATE THEMATIC TEAM
   */
  function generateThematicTeam(options = {}) {
    const rng = createRandom(options.seed);
    const catalog = getCatalog();
    const archetypeKeys = Object.keys(ARCHETYPES);
    const selectedKey = options.archetypeKey || pickRandom(archetypeKeys, rng);
    const arch = ARCHETYPES[selectedKey] || ARCHETYPES.hypercarry;

    const findValid = (idList) => {
      let found = idList.map(id => getCharacterById(id)).filter(Boolean);
      if (options.whitelist) {
        if (typeof options.whitelist.has === 'function') {
          found = found.filter(c => options.whitelist.has(String(c.id)));
        } else if (Array.isArray(options.whitelist) && options.whitelist.length > 0) {
          found = found.filter(c => options.whitelist.includes(String(c.id)));
        }
      }
      return found.length > 0 ? found : filterCandidates(catalog, options);
    };

    const team = [];
    const used = new Set();
    let availablePool = filterCandidates(catalog, options);
    if (availablePool.length < 4) {
      availablePool = filterCandidates(catalog, { blacklist: options.blacklist || [] });
      if (availablePool.length < 4) availablePool = catalog;
    }

    [arch.dps, arch.sub, arch.support, arch.sustain].forEach(list => {
      const candidates = findValid(list).filter(c => !used.has(c.id));
      const pick = pickRandom(candidates.length > 0 ? candidates : availablePool.filter(c => !used.has(c.id)), rng);
      if (pick) {
        team.push(pick);
        used.add(pick.id);
      }
    });

    return {
      name: arch.name,
      team: team
    };
  }

  /**
   * 4. GENERATE CHAOS TEAM
   */
  function generateChaosTeam(options = {}) {
    const rng = createRandom(options.seed);
    const catalog = getCatalog();
    const available = filterCandidates(catalog, options);
    const pool = available.length >= 4 ? [...available] : [...catalog];
    const team = [];

    for (let i = 0; i < 4 && pool.length > 0; i++) {
      const idx = Math.floor(rng() * pool.length);
      team.push(pool.splice(idx, 1)[0]);
    }

    return team;
  }

  // --------------------------------------------------------------------------
  // SEASONAL ENDGAME ROTATIONS (MoC, PF, AS)
  // Reflects the seasonal / rotational nature of endgame buffs & boss lineups
  // --------------------------------------------------------------------------
  const SEASONAL_ROTATIONS = {
    moc: [
      {
        id: "moc_current",
        name: "Temporada Actual: Réquiem del Sueño Quebrantado",
        cycleTarget: "≤ 10 ciclos totales",
        turbulence: {
          name: "Turbulencia: Fervor de Ruptura",
          effect: "Al causar Ruptura de Debilidad, los aliados avanzan su acción un 30% y acumulan 1 carga de Recuerdo. Al inicio de cada ciclo, cada carga inflige daño masivo a la barra de vida enemiga."
        },
        bossNode1Id: "sam_boss",
        bossNode2Id: "aventurine_boss"
      },
      {
        id: "moc_classic",
        name: "Temporada: Sinfonía de Cadenas y Coros",
        cycleTarget: "≤ 10 ciclos totales",
        turbulence: {
          name: "Turbulencia: Cadencia de Definitivas",
          effect: "Cada vez que un personaje lanza su Habilidad Definitiva, todo el equipo recupera 1 Punto de Habilidad Básica y gana un 40% de Daño de Habilidad Básica acumulable."
        },
        bossNode1Id: "sunday_boss",
        bossNode2Id: "kafka_boss"
      },
      {
        id: "moc_hunt",
        name: "Temporada: Caza Borisin en la Niebla",
        cycleTarget: "≤ 10 ciclos totales",
        turbulence: {
          name: "Turbulencia: Resonancia de Persecución",
          effect: "Los ataques adicionales infligen un 50% más de daño e imbuyen una marca que detona un golpe de Daño Verdadero al inicio del turno del objetivo."
        },
        bossNode1Id: "hoolay_boss",
        bossNode2Id: "argenti_boss"
      }
    ],
    pure_fiction: [
      {
        id: "pf_current",
        name: "Temporada Actual: Cuento de Ráfaga en Cadena",
        scoreTarget: "≥ 60,000 pts",
        turbulence: {
          name: "Cacofonía: Ráfaga en Cadena",
          effect: "Al derrotar a un enemigo, su daño excedente se transfiere en un 100% como daño de rebote a todos los enemigos restantes en el campo."
        },
        bossNode1Id: "cocolia",
        bossNode2Id: "argenti_boss"
      },
      {
        id: "pf_erudition",
        name: "Temporada: Festín de Erudición Masiva",
        scoreTarget: "≥ 60,000 pts",
        turbulence: {
          name: "Cacofonía: Festín de Erudición",
          effect: "Los ataques que golpean a 3 o más objetivos acumulan 'Euforia'. Con 10 cargas, desata una explosión que limpia la oleada actual."
        },
        bossNode1Id: "swarm_sting",
        bossNode2Id: "sunday_boss"
      },
      {
        id: "pf_dot",
        name: "Temporada: Veneno Negro y Propagación",
        scoreTarget: "≥ 60,000 pts",
        turbulence: {
          name: "Cacofonía: Propagación de DoT",
          effect: "Cuando un enemigo con Daño con el Tiempo cae en combate, todos sus estados negativos se replican en el siguiente grupo de refuerzos."
        },
        bossNode1Id: "kafka_boss",
        bossNode2Id: "hoolay_boss"
      }
    ],
    apocalyptic_shadow: [
      {
        id: "as_current",
        name: "Temporada Actual: Firmeza Hendida del Estelaron",
        scoreTarget: "≥ 6,600 pts",
        turbulence: {
          name: "Rasgo Apocalíptico: Tenacidad Hendida",
          effect: "La barra de firmeza del jefe es un 50% mayor, pero al romperla sufre un 150% más de daño de Superruptura y retrasa su recuperación al 100%."
        },
        bossNode1Id: "aventurine_boss",
        bossNode2Id: "sam_boss"
      },
      {
        id: "as_shadows",
        name: "Temporada: Sombras del Vínculo Borisin",
        scoreTarget: "≥ 6,600 pts",
        turbulence: {
          name: "Rasgo Apocalíptico: Vínculo de Sombras",
          effect: "Derrotar a las invocaciones o piezas secundarias del jefe reduce su barra de firmeza principal en un 25% instantáneamente."
        },
        bossNode1Id: "hoolay_boss",
        bossNode2Id: "sunday_boss"
      }
    ]
  };

  /**
   * 5. GENERATE ENDGAME DUEL MATCH FOR 2 PLAYERS
   * Includes MoC / PF / AS double node stages with seasonal rotations and score calculation
   */
  function generateEndgameMatch(modeKey = 'moc', seed = null, options = {}) {
    let matchSeed = null;
    let matchOptions = options;
    if (typeof seed === 'string') {
      matchSeed = seed;
    } else if (seed && typeof seed === 'object' && !Array.isArray(seed)) {
      matchOptions = seed;
      matchSeed = matchOptions.seed || null;
    }
    matchSeed = matchSeed || 'ENDGAME-' + Math.floor(100000 + Math.random() * 900000);
    const rng = createRandom(matchSeed);

    const modeData = ENDGAME_MODES[modeKey] || ENDGAME_MODES.moc;
    const seasons = SEASONAL_ROTATIONS[modeKey] || [];

    let activeSeason = null;
    if (matchOptions.seasonId) {
      activeSeason = seasons.find(s => s.id === matchOptions.seasonId);
    } else if (typeof matchOptions.seasonIndex === 'number' && seasons[matchOptions.seasonIndex]) {
      activeSeason = seasons[matchOptions.seasonIndex];
    }

    let turbulence;
    let bossNode1, bossNode2;

    if (activeSeason) {
      turbulence = activeSeason.turbulence;
      bossNode1 = BOSS_ROSTER.find(b => b.id === activeSeason.bossNode1Id) || BOSS_ROSTER[0];
      bossNode2 = BOSS_ROSTER.find(b => b.id === activeSeason.bossNode2Id) || BOSS_ROSTER[1];
    } else {
      // Procedural seasonal rotation
      turbulence = pickRandom(modeData.turbulences, rng);
      const bossPool = [...BOSS_ROSTER];
      bossNode1 = bossPool.splice(Math.floor(rng() * bossPool.length), 1)[0];
      bossNode2 = bossPool.splice(Math.floor(rng() * bossPool.length), 1)[0];
      activeSeason = {
        id: "seasonal_procedural",
        name: `Rotación Procedural #${matchSeed.slice(-4)}`,
        turbulence: turbulence
      };
    }

    const restriction = pickRandom(CHALLENGE_RESTRICTIONS, rng);

    // Player 1 Double Node
    const player1Rosters = generateDoubleNodeTeams({
      seed: matchSeed + '-P1',
      whitelist: matchOptions.whitelist,
      onlyFourStars: matchOptions.onlyFourStars
    });

    // Player 2 Double Node
    const player2Rosters = generateDoubleNodeTeams({
      seed: matchSeed + '-P2',
      whitelist: matchOptions.whitelist,
      onlyFourStars: matchOptions.onlyFourStars
    });

    return {
      seed: matchSeed,
      mode: modeData,
      season: activeSeason,
      turbulence: turbulence,
      bossNode1: bossNode1,
      bossNode2: bossNode2,
      restriction: restriction,
      player1: {
        node1: player1Rosters.node1,
        node2: player1Rosters.node2
      },
      player2: {
        node1: player2Rosters.node1,
        node2: player2Rosters.node2
      }
    };
  }

  // --------------------------------------------------------------------------
  // RNG EXPEDITION MODES: Universo Diferenciado, Guerra de Divisas y La Plaga
  // --------------------------------------------------------------------------
  const EXPEDITION_MODES = {
    divergent_universe: {
      id: "divergent_universe",
      name: "Universo Diferenciado",
      subtitle: "Protocolo de Umbral, Ecuaciones y Curiosidades Ponderadas",
      tag: "Modo Roguelike Canónico",
      icon: "https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/icon/path/Remembrance.png",
      levels: ["Umbral 1 (Estándar)", "Umbral 3 (Desafiante)", "Umbral 5 (Sobrecarga)", "Umbral 6 (Tormento)"],
      buffCategory: "Ecuación Inicial Asignada",
      riskCategory: "Parámetro de Umbral",
      risks: [
        "Sobrecarga Aritmética: Los enemigos de élite aumentan su ataque en un 25% hasta activar tu primera ecuación.",
        "Compresión Mnemónica: Reducción del 20% de probabilidad de aparición de zonas de descanso.",
        "Resistencia de Datos: Los jefes ganan un 30% de firmeza adicional en los turnos 1 y 2."
      ],
      criteria: [
        { id: 'du_clear_plane3', text: 'Superó el Plano 3 (Jefe Final Aleatorio de la Expedición)', points: 1000 },
        { id: 'du_eq_3star', text: 'Activó al menos una Ecuación de 3 Estrellas', points: 500 },
        { id: 'du_eq_3total', text: 'Activó 3 o más Ecuaciones en total a lo largo del recorrido', points: 400 },
        { id: 'du_weighted_curio', text: 'Consiguió y activó una Curiosidad Ponderada compatible', points: 350 },
        { id: 'du_clean_clear', text: 'Victoria Limpia: Sin bajas aliadas en el combate del Plano 3', points: 450 },
        { id: 'du_no_downloads', text: 'Autosuficiencia: No sustituyó personajes en zonas de descanso', points: 300 },
        { id: 'du_trotter_catch', text: 'Caza Espacial: Derrotó al Cerdo Espacial / Trotter de bendición', points: 250 },
        { id: 'du_penalty_death', text: 'Penalización: Cayó algún personaje en el combate final', points: -200 }
      ],
      bonusLabel: 'Fragmentos Cósmicos finales:',
      bonusHelper: '1 pt por cada 10 fragmentos en reserva',
      bonusMultiplier: 0.1
    },
    currency_wars: {
      id: "currency_wars",
      name: "Guerra de Divisas",
      subtitle: "Operación Bursátil CPI, Auto-battler y Sinergias Financieras",
      tag: "Estrategia Económica & CPI",
      icon: "https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/icon/path/Preservation.png",
      levels: ["Ronda Comercial I (Mercado Local)", "Ronda Comercial II (Interbancaria)", "Ronda Comercial III (Alta Especulación)", "Ronda Comercial IV (Gran Depresión)"],
      buffCategory: "Estrategia Financiera Asignada",
      strategies: [
        {
          name: "Estrategia: Monopolio de Jade",
          effect: "Por cada 10 divisas ahorradas al final de una ronda, gana un 15% de poder de ataque acumulable (hasta 5 cargas)."
        },
        {
          name: "Estrategia: Apuesta Imprudente de Aventurino",
          effect: "50% de probabilidad de duplicar las recompensas tras cada combate comercial, o perder 5 divisas en caso de fallo."
        },
        {
          name: "Estrategia: Bono Corporativo de Topaz",
          effect: "Los personajes con ataques adicionales generan 2 divisas suplementarias al asestar golpes críticos."
        },
        {
          name: "Estrategia: Préstamo a Tipo Fijo CPI",
          effect: "Inicia con 30 divisas adicionales, pero el costo de subida de nivel de unidades aumenta un 20%."
        }
      ],
      riskCategory: "Fluctuación del Mercado",
      risks: [
        "Volatilidad Inflacionaria: El costo de refrescar la tienda se duplica tras la 3ª ronda.",
        "Presión Crediticia: Si tu capital cae a 0 divisas, pierdes 10% de Salud Corporativa.",
        "Arancel Comercial: Las unidades de rango superior cuestan 1 divisa más."
      ],
      criteria: [
        { id: 'cw_clear_market', text: 'Superó la Ronda Final del Mercado / Batalla Corporativa', points: 1000 },
        { id: 'cw_golden_synergy', text: 'Sinergia Dorada: Activó una sinergia de facción Nivel 3 (Máxima)', points: 500 },
        { id: 'cw_elite_units', text: 'Escuadra de Élite: Obtuvo al menos 2 unidades a Nivel 3 (Oro)', points: 450 },
        { id: 'cw_interest_cap', text: 'Gestión Financiera: Alcanzó el tope de intereses en 3+ rondas', points: 400 },
        { id: 'cw_high_hp', text: 'Solvencia: Terminó con ≥ 50% de Salud Corporativa / HP', points: 350 },
        { id: 'cw_no_bailout', text: 'Cero Rescates: No usó el rescate o auxilio financiero de emergencia', points: 300 },
        { id: 'cw_fast_clear', text: 'Liquidación Rápida: Venció en ≤ 5 turnos en la batalla final', points: 350 },
        { id: 'cw_penalty_bankrupt', text: 'Penalización: Cayó en quiebra temporal o auxilio bancario', points: -250 }
      ],
      bonusLabel: 'Divisas / Monedas en reserva final:',
      bonusHelper: '10 pts por cada divisa ahorrada',
      bonusMultiplier: 10
    },
    swarm_disaster: {
      id: "swarm_disaster",
      name: "Desastre del Enjambre",
      subtitle: "La Plaga, Auditoría del Imperio y Tablero de Resonancia",
      tag: "Desafío Clásico de Supervivencia",
      icon: "https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/icon/path/Destruction.png",
      levels: ["Dificultad III (Invasión)", "Dificultad IV (Metamorfosis)", "Dificultad V (Tortura del Enjambre)"],
      buffCategory: "Entrelazamiento de Resonancia Asignado",
      resonances: [
        {
          name: "Entrelazamiento: Destrucción + Preservación",
          effect: "Cuando la salud cae al 35%, genera un escudo impenetrable equivalente al 100% de la vida máxima durante 2 turnos."
        },
        {
          name: "Entrelazamiento: Cacería + Abundancia",
          effect: "Eliminar a un enemigo restaura un 30% de salud a todos los aliados y avanza sus acciones un 25%."
        },
        {
          name: "Entrelazamiento: Nihilidad + Propagación",
          effect: "Los estados de DoT aceleran la propagación de esporas de ruptura en un 100% de daño verdadero."
        }
      ],
      riskCategory: "Alerta del Enjambre",
      risks: [
        "Metamorfosis Espacial: Los insectos detonan con un 40% más de daño al caer en combate.",
        "Perturbación Dimensional: El contador del tablero desciende 1 punto adicional al cruzar casillas vacías.",
        "Feromona de Plaga: Los enemigos son inmunes a estados de control durante la primera oleada."
      ],
      criteria: [
        { id: 'sd_clear_swarm', text: 'Derrotó al Enjambre: Escaraviejo Verdadero en Plano 3', points: 1000 },
        { id: 'sd_resonance_intertwine', text: 'Entrelazamiento de Resonancia: Activó Resonancia Secundaria', points: 500 },
        { id: 'sd_safe_board', text: 'Ruta Segura: Llegó al Plano 3 sin sufrir Colapso Espacial', points: 400 },
        { id: 'sd_trotter_minigame', text: 'Audición de Aventura: Superó el minijuego de atrapar troters', points: 350 },
        { id: 'sd_clean_explosion', text: 'Resistencia: Toda la escuadra sobrevivió a la explosión final', points: 450 },
        { id: 'sd_penalty_alert', text: 'Penalización: Alerta del Enjambre nivel ≥ 5 alcanzada', points: -300 }
      ],
      bonusLabel: 'Fragmentos Cósmicos finales:',
      bonusHelper: '1 pt por cada 10 fragmentos en reserva',
      bonusMultiplier: 0.1
    }
  };

  /**
   * 6. GENERATE EXPEDITION CHALLENGE (Universo Diferenciado, Guerra de Divisas, La Plaga)
   * Acknowledges that final bosses and domains in DU / Currency Wars are 100% RNG-driven!
   */
  function generateExpeditionChallenge(modeKey = 'divergent_universe', seed = null, options = {}) {
    const runSeed = seed || 'EXP-' + Math.floor(100000 + Math.random() * 900000);
    const rng = createRandom(runSeed);

    const mode = EXPEDITION_MODES[modeKey] || EXPEDITION_MODES.divergent_universe;
    const level = pickRandom(mode.levels, rng);
    const risk = pickRandom(mode.risks, rng);

    let initialBuff = null;
    if (modeKey === 'divergent_universe') {
      initialBuff = pickRandom(EQUATIONS, rng);
    } else if (modeKey === 'currency_wars') {
      initialBuff = pickRandom(mode.strategies, rng);
    } else {
      initialBuff = pickRandom(mode.resonances, rng);
    }

    const recommendedTeam = generateCoherentTeam({ seed: runSeed, whitelist: options.whitelist });

    return {
      seed: runSeed,
      modeKey: modeKey,
      mode: mode,
      level: level,
      initialBuff: initialBuff,
      risk: risk,
      team: recommendedTeam,
      criteria: mode.criteria,
      bonusLabel: mode.bonusLabel,
      bonusHelper: mode.bonusHelper,
      bonusMultiplier: mode.bonusMultiplier
    };
  }

  // Alias for backward compatibility
  function generateUniverseChallenge(seed = null, options = {}) {
    return generateExpeditionChallenge('divergent_universe', seed, options);
  }

  /**
   * 7. CALCULATE EXPEDITION WINNER (1v1 Checklist Comparison)
   */
  function calculateExpeditionWinner(challenge, p1CheckedIds = [], p1Bonus = 0, p2CheckedIds = [], p2Bonus = 0) {
    if (!challenge || !challenge.criteria) return null;

    const criteriaMap = new Map();
    challenge.criteria.forEach(c => criteriaMap.set(c.id, c));

    // Player 1 Points
    let p1Base = 0;
    p1CheckedIds.forEach(id => {
      const item = criteriaMap.get(id);
      if (item) p1Base += item.points;
    });
    const p1BonusPts = Math.max(0, Math.floor(Number(p1Bonus || 0) * (challenge.bonusMultiplier || 0.1)));
    const p1Total = Math.max(0, p1Base + p1BonusPts);

    // Player 2 Points
    let p2Base = 0;
    p2CheckedIds.forEach(id => {
      const item = criteriaMap.get(id);
      if (item) p2Base += item.points;
    });
    const p2BonusPts = Math.max(0, Math.floor(Number(p2Bonus || 0) * (challenge.bonusMultiplier || 0.1)));
    const p2Total = Math.max(0, p2Base + p2BonusPts);

    let winner = 'tie';
    if (p1Total > p2Total) winner = 'player1';
    else if (p2Total > p1Total) winner = 'player2';

    return {
      winner: winner,
      diff: Math.abs(p1Total - p2Total),
      player1: {
        baseScore: p1Base,
        bonusScore: p1BonusPts,
        totalScore: p1Total,
        checkedCount: p1CheckedIds.length
      },
      player2: {
        baseScore: p2Base,
        bonusScore: p2BonusPts,
        totalScore: p2Total,
        checkedCount: p2CheckedIds.length
      }
    };
  }

  /**
   * 8. CALCULATE ENDGAME MATCH WINNER
   */
  function calculateWinner(modeKey, p1Score, p2Score) {
    if (p1Score === null || p1Score === undefined || p2Score === null || p2Score === undefined) {
      return null;
    }
    const score1 = Number(p1Score);
    const score2 = Number(p2Score);

    if (modeKey === 'moc') {
      // In Memory of Chaos: LESS cycles spent = BETTER (or MORE remaining cycles = BETTER)
      if (score1 < score2) {
        return { winner: 'player1', diff: score2 - score1, unit: 'ciclos de ventaja' };
      } else if (score2 < score1) {
        return { winner: 'player2', diff: score1 - score2, unit: 'ciclos de ventaja' };
      } else {
        return { winner: 'tie', diff: 0, unit: 'empate perfecto' };
      }
    } else {
      // In Pure Fiction or Apocalyptic Shadow: MORE points = BETTER
      if (score1 > score2) {
        return { winner: 'player1', diff: score1 - score2, unit: 'puntos de ventaja' };
      } else if (score2 > score1) {
        return { winner: 'player2', diff: score2 - score1, unit: 'puntos de ventaja' };
      } else {
        return { winner: 'tie', diff: 0, unit: 'empate' };
      }
    }
  }

  // --------------------------------------------------------------------------
  // 9. GACHAPON ENGINE (WARP SIMULATOR & SQUAD DRAFT)
  // Recreates Honkai: Star Rail's canonical Warp System:
  // - 5★ Pity at 90 (Soft Pity starting at 74 pulls, +6% per pull)
  // - 50/50 System with Guaranteed status tracking
  // - 4★ Guaranteed every 10 pulls
  // - Free Starter 10-Pull guaranteeing 4 core squad members (DPS, Sub-DPS, Support, Sustain)
  // - Configurable pull limits (10, 50, 90, 160, 200, or unlimited)
  // - Dynamic Active Squad roster management with member swapping
  // - Provably fair audit history with cryptographic session seed
  // --------------------------------------------------------------------------

  const STANDARD_5STAR_IDS = ['1003', '1004', '1101', '1104', '1107', '1209', '1211'];

  const STANDARD_3STAR_LIGHT_CONES = [
    { id: '20000', name: 'Flechas', rarity: 3, path: 'Cacería', type: 'light_cone', icon: 'https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/image/light_cone_portrait/20000.png', preview: 'https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/image/light_cone_preview/20000.png' },
    { id: '20001', name: 'Cornucopia', rarity: 3, path: 'Abundancia', type: 'light_cone', icon: 'https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/image/light_cone_portrait/20001.png', preview: 'https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/image/light_cone_preview/20001.png' },
    { id: '20002', name: 'Colapso Celestial', rarity: 3, path: 'Destrucción', type: 'light_cone', icon: 'https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/image/light_cone_portrait/20002.png', preview: 'https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/image/light_cone_preview/20002.png' },
    { id: '20003', name: 'Ámbar', rarity: 3, path: 'Preservación', type: 'light_cone', icon: 'https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/image/light_cone_portrait/20003.png', preview: 'https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/image/light_cone_preview/20003.png' },
    { id: '20004', name: 'Vacío', rarity: 3, path: 'Nihilidad', type: 'light_cone', icon: 'https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/image/light_cone_portrait/20004.png', preview: 'https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/image/light_cone_preview/20004.png' },
    { id: '20005', name: 'Coro', rarity: 3, path: 'Armonía', type: 'light_cone', icon: 'https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/image/light_cone_portrait/20005.png', preview: 'https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/image/light_cone_preview/20005.png' },
    { id: '20006', name: 'Sagacidad', rarity: 3, path: 'Erudición', type: 'light_cone', icon: 'https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/image/light_cone_portrait/20006.png', preview: 'https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/image/light_cone_preview/20006.png' },
    { id: '20007', name: 'Pasapáginas', rarity: 3, path: 'Erudición', type: 'light_cone', icon: 'https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/image/light_cone_portrait/20007.png', preview: 'https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/image/light_cone_preview/20007.png' },
    { id: '20008', name: 'Destrucción Mutua', rarity: 3, path: 'Destrucción', type: 'light_cone', icon: 'https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/image/light_cone_portrait/20008.png', preview: 'https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/image/light_cone_preview/20008.png' },
    { id: '20009', name: 'Multiplicación', rarity: 3, path: 'Abundancia', type: 'light_cone', icon: 'https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/image/light_cone_portrait/20009.png', preview: 'https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/image/light_cone_preview/20009.png' },
    { id: '20010', name: 'Mediación', rarity: 3, path: 'Armonía', type: 'light_cone', icon: 'https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/image/light_cone_portrait/20010.png', preview: 'https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/image/light_cone_portrait/20010.png' },
    { id: '20011', name: 'Defensa', rarity: 3, path: 'Preservación', type: 'light_cone', icon: 'https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/image/light_cone_portrait/20011.png', preview: 'https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/image/light_cone_preview/20011.png' },
    { id: '20012', name: 'Bucle', rarity: 3, path: 'Nihilidad', type: 'light_cone', icon: 'https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/image/light_cone_portrait/20012.png', preview: 'https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/image/light_cone_preview/20012.png' },
    { id: '20013', name: 'Rueda Mecánica', rarity: 3, path: 'Armonía', type: 'light_cone', icon: 'https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/image/light_cone_portrait/20013.png', preview: 'https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/image/light_cone_preview/20013.png' },
    { id: '20014', name: 'Sombra Oculta', rarity: 3, path: 'Cacería', type: 'light_cone', icon: 'https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/image/light_cone_portrait/20014.png', preview: 'https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/image/light_cone_preview/20014.png' }
  ];

  const UNIVERSAL_WARP_BANNER = {
    id: 'universal',
    title: 'Salto Astral Universal',
    subtitle: 'El Expreso Astral surca el cosmos reuniendo a todos los héroes de 4★ y 5★.',
    themeColor: '#0d9488',
    quote: 'Que este viaje nos lleve hacia las estrellas.'
  };

  const FEATURED_BANNERS = [UNIVERSAL_WARP_BANNER];

  function getGachaCandidatePool(session, catalog = null, ownedIds = null) {
    const cat = catalog || getCatalog();
    let basePool = cat;

    // Filter by user's owned roster if enabled
    const rosterFilterActive = session && (session.filterByOwnedRoster === true);
    if (rosterFilterActive && Array.isArray(ownedIds) && ownedIds.length > 0) {
      const ownedSet = new Set(ownedIds.map(String));
      const filtered = cat.filter(c => ownedSet.has(String(c.id)));
      if (filtered.length > 0) {
        basePool = filtered;
      }
    }

    const rFilter = session?.rarityFilter || 'all'; // 'all', '5star', '4star'

    let pool5 = basePool.filter(c => c.rarity === 5);
    let pool4 = basePool.filter(c => c.rarity === 4);

    // Fallbacks if one pool is empty due to strict roster filtering
    if (pool5.length === 0) pool5 = cat.filter(c => c.rarity === 5);
    if (pool4.length === 0) pool4 = cat.filter(c => c.rarity === 4);

    let totalActiveCharacters = 0;
    if (rFilter === '5star') {
      totalActiveCharacters = pool5.length;
    } else if (rFilter === '4star') {
      totalActiveCharacters = pool4.length;
    } else {
      totalActiveCharacters = pool5.length + pool4.length;
    }

    return {
      pool5,
      pool4,
      basePool,
      totalActiveCharacters,
      isRosterFiltered: rosterFilterActive && Array.isArray(ownedIds) && ownedIds.length > 0
    };
  }

  function createGachaSession(pullLimit = 90, seed = null, options = {}) {
    const sessionSeed = seed || 'WARP-' + Math.floor(100000 + Math.random() * 900000);
    let limit = pullLimit;
    if (typeof pullLimit === 'string' && isNaN(Number(pullLimit))) {
      limit = 90;
    } else if (pullLimit !== null) {
      limit = Number(pullLimit);
    }

    const targetPity = Math.max(10, Math.min(300, Number(options?.pity5StarTarget) || 90));
    const rFilter = ['all', '5star', '4star'].includes(options?.rarityFilter) ? options.rarityFilter : 'all';

    return {
      seed: sessionSeed,
      bannerId: 'universal',
      pullLimit: limit, // number or null (unlimited)
      totalPulls: 0,
      freeStarterClaimed: false,
      pity5Star: 0,
      pity4Star: 0,
      pity5StarTarget: targetPity, // Configurable: default 90 (hard pity guaranteed 5★)
      rarityFilter: rFilter, // 'all', '5star', '4star'
      filterByOwnedRoster: Boolean(options?.filterByOwnedRoster),
      activeSquad: [null, null, null, null],
      inventory: [],
      history: []
    };
  }

  function pullStarterSquad(session, catalog = null, ownedIds = null) {
    if (!session) return { error: 'Sesión no válida' };
    if (session.freeStarterClaimed) {
      return { error: 'El Salto Inicial Gratis ya ha sido reclamado para esta sesión.' };
    }
    const cat = catalog || getCatalog();
    const rng = createRandom(session.seed + '-starter');
    const { pool5, pool4, basePool } = getGachaCandidatePool(session, cat, ownedIds);
    const rFilter = session.rarityFilter || 'all';

    // Target roles: DPS, Sub-DPS, Support, Sustain
    let rolePool = (rFilter === '5star') ? pool5 : ((rFilter === '4star') ? pool4 : basePool);
    if (!rolePool || rolePool.length < 4) {
      rolePool = (rFilter === '5star') ? cat.filter(c => c.rarity === 5) : cat.filter(c => c.rarity === 4);
    }

    const dpsPool = rolePool.filter(c => c.role === 'DPS');
    const subPool = rolePool.filter(c => c.role === 'SUB-DPS' || c.path?.id === 'Mage');
    const suppPool = rolePool.filter(c => c.role === 'SUPPORT' && ['Shaman', 'Warlock'].includes(c.path?.id));
    const sustainPool = rolePool.filter(c => ['Knight', 'Priest'].includes(c.path?.id));

    const chosenDps = pickRandom(dpsPool.length > 0 ? dpsPool : rolePool, rng);
    const chosenSub = pickRandom(subPool.length > 0 ? subPool : rolePool.filter(c => c.id !== chosenDps?.id), rng) || chosenDps;
    const chosenSupp = pickRandom(suppPool.length > 0 ? suppPool : rolePool.filter(c => ![chosenDps?.id, chosenSub?.id].includes(c.id)), rng) || chosenSub;
    const chosenSustain = pickRandom(sustainPool.length > 0 ? sustainPool : rolePool.filter(c => ![chosenDps?.id, chosenSub?.id, chosenSupp?.id].includes(c.id)), rng) || chosenSupp;

    const rawStarterCharacters = [chosenDps, chosenSub, chosenSupp, chosenSustain].filter(Boolean);
    const starterCharacters = rawStarterCharacters.map(c => {
      const charIcon = c.images?.icon_cdn || c.images?.icon || `https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/icon/character/${c.id}.png`;
      const charPreview = c.images?.preview_cdn || c.images?.preview || `https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/image/character_preview/${c.id}.png`;
      return {
        ...c,
        type: 'character',
        icon: charIcon,
        preview: charPreview
      };
    });

    // 6 3-star light cones to complete 10 items
    const starterLightCones = [];
    for (let i = 0; i < (10 - starterCharacters.length); i++) {
      starterLightCones.push(pickRandom(STANDARD_3STAR_LIGHT_CONES, rng));
    }

    const items = [...starterCharacters, ...starterLightCones];
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }

    session.activeSquad = [...starterCharacters];
    starterCharacters.forEach(ch => {
      const existing = session.inventory.find(inv => String(inv.id) === String(ch.id));
      if (!existing) {
        session.inventory.push({ ...ch, eidolon: 0 });
      }
    });

    session.freeStarterClaimed = true;

    starterCharacters.forEach(ch => {
      session.history.unshift({
        pullIndex: 0,
        type: 'character',
        id: ch.id,
        name: ch.name,
        rarity: ch.rarity,
        element: ch.element,
        path: ch.path,
        icon: ch.icon,
        preview: ch.preview,
        images: ch.images,
        pity: 0,
        note: `Salto Inicial Garantizado (${ch.rarity}★)`,
        timestamp: Date.now()
      });
    });

    return {
      success: true,
      items: items,
      activeSquad: session.activeSquad,
      inventory: session.inventory
    };
  }

  function pullSingle(session, catalog = null, ownedIds = null) {
    if (!session) return { error: 'Sesión inválida' };
    if (session.pullLimit !== null && session.totalPulls >= session.pullLimit) {
      return { error: `Límite de ${session.pullLimit} tiradas alcanzado. Amplía tu presupuesto o activa el modo Ilimitado.` };
    }

    const cat = catalog || getCatalog();
    session.totalPulls++;
    session.pity5Star++;
    session.pity4Star++;

    const rng = createRandom(`${session.seed}-pull-${session.totalPulls}`);
    const { pool5, pool4 } = getGachaCandidatePool(session, cat, ownedIds);
    const rFilter = session.rarityFilter || 'all';
    const targetPity5 = session.pity5StarTarget || 90;

    // 5-Star Probability: 0.6% base, smooth soft-pity scaling, 100% hard pity at target
    const softPityStart = Math.max(1, Math.floor(targetPity5 * 0.82));
    let prob5 = 0.006;
    if (session.pity5Star >= softPityStart) {
      prob5 = 0.006 + (session.pity5Star - (softPityStart - 1)) * (0.994 / (targetPity5 - softPityStart + 1));
      if (session.pity5Star >= targetPity5) prob5 = 1.0;
    }

    // 4-Star Probability: 5.1% base, guaranteed at 10
    let prob4 = 0.051;
    if (session.pity4Star >= 10) {
      prob4 = 1.0;
    }

    const roll = rng();
    let result = null;

    const is5StarHit = (rFilter === '5star' && (roll < prob5 || session.pity5Star >= targetPity5)) ||
                       (rFilter !== '4star' && (roll < prob5 || session.pity5Star >= targetPity5));

    const is4StarHit = !is5StarHit && (
      (rFilter === '4star' && (roll < prob5 + prob4 || session.pity4Star >= 10)) ||
      (rFilter !== '5star' && (roll < prob5 + prob4 || session.pity4Star >= 10))
    );

    if (is5StarHit) {
      // 5-STAR HIT! Sin 50/50: siempre entrega un 5★ canónico del pool configurado
      const currentPity = session.pity5Star;
      session.pity5Star = 0;

      const character = pickRandom(pool5, rng) || cat.find(c => c.rarity === 5) || cat[0];

      const invChar = session.inventory.find(c => String(c.id) === String(character.id));
      if (invChar) {
        invChar.eidolon = Math.min(6, (invChar.eidolon || 0) + 1);
      } else {
        session.inventory.push({ ...character, eidolon: 0 });
      }

      const char5Icon = character.images?.icon_cdn || character.images?.icon || `https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/icon/character/${character.id}.png`;
      const char5Preview = character.images?.preview_cdn || character.images?.preview || `https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/image/character_preview/${character.id}.png`;

      result = {
        pullIndex: session.totalPulls,
        type: 'character',
        id: character.id,
        name: character.name,
        rarity: 5,
        element: character.element,
        path: character.path,
        icon: char5Icon,
        preview: char5Preview,
        images: character.images,
        pity: currentPity,
        pityTarget: targetPity5,
        note: `Salto 5★ (Tirada ${currentPity}/${targetPity5})`,
        timestamp: Date.now()
      };
    } else if (is4StarHit) {
      // 4-STAR HIT!
      const currentPity = session.pity4Star;
      session.pity4Star = 0;

      const character = pickRandom(pool4, rng) || cat.find(c => c.rarity === 4) || cat[0];

      const invChar = session.inventory.find(c => String(c.id) === String(character.id));
      if (invChar) {
        invChar.eidolon = Math.min(6, (invChar.eidolon || 0) + 1);
      } else {
        session.inventory.push({ ...character, eidolon: 0 });
      }

      const char4Icon = character.images?.icon_cdn || character.images?.icon || `https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/icon/character/${character.id}.png`;
      const char4Preview = character.images?.preview_cdn || character.images?.preview || `https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/image/character_preview/${character.id}.png`;

      result = {
        pullIndex: session.totalPulls,
        type: 'character',
        id: character.id,
        name: character.name,
        rarity: 4,
        element: character.element,
        path: character.path,
        icon: char4Icon,
        preview: char4Preview,
        images: character.images,
        pity: currentPity,
        note: `Salto 4★ (Tirada ${currentPity}/10)`,
        timestamp: Date.now()
      };
    } else {
      // 3-STAR LIGHT CONE
      const lc = pickRandom(STANDARD_3STAR_LIGHT_CONES, rng);
      result = {
        pullIndex: session.totalPulls,
        type: 'light_cone',
        id: lc.id,
        name: lc.name,
        rarity: 3,
        pathName: lc.path,
        icon: lc.icon,
        preview: lc.preview,
        pity: session.pity5Star,
        note: 'Cono de Luz 3★',
        timestamp: Date.now()
      };
    }

    session.history.unshift(result);
    return { success: true, result: result, session: session };
  }

  function pullTen(session, catalog = null, ownedIds = null) {
    if (!session) return { error: 'Sesión inválida' };
    const remaining = session.pullLimit === null ? 10 : session.pullLimit - session.totalPulls;
    if (remaining <= 0) {
      return { error: `Límite de tiradas alcanzado (${session.totalPulls}/${session.pullLimit}). Modifica el límite para continuar.` };
    }

    const count = Math.min(10, remaining);
    const results = [];
    for (let i = 0; i < count; i++) {
      const res = pullSingle(session, catalog, ownedIds);
      if (res.error) break;
      results.push(res.result);
    }

    return {
      success: true,
      count: results.length,
      results: results,
      session: session
    };
  }

  function swapSquadMember(session, slotIndex, characterId, catalog = null) {
    if (!session) return { error: 'Sesión no válida' };
    if (slotIndex < 0 || slotIndex > 3) return { error: 'Índice de ranura fuera de rango (0-3)' };
    const char = session.inventory.find(c => String(c.id) === String(characterId));
    if (!char) return { error: 'El personaje seleccionado no ha sido obtenido en este Gachapón.' };

    session.activeSquad[slotIndex] = char;
    return {
      success: true,
      activeSquad: session.activeSquad
    };
  }

  function generateGachaAuditReport(session) {
    if (!session) return '';
    const banner = UNIVERSAL_WARP_BANNER;
    const squadNames = (session.activeSquad || []).map((c, i) => {
      const roleLabel = ['DPS Principal', 'Sub-DPS / Buffer', 'Soporte Táctico', 'Sostenimiento'][i];
      return c ? `Posición ${i + 1} [${roleLabel}]: ${c.name} (${c.rarity}★ - ${c.element?.name || ''} / ${c.path?.name || ''})` : `Posición ${i + 1} [${roleLabel}]: [Vacío]`;
    }).join('\n');

    const keyPulls = (session.history || []).filter(h => h.rarity >= 4).slice(0, 30).map(h => {
      return `#${h.pullIndex} | ${h.rarity}★ ${h.name} — Pity: ${h.pity} [${h.note}]`;
    }).join('\n');

    const rarityFilterLabel = session.rarityFilter === '5star' ? 'Solo 5★' : (session.rarityFilter === '4star' ? 'Solo 4★' : 'Todos [5★ y 4★]');
    const rosterFilterLabel = session.filterByOwnedRoster ? 'Sincronizado con Roster Personal' : 'Catálogo Completo';

    return `✦ ACTA DE AUDITORÍA Y SALTO // AIIKO MUSIC & STAR RAIL ✦
Código Criptográfico de Verificación: ${session.seed}
Banner Activo: ${banner.title}
Filtro de Rareza: ${rarityFilterLabel}
Filtro de Roster: ${rosterFilterLabel}
Pity 5★ Configurado: Garantizado en ${session.pity5StarTarget || 90} tiros (Pity Actual: ${session.pity5Star}/${session.pity5StarTarget || 90})
Pity 4★: Garantizado en 10 tiros (Pity Actual: ${session.pity4Star}/10)
Tiradas Realizadas: ${session.totalPulls} / ${session.pullLimit ? session.pullLimit : 'Ilimitado'}
Personajes Obtenidos en Inventario: ${session.inventory.length}

=== ESCUADRA ACTIVA DEL DESAFÍO ===
${squadNames}

=== HISTORIAL VERIFICABLE DE TIROS 4★ Y 5★ ===
${keyPulls || 'Sin tiradas 4★/5★ registradas aún.'}
`;
  }

  return {
    BOSS_ROSTER,
    ENDGAME_MODES,
    EXPEDITION_MODES,
    EQUATIONS,
    CHALLENGE_RESTRICTIONS,
    ARCHETYPES,
    SEASONAL_ROTATIONS,
    STANDARD_5STAR_IDS,
    STANDARD_3STAR_LIGHT_CONES,
    UNIVERSAL_WARP_BANNER,
    FEATURED_BANNERS,
    getCatalog,
    getGachaCandidatePool,
    getCharacterById,
    generateCoherentTeam,
    generateDoubleNodeTeams,
    generateThematicTeam,
    generateChaosTeam,
    generateEndgameMatch,
    generateExpeditionChallenge,
    generateUniverseChallenge,
    calculateExpeditionWinner,
    calculateWinner,
    createGachaSession,
    pullStarterSquad,
    pullSingle,
    pullTen,
    swapSquadMember,
    generateGachaAuditReport
  };

})();

if (typeof module !== 'undefined') {
  module.exports = HSR_GAME_MODES;
}

