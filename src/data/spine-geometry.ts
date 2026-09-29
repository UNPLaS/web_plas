/** Geometría compartida: diagonal del hero + primer tramo del spine. */

/**
 * Avance horizontal por cada px vertical (y hacia abajo).
 * Mayor = diagonal más plana (menos vertical).
 * Se mantiene en todos los rebotes (|pendiente| constante).
 * Igual a los bordes largos del símbolo "S" del logo PLaS (≈35.2° sobre la horizontal).
 */
export const SPINE_DX_PER_DY = 1.416;

/**
 * Origen del primer tramo, como fracción del ancho de página (0–1).
 * Más alto = nace más a la derecha.
 */
export const SPINE_START_X_FRAC = 0.96;

/**
 * Distancia horizontal mínima (px) entre el texto del hero y la diagonal (desktop).
 * Si el texto no cabe, el origen se corre a la derecha de SPINE_START_X_FRAC.
 */
export const HERO_TEXT_CLEARANCE_PX = 32;