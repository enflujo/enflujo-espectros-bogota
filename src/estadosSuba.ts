export default (
  estados: { [nombre: string]: boolean },
  segundos: number,
  espectroAmplitud: Float32Array,
  zcr: number
) => {
  estados.abuela =
    segundos > 10.5 &&
    segundos < 12.1 &&
    espectroAmplitud[16] > 2 &&
    espectroAmplitud[14] > 4.9 &&
    espectroAmplitud[9] > 3; //espectroAmplitud[16] > 7 && espectroAmplitud[47] > 5 && zcr < 100 && zcr > 84;

  estados.aguaFuego = (segundos > 2 && segundos < 2.02) || (segundos > 5 && segundos < 5.02);

  estados.avion = espectroAmplitud[1] > 5 && segundos > 80.9 && segundos < 88;

  estados.biciMotor =
    (segundos > 57 && segundos < 57.05) ||
    (segundos > 57.5 && segundos < 57.55) ||
    (segundos > 58 && segundos < 58.05) ||
    (segundos > 58.5 && segundos < 58.55) ||
    (segundos > 59 && segundos < 59.05) ||
    (segundos > 60 && segundos < 60.05) ||
    (segundos > 61 && segundos < 61.05);

  // cambiar booleanos a verdadero para mostrar elementos si se cumplen condiciones de tiempo y frecuencia
  estados.copeton =
    segundos > 8 &&
    segundos < 43 &&
    espectroAmplitud[92] >= 3 &&
    espectroAmplitud[78] <= 2 &&
    espectroAmplitud[27] < 3 &&
    zcr > 150;

  estados.curi = segundos > 90.2 && segundos < 90.23;

  estados.tingua_bogotana =
    segundos >= 87 &&
    segundos <= 99 &&
    espectroAmplitud[2] > 5 &&
    espectroAmplitud[78] < 3 &&
    espectroAmplitud[27] < 7 &&
    zcr < 170;

  estados.tingua_azul =
    (segundos >= 78.1 && segundos <= 78.2) ||
    (segundos >= 80 && segundos <= 88 && espectroAmplitud[57] >= 0.1 && espectroAmplitud[58] >= 0.5 && zcr < 170);

  estados.mosca =
    (segundos % 2 === 0 && segundos >= 119.5 && segundos < 120) || (segundos === 163 && espectroAmplitud[2] > 3);

  estados.abejorro = segundos >= 161 && segundos < 162;

  estados.abeja = segundos >= 71 && segundos < 71.5;

  estados.pasos =
    segundos === 124 ||
    (segundos > 124 &&
      segundos < 137 &&
      espectroAmplitud[1] > 20 &&
      espectroAmplitud[2] > 30 &&
      espectroAmplitud[3] > 30);

  estados.risas =
    segundos > 157 &&
    segundos < 160 &&
    espectroAmplitud[8] >= 3.6 &&
    espectroAmplitud[7] >= 3.2 &&
    espectroAmplitud[10] >= 2;

  estados.arboloco =
    (segundos > 124 &&
      segundos < 143 &&
      espectroAmplitud[1] >= 23 &&
      espectroAmplitud[2] >= 40 &&
      espectroAmplitud[3] >= 36) ||
    (segundos > 144 && segundos < 149 && espectroAmplitud[2] >= 30 && espectroAmplitud[3] >= 30);
};
