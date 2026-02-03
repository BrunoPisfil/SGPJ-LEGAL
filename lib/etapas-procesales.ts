/**
 * Utilidades para manejar etapas procesales y tipos de composición del tribunal
 */

export const ETAPAS_PROCESALES = {
  INVESTIGACION_PREPARATORIA: "investigación_preparatoria",
  ETAPA_INTERMEDIA: "etapa_intermedia",
  JUZGAMIENTO: "juzgamiento",
} as const;

export const TIPOS_COMPOSICION = {
  UNIPERSONAL: "unipersonal",
  COLEGIADO: "colegiado",
} as const;

export type EtapaProcesalType = typeof ETAPAS_PROCESALES[keyof typeof ETAPAS_PROCESALES];
export type TipoComposicionType = typeof TIPOS_COMPOSICION[keyof typeof TIPOS_COMPOSICION];

/**
 * Opciones de etapas procesales para select
 */
export const OPCIONES_ETAPAS_PROCESALES = [
  {
    value: ETAPAS_PROCESALES.INVESTIGACION_PREPARATORIA,
    label: "Investigación Preparatoria",
    descripcion: "Etapa inicial donde se recopila evidencia",
  },
  {
    value: ETAPAS_PROCESALES.ETAPA_INTERMEDIA,
    label: "Etapa Intermedia",
    descripcion: "Etapa de revisión y determinación de cargos",
  },
  {
    value: ETAPAS_PROCESALES.JUZGAMIENTO,
    label: "Juzgamiento",
    descripcion: "Etapa de juicio oral y sentencia",
  },
];

/**
 * Opciones de tipo de composición para select
 */
export const OPCIONES_TIPOS_COMPOSICION = [
  {
    value: TIPOS_COMPOSICION.UNIPERSONAL,
    label: "Unipersonal",
    descripcion: "Un juez",
  },
  {
    value: TIPOS_COMPOSICION.COLEGIADO,
    label: "Colegiado",
    descripcion: "Panel de tres jueces",
  },
];

/**
 * Obtiene las opciones de tipo de composición disponibles para una etapa dada
 * El tipo de composición solo aplica para etapa intermedia
 */
export const getOpcionesTipoComposicion = (etapa?: EtapaProcesalType): typeof OPCIONES_TIPOS_COMPOSICION | [] => {
  if (!etapa || etapa !== ETAPAS_PROCESALES.ETAPA_INTERMEDIA) {
    return [];
  }
  return OPCIONES_TIPOS_COMPOSICION;
};

/**
 * Valida que el tipo de composición sea válido para la etapa dada
 */
export const esValidoTipoComposicion = (
  tipoComposicion: TipoComposicionType | undefined,
  etapa: EtapaProcesalType | undefined
): boolean => {
  if (!tipoComposicion) return true; // Es opcional
  if (!etapa) return false;
  
  return etapa === ETAPAS_PROCESALES.ETAPA_INTERMEDIA;
};

/**
 * Obtiene el label en español para una etapa procesal
 */
export const getLabelEtapa = (etapa: EtapaProcesalType): string => {
  const opcion = OPCIONES_ETAPAS_PROCESALES.find((o) => o.value === etapa);
  return opcion?.label || etapa;
};

/**
 * Obtiene el label en español para un tipo de composición
 */
export const getLabelTipoComposicion = (tipo: TipoComposicionType): string => {
  const opcion = OPCIONES_TIPOS_COMPOSICION.find((o) => o.value === tipo);
  return opcion?.label || tipo;
};
