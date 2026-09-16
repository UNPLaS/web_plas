/** Tipologías de publicaciones del blog / novedades. */
export const TYPOLOGIES = {
  evento: { id: 'evento', label: 'Evento' },
  proyecto: { id: 'proyecto', label: 'Proyecto' },
  publicacion: { id: 'publicacion', label: 'Publicación' },
  recurso: { id: 'recurso', label: 'Recurso' },
} as const;

export type TypologyId = keyof typeof TYPOLOGIES;

export function resolveTypology(id: string | undefined | null) {
  if (id && id in TYPOLOGIES) return TYPOLOGIES[id as TypologyId];
  return TYPOLOGIES.evento;
}
