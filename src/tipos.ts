import type { MeydaAnalyzer } from 'meyda/dist/esm/meyda-wa';

export interface FFTComplejo {
  re: number;
  im: number;
  magnitude: number;
  phase: number;
}

export interface BarraEspectrograma {
  lo: number;
  hi: number;
  start: number;
  end: number;
}

export type TColor = {
  r: number;
  g: number;
  b: number;
};

export type TBandas = {
  lo: number;
  ctr: number;
  hi: number;
};

export type TSubtitulo = {
  tiempoInicial: number;
  tiempoFinal: number;
  texto: string;
};

export type TLugar = {
  rutaAudio: string;
  imagenes: string[];
  analizadorMeyda?: MeydaAnalyzer;
  subtitulos: TSubtitulo[];
};

export type TImagenes = { [nombre: string]: { ruta: string; img: HTMLImageElement; ancho: number; alto: number } };
