export default (
  estados: { [nombre: string]: boolean },
  segundos: number,
  espectroAmplitud: Float32Array,
  zcr: number
) => {
  // cambiar booleanos a verdadero para mostrar elementos si se cumplen condiciones de tiempo y frecuencia
  estados.alcaravan = segundos > 97 && segundos < 101 && espectroAmplitud[58] > 0.5;

  estados.copeton =
    ((segundos > 55 && segundos < 58) || (segundos > 161 && segundos < 163) || (segundos > 167 && segundos < 168)) &&
    espectroAmplitud[92] >= 2 &&
    zcr > 150;

  estados.narizPerro =
    (segundos > 25.7 && segundos < 25.75) ||
    (segundos > 26.4 && segundos < 26.45) ||
    (segundos > 28 && segundos < 28.05) ||
    (segundos > 28.2 && segundos < 28.25) ||
    (segundos > 29.5 && segundos < 29.55);

  estados.gallina =
    (segundos > 5 && segundos < 5.05) ||
    (segundos > 10 && segundos < 10.05) ||
    (segundos > 13.8 && segundos < 13.85) ||
    (segundos > 19.7 && segundos < 19.75) ||
    (segundos > 20.8 && segundos < 20.85) ||
    (segundos > 23.7 && segundos < 23.75) ||
    (segundos > 32 && segundos < 32.05);
  estados.gallo = (segundos > 7 && segundos < 7) || (segundos > 17.5 && segundos < 17.55);

  estados.pasos =
    (segundos > 91 && segundos < 96 && espectroAmplitud[1] > 5 && espectroAmplitud[2] > 5 && espectroAmplitud[3] > 5) ||
    (segundos > 131 && segundos < 131.1) ||
    (segundos > 132 && segundos < 132.1) ||
    (segundos > 133 && segundos < 133.1) ||
    (segundos > 134 && segundos < 134.1);
};
