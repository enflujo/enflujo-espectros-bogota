export default (
  estados: { [nombre: string]: boolean },
  segundos: number,
  espectroAmplitud: Float32Array,
  zcr: number
) => {
  // cambiar booleanos a verdadero para mostrar elementos si se cumplen condiciones de tiempo y frecuencia
  estados.copeton =
    segundos > 24.5 &&
    segundos < 26 &&
    espectroAmplitud[92] >= 3 &&
    espectroAmplitud[78] <= 2 &&
    espectroAmplitud[27] < 3 &&
    zcr > 150;

  estados.narizPerro =
    (segundos > 36.2 && segundos < 36.25) ||
    (segundos > 39.3 && segundos < 39.4) ||
    (segundos > 42 && segundos < 42.1) ||
    (segundos > 46.4 && segundos < 46.45) ||
    (segundos > 47 && segundos < 47.05) ||
    (segundos > 48.2 && segundos < 48.25) ||
    (segundos > 49 && segundos < 49.05) ||
    (segundos > 114.5 && segundos < 114.6) ||
    (segundos > 116.5 && segundos < 116.6) ||
    (segundos > 119.6 && segundos < 119.7) ||
    (segundos > 123.9 && segundos < 124.1) ||
    (segundos > 158 && segundos < 158.1) ||
    (segundos > 161.3 && segundos < 161.4) ||
    (segundos > 167.5 && segundos < 167.6);

  estados.mosca = (espectroAmplitud[2] > 3 && segundos > 1 && segundos < 1.4) || (segundos > 96 && segundos < 96.5);

  estados.abeja = segundos > 33.8 && segundos < 34;

  estados.pasos =
    espectroAmplitud[1] > 0.5 &&
    espectroAmplitud[2] > 0.5 &&
    espectroAmplitud[3] > 0.5 &&
    ((segundos > 1.8 && segundos < 8.5) ||
      (segundos > 32.8 && segundos < 41.6) ||
      (segundos > 67.3 && segundos < 71.7) ||
      (segundos > 72.2 && segundos < 85) ||
      (segundos > 97 && segundos < 105) ||
      (segundos > 103 && segundos < 130) ||
      (segundos > 151 && segundos < 157) ||
      (segundos > 166 && segundos < 167.6));

  estados.risas =
    espectroAmplitud[8] >= 3 &&
    espectroAmplitud[7] >= 3 &&
    espectroAmplitud[10] >= 2 &&
    ((segundos > 3 && segundos < 12) || (segundos > 20 && segundos < 22));
};
