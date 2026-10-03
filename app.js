/**
 * Honkai: Star Rail — Fluent Minimalist Platform Controller (app.js)
 * Coordinates Catalog, Interactive Game Modes (Roulette, Endgame 1v1 Arena Double-Node,
 * Divergent Universe), Collection Roster Ownership Whitelist, Persistent User Profile,
 * JSON Export/Import Backups, Tactile Web Audio UI Synthesizer, and URL State Sharing.
 */

document.addEventListener('DOMContentLoaded', () => {

  // Global Character Data
  const characters = (typeof HSR_CHARACTERS !== 'undefined') ? [...HSR_CHARACTERS] : [];
  let currentCharacters = [...characters];

  // Collection / Roster Filter State (Persisted in localStorage)
  let ownedCharacterIds = new Set();
  const savedOwned = localStorage.getItem('hsr_owned_characters');
  if (savedOwned) {
    try {
      ownedCharacterIds = new Set(JSON.parse(savedOwned));
    } catch (e) {
      ownedCharacterIds = new Set(characters.map(c => String(c.id)));
    }
  } else {
    // By default, mark all characters as owned
    ownedCharacterIds = new Set(characters.map(c => String(c.id)));
  }

  let isRosterFilterActive = localStorage.getItem('hsr_roster_filter_active') === 'true';

  // Persistent User Profile State
  function generateFallbackUid() {
    return '7' + Math.floor(10000000 + Math.random() * 89999999);
  }

  let userProfile = {
    username: 'Trazacaminos',
    avatar: 'https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/icon/character/1001.png',
    uid: generateFallbackUid(),
    updatedAt: new Date().toISOString()
  };
  const savedProfile = localStorage.getItem('hsr_profile');
  if (savedProfile) {
    try {
      userProfile = { ...userProfile, ...JSON.parse(savedProfile) };
      if (!userProfile.uid) {
        userProfile.uid = generateFallbackUid();
        localStorage.setItem('hsr_profile', JSON.stringify(userProfile));
      }
    } catch (e) {}
  }

  // Audio Synthesizer State
  let soundEnabled = localStorage.getItem('hsr_sound_enabled') !== 'false';
  let audioCtx = null;

  // Navigation & View States
  let filterState = {
    search: '',
    role: 'ALL',
    element: 'ALL',
    path: 'ALL',
    rarity: 'ALL'
  };

  let sortState = {
    column: 'rarity',
    ascending: false
  };

  let currentViewMode = localStorage.getItem('hsr_view_mode') || (window.innerWidth <= 768 ? 'cards' : 'table');
  let currentTheme = localStorage.getItem('hsr_theme') || 'dark';

  // Game Modes States
  let currentRouletteMode = 'coherent';
  let currentRouletteTeam = [];
  let isSpinning = false;
  const lockedRouletteSlots = new Set();

  let currentEndgameMode = 'moc';
  let currentDuelMatch = null;
  let currentDuelSeasonId = null;

  let currentExpeditionMode = 'divergent_universe';
  let currentExpeditionChallenge = null;
  let p1CheckedCriteria = new Set();
  let p2CheckedCriteria = new Set();

  let currentGachaBannerId = 'universal';
  let currentGachaLimit = 90;
  let currentGachaRarityFilter = 'all'; // 'all', '5star', '4star'
  let currentGachaPityTarget = 90; // Configurable: 50, 70, 80, 90, custom
  let currentGachaSyncRoster = false;
  let currentGachaSession = null;
  let activeSwapSlotIndex = null;
  let lastPullType = 'single'; // 'starter', 'single', 'ten'
  let warpCanvasAnimId = null;
  let cancelWarpAnimationFn = null;

  // DOM Elements: Navigation & Header
  const mainNavTabs = document.getElementById('mainNavTabs');
  const pages = {
    catalog: document.getElementById('pageCatalog'),
    roulette: document.getElementById('pageRoulette'),
    duel: document.getElementById('pageDuel'),
    universe: document.getElementById('pageUniverse'),
    gacha: document.getElementById('pageGacha')
  };

  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');
  const themeBtnText = document.getElementById('themeBtnText');
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundIcon = document.getElementById('soundIcon');
  const quickShareRoomBtn = document.getElementById('quickShareRoomBtn');
  const toastContainer = document.getElementById('toastContainer');

  // DOM Elements: Header User Profile & Modal
  const openProfileModalBtn = document.getElementById('openProfileModalBtn');
  const headerUserAvatar = document.getElementById('headerUserAvatar');
  const headerUserName = document.getElementById('headerUserName');
  const profileModal = document.getElementById('profileModal');
  const profileModalCloseBtn = document.getElementById('profileModalCloseBtn');
  const profileCurrentAvatar = document.getElementById('profileCurrentAvatar');
  const profileUsernameInput = document.getElementById('profileUsernameInput');
  const profileUidInput = document.getElementById('profileUidInput');

  // DOM Elements: Shared Room Banner (Host info display)
  const sharedRoomBanner = document.getElementById('sharedRoomBanner');
  const sharedRoomHostAvatar = document.getElementById('sharedRoomHostAvatar');
  const sharedRoomHostName = document.getElementById('sharedRoomHostName');
  const sharedRoomHostUid = document.getElementById('sharedRoomHostUid');
  const sharedRoomSubText = document.getElementById('sharedRoomSubText');
  const p2pLiveStatusBadge = document.getElementById('p2pLiveStatusBadge');
  const disconnectRoomBtn = document.getElementById('disconnectRoomBtn');

  // DOM Elements: Share Room & P2P Modal
  const shareRoomModal = document.getElementById('shareRoomModal');
  const shareRoomModalCloseBtn = document.getElementById('shareRoomModalCloseBtn');
  const shareModalUserAvatar = document.getElementById('shareModalUserAvatar');
  const shareModalUserName = document.getElementById('shareModalUserName');
  const shareModalUserUid = document.getElementById('shareModalUserUid');
  const shareEditProfileBtn = document.getElementById('shareEditProfileBtn');
  const shareModalP2pStatus = document.getElementById('shareModalP2pStatus');
  const p2pRoomCodeBox = document.getElementById('p2pRoomCodeBox');
  const p2pCurrentRoomCode = document.getElementById('p2pCurrentRoomCode');
  const copyP2pCodeBtn = document.getElementById('copyP2pCodeBtn');
  const createP2pRoomBtn = document.getElementById('createP2pRoomBtn');
  const p2pHostStatusText = document.getElementById('p2pHostStatusText');
  const joinP2pCodeInput = document.getElementById('joinP2pCodeInput');
  const connectP2pBtn = document.getElementById('connectP2pBtn');
  const shareModalFullUrlInput = document.getElementById('shareModalFullUrlInput');
  const shareModalCopyUrlBtn = document.getElementById('shareModalCopyUrlBtn');
  const shareSummaryChips = document.getElementById('shareSummaryChips');
  const shareModalDoneBtn = document.getElementById('shareModalDoneBtn');

  // DOM Elements: Player 2 Dynamic Headers
  const duelP2NameDisplay = document.getElementById('duelP2NameDisplay');
  const p2ExpName = document.getElementById('p2ExpName');
  const p2ExpAvatar = document.getElementById('p2ExpAvatar');
  const p2ExpSvg = document.getElementById('p2ExpSvg');

  // DOM Elements: Friend Inspection Modal & Trigger Buttons
  const openFriendInspectBannerBtn = document.getElementById('openFriendInspectBannerBtn');
  const rouletteFriendViewBtn = document.getElementById('rouletteFriendViewBtn');
  const gachaFriendViewBtn = document.getElementById('gachaFriendViewBtn');
  const expeditionFriendViewBtn = document.getElementById('expeditionFriendViewBtn');

  const friendInspectModal = document.getElementById('friendInspectModal');
  const friendInspectModalCloseBtn = document.getElementById('friendInspectModalCloseBtn');
  const friendInspectDoneBtn = document.getElementById('friendInspectDoneBtn');
  const friendInspectAvatar = document.getElementById('friendInspectAvatar');
  const friendInspectPulse = document.getElementById('friendInspectPulse');
  const friendInspectName = document.getElementById('friendInspectName');
  const friendInspectUid = document.getElementById('friendInspectUid');
  const friendInspectStatusPill = document.getElementById('friendInspectStatusPill');
  const friendInspectSubtext = document.getElementById('friendInspectSubtext');
  const refreshFriendDataBtn = document.getElementById('refreshFriendDataBtn');
  const refreshFriendIcon = document.getElementById('refreshFriendIcon');
  const friendNavPills = document.getElementById('friendNavPills');

  const friendInspectRoulettePanel = document.getElementById('friendInspectRoulettePanel');
  const friendRouletteArchetype = document.getElementById('friendRouletteArchetype');
  const friendRouletteSeed = document.getElementById('friendRouletteSeed');
  const friendRouletteSlots = document.getElementById('friendRouletteSlots');

  const friendInspectGachaPanel = document.getElementById('friendInspectGachaPanel');
  const friendGachaPullsText = document.getElementById('friendGachaPullsText');
  const friendGachaPity5Text = document.getElementById('friendGachaPity5Text');
  const friendGachaSeed = document.getElementById('friendGachaSeed');
  const friendGachaSquadSlots = document.getElementById('friendGachaSquadSlots');
  const friendGachaHistoryList = document.getElementById('friendGachaHistoryList');

  const friendInspectExpeditionPanel = document.getElementById('friendInspectExpeditionPanel');
  const friendExpModeTitle = document.getElementById('friendExpModeTitle');
  const friendExpScoreBadge = document.getElementById('friendExpScoreBadge');
  const friendExpSeed = document.getElementById('friendExpSeed');
  const friendExpSquadSlots = document.getElementById('friendExpSquadSlots');
  const friendExpCriteriaList = document.getElementById('friendExpCriteriaList');
  const friendInspectEmptyState = document.getElementById('friendInspectEmptyState');
  const friendInspectOpenShareBtn = document.getElementById('friendInspectOpenShareBtn');

  const avatarPickerContainer = document.getElementById('avatarPickerContainer');
  const exportSettingsJsonBtn = document.getElementById('exportSettingsJsonBtn');
  const importSettingsFileInput = document.getElementById('importSettingsFileInput');
  const resetAllSettingsBtn = document.getElementById('resetAllSettingsBtn');
  const saveProfileBtn = document.getElementById('saveProfileBtn');
  let selectedAvatarUrl = userProfile.avatar;

  // DOM Elements: Breadcrumb Tracker
  const breadcrumbBar = document.getElementById('breadcrumbBar');
  const breadcrumbMain = document.getElementById('breadcrumbMain');
  const breadcrumbSub = document.getElementById('breadcrumbSub');

  // DOM Elements: Roster Collection Modal
  const openRosterModalBtn = document.getElementById('openRosterModalBtn');
  const rosterModal = document.getElementById('rosterModal');
  const rosterModalCloseBtn = document.getElementById('rosterModalCloseBtn');
  const rosterMasterToggle = document.getElementById('rosterMasterToggle');
  const rosterSearchInput = document.getElementById('rosterSearchInput');
  const rosterSelectAllBtn = document.getElementById('rosterSelectAllBtn');
  const rosterDeselectAllBtn = document.getElementById('rosterDeselectAllBtn');
  const rosterSelectFourStarsBtn = document.getElementById('rosterSelectFourStarsBtn');
  const rosterCountStatus = document.getElementById('rosterCountStatus');
  const rosterTilesContainer = document.getElementById('rosterTilesContainer');
  const rosterSaveBtn = document.getElementById('rosterSaveBtn');
  const rosterIndicatorDot = document.getElementById('rosterIndicatorDot');

  // DOM Elements: Catalog
  const searchInput = document.getElementById('searchInput');
  const searchClearBtn = document.getElementById('searchClearBtn');
  const tableBody = document.getElementById('tableBody');
  const cardsContainer = document.getElementById('cardsViewSection');
  const tableViewSection = document.getElementById('tableViewSection');
  const noResultsState = document.getElementById('noResultsState');
  const resultsCounterText = document.getElementById('resultsCounterText');
  const clearAllFiltersBtn = document.getElementById('clearAllFiltersBtn');
  const resetFiltersFromEmptyBtn = document.getElementById('resetFiltersFromEmptyBtn');
  const viewTableBtn = document.getElementById('viewTableBtn');
  const viewCardsBtn = document.getElementById('viewCardsBtn');
  const exportCsvBtn = document.getElementById('exportCsvBtn');

  // DOM Elements: Stats
  const statTotalChars = document.getElementById('statTotalChars');
  const statDpsChars = document.getElementById('statDpsChars');
  const statSubDpsChars = document.getElementById('statSubDpsChars');
  const statSupportChars = document.getElementById('statSupportChars');
  const catalogRosterStatusText = document.getElementById('catalogRosterStatusText');

  // DOM Elements: Roulette
  const spinRouletteBtn = document.getElementById('spinRouletteBtn');
  const spinBtnText = document.getElementById('spinBtnText');
  const copyTeamLinkBtn = document.getElementById('copyTeamLinkBtn');
  const rouletteOnlyFourStars = document.getElementById('rouletteOnlyFourStars');
  const rouletteCaptainSelect = document.getElementById('rouletteCaptainSelect');
  const rouletteArchetypeBadge = document.getElementById('rouletteArchetypeBadge');
  const rouletteRosterCountText = document.getElementById('rouletteRosterCountText');
  const rouletteConfigRosterBtn = document.getElementById('rouletteConfigRosterBtn');
  const teamSlotsContainer = document.getElementById('teamSlotsContainer');

  // DOM Elements: Endgame 1v1 Arena (Double Node)
  const endgameModePills = document.getElementById('endgameModePills');
  const endgameSeasonPills = document.getElementById('endgameSeasonPills');
  const newDuelMatchBtn = document.getElementById('newDuelMatchBtn');
  const copyDuelLinkBtn = document.getElementById('copyDuelLinkBtn');
  const endgameStageContainer = document.getElementById('endgameStageContainer');
  const duelP1NameDisplay = document.getElementById('duelP1NameDisplay');
  const p1Node1Grid = document.getElementById('p1Node1Grid');
  const p1Node2Grid = document.getElementById('p1Node2Grid');
  const p1ScoreLabel = document.getElementById('p1ScoreLabel');
  const p1ScoreInput = document.getElementById('p1ScoreInput');
  const calculateWinnerBtn = document.getElementById('calculateWinnerBtn');
  const duelResultBanner = document.getElementById('duelResultBanner');
  const p2Node1Grid = document.getElementById('p2Node1Grid');
  const p2Node2Grid = document.getElementById('p2Node2Grid');
  const p2ScoreLabel = document.getElementById('p2ScoreLabel');
  const p2ScoreInput = document.getElementById('p2ScoreInput');

  // DOM Elements: Expediciones RNG (Universo Diferenciado, Guerra de Divisas, La Plaga)
  const expeditionModePills = document.getElementById('expeditionModePills');
  const universeChallengeContainer = document.getElementById('universeChallengeContainer');
  const univSeedDisplay = document.getElementById('univSeedDisplay');
  const univTeamSlotsGrid = document.getElementById('univTeamSlotsGrid');
  const newUnivChallengeBtn = document.getElementById('newUnivChallengeBtn');
  const copyUnivChallengeBtn = document.getElementById('copyUnivChallengeBtn');

  // Scorecard DOM Elements
  const p1ExpAvatar = document.getElementById('p1ExpAvatar');
  const p1ExpName = document.getElementById('p1ExpName');
  const p1ScoreBadge = document.getElementById('p1ScoreBadge');
  const p1CriteriaList = document.getElementById('p1CriteriaList');
  const p1BonusLabel = document.getElementById('p1BonusLabel');
  const p1BonusHelper = document.getElementById('p1BonusHelper');
  const p1BonusInput = document.getElementById('p1BonusInput');

  const p2ScoreBadge = document.getElementById('p2ScoreBadge');
  const p2CriteriaList = document.getElementById('p2CriteriaList');
  const p2BonusLabel = document.getElementById('p2BonusLabel');
  const p2BonusHelper = document.getElementById('p2BonusHelper');
  const p2BonusInput = document.getElementById('p2BonusInput');

  const calculateExpeditionBtn = document.getElementById('calculateExpeditionBtn');
  const resetExpeditionChecklistBtn = document.getElementById('resetExpeditionChecklistBtn');
  const expeditionResultBanner = document.getElementById('expeditionResultBanner');

  // DOM Elements: Character Detail Modal
  const characterModal = document.getElementById('characterModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalContent = document.getElementById('modalContent');

  // DOM Elements: Gachapón Engine & Modals
  const gachaRarityFilterPills = document.getElementById('gachaRarityFilterPills');
  const gachaSyncRosterToggle = document.getElementById('gachaSyncRosterToggle');
  const gachaPoolStatusBadge = document.getElementById('gachaPoolStatusBadge');
  const gachaPityTargetPills = document.getElementById('gachaPityTargetPills');
  const gachaCustomPityInput = document.getElementById('gachaCustomPityInput');
  const applyGachaCustomPityBtn = document.getElementById('applyGachaCustomPityBtn');
  const gachaLimitPills = document.getElementById('gachaLimitPills');
  const gachaCustomLimitInput = document.getElementById('gachaCustomLimitInput');
  const applyGachaCustomLimitBtn = document.getElementById('applyGachaCustomLimitBtn');
  const addGachaCustomPullsBtn = document.getElementById('addGachaCustomPullsBtn');
  const resetGachaSessionBtn = document.getElementById('resetGachaSessionBtn');
  const gachaPullsCounterDisplay = document.getElementById('gachaPullsCounterDisplay');
  const gachaPity5Caption = document.getElementById('gachaPity5Caption');
  const gachaPity5Text = document.getElementById('gachaPity5Text');
  const gachaPity5Bar = document.getElementById('gachaPity5Bar');
  const gachaPity4Text = document.getElementById('gachaPity4Text');
  const gachaPity4Bar = document.getElementById('gachaPity4Bar');
  const gachaActivePoolBadge = document.getElementById('gachaActivePoolBadge');
  const gachaSeedDisplay = document.getElementById('gachaSeedDisplay');
  const copyGachaSeedBtn = document.getElementById('copyGachaSeedBtn');
  const gachaBannerStage = document.getElementById('gachaBannerStage');
  const gachaSquadSlotsContainer = document.getElementById('gachaSquadSlotsContainer');
  const gachaInventoryGrid = document.getElementById('gachaInventoryGrid');
  const gachaInvCountBadge = document.getElementById('gachaInvCountBadge');
  const gachaHistoryCountBadge = document.getElementById('gachaHistoryCountBadge');
  const gachaHistoryTableBody = document.getElementById('gachaHistoryTableBody');
  const copyGachaAuditBtn = document.getElementById('copyGachaAuditBtn');
  const exportSquadToExpeditionBtn = document.getElementById('exportSquadToExpeditionBtn');
  const exportSquadToDuelBtn = document.getElementById('exportSquadToDuelBtn');

  // Gacha Cinematic & Reveal Elements
  const gachaWarpCinematic = document.getElementById('gachaWarpCinematic');
  const gachaWarpCanvas = document.getElementById('gachaWarpCanvas');
  const warpTicketContainer = document.getElementById('warpTicketContainer');
  const warpTicketAura = document.getElementById('warpTicketAura');
  const skipWarpAnimationBtn = document.getElementById('skipWarpAnimationBtn');
  const gachaRevealModal = document.getElementById('gachaRevealModal');
  const gachaRevealSummaryText = document.getElementById('gachaRevealSummaryText');
  const gachaRevealCardsGrid = document.getElementById('gachaRevealCardsGrid');
  const gachaRevealPullAgainBtn = document.getElementById('gachaRevealPullAgainBtn');
  const gachaRevealCloseBtn = document.getElementById('gachaRevealCloseBtn');
  const squadSwapModal = document.getElementById('squadSwapModal');
  const squadSwapTitle = document.getElementById('squadSwapTitle');
  const squadSwapSubtitle = document.getElementById('squadSwapSubtitle');
  const squadSwapGrid = document.getElementById('squadSwapGrid');
  const squadSwapCloseBtn = document.getElementById('squadSwapCloseBtn');

  /* ==========================================================================
     INIT & ROUTER
     ========================================================================== */
  function init() {
    applyTheme(currentTheme);
    setViewMode(currentViewMode);
    updateAudioUI();
    updateUserProfileUI();
    setupDynamicFilterButtons();
    populateCaptainSelect();
    populateAvatarPicker();
    updateRosterUI();
    updateStatsBanner();
    renderCharacters();
    initGachaSession();
    renderEndgameSeasonPills();

    setupEventListeners();
    handleHashNavigation();
  }

  function handleHashNavigation() {
    const rawHash = window.location.hash.replace(/^#/, '');
    const params = new URLSearchParams(rawHash);
    const tab = params.get('tab') || (rawHash.includes('roulette') ? 'roulette' : rawHash.includes('duel') ? 'duel' : rawHash.includes('universe') ? 'universe' : rawHash.includes('gacha') ? 'gacha' : 'catalog');

    // Extract Host Profile & Shared Room params
    const hostParam = params.get('host');
    const uidParam = params.get('uid');
    const avatarParam = params.get('avatar');
    const roomParam = params.get('room');

    if (hostParam) {
      remoteHostProfile = {
        username: decodeURIComponent(hostParam),
        uid: uidParam ? decodeURIComponent(uidParam) : '---',
        avatar: avatarParam ? decodeURIComponent(avatarParam) : 'https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/icon/character/1001.png'
      };

      if (sharedRoomBanner) {
        sharedRoomBanner.style.display = 'block';
        if (sharedRoomHostAvatar) sharedRoomHostAvatar.src = remoteHostProfile.avatar;
        if (sharedRoomHostName) sharedRoomHostName.textContent = remoteHostProfile.username;
        if (sharedRoomHostUid) sharedRoomHostUid.textContent = `UID: ${remoteHostProfile.uid}`;
        if (sharedRoomSubText) {
          sharedRoomSubText.textContent = `Desafío compartido por ${remoteHostProfile.username}. Compitiendo en tiempo real.`;
        }
      }

      // Configure Duelo displays: P1 is Host, P2 is Local User
      if (duelP1NameDisplay) {
        duelP1NameDisplay.textContent = `P1: ${remoteHostProfile.username} (Anfitrión)`;
      }
      if (duelP2NameDisplay) {
        duelP2NameDisplay.textContent = `P2: ${userProfile.username || 'Trazacaminos'} (Tú)`;
      }
      if (p1ScoreLabel) {
        p1ScoreLabel.textContent = `Resultado de ${remoteHostProfile.username}:`;
      }
      if (p2ScoreLabel) {
        p2ScoreLabel.textContent = `Tu resultado (${userProfile.username || 'Tú'}):`;
      }

      // Configure Expedición displays: P1 is Host, P2 is Local User
      if (p1ExpName) {
        p1ExpName.textContent = `${remoteHostProfile.username} (Anfitrión)`;
      }
      if (p1ExpAvatar) {
        p1ExpAvatar.src = remoteHostProfile.avatar;
      }
      if (p2ExpName) {
        p2ExpName.textContent = `${userProfile.username || 'Trazacaminos'} (Tú)`;
      }
      if (p2ExpAvatar) {
        p2ExpAvatar.src = userProfile.avatar;
        p2ExpAvatar.style.display = 'inline-block';
      }
      if (p2ExpSvg) {
        p2ExpSvg.style.display = 'none';
      }

      // If room parameter is provided, auto-join WebRTC P2P room
      if (roomParam && (!p2pConn || currentP2pRoomCode !== roomParam)) {
        joinP2PRoom(roomParam);
      }
    } else {
      if (sharedRoomBanner) sharedRoomBanner.style.display = 'none';
      remoteHostProfile = null;
      updateUserProfileUI();
    }

    switchTab(tab, false);

    if (tab === 'roulette') {
      const teamParam = params.get('team');
      const seedParam = params.get('seed');
      if (teamParam) {
        loadTeamFromIds(teamParam.split(','));
      } else {
        spinRoulette(seedParam, false);
      }
    } else if (tab === 'duel') {
      const modeParam = params.get('mode');
      if (modeParam && ['moc', 'pure_fiction', 'apocalyptic_shadow'].includes(modeParam)) {
        currentEndgameMode = modeParam;
        document.querySelectorAll('#endgameModePills .roulette-pill-btn').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.endgame === modeParam);
        });
      }
      const seedParam = params.get('seed');
      generateDuel(seedParam);
    } else if (tab === 'universe') {
      const modeParam = params.get('mode');
      if (modeParam && ['divergent_universe', 'currency_wars', 'swarm_disaster'].includes(modeParam)) {
        currentExpeditionMode = modeParam;
        if (expeditionModePills) {
          expeditionModePills.querySelectorAll('.roulette-pill-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.expedition === modeParam);
          });
        }
      }
      const seedParam = params.get('seed');
      generateExpedition(seedParam);
    } else if (tab === 'gacha') {
      const bannerParam = params.get('banner');
      if (bannerParam && currentGachaSession) {
        currentGachaBannerId = bannerParam;
        currentGachaSession.bannerId = bannerParam;
      }
      renderGachaUI();
    }
  }

  function switchTab(tabName, updateHash = true) {
    if (!pages[tabName]) tabName = 'catalog';

    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    Object.keys(pages).forEach(k => {
      if (pages[k]) {
        pages[k].style.display = (k === tabName) ? 'flex' : 'none';
      }
    });

    if (updateHash) {
      const currentParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      currentParams.set('tab', tabName);
      window.location.hash = currentParams.toString();
    }

    if (tabName === 'catalog') {
      updateBreadcrumb('Catálogo Oficial', `${characters.length} Personajes Compilados`);
    } else if (tabName === 'roulette') {
      if (currentRouletteTeam.length === 0) spinRoulette(null, false);
      updateBreadcrumb('Ruleta de Equipos', rouletteArchetypeBadge.textContent || 'Composición Táctica');
    } else if (tabName === 'duel') {
      if (!currentDuelMatch) generateDuel();
      const modeName = HSR_GAME_MODES.ENDGAME_MODES[currentEndgameMode]?.name || 'Endgame 1v1';
      updateBreadcrumb('Duelo Endgame 1v1', `${modeName} • Doble Nodo`);
    } else if (tabName === 'universe') {
      if (!currentExpeditionChallenge) generateExpedition();
      const expName = HSR_GAME_MODES.EXPEDITION_MODES[currentExpeditionMode]?.name || 'Expedición RNG';
      updateBreadcrumb('Expediciones RNG', `${expName} • Tablero 1v1`);
    } else if (tabName === 'gacha') {
      renderGachaUI();
      updateBreadcrumb('Modo Gachapón', 'Salto Astral, Banners 50/50 y Presupuesto');
    }
  }

  function updateBreadcrumb(mainText, subText) {
    if (breadcrumbMain) breadcrumbMain.textContent = mainText;
    if (breadcrumbSub) breadcrumbSub.textContent = subText;
  }

  /* ==========================================================================
     WEB AUDIO API SYNTHESIZER (TACTILE UI CLICKS & REEL TICKS)
     ========================================================================== */
  function getAudioContext() {
    if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioCtx();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playUiSound(type = 'click') {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(750, now);
        osc.frequency.exponentialRampToValueAtTime(360, now + 0.035);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
        osc.start(now);
        osc.stop(now + 0.035);
      } else if (type === 'tick') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(260, now + 0.025);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
        osc.start(now);
        osc.stop(now + 0.025);
      } else if (type === 'card_flip') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(820, now);
        osc.frequency.exponentialRampToValueAtTime(280, now + 0.04);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === 'warp_start') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(85, now);
        osc.frequency.exponentialRampToValueAtTime(520, now + 1.4);
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.07, now + 0.8);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
        osc.start(now);
        osc.stop(now + 1.4);
      } else if (type === 'warp_burst') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(620, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.35);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'fanfare' || type === 'gold_fanfare') {
        const chord = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C5, E5, G5, C6, E6
        chord.forEach((freq, idx) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.type = 'triangle';
          const start = now + (idx * 0.07);
          o.frequency.setValueAtTime(freq, start);
          g.gain.setValueAtTime(0.1, start);
          g.gain.exponentialRampToValueAtTime(0.001, start + 0.42);
          o.start(start);
          o.stop(start + 0.42);
        });
      } else if (type === 'purple_chime') {
        const chord = [440.0, 554.37, 659.25, 880.0]; // A4, C#5, E5, A5
        chord.forEach((freq, idx) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.type = 'sine';
          const start = now + (idx * 0.06);
          o.frequency.setValueAtTime(freq, start);
          g.gain.setValueAtTime(0.08, start);
          g.gain.exponentialRampToValueAtTime(0.001, start + 0.32);
          o.start(start);
          o.stop(start + 0.32);
        });
      }
    } catch (e) {
      // Audio playback suspended or disabled
    }
  }

  function updateAudioUI() {
    if (soundIcon) {
      soundIcon.innerHTML = soundEnabled
        ? '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>'
        : '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>';
    }
  }

  /* ==========================================================================
     PERSISTENT USER PROFILE & SETTINGS EXPORT / IMPORT
     ========================================================================== */
  function updateUserProfileUI() {
    if (headerUserName) headerUserName.textContent = userProfile.username || 'Trazacaminos';
    if (headerUserAvatar) headerUserAvatar.src = userProfile.avatar;
    if (profileCurrentAvatar) profileCurrentAvatar.src = userProfile.avatar;
    if (profileUsernameInput) profileUsernameInput.value = userProfile.username || 'Trazacaminos';
    if (profileUidInput) profileUidInput.value = userProfile.uid || '';
    if (shareModalUserAvatar) shareModalUserAvatar.src = userProfile.avatar;
    if (shareModalUserName) shareModalUserName.textContent = userProfile.username || 'Trazacaminos';
    if (shareModalUserUid) shareModalUserUid.textContent = `UID: ${userProfile.uid || '---'}`;

    if (!remoteHostProfile) {
      if (duelP1NameDisplay) {
        duelP1NameDisplay.textContent = `P1: ${userProfile.username || 'Trazacaminos'}`;
      }
      if (duelP2NameDisplay) {
        const p2Name = remotePeerProfile ? `${remotePeerProfile.username} (Amigo)` : 'Jugador 2 (Amigo)';
        duelP2NameDisplay.textContent = `P2: ${p2Name}`;
      }
      if (p1ScoreLabel) {
        p1ScoreLabel.textContent = 'Tu resultado:';
      }
      if (p2ScoreLabel) {
        const p2Name = remotePeerProfile ? remotePeerProfile.username : 'tu amigo';
        p2ScoreLabel.textContent = `Resultado de ${p2Name}:`;
      }
      if (p1ExpName) {
        p1ExpName.textContent = userProfile.username || 'Trazacaminos';
      }
      if (p1ExpAvatar) {
        p1ExpAvatar.src = userProfile.avatar;
      }
      if (p2ExpName) {
        const p2Name = remotePeerProfile ? `${remotePeerProfile.username} (Amigo)` : 'Jugador 2 (Amigo)';
        p2ExpName.textContent = p2Name;
      }
      if (p2ExpAvatar && remotePeerProfile?.avatar) {
        p2ExpAvatar.src = remotePeerProfile.avatar;
        p2ExpAvatar.style.display = 'inline-block';
        if (p2ExpSvg) p2ExpSvg.style.display = 'none';
      }
    } else {
      // In guest session, Remote Host is P1 and local user is P2
      if (duelP1NameDisplay) {
        duelP1NameDisplay.textContent = `P1: ${remoteHostProfile.username} (Anfitrión)`;
      }
      if (duelP2NameDisplay) {
        duelP2NameDisplay.textContent = `P2: ${userProfile.username || 'Trazacaminos'} (Tú)`;
      }
      if (p1ScoreLabel) {
        p1ScoreLabel.textContent = `Resultado de ${remoteHostProfile.username}:`;
      }
      if (p2ScoreLabel) {
        p2ScoreLabel.textContent = `Tu resultado (${userProfile.username || 'Tú'}):`;
      }
      if (p1ExpName) {
        p1ExpName.textContent = `${remoteHostProfile.username} (Anfitrión)`;
      }
      if (p1ExpAvatar) {
        p1ExpAvatar.src = remoteHostProfile.avatar;
      }
      if (p2ExpName) {
        p2ExpName.textContent = `${userProfile.username || 'Trazacaminos'} (Tú)`;
      }
      if (p2ExpAvatar) {
        p2ExpAvatar.src = userProfile.avatar;
        p2ExpAvatar.style.display = 'inline-block';
      }
      if (p2ExpSvg) {
        p2ExpSvg.style.display = 'none';
      }
    }
  }

  function populateAvatarPicker() {
    if (!avatarPickerContainer) return;
    avatarPickerContainer.innerHTML = '';
    const fragment = document.createDocumentFragment();

    // Use a diverse curated selection of canonical avatars
    characters.forEach(c => {
      const avatarSrc = c.images?.icon_cdn || c.images?.icon || c.icon || '';
      if (!avatarSrc) return;
      const item = document.createElement('div');
      item.className = `avatar-pick-item ${selectedAvatarUrl === avatarSrc ? 'active selected' : ''}`;
      item.title = c.name;
      item.innerHTML = `<img src="${avatarSrc}" alt="${c.name}" loading="lazy">`;

      item.addEventListener('click', () => {
        selectedAvatarUrl = avatarSrc;
        document.querySelectorAll('.avatar-pick-item').forEach(el => el.classList.remove('active', 'selected'));
        item.classList.add('active', 'selected');
        if (profileCurrentAvatar) profileCurrentAvatar.src = avatarSrc;
        playUiSound('click');
      });

      fragment.appendChild(item);
    });

    avatarPickerContainer.appendChild(fragment);
  }

  function openProfileModal() {
    selectedAvatarUrl = userProfile.avatar;
    updateUserProfileUI();
    populateAvatarPicker();
    profileModal.classList.add('open');
    profileModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    playUiSound('click');
  }

  function closeProfileModal() {
    profileModal.classList.remove('open');
    profileModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function saveProfile() {
    const newName = (profileUsernameInput.value || '').trim() || 'Trazacaminos';
    const newUid = (profileUidInput?.value || '').trim() || userProfile.uid || generateFallbackUid();
    userProfile.username = newName;
    userProfile.uid = newUid;
    userProfile.avatar = selectedAvatarUrl || userProfile.avatar;
    userProfile.updatedAt = new Date().toISOString();

    localStorage.setItem('hsr_profile', JSON.stringify(userProfile));
    updateUserProfileUI();
    closeProfileModal();
    showToast(`Perfil de ${newName} (UID: ${newUid}) guardado`, 'success');
    playUiSound('click');

    // If connected via P2P, announce updated profile
    sendP2PMessage('HANDSHAKE', { profile: userProfile, role: p2pRole });
  }

  function exportAllDataAsJson() {
    const exportPayload = {
      app: 'HSR_Endgame_Platform',
      version: '1.11.0',
      exportDate: new Date().toISOString(),
      profile: userProfile,
      ownedCharacters: Array.from(ownedCharacterIds),
      rosterFilterActive: isRosterFilterActive,
      gachaSession: currentGachaSession,
      preferences: {
        theme: currentTheme,
        viewMode: currentViewMode,
        soundEnabled: soundEnabled,
        endgameMode: currentEndgameMode
      }
    };

    const jsonStr = JSON.stringify(exportPayload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = (userProfile.username || 'Trazacaminos').replace(/[^a-zA-Z0-9_-]/g, '_');
    a.download = `HSR_Perfil_${safeName}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Copia de seguridad descargada exitosamente (.json)', 'download');
    playUiSound('fanfare');
  }

  function handleImportJsonFile(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data || typeof data !== 'object') throw new Error('Formato inválido');

        if (data.profile) {
          userProfile = { ...userProfile, ...data.profile };
          localStorage.setItem('hsr_profile', JSON.stringify(userProfile));
          updateUserProfileUI();
        }

        if (Array.isArray(data.ownedCharacters)) {
          ownedCharacterIds = new Set(data.ownedCharacters.map(String));
          localStorage.setItem('hsr_owned_characters', JSON.stringify(Array.from(ownedCharacterIds)));
        }

        if (typeof data.rosterFilterActive === 'boolean') {
          isRosterFilterActive = data.rosterFilterActive;
          localStorage.setItem('hsr_roster_filter_active', String(isRosterFilterActive));
        }

        if (data.gachaSession) {
          currentGachaSession = data.gachaSession;
          saveGachaSession();
          renderGachaUI();
        }

        if (data.preferences) {
          if (data.preferences.theme) applyTheme(data.preferences.theme);
          if (data.preferences.viewMode) setViewMode(data.preferences.viewMode);
          if (typeof data.preferences.soundEnabled === 'boolean') {
            soundEnabled = data.preferences.soundEnabled;
            localStorage.setItem('hsr_sound_enabled', String(soundEnabled));
            updateAudioUI();
          }
          if (data.preferences.endgameMode && ['moc', 'pure_fiction', 'apocalyptic_shadow'].includes(data.preferences.endgameMode)) {
            currentEndgameMode = data.preferences.endgameMode;
          }
        }

        updateRosterUI();
        renderCharacters();
        closeProfileModal();
        showToast('¡Copia de seguridad restaurada exitosamente!', 'info');
        playUiSound('fanfare');
      } catch (err) {
        showToast('Error al importar archivo JSON: formato incompatible', 'warn');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  function resetAllData() {
    if (confirm('¿Restablecer todos los datos locales y colección a valores por defecto?')) {
      localStorage.removeItem('hsr_profile');
      localStorage.removeItem('hsr_owned_characters');
      localStorage.removeItem('hsr_roster_filter_active');
      localStorage.removeItem('hsr_view_mode');
      localStorage.removeItem('hsr_theme');
      localStorage.removeItem('hsr_sound_enabled');
      localStorage.removeItem('hsr_gacha_session');
      showToast('Datos reiniciados. Recargando...', '↻');
      setTimeout(() => window.location.reload(), 500);
    }
  }

  /* ==========================================================================
     WEBRTC P2P & MULTIPLAYER ROOM ENGINE (PEERJS)
     ========================================================================== */
  let remoteHostProfile = null;
  let remotePeerProfile = null;
  let p2pPeer = null;
  let p2pConn = null;
  let currentP2pRoomCode = null;
  let p2pRole = null; // 'host' | 'guest' | null
  let isP2pConnected = false;

  // Friend Inspection State (Ruleta, Gachapón, Expedición)
  let friendGameState = {
    profile: null,
    roulette: null,
    gacha: null,
    expedition: null,
    lastUpdated: null
  };
  let activeFriendTab = 'roulette';

  function getFullStatePayload() {
    return {
      profile: userProfile,
      roulette: {
        team: currentRouletteTeam,
        archetype: rouletteArchetypeBadge?.textContent || '',
        captain: rouletteCaptainSelect?.value || '',
        seed: document.getElementById('teamSeedDisplay')?.textContent || ''
      },
      gacha: currentGachaSession ? {
        activeSquad: currentGachaSession.activeSquad,
        history: currentGachaSession.history ? currentGachaSession.history.slice(-30) : [],
        totalPulls: currentGachaSession.totalPulls || 0,
        pullLimit: currentGachaSession.pullLimit || 90,
        pityCount5: currentGachaSession.pityCount5 || 0,
        seed: currentGachaSession.seed || ''
      } : null,
      expedition: currentExpeditionChallenge ? {
        mode: currentExpeditionMode,
        seed: currentExpeditionChallenge.seed,
        team: currentExpeditionChallenge.team,
        checkedCriteria: Array.from(p1CheckedCriteria),
        bonus: Number(p1BonusInput?.value || 0),
        totalScore: p1ScoreBadge?.textContent || '0 pts'
      } : null
    };
  }

  function broadcastRouletteState() {
    sendP2PMessage('ROULETTE_SYNC', {
      team: currentRouletteTeam,
      archetype: rouletteArchetypeBadge?.textContent || '',
      captain: rouletteCaptainSelect?.value || '',
      seed: document.getElementById('teamSeedDisplay')?.textContent || ''
    });
  }

  function broadcastGachaState() {
    if (!currentGachaSession) return;
    sendP2PMessage('GACHA_SYNC', {
      activeSquad: currentGachaSession.activeSquad || [],
      history: currentGachaSession.history ? currentGachaSession.history.slice(-30) : [],
      totalPulls: currentGachaSession.totalPulls || 0,
      pullLimit: currentGachaSession.pullLimit || 90,
      pityCount5: currentGachaSession.pityCount5 || 0,
      seed: currentGachaSession.seed || ''
    });
  }

  function broadcastExpeditionState() {
    if (!currentExpeditionChallenge) return;
    sendP2PMessage('EXPEDITION_SYNC', {
      mode: currentExpeditionMode,
      seed: currentExpeditionChallenge.seed,
      team: currentExpeditionChallenge.team,
      checkedCriteria: Array.from(p1CheckedCriteria),
      bonus: Number(p1BonusInput?.value || 0),
      totalScore: p1ScoreBadge?.textContent || '0 pts'
    });
  }

  function openFriendInspectModal(initialTab = null) {
    if (initialTab) {
      activeFriendTab = initialTab;
    }
    switchFriendTab(activeFriendTab);
    renderFriendInspectUI();

    if (friendInspectModal) {
      friendInspectModal.classList.add('open');
      friendInspectModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      playUiSound('click');
    }

    if (p2pConn && p2pConn.open) {
      sendP2PMessage('REQUEST_FULL_STATE', {});
    }
  }

  function closeFriendInspectModal() {
    if (friendInspectModal) {
      friendInspectModal.classList.remove('open');
      friendInspectModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  }

  function switchFriendTab(tabName) {
    activeFriendTab = tabName;
    if (friendNavPills) {
      friendNavPills.querySelectorAll('.friend-nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.friendTab === tabName);
      });
    }

    if (friendInspectRoulettePanel) {
      friendInspectRoulettePanel.style.display = (tabName === 'roulette') ? 'flex' : 'none';
    }
    if (friendInspectGachaPanel) {
      friendInspectGachaPanel.style.display = (tabName === 'gacha') ? 'flex' : 'none';
    }
    if (friendInspectExpeditionPanel) {
      friendInspectExpeditionPanel.style.display = (tabName === 'expedition') ? 'flex' : 'none';
    }
  }

  function renderFriendInspectUI() {
    const friendProfile = friendGameState.profile || remotePeerProfile || remoteHostProfile;
    const friendName = friendProfile?.username || 'Amigo';
    const friendAvatar = friendProfile?.avatar || 'https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/icon/character/1001.png';
    const friendUid = friendProfile?.uid || '---';

    if (friendInspectAvatar) friendInspectAvatar.src = friendAvatar;
    if (friendInspectName) friendInspectName.textContent = friendName;
    if (friendInspectUid) friendInspectUid.textContent = `UID: ${friendUid}`;

    const isConnected = !!(p2pConn && p2pConn.open);
    if (friendInspectStatusPill) {
      friendInspectStatusPill.className = `p2p-status-pill ${isConnected ? 'connected' : (remoteHostProfile ? 'waiting' : 'offline')}`;
      friendInspectStatusPill.textContent = isConnected ? '● En Vivo P2P' : (remoteHostProfile ? '● Enlace Compartido' : '● Desconectado');
    }
    if (friendInspectPulse) {
      friendInspectPulse.style.display = isConnected ? 'block' : 'none';
    }
    if (friendInspectSubtext) {
      friendInspectSubtext.textContent = friendGameState.lastUpdated
        ? `Última sincronización: ${friendGameState.lastUpdated.toLocaleTimeString()} (${isConnected ? 'Conexión WebRTC P2P activa' : 'Caché de sala'})`
        : (isConnected ? 'Conexión directa en tiempo real sin intermediarios.' : 'Tu amigo aún no se ha conectado en vivo a esta sala.');
    }

    const hasAnyData = !!(friendGameState.roulette?.team?.length || friendGameState.gacha || friendGameState.expedition || isConnected || remoteHostProfile);

    if (!hasAnyData) {
      if (friendInspectEmptyState) friendInspectEmptyState.style.display = 'flex';
      if (friendInspectRoulettePanel) friendInspectRoulettePanel.style.display = 'none';
      if (friendInspectGachaPanel) friendInspectGachaPanel.style.display = 'none';
      if (friendInspectExpeditionPanel) friendInspectExpeditionPanel.style.display = 'none';
      return;
    }

    if (friendInspectEmptyState) friendInspectEmptyState.style.display = 'none';
    switchFriendTab(activeFriendTab);

    // 1. Render Roulette Panel
    if (friendGameState.roulette?.team?.length) {
      if (friendRouletteArchetype) friendRouletteArchetype.textContent = `Arquetipo: ${friendGameState.roulette.archetype || 'Composición Libre'}`;
      if (friendRouletteSeed) friendRouletteSeed.textContent = `Semilla: ${friendGameState.roulette.seed || '---'}`;

      if (friendRouletteSlots) {
        friendRouletteSlots.innerHTML = friendGameState.roulette.team.map((c) => {
          const charObj = characters.find(ch => String(ch.id) === String(c.id)) || c;
          const imgSrc = charObj.images?.icon_cdn || charObj.images?.icon || c.icon || '';
          const rarity = charObj.rarity || c.rarity || 4;
          const stars = '✦'.repeat(rarity);
          const isCaptain = (friendGameState.roulette.captain && String(c.id) === String(friendGameState.roulette.captain));
          return `
            <div class="friend-slot-card rarity-${rarity}">
              ${isCaptain ? '<span class="friend-slot-eidolon">Capitán</span>' : ''}
              <img class="friend-slot-avatar" src="${imgSrc}" alt="${charObj.name || c.name}">
              <div class="friend-slot-name">${charObj.name || c.name}</div>
              <div style="font-size: 0.65rem; color: ${rarity === 5 ? '#fde047' : '#c084fc'};">${stars}</div>
              <div class="friend-slot-tags">
                <span class="friend-slot-tag">${charObj.element || c.element || ''}</span>
                <span class="friend-slot-tag">${charObj.path || c.path || ''}</span>
                <span class="friend-slot-tag">${charObj.role || c.role || ''}</span>
              </div>
            </div>
          `;
        }).join('');
      }
    } else {
      if (friendRouletteArchetype) friendRouletteArchetype.textContent = 'Arquetipo: Sin datos';
      if (friendRouletteSeed) friendRouletteSeed.textContent = 'Semilla: ---';
      if (friendRouletteSlots) {
        friendRouletteSlots.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 24px; color: var(--text-muted); font-size: 0.8rem;">Tu amigo no ha girado la ruleta todavía o aún no ha compartido su composición.</div>';
      }
    }

    // 2. Render Gacha Panel
    if (friendGameState.gacha) {
      const g = friendGameState.gacha;
      const limitStr = g.pullLimit === 999999 ? '∞' : (g.pullLimit || 90);
      if (friendGachaPullsText) friendGachaPullsText.textContent = `Tiradas: ${g.totalPulls || 0} / ${limitStr}`;
      if (friendGachaPity5Text) friendGachaPity5Text.textContent = `Pity 5★: ${g.pityCount5 || 0}/90`;
      if (friendGachaSeed) friendGachaSeed.textContent = `Semilla: #${g.seed || '---'}`;

      if (friendGachaSquadSlots) {
        if (g.activeSquad && g.activeSquad.length > 0) {
          friendGachaSquadSlots.innerHTML = g.activeSquad.map(sq => {
            const charObj = characters.find(c => String(c.id) === String(sq.id)) || sq;
            const imgSrc = charObj.images?.icon_cdn || charObj.images?.icon || sq.icon || '';
            const rarity = charObj.rarity || sq.rarity || 4;
            const stars = '✦'.repeat(rarity);
            return `
              <div class="friend-slot-card rarity-${rarity}">
                <span class="friend-slot-eidolon">E${sq.eidolon || 0}</span>
                <img class="friend-slot-avatar" src="${imgSrc}" alt="${charObj.name || sq.name}">
                <div class="friend-slot-name">${charObj.name || sq.name}</div>
                <div style="font-size: 0.65rem; color: ${rarity === 5 ? '#fde047' : '#c084fc'};">${stars}</div>
                <div class="friend-slot-tags">
                  <span class="friend-slot-tag">${charObj.element || sq.element || ''}</span>
                  <span class="friend-slot-tag">${charObj.path || sq.path || ''}</span>
                </div>
              </div>
            `;
          }).join('');
        } else {
          friendGachaSquadSlots.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 18px; color: var(--text-muted); font-size: 0.78rem;">Tu amigo no ha reclamado su escuadra inicial todavía.</div>';
        }
      }

      if (friendGachaHistoryList) {
        const highlights = (g.history || []).filter(h => (h.rarity || 3) >= 4);
        if (highlights.length > 0) {
          friendGachaHistoryList.innerHTML = highlights.slice(-16).reverse().map(item => {
            const charObj = characters.find(c => String(c.id) === String(item.id)) || item;
            const imgSrc = charObj.images?.icon_cdn || charObj.images?.icon || item.icon || '';
            const is5 = (item.rarity === 5);
            return `
              <div class="friend-gacha-item-pill ${is5 ? 'rarity-5' : 'rarity-4'}">
                <img class="friend-gacha-item-img" src="${imgSrc}" alt="${item.name}">
                <div style="min-width: 0; flex: 1;">
                  <strong style="font-size: 0.75rem; color: ${is5 ? '#fde047' : '#c084fc'}; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${item.name}
                  </strong>
                  <span style="font-size: 0.66rem; color: var(--text-muted);">Tirada #${item.pullIndex || '?'}</span>
                </div>
              </div>
            `;
          }).join('');
        } else {
          friendGachaHistoryList.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 18px; color: var(--text-muted); font-size: 0.78rem;">Sin combatientes de 4★ o 5★ registrados en los últimos saltos.</div>';
        }
      }
    } else {
      if (friendGachaPullsText) friendGachaPullsText.textContent = 'Tiradas: 0 / 90';
      if (friendGachaPity5Text) friendGachaPity5Text.textContent = 'Pity 5★: 0/90';
      if (friendGachaSeed) friendGachaSeed.textContent = 'Semilla: ---';
      if (friendGachaSquadSlots) {
        friendGachaSquadSlots.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 24px; color: var(--text-muted); font-size: 0.8rem;">Tu amigo no ha iniciado sesión de gachapón aún.</div>';
      }
      if (friendGachaHistoryList) {
        friendGachaHistoryList.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 18px; color: var(--text-muted); font-size: 0.78rem;">Sin datos de saltos registrados.</div>';
      }
    }

    // 3. Render Expedition Panel
    if (friendGameState.expedition) {
      const exp = friendGameState.expedition;
      const modeObj = HSR_GAME_MODES.EXPEDITION_MODES[exp.mode];
      if (friendExpModeTitle) friendExpModeTitle.textContent = `Modo: ${modeObj?.name || exp.mode || 'Expedición RNG'}`;
      if (friendExpScoreBadge) friendExpScoreBadge.textContent = `Puntuación: ${exp.totalScore || '0 pts'}`;
      if (friendExpSeed) friendExpSeed.textContent = `Semilla: #${exp.seed || '---'}`;

      if (friendExpSquadSlots) {
        if (exp.team && exp.team.length > 0) {
          friendExpSquadSlots.innerHTML = exp.team.map(c => {
            const charObj = characters.find(ch => String(ch.id) === String(c.id)) || c;
            const imgSrc = charObj.images?.icon_cdn || charObj.images?.icon || c.icon || '';
            const rarity = charObj.rarity || c.rarity || 4;
            return `
              <div class="friend-slot-card rarity-${rarity}">
                <img class="friend-slot-avatar" src="${imgSrc}" alt="${charObj.name || c.name}">
                <div class="friend-slot-name">${charObj.name || c.name}</div>
                <div class="friend-slot-tags">
                  <span class="friend-slot-tag">${charObj.element || c.element || ''}</span>
                  <span class="friend-slot-tag">${charObj.path || c.path || ''}</span>
                </div>
              </div>
            `;
          }).join('');
        } else {
          friendExpSquadSlots.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 18px; color: var(--text-muted); font-size: 0.78rem;">Sin escuadra de partida registrada.</div>';
        }
      }

      if (friendExpCriteriaList) {
        const criteria = currentExpeditionChallenge?.criteria || modeObj?.criteriaPool || [];
        const checkedSet = new Set(exp.checkedCriteria || []);
        if (criteria.length > 0) {
          friendExpCriteriaList.innerHTML = criteria.map(crit => {
            const isDone = checkedSet.has(crit.id);
            return `
              <div class="friend-crit-item ${isDone ? 'checked' : ''}">
                <span>${crit.text}</span>
                <span class="friend-crit-badge ${isDone ? 'done' : 'pending'}">
                  ${isDone ? `✓ Cumplido (+${crit.points} pts)` : `○ Pendiente (${crit.points} pts)`}
                </span>
              </div>
            `;
          }).join('');
        } else {
          friendExpCriteriaList.innerHTML = '<div style="text-align: center; padding: 18px; color: var(--text-muted); font-size: 0.78rem;">Sin objetivos disponibles para este modo.</div>';
        }
      }
    } else {
      if (friendExpModeTitle) friendExpModeTitle.textContent = 'Modo: ---';
      if (friendExpScoreBadge) friendExpScoreBadge.textContent = 'Puntuación: 0 pts';
      if (friendExpSeed) friendExpSeed.textContent = 'Semilla: ---';
      if (friendExpSquadSlots) {
        friendExpSquadSlots.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 24px; color: var(--text-muted); font-size: 0.8rem;">Tu amigo no ha generado ninguna expedición aún.</div>';
      }
      if (friendExpCriteriaList) {
        friendExpCriteriaList.innerHTML = '<div style="text-align: center; padding: 18px; color: var(--text-muted); font-size: 0.78rem;">Sin objetivos registrados.</div>';
      }
    }
  }

  function requestFriendDataRefresh() {
    if (refreshFriendIcon) refreshFriendIcon.classList.add('spinning');
    playUiSound('click');

    const friendName = friendGameState.profile?.username || remotePeerProfile?.username || remoteHostProfile?.username || 'tu amigo';

    if (p2pConn && p2pConn.open) {
      sendP2PMessage('REQUEST_FULL_STATE', {});
      showToast(`✦ Solicitando datos actualizados a ${friendName}...`, 'info');
    } else if (remoteHostProfile) {
      showToast('✦ Refrescando datos locales de la sala compartida...', 'info');
    } else {
      showToast('Sin conexión P2P activa con tu amigo. Conéctate con un código.', 'warn');
    }

    setTimeout(() => {
      if (refreshFriendIcon) refreshFriendIcon.classList.remove('spinning');
      renderFriendInspectUI();
    }, 600);
  }

  function generateP2PRoomCode() {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `HSR-${code}`;
  }

  function getPeerIdFromCode(code) {
    const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    return `hsr-room-${clean.toLowerCase()}`;
  }

  function updateP2PStatusUI(status, label) {
    if (shareModalP2pStatus) {
      shareModalP2pStatus.classList.remove('offline', 'waiting', 'connected');
      shareModalP2pStatus.classList.add(status);
      shareModalP2pStatus.textContent = `● ${label}`;
    }
    if (p2pLiveStatusBadge) {
      p2pLiveStatusBadge.classList.remove('offline', 'waiting', 'connected');
      p2pLiveStatusBadge.classList.add(status);
      p2pLiveStatusBadge.textContent = `● P2P ${label}`;
      p2pLiveStatusBadge.style.display = (status === 'offline' && !remoteHostProfile) ? 'none' : 'inline-flex';
    }
  }

  function sendP2PMessage(type, payload = {}) {
    if (p2pConn && p2pConn.open) {
      try {
        p2pConn.send({ type, ...payload, timestamp: Date.now() });
      } catch (err) {
        console.warn('P2P Message send error:', err);
      }
    }
  }

  function syncStateToGuest() {
    const activeTab = document.querySelector('.nav-tab-btn.active')?.dataset.tab || 'catalog';
    sendP2PMessage('SYNC_STATE', {
      activeTab,
      duel: currentDuelMatch ? {
        mode: currentEndgameMode,
        seed: currentDuelMatch.seed,
        p1Score: p1ScoreInput ? p1ScoreInput.value : ''
      } : null,
      expedition: currentExpeditionChallenge ? {
        mode: currentExpeditionMode,
        seed: currentExpeditionChallenge.seed,
        p1Bonus: p1BonusInput ? p1BonusInput.value : '',
        p1Checked: Array.from(p1CheckedCriteria)
      } : null
    });
  }

  function syncExpeditionCheckboxesUI() {
    if (p1CriteriaList) {
      p1CriteriaList.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        const id = cb.dataset.critId;
        const checked = p1CheckedCriteria.has(id);
        cb.checked = checked;
        cb.closest('.criteria-checkbox-item')?.classList.toggle('checked', checked);
      });
    }
    if (p2CriteriaList) {
      p2CriteriaList.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        const id = cb.dataset.critId;
        const checked = p2CheckedCriteria.has(id);
        cb.checked = checked;
        cb.closest('.criteria-checkbox-item')?.classList.toggle('checked', checked);
      });
    }
  }

  function handleIncomingP2PData(data) {
    if (!data || !data.type) return;

    switch (data.type) {
      case 'HANDSHAKE': {
        remotePeerProfile = data.profile;
        if (data.profile) {
          friendGameState.profile = data.profile;
        }
        if (data.fullState) {
          if (data.fullState.roulette) friendGameState.roulette = data.fullState.roulette;
          if (data.fullState.gacha) friendGameState.gacha = data.fullState.gacha;
          if (data.fullState.expedition) friendGameState.expedition = data.fullState.expedition;
          friendGameState.lastUpdated = new Date();
          renderFriendInspectUI();
        }
        if (p2pRole === 'host') {
          if (duelP2NameDisplay) {
            duelP2NameDisplay.textContent = `P2: ${data.profile?.username || 'Amigo'} (UID: ${data.profile?.uid || '---'})`;
          }
          if (p2ScoreLabel) {
            p2ScoreLabel.textContent = `Resultado de ${data.profile?.username || 'Amigo'}:`;
          }
          if (p2ExpName) {
            p2ExpName.textContent = `${data.profile?.username || 'Amigo'} • UID: ${data.profile?.uid || '---'}`;
          }
          if (p2ExpAvatar && data.profile?.avatar) {
            p2ExpAvatar.src = data.profile.avatar;
            p2ExpAvatar.style.display = 'inline-block';
            if (p2ExpSvg) p2ExpSvg.style.display = 'none';
          }
          syncStateToGuest();
        } else if (p2pRole === 'guest') {
          if (duelP1NameDisplay) {
            duelP1NameDisplay.textContent = `P1: ${data.profile?.username || 'Anfitrión'} (UID: ${data.profile?.uid || '---'})`;
          }
          if (p1ScoreLabel) {
            p1ScoreLabel.textContent = `Resultado de ${data.profile?.username || 'Anfitrión'}:`;
          }
          if (p1ExpName) {
            p1ExpName.textContent = `${data.profile?.username || 'Anfitrión'} (Anfitrión)`;
          }
          if (p1ExpAvatar && data.profile?.avatar) {
            p1ExpAvatar.src = data.profile.avatar;
          }
        }
        showToast(`✦ Conexión en vivo con ${data.profile?.username || 'Jugador'}`, 'success');
        playUiSound('fanfare');
        break;
      }

      case 'SYNC_STATE': {
        if (data.activeTab && pages[data.activeTab]) {
          switchTab(data.activeTab, false);
        }
        if (data.duel) {
          currentEndgameMode = data.duel.mode || currentEndgameMode;
          generateDuel(data.duel.seed);
          if (data.duel.p1Score !== undefined && p1ScoreInput) {
            p1ScoreInput.value = data.duel.p1Score;
          }
        }
        if (data.expedition) {
          currentExpeditionMode = data.expedition.mode || currentExpeditionMode;
          generateExpedition(data.expedition.seed);
          if (data.expedition.p1Bonus !== undefined && p1BonusInput) {
            p1BonusInput.value = data.expedition.p1Bonus;
          }
          if (Array.isArray(data.expedition.p1Checked)) {
            p1CheckedCriteria = new Set(data.expedition.p1Checked);
            syncExpeditionCheckboxesUI();
            updateLiveExpeditionScore();
          }
        }
        break;
      }

      case 'DUEL_SCORE': {
        const targetInput = (p2pRole === 'host') ? p2ScoreInput : p1ScoreInput;
        if (targetInput) {
          targetInput.value = (data.score !== undefined) ? data.score : '';
        }
        break;
      }

      case 'DUEL_CALCULATE': {
        calculateDuelResult(false);
        showToast('✦ Tu amigo ha comparado los resultados del duelo', 'info');
        break;
      }

      case 'NEW_DUEL': {
        if (data.mode) currentEndgameMode = data.mode;
        generateDuel(data.seed);
        showToast('✦ El anfitrión generó un nuevo duelo sincronizado', 'info');
        break;
      }

      case 'EXPEDITION_CHECK': {
        const targetSet = (p2pRole === 'host') ? p2CheckedCriteria : p1CheckedCriteria;
        const targetContainer = (p2pRole === 'host') ? p2CriteriaList : p1CriteriaList;
        if (data.checked) {
          targetSet.add(data.critId);
        } else {
          targetSet.delete(data.critId);
        }
        if (targetContainer) {
          const input = targetContainer.querySelector(`input[data-crit-id="${data.critId}"]`);
          if (input) {
            input.checked = data.checked;
            const label = input.closest('.criteria-checkbox-item');
            if (label) label.classList.toggle('checked', data.checked);
          }
        }
        updateLiveExpeditionScore();
        break;
      }

      case 'EXPEDITION_BONUS': {
        const targetInput = (p2pRole === 'host') ? p2BonusInput : p1BonusInput;
        if (targetInput) {
          targetInput.value = (data.value !== undefined) ? data.value : '';
          updateLiveExpeditionScore();
        }
        break;
      }

      case 'EXPEDITION_CALCULATE': {
        calculateExpeditionResult(false);
        showToast('✦ Tu amigo ha calculado el resultado de la expedición', 'info');
        break;
      }

      case 'NEW_EXPEDITION': {
        if (data.mode) currentExpeditionMode = data.mode;
        generateExpedition(data.seed);
        showToast('✦ El anfitrión generó una nueva expedición sincronizada', 'info');
        break;
      }

      case 'GACHA_PULL': {
        if (data.rarity >= 4) {
          const starStr = '★'.repeat(data.rarity);
          showToast(`✦ [En Vivo] ¡${data.username || 'Tu amigo'} sacó a ${data.name} (${starStr})!`, 'success');
          if (data.rarity === 5) playUiSound('fanfare');
        }
        break;
      }

      case 'REQUEST_FULL_STATE': {
        sendP2PMessage('FULL_STATE_RESPONSE', getFullStatePayload());
        break;
      }

      case 'FULL_STATE_RESPONSE': {
        if (data.profile) friendGameState.profile = data.profile;
        if (data.roulette) friendGameState.roulette = data.roulette;
        if (data.gacha) friendGameState.gacha = data.gacha;
        if (data.expedition) friendGameState.expedition = data.expedition;
        friendGameState.lastUpdated = new Date();
        renderFriendInspectUI();
        if (refreshFriendIcon) refreshFriendIcon.classList.remove('spinning');
        showToast(`✦ Datos sincronizados de ${friendGameState.profile?.username || 'tu amigo'}`, 'success');
        break;
      }

      case 'ROULETTE_SYNC': {
        friendGameState.roulette = {
          team: data.team,
          archetype: data.archetype,
          captain: data.captain,
          seed: data.seed
        };
        friendGameState.lastUpdated = new Date();
        renderFriendInspectUI();
        break;
      }

      case 'GACHA_SYNC': {
        friendGameState.gacha = {
          activeSquad: data.activeSquad,
          history: data.history,
          totalPulls: data.totalPulls,
          pullLimit: data.pullLimit,
          pityCount5: data.pityCount5,
          seed: data.seed
        };
        friendGameState.lastUpdated = new Date();
        renderFriendInspectUI();
        break;
      }

      case 'EXPEDITION_SYNC': {
        friendGameState.expedition = {
          mode: data.mode,
          seed: data.seed,
          team: data.team,
          checkedCriteria: data.checkedCriteria,
          bonus: data.bonus,
          totalScore: data.totalScore
        };
        friendGameState.lastUpdated = new Date();
        renderFriendInspectUI();
        break;
      }
    }
  }

  function setupDataConnection(conn) {
    conn.on('open', () => {
      isP2pConnected = true;
      updateP2PStatusUI('connected', p2pRole === 'host' ? 'En Vivo con Amigo' : 'En Vivo con Anfitrión');
      if (p2pHostStatusText) {
        p2pHostStatusText.textContent = p2pRole === 'host'
          ? '¡Tu amigo se ha conectado a la sala! Sincronizando datos en vivo.'
          : '¡Conectado al anfitrión en vivo!';
      }
      conn.send({
        type: 'HANDSHAKE',
        profile: userProfile,
        role: p2pRole,
        fullState: getFullStatePayload(),
        timestamp: Date.now()
      });
    });

    conn.on('data', (data) => {
      handleIncomingP2PData(data);
    });

    conn.on('close', () => {
      isP2pConnected = false;
      updateP2PStatusUI('offline', 'Desconectado');
      if (p2pHostStatusText) p2pHostStatusText.textContent = 'La conexión P2P se ha cerrado.';
      showToast('✦ Conexión P2P cerrada', 'warn');
    });

    conn.on('error', (err) => {
      console.warn('DataConnection error:', err);
      isP2pConnected = false;
      updateP2PStatusUI('offline', 'Error P2P');
    });
  }

  function initP2PHost(customCode = null) {
    if (typeof Peer === 'undefined') {
      showToast('PeerJS no está disponible en este momento. Revisa tu conexión a internet.', 'warn');
      return;
    }

    if (p2pPeer) {
      try { p2pPeer.destroy(); } catch (e) {}
    }

    const roomCode = customCode || generateP2PRoomCode();
    currentP2pRoomCode = roomCode;
    p2pRole = 'host';

    if (p2pCurrentRoomCode) p2pCurrentRoomCode.textContent = roomCode;
    if (p2pHostStatusText) p2pHostStatusText.textContent = `Sala creada: ${roomCode}. Esperando a que tu amigo se conecte...`;
    updateP2PStatusUI('waiting', 'Esperando Amigo...');

    updateShareModalUrl();
    renderShareSummaryChips();

    const peerId = getPeerIdFromCode(roomCode);
    p2pPeer = new Peer(peerId, { debug: 1 });

    p2pPeer.on('open', (id) => {
      updateP2PStatusUI('waiting', 'Esperando Amigo...');
      showToast(`✦ Sala en vivo creada con código ${roomCode}`, 'info');
      playUiSound('click');
    });

    p2pPeer.on('connection', (conn) => {
      p2pConn = conn;
      setupDataConnection(conn);
    });

    p2pPeer.on('error', (err) => {
      console.warn('PeerJS Host Error:', err);
      if (err.type === 'unavailable-id') {
        const retryCode = generateP2PRoomCode();
        initP2PHost(retryCode);
      } else {
        updateP2PStatusUI('offline', 'Error de Conexión');
        if (p2pHostStatusText) p2pHostStatusText.textContent = 'No se pudo registrar la sala en el servidor de señalización.';
      }
    });
  }

  function joinP2PRoom(code) {
    if (!code) return;
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;

    if (typeof Peer === 'undefined') {
      showToast('PeerJS no está disponible en este momento. Revisa tu conexión a internet.', 'warn');
      return;
    }

    if (p2pPeer) {
      try { p2pPeer.destroy(); } catch (e) {}
    }

    currentP2pRoomCode = cleanCode;
    p2pRole = 'guest';

    if (p2pCurrentRoomCode) p2pCurrentRoomCode.textContent = cleanCode;
    updateP2PStatusUI('waiting', 'Conectando...');
    if (p2pHostStatusText) p2pHostStatusText.textContent = `Conectando con la sala ${cleanCode}...`;

    p2pPeer = new Peer({ debug: 1 });

    p2pPeer.on('open', () => {
      const targetPeerId = getPeerIdFromCode(cleanCode);
      const conn = p2pPeer.connect(targetPeerId, { reliable: true });
      p2pConn = conn;
      setupDataConnection(conn);
    });

    p2pPeer.on('error', (err) => {
      console.warn('PeerJS Guest Error:', err);
      updateP2PStatusUI('offline', 'Fallo al Conectar');
      showToast(`No se pudo conectar a la sala ${cleanCode}. Comprueba que el anfitrión tenga la sala abierta.`, 'warn');
    });
  }

  function disconnectP2P() {
    if (p2pConn) {
      try { p2pConn.close(); } catch (e) {}
      p2pConn = null;
    }
    if (p2pPeer) {
      try { p2pPeer.destroy(); } catch (e) {}
      p2pPeer = null;
    }
    isP2pConnected = false;
    currentP2pRoomCode = null;
    p2pRole = null;
    remoteHostProfile = null;
    remotePeerProfile = null;

    if (sharedRoomBanner) sharedRoomBanner.style.display = 'none';
    if (p2pCurrentRoomCode) p2pCurrentRoomCode.textContent = '---';
    updateP2PStatusUI('offline', 'Desconectado');
    if (p2pHostStatusText) p2pHostStatusText.textContent = 'Pulsa "Generar Sala en Vivo" para obtener un código y permitir que tu amigo se conecte en tiempo real.';

    const activeTab = document.querySelector('.nav-tab-btn.active')?.dataset.tab || 'catalog';
    window.location.hash = `#tab=${activeTab}`;

    updateUserProfileUI();
    showToast('Has salido de la sala compartida. Sesión local restaurada.', 'info');
    playUiSound('click');
  }

  function generateShareUrl() {
    const activeTab = document.querySelector('.nav-tab-btn.active')?.dataset.tab || 'catalog';
    const params = new URLSearchParams();
    params.set('tab', activeTab);

    if (activeTab === 'duel' && currentDuelMatch) {
      params.set('mode', currentEndgameMode);
      params.set('seed', currentDuelMatch.seed);
    } else if (activeTab === 'universe' && currentExpeditionChallenge) {
      params.set('mode', currentExpeditionMode);
      params.set('seed', currentExpeditionChallenge.seed);
    } else if (activeTab === 'roulette' && currentRouletteTeam.length === 4) {
      params.set('team', currentRouletteTeam.map(c => c.id).join(','));
    } else if (activeTab === 'gacha' && currentGachaSession) {
      params.set('banner', currentGachaSession.bannerId);
      params.set('seed', currentGachaSession.seed);
    }

    params.set('host', userProfile.username || 'Trazacaminos');
    params.set('uid', userProfile.uid || '');
    if (userProfile.avatar) {
      params.set('avatar', userProfile.avatar);
    }

    if (currentP2pRoomCode) {
      params.set('room', currentP2pRoomCode);
    }

    return `${window.location.origin}${window.location.pathname}#${params.toString()}`;
  }

  function updateShareModalUrl() {
    const url = generateShareUrl();
    if (shareModalFullUrlInput) {
      shareModalFullUrlInput.value = url;
    }
  }

  function renderShareSummaryChips() {
    if (!shareSummaryChips) return;
    shareSummaryChips.innerHTML = '';
    const activeTab = document.querySelector('.nav-tab-btn.active')?.dataset.tab || 'catalog';

    const chips = [];
    if (activeTab === 'duel') {
      const modeName = HSR_GAME_MODES.ENDGAME_MODES[currentEndgameMode]?.name || 'Caos del Recuerdo';
      chips.push(`✦ Modo: Duelo (${modeName})`);
      if (currentDuelMatch) chips.push(`✦ Semilla: #${currentDuelMatch.seed}`);
    } else if (activeTab === 'universe') {
      const expName = HSR_GAME_MODES.EXPEDITION_MODES[currentExpeditionMode]?.name || 'Universo Diferenciado';
      chips.push(`✦ Modo: Expedición (${expName})`);
      if (currentExpeditionChallenge) chips.push(`✦ Semilla: #${currentExpeditionChallenge.seed}`);
    } else if (activeTab === 'gacha') {
      chips.push(`✦ Modo: Gachapón`);
      if (currentGachaSession) chips.push(`✦ Semilla: #${currentGachaSession.seed}`);
    } else if (activeTab === 'roulette') {
      chips.push(`✦ Modo: Ruleta`);
    } else {
      chips.push(`✦ Modo: Catálogo`);
    }

    chips.push(`✦ Anfitrión: ${userProfile.username || 'Trazacaminos'}`);
    chips.push(`✦ UID: ${userProfile.uid || '---'}`);

    if (currentP2pRoomCode) {
      chips.push(`✦ Sala P2P: ${currentP2pRoomCode}`);
    } else {
      chips.push(`✦ Enlace Hash Estático`);
    }

    shareSummaryChips.innerHTML = chips.map(c => `<span class="share-summary-chip">${c}</span>`).join('');
  }

  function openShareRoomModal() {
    updateUserProfileUI();
    updateShareModalUrl();
    renderShareSummaryChips();

    shareRoomModal.classList.add('open');
    shareRoomModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    playUiSound('click');
  }

  function closeShareRoomModal() {
    shareRoomModal.classList.remove('open');
    shareRoomModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  /* ==========================================================================
     ROSTER / COLLECTION OWNERSHIP MANAGEMENT
     ========================================================================== */
  function saveOwnedRoster() {
    localStorage.setItem('hsr_owned_characters', JSON.stringify(Array.from(ownedCharacterIds)));
    localStorage.setItem('hsr_roster_filter_active', String(isRosterFilterActive));
    updateRosterUI();
  }

  function toggleCharacterOwned(cid) {
    const idStr = String(cid);
    if (ownedCharacterIds.has(idStr)) {
      ownedCharacterIds.delete(idStr);
    } else {
      ownedCharacterIds.add(idStr);
    }
    saveOwnedRoster();
    renderCharacters();
    playUiSound('click');
  }

  function getEffectiveWhitelist() {
    if (!isRosterFilterActive) return null;
    return Array.from(ownedCharacterIds);
  }

  function updateRosterUI() {
    const total = characters.length;
    const ownedCount = ownedCharacterIds.size;

    rosterMasterToggle.checked = isRosterFilterActive;
    rosterIndicatorDot.style.display = isRosterFilterActive ? 'inline-block' : 'none';

    if (isRosterFilterActive) {
      rosterCountStatus.textContent = `Filtro Activo: ${ownedCount} de ${total} personajes disponibles para juegos`;
      rouletteRosterCountText.textContent = `Roster: ${ownedCount}/${total} (Filtro Activo)`;
      catalogRosterStatusText.innerHTML = `Colección: <strong style="color: #6ee7b7;">${ownedCount}/${total} obtenidos</strong> (Filtro Activo)`;
    } else {
      rosterCountStatus.textContent = `Filtro Inactivo: Tienes ${ownedCount} de ${total} marcados en tu colección`;
      rouletteRosterCountText.textContent = `Roster: ${total} disponibles (Todos)`;
      catalogRosterStatusText.innerHTML = `Colección: ${ownedCount}/${total} marcados (Filtro Inactivo)`;
    }
  }

  function renderRosterTiles(searchTerm = '') {
    rosterTilesContainer.innerHTML = '';
    const q = searchTerm.toLowerCase().trim();

    const filtered = characters.filter(c => {
      if (!q) return true;
      return c.name.toLowerCase().includes(q) || c.name_en.toLowerCase().includes(q) || c.element.name.toLowerCase().includes(q);
    });

    const fragment = document.createDocumentFragment();
    filtered.forEach(c => {
      const isOwned = ownedCharacterIds.has(String(c.id));
      const tile = document.createElement('div');
      tile.className = `roster-tile ${isOwned ? 'is-owned selected' : 'not-owned'}`;
      tile.innerHTML = `
        <img class="roster-tile-avatar" src="${c.images.icon_cdn || c.images.icon}" alt="${c.name}" loading="lazy">
        <span class="roster-tile-name" title="${c.name}">${c.name}</span>
        <span class="roster-tile-check">${isOwned ? '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>' : '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>'}</span>
      `;

      tile.addEventListener('click', () => {
        toggleCharacterOwned(c.id);
        const nowOwned = ownedCharacterIds.has(String(c.id));
        tile.className = `roster-tile ${nowOwned ? 'is-owned selected' : 'not-owned'}`;
        tile.querySelector('.roster-tile-check').innerHTML = nowOwned ? '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>' : '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
        updateRosterUI();
      });

      fragment.appendChild(tile);
    });

    rosterTilesContainer.appendChild(fragment);
  }

  function openRosterModal() {
    rosterSearchInput.value = '';
    renderRosterTiles();
    rosterModal.classList.add('open');
    rosterModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    playUiSound('click');
  }

  function closeRosterModal() {
    rosterModal.classList.remove('open');
    rosterModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  /* ==========================================================================
     TOAST NOTIFICATIONS
     ========================================================================== */
    const TOAST_ICONS = {
    success: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>',
    error: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
    warn: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>',
    info: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"/></svg>',
    download: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>',
    upload: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>',
    dice: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"/></svg>'
  };

  function resolveToastIcon(icon) {
    if (!icon) return TOAST_ICONS.info;
    if (typeof icon === 'string' && icon.startsWith('<svg')) return icon;
    if (icon === 'success') return TOAST_ICONS.success;
    if (icon === 'error') return TOAST_ICONS.error;
    if (icon === 'warn') return TOAST_ICONS.warn;
    if (icon === 'download') return TOAST_ICONS.download;
    if (icon === 'upload') return TOAST_ICONS.upload;
    if (icon === '↻' || icon === 'refresh') return TOAST_ICONS.refresh;
    if (icon === 'dice' || icon === 'info') return TOAST_ICONS.dice;
    if (TOAST_ICONS[icon]) return TOAST_ICONS[icon];
    return TOAST_ICONS.info;
  }

  function showToast(message, icon = 'info') {
    const toast = document.createElement('div');
    toast.className = 'fluent-toast';
    const svgIcon = resolveToastIcon(icon);
    toast.innerHTML = `<span class="toast-icon-wrap">${svgIcon}</span><span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 2600);
  }

  function copyToClipboard(text, successMsg = 'Enlace copiado al portapapeles') {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(successMsg, 'success');
        playUiSound('click');
      });
    } else {
      const input = document.createElement('input');
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      showToast(successMsg, 'success');
      playUiSound('click');
    }
  }

  /* ==========================================================================
     THEME & VIEW MANAGEMENT
     ========================================================================== */
  function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('hsr_theme', theme);

    if (theme === 'light') {
      themeIcon.innerHTML = `<path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0z"/>`;
      themeBtnText.textContent = 'Claro';
    } else {
      themeIcon.innerHTML = `<path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-3.03 0-5.5-2.47-5.5-5.5 0-1.82.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>`;
      themeBtnText.textContent = 'Oscuro';
    }
  }

  function setViewMode(mode) {
    currentViewMode = mode;
    localStorage.setItem('hsr_view_mode', mode);

    if (mode === 'table') {
      tableViewSection.style.display = 'block';
      cardsContainer.style.display = 'none';
      viewTableBtn.classList.add('active');
      viewCardsBtn.classList.remove('active');
    } else {
      tableViewSection.style.display = 'none';
      cardsContainer.style.display = 'grid';
      viewTableBtn.classList.remove('active');
      viewCardsBtn.classList.add('active');
    }
  }

  /* ==========================================================================
     CATALOG STATS & DYNAMIC FILTERS
     ========================================================================== */
  function updateStatsBanner() {
    const total = currentCharacters.length;
    const dps = currentCharacters.filter(c => c.role === 'DPS').length;
    const subdps = currentCharacters.filter(c => c.role === 'SUB-DPS').length;
    const support = currentCharacters.filter(c => c.role === 'SUPPORT').length;

    statTotalChars.textContent = total;
    statDpsChars.textContent = dps;
    statSubDpsChars.textContent = subdps;
    statSupportChars.textContent = support;

    document.getElementById('countRoleAll').textContent = total;
    document.getElementById('countRoleDps').textContent = dps;
    document.getElementById('countRoleSubDps').textContent = subdps;
    document.getElementById('countRoleSupport').textContent = support;
  }

  function setupDynamicFilterButtons() {
    const elementFilters = document.getElementById('elementFilters');
    const pathFilters = document.getElementById('pathFilters');

    const elementsMap = new Map();
    const pathsMap = new Map();

    currentCharacters.forEach(c => {
      if (c.element && !elementsMap.has(c.element.id)) elementsMap.set(c.element.id, c.element);
      if (c.path && !pathsMap.has(c.path.id)) pathsMap.set(c.path.id, c.path);
    });

    elementsMap.forEach(el => {
      const btn = document.createElement('button');
      btn.className = 'filter-chip';
      btn.dataset.filterElem = el.name;
      btn.innerHTML = `<img src="${el.icon_cdn || el.icon}" alt="${el.name}"><span>${el.name}</span>`;
      elementFilters.appendChild(btn);
    });

    pathsMap.forEach(p => {
      const btn = document.createElement('button');
      btn.className = 'filter-chip';
      btn.dataset.filterPath = p.name;
      btn.innerHTML = `<img src="${p.icon_cdn || p.icon}" alt="${p.name}"><span>${p.name}</span>`;
      pathFilters.appendChild(btn);
    });
  }

  function populateCaptainSelect() {
    rouletteCaptainSelect.innerHTML = '<option value="">Aleatorio (Sin fijar)</option>';
    const sorted = [...characters].sort((a, b) => a.name.localeCompare(b.name));
    sorted.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${c.name} (${c.element.name} - ${c.role})`;
      rouletteCaptainSelect.appendChild(opt);
    });
  }

  /* ==========================================================================
     CATALOG RENDERING
     ========================================================================== */
  function getFilteredCharacters() {
    return currentCharacters.filter(c => {
      if (filterState.search) {
        const q = filterState.search.toLowerCase();
        const matchName = c.name.toLowerCase().includes(q) || c.name_en.toLowerCase().includes(q);
        const matchElem = c.element.name.toLowerCase().includes(q);
        const matchPath = c.path.name.toLowerCase().includes(q);
        const matchRole = c.role.toLowerCase().includes(q) || (c.sub_role && c.sub_role.toLowerCase().includes(q));
        const matchSpecialty = c.specialty && c.specialty.toLowerCase().includes(q);
        if (!matchName && !matchElem && !matchPath && !matchRole && !matchSpecialty) return false;
      }

      if (filterState.role !== 'ALL' && c.role !== filterState.role) return false;
      if (filterState.element !== 'ALL' && c.element.name !== filterState.element) return false;
      if (filterState.path !== 'ALL' && c.path.name !== filterState.path) return false;
      if (filterState.rarity !== 'ALL' && String(c.rarity) !== filterState.rarity) return false;

      return true;
    }).sort((a, b) => {
      let valA, valB;
      switch (sortState.column) {
        case 'name':
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
          return sortState.ascending ? valA.localeCompare(valB) : valB.localeCompare(valA);
        case 'rarity':
          return sortState.ascending ? a.rarity - b.rarity : b.rarity - a.rarity;
        case 'element':
          valA = a.element.name;
          valB = b.element.name;
          return sortState.ascending ? valA.localeCompare(valB) : valB.localeCompare(valA);
        case 'path':
          valA = a.path.name;
          valB = b.path.name;
          return sortState.ascending ? valA.localeCompare(valB) : valB.localeCompare(valA);
        case 'role':
          valA = a.role;
          valB = b.role;
          return sortState.ascending ? valA.localeCompare(valB) : valB.localeCompare(valA);
        default:
          return 0;
      }
    });
  }

  function getRoleBadgeClass(role) {
    if (role === 'DPS') return 'role-dps';
    if (role === 'SUB-DPS') return 'role-sub-dps';
    return 'role-support';
  }

  function getRoleIcon(role) {
    if (role === 'DPS') return '◆';
    if (role === 'SUB-DPS') return '◇';
    return '✦';
  }

  function renderCharacters() {
    const list = getFilteredCharacters();
    const total = currentCharacters.length;

    resultsCounterText.textContent = `Mostrando ${list.length} de ${total} personajes`;
    const isFilterActive = filterState.search || filterState.role !== 'ALL' || filterState.element !== 'ALL' || filterState.path !== 'ALL' || filterState.rarity !== 'ALL';
    clearAllFiltersBtn.style.display = isFilterActive ? 'inline-block' : 'none';

    if (pages.catalog.style.display !== 'none') {
      updateBreadcrumb('Catálogo Oficial', `Mostrando ${list.length} de ${total} personajes`);
    }

    if (list.length === 0) {
      tableViewSection.style.display = 'none';
      cardsContainer.style.display = 'none';
      noResultsState.style.display = 'flex';
      return;
    }

    noResultsState.style.display = 'none';
    if (currentViewMode === 'table') {
      tableViewSection.style.display = 'block';
      cardsContainer.style.display = 'none';
    } else {
      tableViewSection.style.display = 'none';
      cardsContainer.style.display = 'grid';
    }

    // Render Table
    tableBody.innerHTML = '';
    const tableFragment = document.createDocumentFragment();
    list.forEach(c => {
      const tr = document.createElement('tr');
      const isOwned = ownedCharacterIds.has(String(c.id));

      const avatarSrc = c.images.icon_cdn || c.images.icon;
      const elemIconSrc = c.element.icon_cdn || c.element.icon;
      const pathIconSrc = c.path.icon_cdn || c.path.icon;
      const roleClass = getRoleBadgeClass(c.role);
      const roleIcon = getRoleIcon(c.role);
      const rarityStars = '✦'.repeat(c.rarity);

      tr.innerHTML = `
        <td>
          <div class="character-cell">
            <div class="char-avatar-box rarity-${c.rarity}">
              <img src="${avatarSrc}" alt="${c.name}" loading="lazy">
            </div>
            <div class="char-meta-name">
              <span class="char-name-es">${c.name}</span>
              <span class="char-name-en">${c.name_en}</span>
            </div>
          </div>
        </td>
        <td><span class="rarity-pill rarity-${c.rarity}">${rarityStars}</span></td>
        <td>
          <span class="elem-badge" style="border-color: ${c.element.color}40; color: ${c.element.color};">
            <img src="${elemIconSrc}" alt="${c.element.name}">
            ${c.element.name}
          </span>
        </td>
        <td>
          <span class="path-badge">
            <img src="${pathIconSrc}" alt="${c.path.name}">
            ${c.path.name}
          </span>
        </td>
        <td>
          <div style="display: flex; flex-direction: column; align-items: flex-start;">
            <span class="role-badge ${roleClass}">
              <span>${roleIcon}</span>
              <span>${c.role}</span>
            </span>
            <span class="subrole-pill">${c.sub_role || 'Combatiente'}</span>
          </div>
        </td>
        <td><div class="specialty-cell">${c.specialty || ''}</div></td>
        <td style="text-align: right;">
          <div style="display: inline-flex; align-items: center; gap: 6px;">
            <button class="btn-own-toggle ${isOwned ? 'is-owned' : ''}" data-own-id="${c.id}" title="${isOwned ? 'Marcado como obtenido en tu cuenta' : 'No obtenido'}">
              ${isOwned ? 'Obtenido' : '+ Añadir'}
            </button>
            <button class="btn-fluent" style="padding: 4px 8px; font-size: 0.74rem;" title="Ver ficha">
              Ficha
            </button>
          </div>
        </td>
      `;

      tr.addEventListener('click', (e) => {
        if (e.target.closest('.btn-own-toggle')) {
          e.stopPropagation();
          toggleCharacterOwned(c.id);
          const btn = tr.querySelector('.btn-own-toggle');
          const nowOwned = ownedCharacterIds.has(String(c.id));
          btn.className = `btn-own-toggle ${nowOwned ? 'is-owned' : ''}`;
          btn.textContent = nowOwned ? 'Obtenido' : '+ Añadir';
          showToast(`${c.name}: ${nowOwned ? 'marcado como obtenido' : 'marcado como no obtenido'}`, nowOwned ? 'success' : 'error');
          return;
        }
        openCharacterModal(c);
      });

      tableFragment.appendChild(tr);
    });
    tableBody.appendChild(tableFragment);

    // Render Cards
    cardsContainer.innerHTML = '';
    const cardsFragment = document.createDocumentFragment();
    list.forEach(c => {
      const isOwned = ownedCharacterIds.has(String(c.id));
      const card = document.createElement('div');
      card.className = `character-card char-card rarity-${c.rarity} ${isOwned ? 'is-owned' : ''}`;

      const previewSrc = c.images.preview_cdn || c.images.preview || c.images.icon;
      const elemIconSrc = c.element.icon_cdn || c.element.icon;
      const pathIconSrc = c.path.icon_cdn || c.path.icon;
      const roleClass = getRoleBadgeClass(c.role);
      const roleIcon = getRoleIcon(c.role);
      const rarityStars = '✦'.repeat(c.rarity);

      card.innerHTML = `
        <div class="card-top-badges">
          <span class="rarity-pill rarity-${c.rarity}">${rarityStars}</span>
          <button class="btn-own-toggle ${isOwned ? 'is-owned' : ''}" data-own-id="${c.id}" title="${isOwned ? 'Marcado como obtenido' : 'No obtenido'}">
            ${isOwned ? 'Obtenido' : '+ Añadir'}
          </button>
        </div>
        <div class="card-art-wrap">
          <div class="card-ambient-glow" style="background: ${c.element.color};"></div>
          <img class="card-portrait" src="${previewSrc}" alt="${c.name}" onerror="this.src='${c.images.icon_cdn || c.images.icon}'" loading="lazy">
        </div>
        <div class="card-body">
          <div class="card-name-title">${c.name}</div>
          <div class="card-meta-tags">
            <span class="elem-badge" style="border-color: ${c.element.color}40; color: ${c.element.color};">
              <img src="${elemIconSrc}" alt="${c.element.name}">
              ${c.element.name}
            </span>
            <span class="path-badge">
              <img src="${pathIconSrc}" alt="${c.path.name}">
              ${c.path.name}
            </span>
          </div>
          <p class="card-specialty">${c.specialty || ''}</p>
          <div class="card-footer">
            <span class="role-badge ${roleClass}">
              <span>${roleIcon}</span> ${c.role}
            </span>
            <span style="font-size: 0.72rem; color: var(--text-muted);">${c.sub_role || ''}</span>
          </div>
        </div>
      `;

      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-own-toggle')) {
          e.stopPropagation();
          toggleCharacterOwned(c.id);
          const btn = card.querySelector('.btn-own-toggle');
          const nowOwned = ownedCharacterIds.has(String(c.id));
          btn.className = `btn-own-toggle ${nowOwned ? 'is-owned' : ''}`;
          btn.textContent = nowOwned ? 'Obtenido' : '+ Añadir';
          showToast(`${c.name}: ${nowOwned ? 'en colección' : 'excluido'}`, nowOwned ? 'success' : 'error');
          return;
        }
        openCharacterModal(c);
      });

      cardsFragment.appendChild(card);
    });
    cardsContainer.appendChild(cardsFragment);
  }

  /* ==========================================================================
     GAME MODE 1: RULETA CON ANIMACIÓN TÁCTIL DE SLOTS (ROLLING REELS)
     ========================================================================== */
  function rerollSingleSlot(index) {
    if (isSpinning) return;
    if (!currentRouletteTeam || currentRouletteTeam.length < 4) return;

    const onlyFour = rouletteOnlyFourStars.checked;
    const effectiveWhitelist = getEffectiveWhitelist();
    const currentIds = new Set(currentRouletteTeam.map((c, i) => i !== index ? String(c.id) : null).filter(Boolean));

    const available = characters.filter(ch => {
      if (currentIds.has(String(ch.id))) return false;
      if (effectiveWhitelist && !effectiveWhitelist.has(String(ch.id))) return false;
      if (onlyFour && ch.rarity !== 4) return false;
      return true;
    });

    if (available.length === 0) {
      showToast('No hay más combatientes disponibles según tus filtros', 'warn');
      return;
    }

    const randChar = available[Math.floor(Math.random() * available.length)];
    currentRouletteTeam[index] = randChar;
    playUiSound('tick');
    renderTeamSlots(currentRouletteTeam, teamSlotsContainer, false);
    showToast(`Posición ${index + 1} actualizada: ${randChar.name}`, 'dice');
    broadcastRouletteState();
  }

  function spinRoulette(seed = null, animate = true) {
    if (isSpinning) return;

    const onlyFour = rouletteOnlyFourStars.checked;
    const captainId = rouletteCaptainSelect.value || null;
    const effectiveWhitelist = getEffectiveWhitelist();

    let targetTeam = [];
    let archetypeLabel = '';

    if (currentRouletteMode === 'coherent') {
      targetTeam = HSR_GAME_MODES.generateCoherentTeam({
        onlyFourStars: onlyFour,
        lockedCaptainId: captainId,
        whitelist: effectiveWhitelist,
        seed: seed
      });
      archetypeLabel = isRosterFilterActive ? 'Composición Coherente (Filtro Activo)' : 'Composición Equilibrada (1 DPS + 1 Sub/Buffer + 1 Support + 1 Sustain)';
    } else if (currentRouletteMode === 'thematic') {
      const thematicResult = HSR_GAME_MODES.generateThematicTeam({
        seed: seed,
        whitelist: effectiveWhitelist
      });
      archetypeLabel = `Arquetipo: ${thematicResult.name}`;
      targetTeam = thematicResult.team;
    } else {
      targetTeam = HSR_GAME_MODES.generateChaosTeam({
        onlyFourStars: onlyFour,
        whitelist: effectiveWhitelist,
        seed: seed
      });
      archetypeLabel = 'Modo Caos (100% Aleatorio)';
    }

    // Preserve locked slots from previous team
    if (lockedRouletteSlots.size > 0 && currentRouletteTeam.length === 4) {
      const lockedIds = new Set();
      lockedRouletteSlots.forEach(idx => {
        if (currentRouletteTeam[idx]) {
          targetTeam[idx] = currentRouletteTeam[idx];
          lockedIds.add(String(currentRouletteTeam[idx].id));
        }
      });

      // Avoid duplicates for unlocked slots
      targetTeam.forEach((ch, idx) => {
        if (!lockedRouletteSlots.has(idx) && lockedIds.has(String(ch.id))) {
          const available = characters.filter(c =>
            !lockedIds.has(String(c.id)) &&
            !targetTeam.some((t, i) => i !== idx && String(t?.id) === String(c.id)) &&
            (!effectiveWhitelist || effectiveWhitelist.has(String(c.id))) &&
            (!onlyFour || c.rarity === 4)
          );
          if (available.length > 0) {
            targetTeam[idx] = available[Math.floor(Math.random() * available.length)];
          }
        }
      });
    }

    currentRouletteTeam = targetTeam;
    rouletteArchetypeBadge.textContent = archetypeLabel;
    updateBreadcrumb('Ruleta de Equipos', archetypeLabel);

    if (!animate) {
      renderTeamSlots(currentRouletteTeam, teamSlotsContainer);
      broadcastRouletteState();
      return;
    }

    // Tactile slot roll animation with audio ticking
    isSpinning = true;
    spinBtnText.textContent = 'CALCULANDO...';
    spinRouletteBtn.style.opacity = '0.7';

    renderTeamSlotsPlaceholders(teamSlotsContainer);

    let rollTicks = 0;
    const rollInterval = setInterval(() => {
      rollTicks++;
      playUiSound('tick');

      const slotCards = teamSlotsContainer.querySelectorAll('.team-slot-card');
      slotCards.forEach((card, idx) => {
        if (lockedRouletteSlots.has(idx)) return; // Do not shuffle locked slot
        const randChar = characters[Math.floor(Math.random() * characters.length)];
        const img = card.querySelector('.slot-avatar, img');
        const nameEl = card.querySelector('.slot-char-name');
        if (img) img.src = randChar.images.icon_cdn || randChar.images.icon;
        if (nameEl) nameEl.textContent = randChar.name;
      });

      if (rollTicks > 6) {
        clearInterval(rollInterval);
        renderTeamSlots(currentRouletteTeam, teamSlotsContainer, true);
        isSpinning = false;
        spinBtnText.textContent = 'EJECUTAR SALTO';
        spinRouletteBtn.style.opacity = '1';
        playUiSound('fanfare');
        showToast('¡Escuadra generada exitosamente!', 'dice');
        broadcastRouletteState();
      }
    }, 85);
  }

  function renderTeamSlotsPlaceholders(container) {
    container.innerHTML = '';
    for (let i = 0; i < 4; i++) {
      const placeholder = document.createElement('div');
      const isLocked = lockedRouletteSlots.has(i) && currentRouletteTeam[i];

      if (isLocked) {
        const lockedChar = currentRouletteTeam[i];
        placeholder.className = 'team-slot-card is-locked-card';
        placeholder.innerHTML = `
          <span class="slot-role-tag role-badge ${getRoleBadgeClass(lockedChar.role)}">
            <span>✦</span> Posición ${i + 1} (Fijado)
          </span>
          <div class="slot-visual-wrap">
            <img class="slot-avatar" src="${lockedChar.images.icon_cdn || lockedChar.images.icon}" alt="${lockedChar.name}">
          </div>
          <h4 class="slot-char-name">${lockedChar.name}</h4>
          <div style="font-size: 0.72rem; color: var(--accent-light);">Fijado en escuadra</div>
        `;
      } else {
        placeholder.className = 'team-slot-card is-rolling';
        placeholder.innerHTML = `
          <span class="slot-role-tag role-badge" style="background: rgba(45,212,191,0.06); color: var(--text-muted);">
            Posición ${i + 1}
          </span>
          <div class="slot-visual-wrap">
            <img class="slot-avatar" src="https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/icon/character/1001.png" alt="Rolling">
          </div>
          <h4 class="slot-char-name">Sintonizando...</h4>
          <div style="font-size: 0.72rem; color: var(--text-muted);">Calculando sinergia</div>
        `;
      }
      container.appendChild(placeholder);
    }
  }

  function loadTeamFromIds(idArray) {
    const loaded = idArray.map(id => HSR_GAME_MODES.getCharacterById(id)).filter(Boolean);
    if (loaded.length === 4) {
      currentRouletteTeam = loaded;
      rouletteArchetypeBadge.textContent = 'Equipo Cargado desde Enlace Compartido';
      renderTeamSlots(currentRouletteTeam, teamSlotsContainer);
      showToast('Equipo cargado exitosamente desde el enlace', 'info');
      playUiSound('fanfare');
      broadcastRouletteState();
    }
  }

  function renderTeamSlots(team, container, staggered = false) {
    container.innerHTML = '';
    const fragment = document.createDocumentFragment();

    team.forEach((c, index) => {
      const isLocked = lockedRouletteSlots.has(index);
      const slot = document.createElement('div');
      slot.className = `team-slot-card ${isLocked ? 'is-locked-card' : ''} ${staggered ? 'card-revealed' : ''}`;
      if (staggered) {
        slot.style.animationDelay = `${index * 0.1}s`;
      }

      // Card click opens character detail modal (when not clicking controls)
      slot.addEventListener('click', (e) => {
        if (e.target.closest('.slot-controls') || e.target.closest('.slot-btn')) return;
        openCharacterModal(c);
      });

      const iconSrc = c.images.icon_cdn || c.images.icon || c.images.preview_cdn || c.images.preview;
      const elemIconSrc = c.element.icon_cdn || c.element.icon;
      const pathIconSrc = c.path.icon_cdn || c.path.icon;
      const roleClass = getRoleBadgeClass(c.role);
      const roleIcon = getRoleIcon(c.role);
      const rarityStars = '✦'.repeat(c.rarity);

      slot.innerHTML = `
        <span class="slot-role-tag role-badge ${roleClass}">
          <span>${roleIcon}</span> Posición ${index + 1}: ${c.role}
        </span>
        <div class="slot-visual-wrap">
          <div class="slot-glow-ring" style="background: ${c.element.color};"></div>
          <img class="slot-avatar" src="${iconSrc}" alt="${c.name}">
        </div>
        <h4 class="slot-char-name">${c.name}</h4>
        <div class="slot-badges-row">
          <span class="rarity-pill rarity-${c.rarity}">${rarityStars}</span>
          <span class="elem-badge" style="border-color: ${c.element.color}40; color: ${c.element.color};">
            <img src="${elemIconSrc}" alt="${c.element.name}">
            ${c.element.name}
          </span>
          <span class="path-badge">
            <img src="${pathIconSrc}" alt="${c.path.name}">
            ${c.path.name}
          </span>
        </div>
        <p class="slot-specialty-text">${c.specialty || ''}</p>
        <div class="slot-controls">
          <button type="button" class="slot-btn slot-lock-btn ${isLocked ? 'is-locked' : ''}" title="${isLocked ? 'Desbloquear ranura' : 'Fijar personaje en la ranura'}">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
              ${isLocked 
                ? '<path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>'
                : '<path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h1.9c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10z"/>'
              }
            </svg>
            <span>${isLocked ? 'Fijado ✦' : 'Fijar'}</span>
          </button>
          <button type="button" class="slot-btn slot-reroll-btn" title="Re-tirar solo esta ranura">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
            <span>Re-tirar</span>
          </button>
          <button type="button" class="slot-btn slot-inspect-btn" title="Ver ficha técnica">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
            <span>Ficha</span>
          </button>
        </div>
      `;

      // Controls handlers
      const lockBtn = slot.querySelector('.slot-lock-btn');
      lockBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (lockedRouletteSlots.has(index)) {
          lockedRouletteSlots.delete(index);
          showToast(`Posición ${index + 1} (${c.name}): liberada`, 'info');
        } else {
          lockedRouletteSlots.add(index);
          showToast(`Posición ${index + 1} (${c.name}): fijada`, 'success');
        }
        playUiSound('click');
        renderTeamSlots(currentRouletteTeam, container, false);
      });

      const rerollBtn = slot.querySelector('.slot-reroll-btn');
      rerollBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        rerollSingleSlot(index);
      });

      const inspectBtn = slot.querySelector('.slot-inspect-btn');
      inspectBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openCharacterModal(c);
      });

      fragment.appendChild(slot);
    });

    container.appendChild(fragment);
  }

  /* ==========================================================================
     GAME MODE 2: ARENA DUELO ENDGAME 1V1 (MoC, PF, AS - DOBLE NODO)
     ========================================================================== */
  function updateEndgameLabels() {
    if (currentEndgameMode === 'moc') {
      p1ScoreLabel.textContent = 'Tus Ciclos consumidos:';
      p1ScoreInput.placeholder = 'Ej. 4 ciclos';
      p2ScoreLabel.textContent = 'Ciclos consumidos por tu amigo:';
      p2ScoreInput.placeholder = 'Ej. 6 ciclos';
    } else if (currentEndgameMode === 'pure_fiction') {
      p1ScoreLabel.textContent = 'Tus Puntos obtenidos (Max 80k):';
      p1ScoreInput.placeholder = 'Ej. 65000 pts';
      p2ScoreLabel.textContent = 'Puntos obtenidos por tu amigo:';
      p2ScoreInput.placeholder = 'Ej. 60000 pts';
    } else {
      p1ScoreLabel.textContent = 'Tus Puntos de acción:';
      p1ScoreInput.placeholder = 'Ej. 6800 pts';
      p2ScoreLabel.textContent = 'Puntos de tu amigo:';
      p2ScoreInput.placeholder = 'Ej. 6400 pts';
    }
  }

  function renderEndgameSeasonPills() {
    if (!endgameSeasonPills) return;
    const seasons = (HSR_GAME_MODES.SEASONAL_ROTATIONS && HSR_GAME_MODES.SEASONAL_ROTATIONS[currentEndgameMode]) || [];
    let html = '';

    const isRandomActive = !currentDuelSeasonId;
    html += `<button class="roulette-pill-btn ${isRandomActive ? 'active' : ''}" data-season-id="">✦ Rotación Aleatoria</button>`;

    seasons.forEach((s) => {
      const shortName = s.name.replace('Temporada Actual: ', 'Actual: ').replace('Temporada: ', '');
      const isActive = currentDuelSeasonId === s.id;
      html += `<button class="roulette-pill-btn ${isActive ? 'active' : ''}" data-season-id="${s.id}">${shortName}</button>`;
    });

    endgameSeasonPills.innerHTML = html;

    endgameSeasonPills.querySelectorAll('.roulette-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        endgameSeasonPills.querySelectorAll('.roulette-pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentDuelSeasonId = btn.dataset.seasonId || null;
        playUiSound('click');
        generateDuel(null, currentDuelSeasonId);
      });
    });
  }

  function generateDuel(seed = null, seasonId = null) {
    const effectiveWhitelist = getEffectiveWhitelist();
    const activeSeasonId = (seasonId !== undefined && seasonId !== null) ? seasonId : currentDuelSeasonId;
    currentDuelMatch = HSR_GAME_MODES.generateEndgameMatch(currentEndgameMode, seed, {
      whitelist: effectiveWhitelist,
      seasonId: activeSeasonId
    });

    const mode = currentDuelMatch.mode;
    const turb = currentDuelMatch.turbulence;
    const b1 = currentDuelMatch.bossNode1;
    const b2 = currentDuelMatch.bossNode2;
    const seasonTag = currentDuelMatch.season ? currentDuelMatch.season.name : `${mode.name} • Rotación Procedimental`;

    updateBreadcrumb('Duelo Endgame 1v1', `${seasonTag} • Semilla #${currentDuelMatch.seed}`);
    updateEndgameLabels();

    // Render Stage Card
    const renderWeaknesses = (list) => list.map(w =>
      `<img src="https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/icon/element/${w}.png" style="width: 17px; height: 17px; vertical-align: middle;" title="Debilidad: ${w}">`
    ).join(' ');

    endgameStageContainer.innerHTML = `
      <div class="endgame-stage-header">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <h2 style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary);">${mode.name}</h2>
            <span class="brand-badge">${mode.abbr}</span>
            <span class="brand-badge" style="background: rgba(13, 148, 136, 0.15); color: #2dd4bf; border-color: rgba(45, 212, 191, 0.3); font-size: 0.72rem;">${currentDuelMatch.season?.name || 'Rotación Procedimental'}</span>
          </div>
          <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px;">
            ${mode.targetMetric} • Semilla: <span style="color: var(--accent-fluent); font-family: monospace;">#${currentDuelMatch.seed}</span>
          </p>
        </div>
        <div class="restriction-item" style="font-size: 0.76rem;">
          ${currentDuelMatch.restriction}
        </div>
      </div>

      <div class="endgame-turbulence-box">
        <strong style="color: var(--accent-fluent);">${turb.name}:</strong> ${turb.effect}
      </div>

      <div class="endgame-bosses-row">
        <div class="endgame-boss-mini-card">
          <img class="endgame-boss-icon" src="${b1.icon}" alt="${b1.name}" width="36" height="36">
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <strong style="font-size: 0.84rem;">Nodo 1: ${b1.name}</strong>
              <span style="font-size: 0.7rem; color: var(--text-muted);">${b1.difficulty}</span>
            </div>
            <div style="font-size: 0.72rem; color: var(--text-secondary); margin-top: 2px;">
              Debilidades: ${renderWeaknesses(b1.weaknesses)}
            </div>
            <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 2px; line-height: 1.3;">
              ${b1.gimmick}
            </div>
          </div>
        </div>

        <div class="endgame-boss-mini-card">
          <img class="endgame-boss-icon" src="${b2.icon}" alt="${b2.name}" width="36" height="36">
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <strong style="font-size: 0.84rem;">Nodo 2: ${b2.name}</strong>
              <span style="font-size: 0.7rem; color: var(--text-muted);">${b2.difficulty}</span>
            </div>
            <div style="font-size: 0.72rem; color: var(--text-secondary); margin-top: 2px;">
              Debilidades: ${renderWeaknesses(b2.weaknesses)}
            </div>
            <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 2px; line-height: 1.3;">
              ${b2.gimmick}
            </div>
          </div>
        </div>
      </div>
    `;

    // Render Double-Node teams for P1 and P2
    renderMiniRoster(currentDuelMatch.player1.node1, p1Node1Grid);
    renderMiniRoster(currentDuelMatch.player1.node2, p1Node2Grid);

    renderMiniRoster(currentDuelMatch.player2.node1, p2Node1Grid);
    renderMiniRoster(currentDuelMatch.player2.node2, p2Node2Grid);

    // Reset scores & victory banner
    p1ScoreInput.value = '';
    p2ScoreInput.value = '';
    duelResultBanner.style.display = 'none';
  }

  function renderMiniRoster(team, container) {
    container.innerHTML = '';
    const fragment = document.createDocumentFragment();

    team.forEach(c => {
      const item = document.createElement('div');
      item.className = 'duel-char-mini-card';
      item.addEventListener('click', () => openCharacterModal(c));

      const avatarSrc = c.images.icon_cdn || c.images.icon;
      const roleClass = getRoleBadgeClass(c.role);
      const roleIcon = getRoleIcon(c.role);

      item.innerHTML = `
        <img class="duel-char-mini-avatar" src="${avatarSrc}" alt="${c.name}" width="36" height="36" loading="lazy">
        <span class="duel-char-mini-name">${c.name}</span>
        <div style="display: flex; align-items: center; gap: 4px; justify-content: center; flex-wrap: wrap;">
          <span class="role-badge ${roleClass}">${roleIcon} ${c.role}</span>
          <span style="color: ${c.element.color}; font-size: 0.65rem; font-weight: 600;">${c.element.name}</span>
        </div>
      `;

      fragment.appendChild(item);
    });

    container.appendChild(fragment);
  }

  function calculateDuelResult(sendP2p = true) {
    const val1 = p1ScoreInput.value.trim();
    const val2 = p2ScoreInput.value.trim();

    if (val1 === '' || val2 === '') {
      showToast('Introduce los resultados de ambos jugadores para calcular la victoria', 'warn');
      playUiSound('click');
      return;
    }

    const p1Score = Number(val1);
    const p2Score = Number(val2);

    if (isNaN(p1Score) || isNaN(p2Score)) {
      showToast('Por favor introduce números válidos para los resultados', 'warn');
      return;
    }

    if (sendP2p) {
      sendP2PMessage('DUEL_CALCULATE', {});
    }

    const outcome = HSR_GAME_MODES.calculateWinner(currentEndgameMode, p1Score, p2Score);
    if (!outcome) return;

    const p1Name = remoteHostProfile
      ? `${remoteHostProfile.username} (Anfitrión)`
      : (userProfile.username || 'Jugador 1');
    const p2Name = remoteHostProfile
      ? `${userProfile.username || 'Trazacaminos'} (Tú)`
      : (remotePeerProfile ? `${remotePeerProfile.username} (Amigo)` : 'Jugador 2 (Amigo)');

    let titleText = '';
    let subText = '';
    let winnerColor = 'var(--accent-color, #60cdff)';

    if (outcome.winner === 'player1') {
      titleText = `¡Victoria para ${p1Name}!`;
      subText = currentEndgameMode === 'moc'
        ? `${p1Name} completó el desafío en ${p1Score} ciclos vs ${p2Score} ciclos de ${p2Name} (${outcome.diff} ${outcome.unit}).`
        : `${p1Name} logró ${p1Score.toLocaleString()} pts vs ${p2Score.toLocaleString()} pts de ${p2Name} (${outcome.diff.toLocaleString()} ${outcome.unit}).`;
      winnerColor = 'var(--accent-color, #60cdff)';
    } else if (outcome.winner === 'player2') {
      titleText = `¡Victoria para ${p2Name}!`;
      subText = currentEndgameMode === 'moc'
        ? `${p2Name} completó el desafío en ${p2Score} ciclos vs ${p1Score} ciclos de ${p1Name} (${outcome.diff} ${outcome.unit}).`
        : `${p2Name} logró ${p2Score.toLocaleString()} pts vs ${p1Score.toLocaleString()} pts de ${p1Name} (${outcome.diff.toLocaleString()} ${outcome.unit}).`;
      winnerColor = '#f87171';
    } else {
      titleText = `¡Empate Técnico!`;
      subText = `Ambos jugadores obtuvieron exactamente el mismo resultado (${p1Score} ${currentEndgameMode === 'moc' ? 'ciclos' : 'pts'}).`;
      winnerColor = '#eab308';
    }

    duelResultBanner.innerHTML = `
      <div style="display: flex; align-items: center; gap: 14px;">
        <div class="duel-victory-icon-wrap">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="${winnerColor}">
            <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0 0 11 15.9V19H7v2h10v-2h-4v-3.1a5.01 5.01 0 0 0 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/>
          </svg>
        </div>
        <div>
          <h3 style="font-size: 1.1rem; font-weight: 700; color: ${winnerColor};">${titleText}</h3>
          <p style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 2px;">${subText}</p>
        </div>
      </div>
      <button id="copyVictoryResultBtn" class="btn-fluent" style="font-size: 0.78rem; padding: 6px 14px;">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
        <span>Copiar Resultado</span>
      </button>
    `;

    duelResultBanner.style.display = 'flex';
    playUiSound('fanfare');

    document.getElementById('copyVictoryResultBtn').addEventListener('click', () => {
      const summaryText = `[HSR Duelo 1v1 - ${HSR_GAME_MODES.ENDGAME_MODES[currentEndgameMode].abbr}]\n${titleText}\n${subText}\nSemilla: #${currentDuelMatch.seed}`;
      copyToClipboard(summaryText, 'Resultado copiado al portapapeles');
    });
  }

  /* ==========================================================================
     GAME MODE 3: EXPEDICIONES RNG (UNIVERSO DIFERENCIADO, GUERRA DE DIVISAS, LA PLAGA)
     ========================================================================== */
  function generateExpedition(seed = null) {
    const effectiveWhitelist = getEffectiveWhitelist();
    currentExpeditionChallenge = HSR_GAME_MODES.generateExpeditionChallenge(currentExpeditionMode, seed, { whitelist: effectiveWhitelist });

    if (univSeedDisplay) {
      univSeedDisplay.textContent = `#${currentExpeditionChallenge.seed}`;
    }

    updateBreadcrumb('Expediciones RNG', `${currentExpeditionChallenge.mode.name} • #${currentExpeditionChallenge.seed}`);

    // Render Compact Expedition Overview Card
    universeChallengeContainer.innerHTML = `
      <div class="expedition-header-row">
        <div class="expedition-title-block">
          <div class="expedition-icon-wrap">
            <img class="expedition-mode-path-icon" src="${currentExpeditionChallenge.mode.icon}" alt="${currentExpeditionChallenge.mode.name}" width="24" height="24">
          </div>
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <h2 style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary);">${currentExpeditionChallenge.mode.name}</h2>
              <span class="brand-badge">${currentExpeditionChallenge.mode.tag}</span>
            </div>
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px;">
              ${currentExpeditionChallenge.mode.subtitle} • Nivel: <strong style="color: var(--accent-color, #60cdff);">${currentExpeditionChallenge.level}</strong>
            </p>
          </div>
        </div>
      </div>

      <div class="expedition-canonical-notice">
        En este modo los encuentros y jefes son aleatorios. Ambos jugadores inician con la misma semilla y configuración, y al terminar marcan los logros obtenidos para comparar puntuaciones.
      </div>

      <div class="expedition-buffs-grid">
        <div class="expedition-buff-card">
          <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">
            ${currentExpeditionChallenge.mode.buffCategory}
          </div>
          <strong style="color: var(--text-primary); margin-top: 2px; display: block;">${currentExpeditionChallenge.initialBuff.name}</strong>
          <p style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 4px;">${currentExpeditionChallenge.initialBuff.effect}</p>
        </div>

        <div class="expedition-buff-card" style="border-color: rgba(239, 68, 68, 0.2); background: rgba(239, 68, 68, 0.04);">
          <div style="font-size: 0.72rem; color: #fca5a5; text-transform: uppercase; font-weight: 700;">
            ${currentExpeditionChallenge.mode.riskCategory}
          </div>
          <strong style="color: #fca5a5; margin-top: 2px; display: block;">Modificador de Riesgo</strong>
          <p style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 4px;">${currentExpeditionChallenge.risk}</p>
        </div>
      </div>
    `;

    // Render Starting Squad
    renderTeamSlots(currentExpeditionChallenge.team, univTeamSlotsGrid);

    // Setup 1v1 Scorecard Checklist
    setupExpeditionScorecard();
  }

  function setupExpeditionScorecard() {
    p1CheckedCriteria.clear();
    p2CheckedCriteria.clear();
    p1BonusInput.value = '';
    p2BonusInput.value = '';

    p1BonusLabel.textContent = currentExpeditionChallenge.bonusLabel;
    p1BonusHelper.textContent = currentExpeditionChallenge.bonusHelper;
    p2BonusLabel.textContent = currentExpeditionChallenge.bonusLabel;
    p2BonusHelper.textContent = currentExpeditionChallenge.bonusHelper;

    p1ScoreBadge.textContent = '0 pts';
    p2ScoreBadge.textContent = '0 pts';
    expeditionResultBanner.style.display = 'none';

    // Render Player 1 Criteria Checklist
    p1CriteriaList.innerHTML = '';
    currentExpeditionChallenge.criteria.forEach(crit => {
      const isPenalty = crit.points < 0;
      const item = document.createElement('label');
      item.className = 'criteria-checkbox-item';
      item.innerHTML = `
        <input type="checkbox" data-crit-id="${crit.id}">
        <span class="criteria-text-wrap">${crit.text}</span>
        <span class="criteria-points-pill ${isPenalty ? 'penalty' : ''}">
          ${crit.points > 0 ? '+' : ''}${crit.points} pts
        </span>
      `;

      const cb = item.querySelector('input');
      cb.addEventListener('change', () => {
        if (cb.checked) {
          p1CheckedCriteria.add(crit.id);
          item.classList.add('checked');
        } else {
          p1CheckedCriteria.delete(crit.id);
          item.classList.remove('checked');
        }
        updateLiveExpeditionScore();
        if (p2pRole !== 'guest') {
          sendP2PMessage('EXPEDITION_CHECK', { critId: crit.id, checked: cb.checked });
        }
      });

      p1CriteriaList.appendChild(item);
    });

    // Render Player 2 Criteria Checklist
    p2CriteriaList.innerHTML = '';
    currentExpeditionChallenge.criteria.forEach(crit => {
      const isPenalty = crit.points < 0;
      const item = document.createElement('label');
      item.className = 'criteria-checkbox-item';
      item.innerHTML = `
        <input type="checkbox" data-crit-id="${crit.id}">
        <span class="criteria-text-wrap">${crit.text}</span>
        <span class="criteria-points-pill ${isPenalty ? 'penalty' : ''}">
          ${crit.points > 0 ? '+' : ''}${crit.points} pts
        </span>
      `;

      const cb = item.querySelector('input');
      cb.addEventListener('change', () => {
        if (cb.checked) {
          p2CheckedCriteria.add(crit.id);
          item.classList.add('checked');
        } else {
          p2CheckedCriteria.delete(crit.id);
          item.classList.remove('checked');
        }
        updateLiveExpeditionScore();
        if (p2pRole === 'guest') {
          sendP2PMessage('EXPEDITION_CHECK', { critId: crit.id, checked: cb.checked });
        }
      });

      p2CriteriaList.appendChild(item);
    });
    broadcastExpeditionState();
  }

  function updateLiveExpeditionScore() {
    let p1Base = 0;
    let p2Base = 0;

    const critMap = new Map();
    currentExpeditionChallenge.criteria.forEach(c => critMap.set(c.id, c.points));

    p1CheckedCriteria.forEach(id => {
      if (critMap.has(id)) p1Base += critMap.get(id);
    });
    p2CheckedCriteria.forEach(id => {
      if (critMap.has(id)) p2Base += critMap.get(id);
    });

    const mult = currentExpeditionChallenge.bonusMultiplier || 0.1;
    const p1Bonus = Math.max(0, Math.floor(Number(p1BonusInput.value || 0) * mult));
    const p2Bonus = Math.max(0, Math.floor(Number(p2BonusInput.value || 0) * mult));

    p1ScoreBadge.textContent = `${Math.max(0, p1Base + p1Bonus)} pts`;
    p2ScoreBadge.textContent = `${Math.max(0, p2Base + p2Bonus)} pts`;
    broadcastExpeditionState();
  }

  function calculateExpeditionResult(sendP2p = true) {
    if (sendP2p) {
      sendP2PMessage('EXPEDITION_CALCULATE', {});
    }

    const outcome = HSR_GAME_MODES.calculateExpeditionWinner(
      currentExpeditionChallenge,
      Array.from(p1CheckedCriteria),
      Number(p1BonusInput.value || 0),
      Array.from(p2CheckedCriteria),
      Number(p2BonusInput.value || 0)
    );

    if (!outcome) return;

    const p1Name = remoteHostProfile
      ? `${remoteHostProfile.username} (Anfitrión)`
      : (userProfile.username || 'Jugador 1');
    const p2Name = remoteHostProfile
      ? `${userProfile.username || 'Trazacaminos'} (Tú)`
      : (remotePeerProfile ? `${remotePeerProfile.username} (Amigo)` : 'Jugador 2 (Amigo)');

    let titleText = '';
    let subText = '';
    let winnerColor = 'var(--accent-color, #60cdff)';

    if (outcome.winner === 'player1') {
      titleText = `¡Victoria para ${p1Name}!`;
      subText = `${p1Name} obtuvo ${outcome.player1.totalScore.toLocaleString()} pts (${outcome.player1.checkedCount} objetivos) vs ${outcome.player2.totalScore.toLocaleString()} pts de ${p2Name} (+${outcome.diff.toLocaleString()} pts de ventaja).`;
      winnerColor = 'var(--accent-color, #60cdff)';
    } else if (outcome.winner === 'player2') {
      titleText = `¡Victoria para ${p2Name}!`;
      subText = `${p2Name} obtuvo ${outcome.player2.totalScore.toLocaleString()} pts (${outcome.player2.checkedCount} objetivos) vs ${outcome.player1.totalScore.toLocaleString()} pts de ${p1Name} (+${outcome.diff.toLocaleString()} pts de ventaja).`;
      winnerColor = '#f87171';
    } else {
      titleText = `¡Empate Técnico en la Expedición!`;
      subText = `Ambos jugadores obtuvieron exactamente ${outcome.player1.totalScore.toLocaleString()} puntos en su partida.`;
      winnerColor = '#eab308';
    }

    expeditionResultBanner.innerHTML = `
      <div style="display: flex; align-items: center; gap: 14px;">
        <div class="duel-victory-icon-wrap">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="${winnerColor}">
            <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0 0 11 15.9V19H7v2h10v-2h-4v-3.1a5.01 5.01 0 0 0 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/>
          </svg>
        </div>
        <div>
          <h3 style="font-size: 1.1rem; font-weight: 700; color: ${winnerColor};">${titleText}</h3>
          <p style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 2px;">${subText}</p>
        </div>
      </div>
      <button id="copyExpeditionResultBtn" class="btn-fluent" style="font-size: 0.78rem; padding: 6px 14px;">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
        <span>Copiar Resultado</span>
      </button>
    `;

    expeditionResultBanner.style.display = 'flex';
    playUiSound('fanfare');

    document.getElementById('copyExpeditionResultBtn').addEventListener('click', () => {
      const summaryText = `[HSR Expedición 1v1 - ${currentExpeditionChallenge.mode.name}]\n${titleText}\n${subText}\nSemilla: #${currentExpeditionChallenge.seed}`;
      copyToClipboard(summaryText, 'Resultado de expedición copiado al portapapeles');
    });
  }

  function resetExpeditionChecklist() {
    setupExpeditionScorecard();
    playUiSound('click');
    showToast('Tablero de objetivos restablecido', 'refresh');
  }

  // Alias for backward compatibility
  function generateUniverse(seed = null) {
    generateExpedition(seed);
  }

  /* ==========================================================================
     CHARACTER DETAIL MODAL
     ========================================================================== */
  function openCharacterModal(c) {
    const portraitSrc = c.images.portrait_cdn || c.images.portrait || c.images.preview_cdn || c.images.preview;
    const elemIconSrc = c.element.icon_cdn || c.element.icon;
    const pathIconSrc = c.path.icon_cdn || c.path.icon;
    const roleClass = getRoleBadgeClass(c.role);
    const roleIcon = getRoleIcon(c.role);
    const rarityStars = '✦'.repeat(c.rarity);
    const isOwned = ownedCharacterIds.has(String(c.id));

    modalContent.innerHTML = `
      <div class="dialog-hero-visual">
        <div class="dialog-ambient-glow" style="background: ${c.element.color};"></div>
        <img src="${portraitSrc}" alt="${c.name}" onerror="this.src='${c.images.preview_cdn || c.images.preview}'">
      </div>
      <div class="dialog-info-pane">
        <div class="dialog-header-titles">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <span class="rarity-pill rarity-${c.rarity}">${rarityStars} (${c.rarity}-STAR)</span>
            <button class="btn-own-toggle ${isOwned ? 'is-owned' : ''}" id="modalOwnToggleBtn">
              ${isOwned ? 'VERIFICADO EN INVENTARIO' : 'MARCAR DISPONIBLE'}
            </button>
          </div>
          <h2 class="dialog-char-name">${c.name}</h2>
          <span class="dialog-char-en">${c.name_en}</span>
        </div>

        <div class="dialog-badges-row">
          <span class="elem-badge" style="border-color: ${c.element.color}40; color: ${c.element.color};">
            <img src="${elemIconSrc}" alt="${c.element.name}">
            Elemento: ${c.element.name}
          </span>
          <span class="path-badge">
            <img src="${pathIconSrc}" alt="${c.path.name}">
            Vía: ${c.path.name}
          </span>
          <span class="role-badge ${roleClass}">
            <span>${roleIcon}</span>
            <span>Función: ${c.role}</span>
          </span>
        </div>

        <div class="dialog-section-block">
          <span class="dialog-section-title">Especialidad Táctica y Combate</span>
          <div class="dialog-specialty-box">
            <strong>${c.sub_role || 'Combatiente'}:</strong> ${c.specialty}
          </div>
        </div>

        <div class="dialog-meta-list">
          <div class="dialog-meta-item">
            <span class="dialog-meta-key">Vía de los Eones</span>
            <span class="dialog-meta-value">${c.path.name} (${c.path.name_en})</span>
          </div>
          <div class="dialog-meta-item">
            <span class="dialog-meta-key">Tipo de Daño</span>
            <span class="dialog-meta-value">${c.element.name} (${c.element.name_en})</span>
          </div>
          <div class="dialog-meta-item">
            <span class="dialog-meta-key">Función Principal</span>
            <span class="dialog-meta-value">${c.role}</span>
          </div>
          <div class="dialog-meta-item">
            <span class="dialog-meta-key">Sub-Rol Táctico</span>
            <span class="dialog-meta-value">${c.sub_role || 'General'}</span>
          </div>
        </div>

        <div style="display: flex; gap: 8px; margin-top: auto; padding-top: 8px;">
          <a href="https://honkai-star-rail.fandom.com/wiki/${encodeURIComponent(c.name_en.replace(/ • /g, ' - '))}" target="_blank" rel="noopener" class="btn-fluent" style="text-decoration: none; flex: 1; justify-content: center; font-size: 0.78rem;">
            Wiki Oficial Fandom ↗
          </a>
          <a href="https://www.prydwen.gg/star-rail/characters/${encodeURIComponent(c.name_en.toLowerCase().replace(/[^a-z0-9]/g, '-'))}" target="_blank" rel="noopener" class="btn-fluent" style="text-decoration: none; flex: 1; justify-content: center; font-size: 0.78rem;">
            Guía Prydwen ↗
          </a>
        </div>
      </div>
    `;

    document.getElementById('modalOwnToggleBtn').addEventListener('click', () => {
      toggleCharacterOwned(c.id);
      const nowOwned = ownedCharacterIds.has(String(c.id));
      const btn = document.getElementById('modalOwnToggleBtn');
      btn.className = `btn-own-toggle ${nowOwned ? 'is-owned' : ''}`;
      btn.textContent = nowOwned ? 'VERIFICADO EN INVENTARIO' : 'MARCAR DISPONIBLE';
      showToast(`${c.name}: ${nowOwned ? 'agregado a tu colección' : 'removido de tu colección'}`, nowOwned ? 'success' : 'error');
    });

    characterModal.classList.add('open');
    characterModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    playUiSound('click');
  }

  function closeCharacterModal() {
    characterModal.classList.remove('open');
    characterModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  /* ==========================================================================
     CSV EXPORT
     ========================================================================== */
  function exportCharactersToCsv() {
    const list = getFilteredCharacters();
    const headers = ['ID', 'Nombre_ES', 'Nombre_EN', 'Rareza', 'Elemento', 'Via', 'Funcion_Rol', 'Sub_Rol', 'Especialidad', 'En_Coleccion'];
    const rows = list.map(c => [
      c.id,
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.name_en.replace(/"/g, '""')}"`,
      c.rarity,
      c.element.name,
      c.path.name,
      c.role,
      `"${(c.sub_role || '').replace(/"/g, '""')}"`,
      `"${(c.specialty || '').replace(/"/g, '""')}"`,
      ownedCharacterIds.has(String(c.id)) ? 'SI' : 'NO'
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `HSR_Personajes_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Archivo CSV descargado correctamente', 'download');
    playUiSound('click');
  }

  /* ==========================================================================
     GACHAPON ENGINE (WARP SIMULATOR & SQUAD DRAFT CONTROLLER)
     ========================================================================== */
  function initGachaSession() {
    const saved = localStorage.getItem('hsr_gacha_session');
    if (saved) {
      try {
        currentGachaSession = JSON.parse(saved);
        if (currentGachaSession) {
          currentGachaBannerId = currentGachaSession.bannerId || 'universal';
          currentGachaLimit = currentGachaSession.pullLimit;
          currentGachaPityTarget = currentGachaSession.pity5StarTarget || 90;
          currentGachaRarityFilter = currentGachaSession.rarityFilter || 'all';
          currentGachaSyncRoster = Boolean(currentGachaSession.filterByOwnedRoster);
        }
      } catch (e) {
        currentGachaSession = null;
      }
    }
    if (!currentGachaSession) {
      currentGachaSession = HSR_GAME_MODES.createGachaSession(currentGachaLimit, null, {
        pity5StarTarget: currentGachaPityTarget,
        rarityFilter: currentGachaRarityFilter,
        filterByOwnedRoster: currentGachaSyncRoster
      });
      saveGachaSession();
    }
    if (gachaSyncRosterToggle) {
      gachaSyncRosterToggle.checked = currentGachaSyncRoster;
    }
  }

  function saveGachaSession() {
    if (currentGachaSession) {
      localStorage.setItem('hsr_gacha_session', JSON.stringify(currentGachaSession));
      broadcastGachaState();
    }
  }

  function renderGachaUI() {
    if (!currentGachaSession) initGachaSession();
    renderGachaRarityFilterPills();
    renderGachaPityTargetPills();
    renderGachaLimitPills();
    renderGachaHUD();
    renderGachaBannerStage();
    renderGachaSquad();
    renderGachaInventory();
    renderGachaHistory();
  }

  function renderGachaRarityFilterPills() {
    if (!gachaRarityFilterPills) return;
    gachaRarityFilterPills.querySelectorAll('.limit-pill-btn').forEach(btn => {
      const r = btn.dataset.rarity;
      btn.classList.toggle('active', r === currentGachaRarityFilter);
      btn.onclick = () => {
        if (currentGachaRarityFilter === r) return;
        currentGachaRarityFilter = r;
        if (currentGachaSession) {
          currentGachaSession.rarityFilter = r;
          saveGachaSession();
        }
        gachaRarityFilterPills.querySelectorAll('.limit-pill-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.rarity === r);
        });
        updateGachaPoolStatusBadge();
        renderGachaHUD();
        renderGachaBannerStage();
        playUiSound('click');
        showToast(
          r === '5star' ? 'Filtro de rareza fijado: Solo personajes de 5★' :
          r === '4star' ? 'Filtro de rareza fijado: Solo personajes de 4★' :
          'Filtro de rareza fijado: Todos los personajes (5★ y 4★)',
          'info'
        );
      };
    });
  }

  function renderGachaPityTargetPills() {
    if (!gachaPityTargetPills) return;
    gachaPityTargetPills.querySelectorAll('.limit-pill-btn').forEach(btn => {
      const p = Number(btn.dataset.pity);
      btn.classList.toggle('active', p === currentGachaPityTarget);
      btn.onclick = () => {
        currentGachaPityTarget = p;
        if (currentGachaSession) {
          currentGachaSession.pity5StarTarget = p;
          saveGachaSession();
        }
        gachaPityTargetPills.querySelectorAll('.limit-pill-btn').forEach(b => {
          b.classList.toggle('active', Number(b.dataset.pity) === p);
        });
        if (gachaCustomPityInput) gachaCustomPityInput.value = '';
        renderGachaHUD();
        playUiSound('click');
        showToast(`Meta de Pity fijada: Personaje 5★ garantizado en el tiro ${p}`, 'success');
      };
    });

    if (gachaCustomPityInput && currentGachaPityTarget) {
      const standardPities = [50, 70, 80, 90];
      if (!standardPities.includes(currentGachaPityTarget)) {
        gachaCustomPityInput.value = currentGachaPityTarget;
      }
    }
  }

  function applyCustomPityTarget() {
    if (!gachaCustomPityInput || !currentGachaSession) return;
    const rawVal = gachaCustomPityInput.value.trim();
    if (!rawVal) {
      showToast('Introduce un número de tiradas para fijar el Pity garantizado.', 'warn');
      return;
    }
    const val = parseInt(rawVal, 10);
    if (isNaN(val) || val < 10 || val > 300) {
      showToast('Por favor introduce un valor entre 10 y 300 tiradas.', 'warn');
      return;
    }

    currentGachaPityTarget = val;
    currentGachaSession.pity5StarTarget = val;
    saveGachaSession();
    playUiSound('click');

    if (gachaPityTargetPills) {
      gachaPityTargetPills.querySelectorAll('.limit-pill-btn').forEach(btn => {
        btn.classList.toggle('active', Number(btn.dataset.pity) === val);
      });
    }

    renderGachaHUD();
    showToast(`Pity de 5★ garantizado fijado a ${val} tiradas`, 'success');
  }

  function updateGachaPoolStatusBadge() {
    const ownedArr = Array.from(ownedCharacterIds);
    const poolData = HSR_GAME_MODES.getGachaCandidatePool(currentGachaSession, characters, ownedArr);

    if (gachaPoolStatusBadge) {
      const count = poolData.totalActiveCharacters;
      const isSync = currentGachaSession?.filterByOwnedRoster;
      if (isSync) {
        gachaPoolStatusBadge.textContent = `${count} personajes de tu colección`;
        gachaPoolStatusBadge.className = 'gacha-pool-badge synced';
      } else {
        gachaPoolStatusBadge.textContent = `${count} personajes disponibles en el pool`;
        gachaPoolStatusBadge.className = 'gacha-pool-badge';
      }
    }

    if (gachaActivePoolBadge) {
      const filter = currentGachaSession?.rarityFilter || 'all';
      const label = filter === '5star' ? `Solo 5★ (${poolData.pool5.length})` :
                    filter === '4star' ? `Solo 4★ (${poolData.pool4.length})` :
                    `5★ y 4★ (${poolData.totalActiveCharacters})`;
      gachaActivePoolBadge.textContent = label;
      gachaActivePoolBadge.title = poolData.isRosterFiltered ? 'Filtrado por colección de personajes obtenida' : 'Todos los personajes del juego';
    }
  }

  function renderGachaLimitPills() {
    if (!gachaLimitPills) return;
    gachaLimitPills.querySelectorAll('.limit-pill-btn').forEach(btn => {
      const limitVal = btn.dataset.limit === 'unlimited' ? null : Number(btn.dataset.limit);
      btn.classList.toggle('active', currentGachaLimit === limitVal);

      btn.onclick = () => {
        gachaLimitPills.querySelectorAll('.limit-pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentGachaLimit = limitVal;
        currentGachaSession.pullLimit = currentGachaLimit;
        if (gachaCustomLimitInput) gachaCustomLimitInput.value = '';
        saveGachaSession();
        playUiSound('click');
        renderGachaHUD();
      };
    });

    if (gachaCustomLimitInput && currentGachaLimit !== null) {
      const standardLimits = [10, 50, 90, 160, 200];
      if (!standardLimits.includes(currentGachaLimit)) {
        gachaCustomLimitInput.value = currentGachaLimit;
      }
    }
  }

  function applyCustomPullLimit() {
    if (!gachaCustomLimitInput || !currentGachaSession) return;
    const rawVal = gachaCustomLimitInput.value.trim();
    if (!rawVal) {
      showToast('Introduce un número de tiradas para fijar el presupuesto.', 'warn');
      return;
    }
    const val = parseInt(rawVal, 10);
    if (isNaN(val) || val <= 0) {
      showToast('Por favor introduce un número entero positivo mayor a 0.', 'warn');
      return;
    }

    currentGachaLimit = val;
    currentGachaSession.pullLimit = val;
    saveGachaSession();
    playUiSound('click');

    // Update preset pills active state
    if (gachaLimitPills) {
      gachaLimitPills.querySelectorAll('.limit-pill-btn').forEach(btn => {
        const pVal = btn.dataset.limit === 'unlimited' ? null : Number(btn.dataset.limit);
        btn.classList.toggle('active', pVal === val);
      });
    }

    renderGachaHUD();
    showToast(`Presupuesto de salto fijado a ${val} tiradas`, 'success');
  }

  function addCustomPullsToLimit() {
    if (!gachaCustomLimitInput || !currentGachaSession) return;
    const rawVal = gachaCustomLimitInput.value.trim();
    if (!rawVal) {
      showToast('Introduce la cantidad de tiradas a añadir.', 'warn');
      return;
    }
    const val = parseInt(rawVal, 10);
    if (isNaN(val) || val <= 0) {
      showToast('Introduce un número entero positivo mayor a 0.', 'warn');
      return;
    }

    if (currentGachaSession.pullLimit === null) {
      currentGachaSession.pullLimit = currentGachaSession.totalPulls + val;
    } else {
      currentGachaSession.pullLimit += val;
    }
    currentGachaLimit = currentGachaSession.pullLimit;
    gachaCustomLimitInput.value = currentGachaLimit;
    saveGachaSession();
    playUiSound('fanfare');

    // Update preset pills
    if (gachaLimitPills) {
      gachaLimitPills.querySelectorAll('.limit-pill-btn').forEach(btn => {
        const pVal = btn.dataset.limit === 'unlimited' ? null : Number(btn.dataset.limit);
        btn.classList.toggle('active', pVal === currentGachaLimit);
      });
    }

    renderGachaHUD();
    showToast(`+${val} tiradas añadidas al presupuesto (Total: ${currentGachaLimit})`, 'success');
  }

  function renderGachaHUD() {
    const s = currentGachaSession;
    if (!s) return;

    if (gachaPullsCounterDisplay) {
      gachaPullsCounterDisplay.textContent = `${s.totalPulls} / ${s.pullLimit === null ? '∞' : s.pullLimit}`;
    }

    const pityTarget = s.pity5StarTarget || 90;
    if (gachaPity5Caption) {
      gachaPity5Caption.textContent = `Pity 5★ (Garantizado en ${pityTarget})`;
    }
    if (gachaPity5Text) {
      gachaPity5Text.textContent = `${s.pity5Star} / ${pityTarget}`;
    }
    if (gachaPity5Bar) {
      const pct = Math.min(100, Math.round((s.pity5Star / pityTarget) * 100));
      gachaPity5Bar.style.width = `${pct}%`;
    }

    if (gachaPity4Text) gachaPity4Text.textContent = `${s.pity4Star} / 10`;
    if (gachaPity4Bar) {
      const pct = Math.min(100, Math.round((s.pity4Star / 10) * 100));
      gachaPity4Bar.style.width = `${pct}%`;
    }

    if (gachaSeedDisplay) {
      gachaSeedDisplay.textContent = s.seed;
    }

    updateGachaPoolStatusBadge();
  }

  function getCharAvatar(c) {
    if (!c) return 'https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/icon/character/1001.png';
    let charObj = c;
    if (typeof c === 'string' || typeof c === 'number') {
      charObj = HSR_GAME_MODES.getCharacterById(c) || characters.find(item => String(item.id) === String(c));
    }
    if (!charObj) {
      return `https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/icon/character/${c}.png`;
    }
    return charObj.images?.icon_cdn ||
           charObj.images?.icon ||
           (charObj.id ? `https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/icon/character/${charObj.id}.png` : 'https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/icon/character/1001.png');
  }

  function getCharPreview(c) {
    if (!c) return '';
    let charObj = c;
    if (typeof c === 'string' || typeof c === 'number') {
      charObj = HSR_GAME_MODES.getCharacterById(c) || characters.find(item => String(item.id) === String(c));
    }
    if (!charObj) return '';
    return charObj.images?.preview_cdn ||
           charObj.images?.preview ||
           (charObj.id ? `https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/image/character_preview/${charObj.id}.png` : '');
  }

  function getLightConeImg(item) {
    if (!item) return 'https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/image/light_cone_portrait/20000.png';
    return item.preview ||
           item.icon ||
           (item.id ? `https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/image/light_cone_portrait/${item.id}.png` : 'https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/image/light_cone_portrait/20000.png');
  }

  function renderGachaBannerStage() {
    if (!gachaBannerStage || !currentGachaSession) return;
    const banner = HSR_GAME_MODES.UNIVERSAL_WARP_BANNER;
    const starterAvailable = !currentGachaSession.freeStarterClaimed;
    const pityTarget = currentGachaSession.pity5StarTarget || 90;

    const ownedArr = Array.from(ownedCharacterIds);
    const poolData = HSR_GAME_MODES.getGachaCandidatePool(currentGachaSession, characters, ownedArr);

    // Pick 6 spotlight showcase characters from active pool
    const spotlight5 = poolData.pool5.slice(0, 4);
    const spotlight4 = poolData.pool4.slice(0, 2);
    const spotlightAll = [...spotlight5, ...spotlight4];

    const filter = currentGachaSession.rarityFilter || 'all';
    const filterLabel = filter === '5star' ? 'Solo Héroes de 5 Estrellas' :
                        filter === '4star' ? 'Solo Héroes de 4 Estrellas' :
                        'Todos los Héroes (5★ y 4★)';

    gachaBannerStage.innerHTML = `
      <div class="gacha-banner-card">
        <div class="banner-visual-left">
          <div class="banner-badge-tag">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
              <path d="M12 2.5l2.4 5.8 6.1.9-4.4 4.3 1 6.1-5.1-2.9-5.1 2.9 1-6.1-4.4-4.3 6.1-.9L12 2.5z"/>
            </svg>
            <span>Salto Astral Universal • ${filterLabel}</span>
          </div>

          <div class="banner-hero-info">
            <h2 class="banner-title-text">${banner.title}</h2>
            <div class="banner-featured-char-name">
              <span>Universo de Todos los Personajes</span>
              <span style="font-size: 0.82rem; color: #fde047; letter-spacing: 2px;">✦✦✦✦✦</span>
              <span style="font-size: 0.74rem; color: var(--accent-light); font-weight: 600;">(Sin 50/50 • 100% Directo)</span>
            </div>
            <p class="banner-quote-box">"${banner.quote}"</p>
          </div>

          <!-- Spotlight Characters Showcase Strip -->
          <div class="banner-featured-4stars-strip">
            <span class="strip-label">✦ Personajes Destacados en el Salto (${poolData.totalActiveCharacters} en el pool):</span>
            <div class="strip-avatars-row">
              ${spotlightAll.map(c => `
                <div class="strip-char-item" title="${c.name} (${c.rarity}★ • ${c.element?.name || ''} • ${c.path?.name || ''})">
                  <img src="${getCharAvatar(c)}" alt="${c.name}" loading="lazy">
                  <span>${c.name}</span>
                  <span style="color: ${c.rarity === 5 ? '#fde047' : '#c084fc'}; font-size: 0.65rem;">${c.rarity}★</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="banner-actions-right">
          <div class="warp-ticket-container" style="width: 90px; height: 140px;">
            <div class="warp-ticket-aura aura-5" style="filter: blur(14px);"></div>
            <div class="warp-ticket-core" style="border-radius: 8px;">
              <div class="warp-ticket-content" style="gap: 4px;">
                <div class="warp-ticket-icon" style="font-size: 1.5rem;">✦</div>
                <div class="warp-ticket-text" style="font-size: 0.68rem;">WARP PASS</div>
              </div>
            </div>
          </div>

          <div class="banner-pull-buttons-col">
            ${starterAvailable ? `
              <button id="gachaStarterPullBtn" class="btn-gacha-pull btn-gacha-starter">
                <span>✦ Salto Inicial Gratis (10x)</span>
                <span class="pass-cost-tag" style="color: #ffffff; background: rgba(0,0,0,0.25); padding: 2px 6px; border-radius: 4px;">0 PASES</span>
              </button>
            ` : ''}

            <button id="gachaSinglePullBtn" class="btn-gacha-pull btn-gacha-single">
              <span>Salto x1</span>
              <span class="pass-cost-tag">1 Pase</span>
            </button>

            <button id="gachaTenPullBtn" class="btn-gacha-pull btn-gacha-ten">
              <span>Salto x10</span>
              <span class="pass-cost-tag">10 Pases</span>
            </button>
          </div>
        </div>
      </div>
    `;

    const starterBtn = document.getElementById('gachaStarterPullBtn');
    if (starterBtn) {
      starterBtn.addEventListener('click', executeStarterPull);
    }
    const singleBtn = document.getElementById('gachaSinglePullBtn');
    if (singleBtn) {
      singleBtn.addEventListener('click', executeSinglePull);
    }
    const tenBtn = document.getElementById('gachaTenPullBtn');
    if (tenBtn) {
      tenBtn.addEventListener('click', executeTenPull);
    }
  }

  function renderGachaSquad() {
    if (!gachaSquadSlotsContainer || !currentGachaSession) return;
    const squad = currentGachaSession.activeSquad || [null, null, null, null];
    const roleLabels = ['DPS Principal', 'Sub-DPS / Buffer', 'Soporte Táctico', 'Sostenimiento'];

    gachaSquadSlotsContainer.innerHTML = squad.map((char, idx) => {
      const posNum = idx + 1;
      const role = roleLabels[idx];
      if (!char) {
        return `
          <div class="gacha-squad-slot-card">
            <span class="slot-pos-badge">#0${posNum}</span>
            <span class="slot-role-tag">${role}</span>
            <div class="slot-char-avatar-wrap" style="display:flex; align-items:center; justify-content:center; border-style:dashed;">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="var(--text-muted)"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
            </div>
            <div class="slot-char-name-text" style="color: var(--text-muted);">[Sin Asignar]</div>
            <button class="btn-slot-swap" data-slot="${idx}">Asignar</button>
          </div>
        `;
      }

      const rarityClass = char.rarity === 5 ? 'rarity-5' : 'rarity-4';
      const eidolonBadge = (char.eidolon && char.eidolon > 0) ? `<span class="inv-tile-eidolon">E${char.eidolon}</span>` : '';
      const stars = char.rarity === 5 ? '✦✦✦✦✦' : '✦✦✦✦';

      return `
        <div class="gacha-squad-slot-card">
          <span class="slot-pos-badge">#0${posNum}</span>
          <span class="slot-role-tag">${role}</span>
          <div class="slot-char-avatar-wrap ${rarityClass}">
            <img src="${getCharAvatar(char)}" alt="${char.name}">
            ${eidolonBadge}
          </div>
          <div class="slot-char-name-text">${char.name}</div>
          <div class="slot-char-badges">
            <span style="color: ${char.rarity === 5 ? '#fde047' : '#c084fc'}; font-size: 0.65rem;">${stars}</span>
            <span>•</span>
            <span>${char.element?.name || ''}</span>
          </div>
          <button class="btn-slot-swap" data-slot="${idx}">Cambiar</button>
        </div>
      `;
    }).join('');

    gachaSquadSlotsContainer.querySelectorAll('.btn-slot-swap').forEach(btn => {
      btn.addEventListener('click', () => {
        const slotIdx = Number(btn.dataset.slot);
        openSquadSwapModal(slotIdx);
      });
    });
  }

  function renderGachaInventory() {
    if (!gachaInventoryGrid || !currentGachaSession) return;
    const inv = currentGachaSession.inventory || [];
    if (gachaInvCountBadge) gachaInvCountBadge.textContent = inv.length;

    if (inv.length === 0) {
      gachaInventoryGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 24px; color: var(--text-muted); font-size: 0.78rem;">
          No has obtenido personajes aún. Realiza el <strong>Salto Inicial Gratis</strong> o tira en el banner.
        </div>
      `;
      return;
    }

    const sorted = [...inv].sort((a, b) => (b.rarity - a.rarity) || a.name.localeCompare(b.name));

    gachaInventoryGrid.innerHTML = sorted.map(c => {
      const rarityClass = c.rarity === 5 ? 'rarity-5' : 'rarity-4';
      const eidolon = (c.eidolon && c.eidolon > 0) ? `<span class="inv-tile-eidolon">E${c.eidolon}</span>` : '';
      const starColor = c.rarity === 5 ? '#fde047' : '#c084fc';

      return `
        <div class="gacha-inv-tile ${rarityClass}">
          ${eidolon}
          <img class="inv-tile-avatar" src="${getCharAvatar(c)}" alt="${c.name}">
          <div class="inv-tile-name">${c.name}</div>
          <div style="font-size: 0.62rem; color: ${starColor};">${c.rarity === 5 ? '✦✦✦✦✦' : '✦✦✦✦'}</div>
          <button class="btn-inv-assign" data-char-id="${c.id}">Asignar</button>
        </div>
      `;
    }).join('');

    gachaInventoryGrid.querySelectorAll('.btn-inv-assign').forEach(btn => {
      btn.addEventListener('click', () => {
        const cid = btn.dataset.charId;
        const squad = currentGachaSession.activeSquad;
        let targetSlot = squad.findIndex(s => s === null);
        if (targetSlot === -1) targetSlot = 0;
        HSR_GAME_MODES.swapSquadMember(currentGachaSession, targetSlot, cid);
        saveGachaSession();
        renderGachaSquad();
        playUiSound('click');
        showToast(`Combatiente asignado a la Posición ${targetSlot + 1}`, 'success');
      });
    });
  }

  function renderGachaHistory() {
    if (!gachaHistoryTableBody || !currentGachaSession) return;
    const history = currentGachaSession.history || [];
    if (gachaHistoryCountBadge) gachaHistoryCountBadge.textContent = history.length;

    if (history.length === 0) {
      gachaHistoryTableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 20px; color: var(--text-muted);">
            Sin saltos realizados en esta sesión.
          </td>
        </tr>
      `;
      return;
    }

    gachaHistoryTableBody.innerHTML = history.slice(0, 50).map(h => {
      let rowClass = '';
      let rarityBadge = '';
      if (h.rarity === 5) {
        rowClass = 'history-row-5star';
        rarityBadge = '<span style="color: #fde047; font-weight: 800;">5★ Dorado</span>';
      } else if (h.rarity === 4) {
        rowClass = 'history-row-4star';
        rarityBadge = '<span style="color: #c084fc; font-weight: 700;">4★ Púrpura</span>';
      } else {
        rarityBadge = '<span style="color: #38bdf8;">3★ Azul</span>';
      }

      const itemTypeIcon = h.type === 'character' ? '✦' : '◆';

      return `
        <tr class="${rowClass}">
          <td style="font-family: var(--font-mono); font-size: 0.72rem;">#${h.pullIndex}</td>
          <td><strong>${itemTypeIcon} ${h.name}</strong></td>
          <td>${rarityBadge}</td>
          <td style="font-family: var(--font-mono);">${h.pity}</td>
          <td style="font-size: 0.7rem;">${h.note || ''}</td>
        </tr>
      `;
    }).join('');
  }

  function initWarpCanvasAnimation(highestRarity = 3, onFinish = null) {
    if (!gachaWarpCanvas || !gachaWarpCinematic) {
      if (typeof onFinish === 'function') onFinish();
      return;
    }

    const canvas = gachaWarpCanvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      if (typeof onFinish === 'function') onFinish();
      return;
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const cx = width / 2;
    const cy = height / 2;

    const numStars = 180;
    const stars = [];
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: (Math.random() - 0.5) * width * 2,
        y: (Math.random() - 0.5) * height * 2,
        z: Math.random() * width,
        prevZ: 0
      });
    }

    if (warpTicketAura) {
      warpTicketAura.className = 'warp-ticket-aura ' + (
        highestRarity === 5 ? 'aura-5' :
        highestRarity === 4 ? 'aura-4' : 'aura-3'
      );
    }

    const centerpiece = document.getElementById('gachaWarpCenterpiece');
    const burstRing = document.getElementById('warpBurstRing');
    if (centerpiece) centerpiece.classList.remove('bursting');
    if (burstRing) burstRing.classList.remove('active');

    const startTime = performance.now();
    let isFinished = false;
    let burstTriggered = false;

    const starColors = highestRarity === 5
      ? ['#ffffff', '#fde047', '#f59e0b', '#fbbf24', '#ffffff']
      : highestRarity === 4
      ? ['#ffffff', '#c084fc', '#a855f7', '#e879f9', '#ffffff']
      : ['#ffffff', '#38bdf8', '#0284c7', '#67e8f9', '#ffffff'];

    function renderFrame(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / 1400);
      const speed = 12 + Math.pow(progress, 2.2) * 45;

      ctx.fillStyle = 'rgba(4, 7, 14, 0.35)';
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < numStars; i++) {
        const s = stars[i];
        s.prevZ = s.z;
        s.z -= speed;

        if (s.z <= 0) {
          s.z = width;
          s.x = (Math.random() - 0.5) * width * 2;
          s.y = (Math.random() - 0.5) * height * 2;
          s.prevZ = s.z;
        }

        const k = 320 / s.z;
        const px = cx + s.x * k;
        const py = cy + s.y * k;

        const prevK = 320 / s.prevZ;
        const oldPx = cx + s.x * prevK;
        const oldPy = cy + s.y * prevK;

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          const color = starColors[i % starColors.length];
          const alpha = Math.min(1, (1 - s.z / width) * 1.4);
          ctx.strokeStyle = color;
          ctx.globalAlpha = alpha;
          ctx.lineWidth = Math.max(1, (1 - s.z / width) * 2.8);
          ctx.beginPath();
          ctx.moveTo(oldPx, oldPy);
          ctx.lineTo(px, py);
          ctx.stroke();
        }
      }

      ctx.globalAlpha = 1;

      // Burst shockwave at 1.35 seconds
      if (elapsed >= 1350 && !burstTriggered) {
        burstTriggered = true;
        if (centerpiece) centerpiece.classList.add('bursting');
        if (burstRing) {
          burstRing.className = 'warp-burst-ring active';
          if (highestRarity === 5) burstRing.style.borderColor = '#fde047';
          else if (highestRarity === 4) burstRing.style.borderColor = '#c084fc';
          else burstRing.style.borderColor = '#38bdf8';
        }
        playUiSound('warp_burst');
        setTimeout(() => {
          if (highestRarity === 5) playUiSound('gold_fanfare');
          else if (highestRarity === 4) playUiSound('purple_chime');
        }, 120);
      }

      // Finish sequence at 2.1 seconds
      if (elapsed >= 2100 && !isFinished) {
        isFinished = true;
        cleanupAndFinish();
        return;
      }

      if (!isFinished) {
        warpCanvasAnimId = requestAnimationFrame(renderFrame);
      }
    }

    function cleanupAndFinish() {
      if (warpCanvasAnimId) {
        cancelAnimationFrame(warpCanvasAnimId);
        warpCanvasAnimId = null;
      }
      if (centerpiece) centerpiece.classList.remove('bursting');
      if (burstRing) burstRing.classList.remove('active');
      ctx.clearRect(0, 0, width, height);

      if (gachaWarpCinematic) {
        gachaWarpCinematic.style.display = 'none';
        gachaWarpCinematic.setAttribute('aria-hidden', 'true');
      }

      if (typeof onFinish === 'function') {
        onFinish();
      }
    }

    cancelWarpAnimationFn = () => {
      isFinished = true;
      cleanupAndFinish();
    };

    warpCanvasAnimId = requestAnimationFrame(renderFrame);
  }

  function triggerWarpSequence(items = [], summaryText = 'Resultado del Salto', pullType = 'single') {
    lastPullType = pullType;
    if (!items || items.length === 0) return;

    // Send P2P live notification if 4★ or 5★ characters obtained
    items.forEach(it => {
      if (it.rarity >= 4) {
        sendP2PMessage('GACHA_PULL', {
          name: it.name,
          rarity: it.rarity,
          itemType: it.type || 'character',
          username: userProfile.username || 'Trazacaminos'
        });
      }
    });

    const highestRarity = Math.max(...items.map(i => i.rarity || 3));

    if (gachaWarpCinematic) {
      gachaWarpCinematic.style.display = 'flex';
      gachaWarpCinematic.setAttribute('aria-hidden', 'false');
    }

    const titleEl = document.getElementById('warpCinematicTitle');
    if (titleEl) {
      titleEl.textContent = `✦ HIPERESPACIO // SALTO ASTRAL (${items.length} ${items.length === 1 ? 'OBJETO' : 'OBJETOS'})`;
    }

    playUiSound('warp_start');

    initWarpCanvasAnimation(highestRarity, () => {
      openGachaRevealModal(items, summaryText);
    });
  }

  function executeStarterPull() {
    if (!currentGachaSession) return;
    const ownedArr = Array.from(ownedCharacterIds);
    const res = HSR_GAME_MODES.pullStarterSquad(currentGachaSession, characters, ownedArr);
    if (res.error) {
      showToast(res.error, 'warn');
      return;
    }

    saveGachaSession();
    triggerWarpSequence(res.items, '¡Salto Inicial Gratis! Escuadra Operativa Lista', 'starter');
    renderGachaUI();
    showToast('¡Escuadra inicial garantizada (DPS, Sub-DPS, Soporte, Sustento)!', 'success');
  }

  function executeSinglePull() {
    if (!currentGachaSession) return;
    const ownedArr = Array.from(ownedCharacterIds);
    const res = HSR_GAME_MODES.pullSingle(currentGachaSession, characters, ownedArr);
    if (res.error) {
      showToast(res.error, 'warn');
      return;
    }

    saveGachaSession();
    triggerWarpSequence([res.result], `Salto Astral #${res.result.pullIndex}`, 'single');
    renderGachaUI();
  }

  function executeTenPull() {
    if (!currentGachaSession) return;
    const ownedArr = Array.from(ownedCharacterIds);
    const res = HSR_GAME_MODES.pullTen(currentGachaSession, characters, ownedArr);
    if (res.error) {
      showToast(res.error, 'warn');
      return;
    }

    saveGachaSession();
    const rangeText = `Tirada Múltiple x10 (Tiradas #${res.results[0]?.pullIndex || 1} - #${res.results[res.results.length - 1]?.pullIndex || 10})`;
    triggerWarpSequence(res.results, rangeText, 'ten');
    renderGachaUI();
  }

  function openGachaRevealModal(items = [], summaryText = 'Resultado del Salto') {
    if (!gachaRevealModal || !gachaRevealCardsGrid) return;
    if (gachaRevealSummaryText) gachaRevealSummaryText.textContent = summaryText;

    if (gachaRevealPullAgainBtn) {
      if (lastPullType === 'ten') {
        gachaRevealPullAgainBtn.textContent = '✦ Saltar x10 de Nuevo';
      } else if (lastPullType === 'starter' && !currentGachaSession.freeStarterClaimed) {
        gachaRevealPullAgainBtn.textContent = '✦ Salto Inicial (10x)';
      } else {
        gachaRevealPullAgainBtn.textContent = '✦ Saltar x1 de Nuevo';
      }
    }

    gachaRevealCardsGrid.innerHTML = items.map((item, idx) => {
      const isChar = item.type === 'character' || (item.rarity >= 4 && (item.element || item.path));
      const rarity = item.rarity || 3;
      const rarityClass = `rarity-${rarity}`;
      const starsClass = `star-${rarity}`;
      const stars = '✦'.repeat(rarity);

      let visualImg = '';
      let subInfo = '';

      if (isChar) {
        const iconSrc = getCharAvatar(item);
        visualImg = `<div class="reveal-card-visual char-visual"><img src="${iconSrc}" alt="${item.name}" loading="lazy"></div>`;
        const elemName = item.element?.name || '';
        const pathName = item.path?.name || '';
        subInfo = elemName && pathName ? `${elemName} • ${pathName}` : (elemName || pathName || 'Personaje');
      } else {
        const coneImg = getLightConeImg(item);
        visualImg = `<div class="reveal-card-visual cone-visual"><img src="${coneImg}" alt="${item.name}" loading="lazy"></div>`;
        subInfo = item.pathName || item.path ? `Cono • ${item.pathName || item.path}` : 'Cono de Luz 3★';
      }

      return `
        <div class="gacha-reveal-card ${rarityClass}" style="animation-delay: ${idx * 0.05}s;">
          ${visualImg}
          <div class="reveal-card-name">${item.name}</div>
          <div class="reveal-card-stars ${starsClass}">${stars}</div>
          <div style="font-size: 0.65rem; color: var(--text-muted);">${item.note || subInfo}</div>
        </div>
      `;
    }).join('');

    gachaRevealModal.classList.add('open');
    gachaRevealModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeGachaRevealModal() {
    if (!gachaRevealModal) return;
    gachaRevealModal.classList.remove('open');
    gachaRevealModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    playUiSound('click');
  }

  function openSquadSwapModal(slotIndex) {
    if (!squadSwapModal || !currentGachaSession) return;
    activeSwapSlotIndex = slotIndex;
    const inv = currentGachaSession.inventory || [];
    const roleLabels = ['DPS Principal', 'Sub-DPS / Buffer', 'Soporte Táctico', 'Sostenimiento'];

    if (squadSwapTitle) squadSwapTitle.textContent = `Asignar a Posición ${slotIndex + 1} [${roleLabels[slotIndex]}]`;

    if (inv.length === 0) {
      squadSwapGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 24px; color: var(--text-muted); font-size: 0.78rem;">
          No tienes personajes en tu inventario. Tira en el Gachapón para reclutar.
        </div>
      `;
    } else {
      const sorted = [...inv].sort((a, b) => (b.rarity - a.rarity) || a.name.localeCompare(b.name));
      squadSwapGrid.innerHTML = sorted.map(c => {
        const rarityClass = c.rarity === 5 ? 'rarity-5' : 'rarity-4';
        return `
          <div class="swap-pick-card ${rarityClass}" data-char-id="${c.id}">
            <img src="${getCharAvatar(c)}" alt="${c.name}">
            <div class="swap-pick-card-name">${c.name}</div>
            <div style="font-size: 0.64rem; color: ${c.rarity === 5 ? '#fde047' : '#c084fc'};">${c.rarity}★ • ${c.element?.name || ''}</div>
          </div>
        `;
      }).join('');

      squadSwapGrid.querySelectorAll('.swap-pick-card').forEach(card => {
        card.addEventListener('click', () => {
          const cid = card.dataset.charId;
          HSR_GAME_MODES.swapSquadMember(currentGachaSession, activeSwapSlotIndex, cid);
          saveGachaSession();
          renderGachaSquad();
          closeSquadSwapModal();
          playUiSound('click');
          showToast(`¡${HSR_GAME_MODES.getCharacterById(cid)?.name} asignado a la Posición ${activeSwapSlotIndex + 1}!`, 'success');
        });
      });
    }

    squadSwapModal.classList.add('open');
    squadSwapModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeSquadSwapModal() {
    if (!squadSwapModal) return;
    squadSwapModal.classList.remove('open');
    squadSwapModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function exportSquadToDuel() {
    if (!currentGachaSession || !currentGachaSession.activeSquad) {
      showToast('No hay una escuadra activa en el Gachapón.', 'warn');
      return;
    }
    const squad = currentGachaSession.activeSquad.filter(Boolean);
    if (squad.length === 0) {
      showToast('Primero realiza tiradas o el Salto Inicial para formar tu escuadra.', 'warn');
      return;
    }
    if (!currentDuelMatch) {
      generateDuel();
    }
    currentDuelMatch.node1 = [...squad];
    renderDuelSlots(p1Node1Grid, currentDuelMatch.node1);
    switchTab('duel', true);
    showToast('¡Escuadra del Gachapón transferida al Nodo 1 del Duelo Endgame!', 'success');
    playUiSound('fanfare');
  }

  function exportSquadToExpedition() {
    if (!currentGachaSession || !currentGachaSession.activeSquad) {
      showToast('No hay una escuadra activa en el Gachapón.', 'warn');
      return;
    }
    const squad = currentGachaSession.activeSquad.filter(Boolean);
    if (squad.length === 0) {
      showToast('Primero realiza tiradas o el Salto Inicial para formar tu escuadra.', 'warn');
      return;
    }
    if (!currentExpeditionChallenge) {
      generateExpedition();
    }
    currentExpeditionChallenge.team = [...squad];
    renderExpeditionChallenge();
    switchTab('universe', true);
    showToast('¡Escuadra del Gachapón transferida a la Expedición Orbital!', 'success');
    playUiSound('fanfare');
  }

  function copyGachaAuditReport() {
    if (!currentGachaSession) return;
    const report = HSR_GAME_MODES.generateGachaAuditReport(currentGachaSession);
    copyToClipboard(report, '¡Acta de auditoría del Gachapón copiada al portapapeles!');
  }

  function copyGachaSeed() {
    if (!currentGachaSession) return;
    copyToClipboard(currentGachaSession.seed, 'Código de sesión del Gachapón copiado');
  }

  function resetGachaSession() {
    if (confirm('¿Reiniciar sesión del Gachapón? Se restablecerán tus tiradas, inventario y escuadra activa con un nuevo código de auditoría.')) {
      currentGachaSession = HSR_GAME_MODES.createGachaSession(currentGachaBannerId, currentGachaLimit);
      saveGachaSession();
      renderGachaUI();
      showToast('Sesión de Gachapón reiniciada con éxito', '↻');
      playUiSound('click');
    }
  }

  /* ==========================================================================
     EVENT LISTENERS SETUP
     ========================================================================== */
  function setupEventListeners() {
    // Navigation Tabs
    mainNavTabs.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-tab]');
      if (!btn) return;
      playUiSound('click');
      switchTab(btn.dataset.tab, true);
    });

    window.addEventListener('hashchange', handleHashNavigation);

    // Audio Mute Toggle
    soundToggleBtn.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      localStorage.setItem('hsr_sound_enabled', String(soundEnabled));
      updateAudioUI();
      if (soundEnabled) playUiSound('click');
      showToast(soundEnabled ? 'Efectos de sonido táctiles activados' : 'Efectos de sonido silenciados', soundEnabled ? 'sound_on' : 'sound_off');
    });

    // Profile Modal
    openProfileModalBtn.addEventListener('click', openProfileModal);
    profileModalCloseBtn.addEventListener('click', closeProfileModal);
    saveProfileBtn.addEventListener('click', saveProfile);
    exportSettingsJsonBtn.addEventListener('click', exportAllDataAsJson);
    importSettingsFileInput.addEventListener('change', handleImportJsonFile);
    resetAllSettingsBtn.addEventListener('click', resetAllData);
    profileModal.addEventListener('click', (e) => {
      if (e.target === profileModal) closeProfileModal();
    });

    // Theme Toggle
    themeToggleBtn.addEventListener('click', () => {
      playUiSound('click');
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
    });

    // Quick Share Room Button & Independent Multiplayer Modal
    if (quickShareRoomBtn) {
      quickShareRoomBtn.addEventListener('click', () => {
        openShareRoomModal();
      });
    }

    if (shareRoomModalCloseBtn) {
      shareRoomModalCloseBtn.addEventListener('click', closeShareRoomModal);
    }
    if (shareModalDoneBtn) {
      shareModalDoneBtn.addEventListener('click', closeShareRoomModal);
    }
    if (shareRoomModal) {
      shareRoomModal.addEventListener('click', (e) => {
        if (e.target === shareRoomModal) closeShareRoomModal();
      });
    }
    if (shareEditProfileBtn) {
      shareEditProfileBtn.addEventListener('click', () => {
        closeShareRoomModal();
        openProfileModal();
      });
    }
    if (createP2pRoomBtn) {
      createP2pRoomBtn.addEventListener('click', () => {
        initP2PHost();
      });
    }
    if (copyP2pCodeBtn) {
      copyP2pCodeBtn.addEventListener('click', () => {
        if (currentP2pRoomCode && currentP2pRoomCode !== '---') {
          copyToClipboard(currentP2pRoomCode, `Código de sala ${currentP2pRoomCode} copiado`);
        } else {
          showToast('Genera una sala primero pulsando el botón ✦', 'warn');
        }
      });
    }
    if (connectP2pBtn) {
      connectP2pBtn.addEventListener('click', () => {
        const code = (joinP2pCodeInput?.value || '').trim();
        if (!code) {
          showToast('Introduce el código de sala que te dio tu amigo (Ej. HSR-7429)', 'warn');
          return;
        }
        joinP2PRoom(code);
      });
    }
    if (joinP2pCodeInput) {
      joinP2pCodeInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          connectP2pBtn?.click();
        }
      });
    }
    if (shareModalCopyUrlBtn) {
      shareModalCopyUrlBtn.addEventListener('click', () => {
        const url = shareModalFullUrlInput?.value;
        if (url) {
          copyToClipboard(url, '¡Enlace de sala completo copiado al portapapeles!');
        }
      });
    }
    if (disconnectRoomBtn) {
      disconnectRoomBtn.addEventListener('click', disconnectP2P);
    }

    // Roster Collection Modal Events
    openRosterModalBtn.addEventListener('click', openRosterModal);
    rouletteConfigRosterBtn.addEventListener('click', openRosterModal);
    rosterModalCloseBtn.addEventListener('click', closeRosterModal);
    rosterSaveBtn.addEventListener('click', () => {
      closeRosterModal();
      showToast('Colección de personajes guardada y aplicada', 'success');
      playUiSound('click');
      if (document.querySelector('.nav-tab-btn.active')?.dataset.tab === 'roulette') {
        spinRoulette(null, false);
      }
    });

    rosterMasterToggle.addEventListener('change', (e) => {
      isRosterFilterActive = e.target.checked;
      saveOwnedRoster();
      playUiSound('click');
      showToast(isRosterFilterActive ? 'Filtro de colección activado' : 'Filtro de colección desactivado', isRosterFilterActive ? 'success' : 'error');
    });

    rosterSearchInput.addEventListener('input', (e) => {
      renderRosterTiles(e.target.value);
    });

    rosterSelectAllBtn.addEventListener('click', () => {
      characters.forEach(c => ownedCharacterIds.add(String(c.id)));
      saveOwnedRoster();
      renderRosterTiles(rosterSearchInput.value);
      showToast('Todos los personajes marcados como obtenidos', 'success');
      playUiSound('click');
    });

    rosterDeselectAllBtn.addEventListener('click', () => {
      ownedCharacterIds.clear();
      saveOwnedRoster();
      renderRosterTiles(rosterSearchInput.value);
      showToast('Todos los personajes desmarcados', 'error');
      playUiSound('click');
    });

    rosterSelectFourStarsBtn.addEventListener('click', () => {
      ownedCharacterIds.clear();
      characters.filter(c => c.rarity === 4).forEach(c => ownedCharacterIds.add(String(c.id)));
      saveOwnedRoster();
      renderRosterTiles(rosterSearchInput.value);
      showToast('Seleccionados únicamente personajes de 4 estrellas (F2P)', 'info');
      playUiSound('click');
    });

    // Catalog Search
    searchInput.addEventListener('input', (e) => {
      filterState.search = e.target.value.trim();
      searchClearBtn.style.display = filterState.search ? 'flex' : 'none';
      renderCharacters();
    });

    searchClearBtn.addEventListener('click', () => {
      searchInput.value = '';
      filterState.search = '';
      searchClearBtn.style.display = 'none';
      searchInput.focus();
      renderCharacters();
      playUiSound('click');
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey && e.key === 'k') || e.key === '/') {
        if (document.activeElement !== searchInput && pages.catalog.style.display !== 'none' && !rosterModal.classList.contains('open') && !profileModal.classList.contains('open')) {
          e.preventDefault();
          searchInput.focus();
          searchInput.select();
        }
      } else if (e.key === 'Escape') {
        if (profileModal.classList.contains('open')) closeProfileModal();
        if (rosterModal.classList.contains('open')) closeRosterModal();
        if (characterModal.classList.contains('open')) closeCharacterModal();
      }
    });

    // View Switcher & CSV
    viewTableBtn.addEventListener('click', () => {
      playUiSound('click');
      setViewMode('table');
    });
    viewCardsBtn.addEventListener('click', () => {
      playUiSound('click');
      setViewMode('cards');
    });
    exportCsvBtn.addEventListener('click', exportCharactersToCsv);

    // Filter Chips
    document.getElementById('roleFilters').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-filter-role]');
      if (!btn) return;
      playUiSound('click');
      document.querySelectorAll('#roleFilters .filter-chip').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      filterState.role = btn.dataset.filterRole;
      renderCharacters();
    });

    document.getElementById('elementFilters').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-filter-elem]');
      if (!btn) return;
      playUiSound('click');
      document.querySelectorAll('#elementFilters .filter-chip').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      filterState.element = btn.dataset.filterElem;
      renderCharacters();
    });

    document.getElementById('pathFilters').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-filter-path]');
      if (!btn) return;
      playUiSound('click');
      document.querySelectorAll('#pathFilters .filter-chip').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      filterState.path = btn.dataset.filterPath;
      renderCharacters();
    });

    document.getElementById('rarityFilters').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-filter-rarity]');
      if (!btn) return;
      playUiSound('click');
      document.querySelectorAll('#rarityFilters .filter-chip').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      filterState.rarity = btn.dataset.filterRarity;
      renderCharacters();
    });

    const resetFilters = () => {
      filterState = { search: '', role: 'ALL', element: 'ALL', path: 'ALL', rarity: 'ALL' };
      searchInput.value = '';
      searchClearBtn.style.display = 'none';

      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      document.querySelector('[data-filter-role="ALL"]').classList.add('active');
      document.querySelector('[data-filter-elem="ALL"]').classList.add('active');
      document.querySelector('[data-filter-path="ALL"]').classList.add('active');
      document.querySelector('[data-filter-rarity="ALL"]').classList.add('active');

      renderCharacters();
      playUiSound('click');
    };

    clearAllFiltersBtn.addEventListener('click', resetFilters);
    resetFiltersFromEmptyBtn.addEventListener('click', resetFilters);

    // Table Header Sorting
    document.querySelectorAll('.fluent-table th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        playUiSound('click');
        const col = th.dataset.sort;
        if (sortState.column === col) {
          sortState.ascending = !sortState.ascending;
        } else {
          sortState.column = col;
          sortState.ascending = true;
        }

        document.querySelectorAll('.fluent-table th').forEach(h => {
          h.classList.remove('sorted');
          const icon = h.querySelector('.sort-icon');
          if (icon) icon.textContent = '◆';
        });

        th.classList.add('sorted');
        const icon = th.querySelector('.sort-icon');
        if (icon) icon.textContent = sortState.ascending ? '▲' : '▼';

        renderCharacters();
      });
    });

    // Roulette Handlers
    document.querySelectorAll('#pageRoulette .roulette-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        playUiSound('click');
        document.querySelectorAll('#pageRoulette .roulette-pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentRouletteMode = btn.dataset.rouletteMode;
        spinRoulette(null, true);
      });
    });

    spinRouletteBtn.addEventListener('click', () => spinRoulette(null, true));

    copyTeamLinkBtn.addEventListener('click', () => {
      if (currentRouletteTeam.length === 4) {
        const teamIds = currentRouletteTeam.map(c => c.id).join(',');
        const url = window.location.origin + window.location.pathname + `#tab=roulette&team=${teamIds}`;
        copyToClipboard(url, '¡Enlace de equipo copiado! Tu amigo verá exactamente esta escuadra.');
      }
    });

    rouletteOnlyFourStars.addEventListener('change', () => spinRoulette(null, true));
    rouletteCaptainSelect.addEventListener('change', () => spinRoulette(null, true));

    // Endgame 1v1 Arena Mode Selector Pills
    if (endgameModePills) {
      endgameModePills.querySelectorAll('.roulette-pill-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          endgameModePills.querySelectorAll('.roulette-pill-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          currentEndgameMode = btn.dataset.endgame;
          currentDuelSeasonId = null;
          renderEndgameSeasonPills();
          playUiSound('click');
          generateDuel();
        });
      });
    }

    newDuelMatchBtn.addEventListener('click', () => {
      playUiSound('click');
      generateDuel();
      if (p2pRole === 'host' && currentDuelMatch) {
        sendP2PMessage('NEW_DUEL', { mode: currentEndgameMode, seed: currentDuelMatch.seed });
      }
    });

    copyDuelLinkBtn.addEventListener('click', () => {
      openShareRoomModal();
    });

    if (p1ScoreInput) {
      p1ScoreInput.addEventListener('input', () => {
        if (p2pRole !== 'guest') {
          sendP2PMessage('DUEL_SCORE', { score: p1ScoreInput.value });
        }
      });
    }

    if (p2ScoreInput) {
      p2ScoreInput.addEventListener('input', () => {
        if (p2pRole === 'guest') {
          sendP2PMessage('DUEL_SCORE', { score: p2ScoreInput.value });
        }
      });
    }

    calculateWinnerBtn.addEventListener('click', () => calculateDuelResult(true));

    // Universe / Expedition Handlers
    if (expeditionModePills) {
      expeditionModePills.querySelectorAll('.roulette-pill-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          expeditionModePills.querySelectorAll('.roulette-pill-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          currentExpeditionMode = btn.dataset.expedition;
          playUiSound('click');
          generateExpedition();
          if (p2pRole === 'host' && currentExpeditionChallenge) {
            sendP2PMessage('NEW_EXPEDITION', { mode: currentExpeditionMode, seed: currentExpeditionChallenge.seed });
          }
        });
      });
    }

    newUnivChallengeBtn.addEventListener('click', () => {
      playUiSound('click');
      generateExpedition();
      if (p2pRole === 'host' && currentExpeditionChallenge) {
        sendP2PMessage('NEW_EXPEDITION', { mode: currentExpeditionMode, seed: currentExpeditionChallenge.seed });
      }
    });

    copyUnivChallengeBtn.addEventListener('click', () => {
      openShareRoomModal();
    });

    calculateExpeditionBtn.addEventListener('click', () => calculateExpeditionResult(true));
    resetExpeditionChecklistBtn.addEventListener('click', resetExpeditionChecklist);
    p1BonusInput.addEventListener('input', () => {
      updateLiveExpeditionScore();
      if (p2pRole !== 'guest') {
        sendP2PMessage('EXPEDITION_BONUS', { value: p1BonusInput.value });
      }
    });
    p2BonusInput.addEventListener('input', () => {
      updateLiveExpeditionScore();
      if (p2pRole === 'guest') {
        sendP2PMessage('EXPEDITION_BONUS', { value: p2BonusInput.value });
      }
    });

    // Gacha Handlers
    if (resetGachaSessionBtn) resetGachaSessionBtn.addEventListener('click', resetGachaSession);
    if (copyGachaSeedBtn) copyGachaSeedBtn.addEventListener('click', copyGachaSeed);
    if (copyGachaAuditBtn) copyGachaAuditBtn.addEventListener('click', copyGachaAuditReport);
    if (exportSquadToExpeditionBtn) exportSquadToExpeditionBtn.addEventListener('click', exportSquadToExpedition);
    if (exportSquadToDuelBtn) exportSquadToDuelBtn.addEventListener('click', exportSquadToDuel);

    if (applyGachaCustomLimitBtn) applyGachaCustomLimitBtn.addEventListener('click', applyCustomPullLimit);
    if (addGachaCustomPullsBtn) addGachaCustomPullsBtn.addEventListener('click', addCustomPullsToLimit);
    if (gachaCustomLimitInput) {
      gachaCustomLimitInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          applyCustomPullLimit();
        }
      });
    }

    if (gachaSyncRosterToggle) {
      gachaSyncRosterToggle.addEventListener('change', (e) => {
        currentGachaSyncRoster = e.target.checked;
        if (currentGachaSession) {
          currentGachaSession.filterByOwnedRoster = currentGachaSyncRoster;
          saveGachaSession();
        }
        playUiSound('click');
        updateGachaPoolStatusBadge();
        renderGachaBannerStage();
        showToast(
          currentGachaSyncRoster
            ? 'Gachapón sincronizado: solo saldrán personajes de tu colección'
            : 'Gachapón global: todos los personajes disponibles en el universo de salto',
          'info'
        );
      });
    }

    if (applyGachaCustomPityBtn) applyGachaCustomPityBtn.addEventListener('click', applyCustomPityTarget);
    if (gachaCustomPityInput) {
      gachaCustomPityInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          applyCustomPityTarget();
        }
      });
    }

    if (skipWarpAnimationBtn) {
      skipWarpAnimationBtn.addEventListener('click', () => {
        if (typeof cancelWarpAnimationFn === 'function') {
          cancelWarpAnimationFn();
        }
      });
    }

    if (gachaRevealPullAgainBtn) {
      gachaRevealPullAgainBtn.addEventListener('click', () => {
        closeGachaRevealModal();
        if (lastPullType === 'ten') {
          executeTenPull();
        } else if (lastPullType === 'starter' && !currentGachaSession?.freeStarterClaimed) {
          executeStarterPull();
        } else {
          executeSinglePull();
        }
      });
    }

    if (gachaRevealCloseBtn) gachaRevealCloseBtn.addEventListener('click', closeGachaRevealModal);
    if (gachaRevealModal) {
      gachaRevealModal.addEventListener('click', (e) => {
        if (e.target === gachaRevealModal) closeGachaRevealModal();
      });
    }

    if (squadSwapCloseBtn) squadSwapCloseBtn.addEventListener('click', closeSquadSwapModal);
    if (squadSwapModal) {
      squadSwapModal.addEventListener('click', (e) => {
        if (e.target === squadSwapModal) closeSquadSwapModal();
      });
    }

    // Modal Close Handlers
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeCharacterModal);
    if (characterModal) {
      characterModal.addEventListener('click', (e) => {
        if (e.target === characterModal) closeCharacterModal();
      });
    }
    if (rosterModal) {
      rosterModal.addEventListener('click', (e) => {
        if (e.target === rosterModal) closeRosterModal();
      });
    }

    // Friend Inspection Modal Event Handlers
    if (openFriendInspectBannerBtn) {
      openFriendInspectBannerBtn.addEventListener('click', () => openFriendInspectModal('roulette'));
    }
    if (rouletteFriendViewBtn) {
      rouletteFriendViewBtn.addEventListener('click', () => openFriendInspectModal('roulette'));
    }
    if (gachaFriendViewBtn) {
      gachaFriendViewBtn.addEventListener('click', () => openFriendInspectModal('gacha'));
    }
    if (expeditionFriendViewBtn) {
      expeditionFriendViewBtn.addEventListener('click', () => openFriendInspectModal('expedition'));
    }
    if (friendInspectModalCloseBtn) {
      friendInspectModalCloseBtn.addEventListener('click', closeFriendInspectModal);
    }
    if (friendInspectDoneBtn) {
      friendInspectDoneBtn.addEventListener('click', closeFriendInspectModal);
    }
    if (friendInspectModal) {
      friendInspectModal.addEventListener('click', (e) => {
        if (e.target === friendInspectModal) closeFriendInspectModal();
      });
    }
    if (refreshFriendDataBtn) {
      refreshFriendDataBtn.addEventListener('click', requestFriendDataRefresh);
    }
    if (friendInspectOpenShareBtn) {
      friendInspectOpenShareBtn.addEventListener('click', () => {
        closeFriendInspectModal();
        openShareRoomModal();
      });
    }
    if (friendNavPills) {
      friendNavPills.querySelectorAll('.friend-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          playUiSound('click');
          switchFriendTab(btn.dataset.friendTab);
          renderFriendInspectUI();
        });
      });
    }
  }

  // Initialize platform after all modules and event listeners are declared
  init();

});
