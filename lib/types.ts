// Tipos oficiales para odds_window.json
// ------------------------------------

// Representa UN partido dentro de odds_window.json
export interface OddsWindowGame {
  id: string;

  // Equipos (pueden venir después, por eso son opcionales)
  home?: string;
  away?: string;

  // Apertura (open) - estos ya existen hoy en tu JSON
  totalOpen: number | null;
  spreadOpen: number | null;

  // Cierre pre-game (última línea antes del tip-off)
  totalPregameClose?: number | null;
  spreadPregameClose?: number | null;

  // Último valor live visto (mercado en partido en curso)
  totalLiveLast?: number | null;
  spreadLiveLast?: number | null;

  // Timestamps asociados al seguimiento del mercado
  timestamps?: {
    createdAt?: string;          // cuándo detectamos el juego por primera vez
    openCapturedAt?: string;     // cuándo fijamos la apertura
    pregameCapturedAt?: string | null; // cuándo fijamos el cierre pre-game
    liveUpdatedAt?: string | null;     // última vez que actualizamos live
  };
}

// Representa TODO el archivo odds_window.json
// Es un diccionario: gameId -> OddsWindowGame
export type OddsWindowStore = Record<string, OddsWindowGame>;
// Snapshots de cuotas para pendiente/momentum
export interface OddsSnapshot {
  timestamp: string;       // ISO string
  total: number | null;    // OU en ese momento
  spread: number | null;   // spread home en ese momento
}

// Tipos oficiales para odds_window.json
// ------------------------------------

// Representa UN partido dentro de odds_window.json
export interface OddsWindowGame {
  id: string;

  // Equipos (pueden venir después, por eso son opcionales)
  home?: string;
  away?: string;

  // Apertura (open) - estos ya existen hoy en tu JSON
  totalOpen: number | null;
  spreadOpen: number | null;

  // Cierre pre-game (última línea antes del tip-off)
  totalPregameClose?: number | null;
  spreadPregameClose?: number | null;

  // Último valor live visto (mercado en partido en curso)
  totalLiveLast?: number | null;
  spreadLiveLast?: number | null;

  // Historial de snapshots para pendiente (pre-game/live)
  snapshotHistory?: OddsSnapshot[];

  // Timestamps asociados al seguimiento del mercado
  timestamps?: {
    createdAt?: string;              // cuándo detectamos el juego por primera vez
    openCapturedAt?: string;         // cuándo fijamos la apertura
    pregameCapturedAt?: string | null; // cuándo fijamos el cierre pre-game
    liveUpdatedAt?: string | null;     // última vez que actualizamos live
  };
}

// Representa TODO el archivo odds_window.json
// Es un diccionario: gameId -> OddsWindowGame
export type OddsWindowStore = Record<string, OddsWindowGame>;

