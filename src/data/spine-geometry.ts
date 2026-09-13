/** Geometría compartida: diagonal del hero + primer tramo del spine. */

/**
 * Avance horizontal por cada px vertical (y hacia abajo).
 * Mayor = diagonal más plana (menos vertical).
 * Se mantiene en todos los rebotes (|pendiente| constante).
 */
export const SPINE_DX_PER_DY = 1.55;

/**
 * Origen del primer tramo, como fracción del ancho de página (0–1).
 * Más alto = nace más a la derecha.
 */
export const SPINE_START_X_FRAC = 0.9;

/** Número de rebotes en bordes laterales (después del origen). */
export const SPINE_MAX_BOUNCES = 4;
