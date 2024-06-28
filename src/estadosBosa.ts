export default (
  estados: { [nombre: string]: boolean },
  segundos: number,
  espectroAmplitud: Float32Array,
  zcr: number
) => {
  estados.risas =
    (segundos > 7.2 && segundos < 7.5) ||
    (segundos > 88 &&
      segundos < 88.2 &&
      espectroAmplitud[8] >= 3.6 &&
      espectroAmplitud[7] >= 3.2 &&
      espectroAmplitud[10] >= 2);

  estados.biciMotor =
    (segundos > 10 && segundos < 10.03) ||
    (segundos > 10.5 && segundos < 10.55) ||
    (segundos > 11 && segundos < 11.03) ||
    (segundos > 11.5 && segundos < 11.55) ||
    (segundos > 12 && segundos < 12.03) ||
    (segundos > 12.5 && segundos < 12.55) ||
    (segundos > 13 && segundos < 13.03) ||
    (segundos > 13.5 && segundos < 13.55) ||
    (segundos > 14 && segundos < 14.03) ||
    (segundos > 14.5 && segundos < 14.55) ||
    (segundos > 15 && segundos < 15.03) ||
    (segundos > 15.5 && segundos < 15.55) ||
    (segundos > 16 && segundos < 16.03) ||
    (segundos > 16.5 && segundos < 16.55) ||
    (segundos > 17 && segundos < 17.05) ||
    (segundos > 130 && segundos < 130.05) ||
    (segundos > 130.9 && segundos < 131.04);

  estados.alcaravan =
    (segundos > 75 && segundos < 85 && espectroAmplitud[58] >= 1.5) ||
    (segundos > 85 && segundos < 89 && espectroAmplitud[58] >= 3);
  estados.avion = espectroAmplitud[1] > 6 && segundos > 38 && segundos < 39;
  estados.copeton =
    ((segundos > 39.5 && segundos < 41.4) ||
      (segundos > 89 && segundos < 91) ||
      (segundos > 93 && segundos < 95) ||
      (segundos > 165 && segundos < 166.8)) &&
    espectroAmplitud[92] >= 2 &&
    /*espectroAmplitud[78] <= 2 &&
    espectroAmplitud[27] < 3 && */
    zcr > 150;

  estados.pito = segundos > 14.5 && segundos < 15;
  estados.abeja =
    (segundos > 19 && segundos < 19.5) || (segundos > 24 && segundos < 24.5) || (segundos > 30 && segundos < 30.5);
  estados.mosca = (segundos > 32 && segundos < 33) || (segundos > 35.5 && segundos < 37);

  estados.pasos =
    ((segundos > 79.5 && segundos < 85) ||
      (segundos > 110 && segundos < 116) ||
      (segundos > 115.8 && segundos < 119)) &&
    espectroAmplitud[1] > 10 &&
    espectroAmplitud[2] > 20 &&
    espectroAmplitud[3] > 20;

  estados.narizPerro = (segundos > 125 && segundos < 125.1) || (segundos > 117 && segundos < 117.1);
};
