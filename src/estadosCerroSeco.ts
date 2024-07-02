export default (
  estados: { [nombre: string]: boolean },
  segundos: number,
  espectroAmplitud: Float32Array,
  zcr: number
) => {
  // cambiar booleanos a verdadero para mostrar elementos si se cumplen condiciones de tiempo y frecuencia
  estados.copeton =
    segundos > 8 &&
    segundos < 43 &&
    espectroAmplitud[92] >= 3 &&
    espectroAmplitud[78] <= 2 &&
    espectroAmplitud[27] < 3 &&
    zcr > 150;

  estados.narizPerro = segundos > 156.5 && segundos < 156.55;

  estados.mosca = (segundos >= 119.5 && segundos < 120) || (segundos === 163 && espectroAmplitud[2] > 3);

  estados.abejorro = segundos >= 161 && segundos < 162;

  estados.abeja = segundos > 71 && segundos < 71.5;

  estados.carro = (segundos > 51 && segundos < 52.2) || (segundos > 53.9 && segundos < 53.95);

  estados.gallina =
    (segundos > 5 && segundos < 5.1) ||
    (segundos > 9.5 && segundos < 9.6) ||
    (segundos > 12.4 && segundos < 12.5) ||
    (segundos > 16.2 && segundos < 16.3) ||
    (segundos > 19.7 && segundos < 19.8) ||
    (segundos > 22.3 && segundos < 22.4) ||
    (segundos > 23.7 && segundos < 23.8);
  estados.gallo = (segundos > 31 && segundos < 31.02) || (segundos > 38.2 && segundos < 38.22);

  estados.pasos =
    segundos === 123 ||
    (segundos > 124 &&
      segundos < 137 &&
      espectroAmplitud[1] > 18 &&
      espectroAmplitud[2] > 30 &&
      espectroAmplitud[3] > 30);
};
