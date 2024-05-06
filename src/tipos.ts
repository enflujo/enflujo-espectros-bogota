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
