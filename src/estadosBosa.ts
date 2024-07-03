export default (
  estados: { [nombre: string]: boolean },
  segundos: number,
  espectroAmplitud: Float32Array,
  zcr: number
) => {
  estados.risas =
    (segundos > 7.2 && segundos < 7.5) ||
    (segundos > 88 && segundos < 88.2) ||
    (segundos > 92 && segundos < 92.2) ||
    (segundos > 161.5 && segundos < 161.7) ||
    (segundos > 162 &&
      segundos < 165.2 &&
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
    (segundos > 42 && segundos < 42.05) ||
    (segundos > 44 && segundos < 44.05) ||
    (segundos > 45 && segundos < 45.05) ||
    (segundos > 46 && segundos < 46.05) ||
    (segundos > 48 && segundos < 48.05) ||
    (segundos > 49 && segundos < 49.05) ||
    (segundos > 51 && segundos < 51.05) ||
    (segundos > 52 && segundos < 52.05) ||
    (segundos > 53 && segundos < 53.05) ||
    (segundos > 54 && segundos < 54.05) ||
    (segundos > 60 && segundos < 60.06) ||
    (segundos > 61 && segundos < 61.06) ||
    (segundos > 62 && segundos < 62.06) ||
    (segundos > 64 && segundos < 64.05) ||
    (segundos > 66 && segundos < 66.06) ||
    (segundos > 130 && segundos < 130.05) ||
    (segundos > 130.9 && segundos < 131.04);

  estados.alcaravan =
    (segundos > 75 && segundos < 85 && espectroAmplitud[58] > 1.5) ||
    (segundos > 85 && segundos < 89 && espectroAmplitud[58] > 3);
  estados.avion = espectroAmplitud[1] > 6 && segundos > 38 && segundos < 39;
  estados.carro = segundos > 153 && segundos < 154 && espectroAmplitud[0] > 1.4;
  estados.copeton =
    ((segundos > 39.5 && segundos < 41.4) ||
      (segundos > 89 && segundos < 91) ||
      (segundos > 93 && segundos < 95) ||
      (segundos > 165 && segundos < 166.8)) &&
    espectroAmplitud[92] >= 2 &&
    zcr > 150;

  estados.pito = segundos > 14.5 && segundos < 15;
  estados.abeja =
    (segundos > 19 && segundos < 19.5) || (segundos > 24 && segundos < 24.5) || (segundos > 30 && segundos < 30.5);
  estados.mosca = (segundos > 32 && segundos < 33) || (segundos > 35.5 && segundos < 37);

  estados.pasos =
    ((segundos > 79.5 && segundos < 85) ||
      (segundos > 110 && segundos < 115) ||
      (segundos > 115.8 && segundos < 129)) &&
    espectroAmplitud[1] > 10 &&
    espectroAmplitud[2] > 20 &&
    espectroAmplitud[3] > 20;

  estados.narizPerro =
    (segundos > 118 && segundos < 118.1) ||
    (segundos > 121 && segundos < 121.1) ||
    (segundos > 123.5 && segundos < 123.6) ||
    (segundos > 126.5 && segundos < 126.6);

  estados.pingPong =
    (segundos > 134 && segundos < 135) ||
    (segundos > 135.5 && segundos < 136) ||
    (segundos > 136.5 && segundos < 137.5) ||
    (segundos > 138 && segundos < 138.5);
};
