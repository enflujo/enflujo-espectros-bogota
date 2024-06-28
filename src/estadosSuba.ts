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

  estados.aguaFuego =
    (segundos > 2 && segundos < 2.02) || (segundos > 5 && segundos < 5.02) || (segundos > 14 && segundos < 14.02);

  estados.avion = espectroAmplitud[1] > 6 && segundos > 80.7 && segundos < 88;

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

  estados.gavilanMaromero =
    (segundos > 72.8 && segundos < 72.9) ||
    (segundos > 73.2 && segundos < 73.4) ||
    (segundos > 73.6 && segundos < 73.8) ||
    (segundos > 105.5 && segundos < 105.8) ||
    (segundos > 113.5 && segundos < 113.8) ||
    (segundos > 166.5 && segundos < 166.7);

  estados.narizPerro = segundos > 156.5 && segundos < 156.55;

  estados.tinguaBogotana =
    segundos >= 98 &&
    segundos <= 99 &&
    espectroAmplitud[2] > 5 &&
    espectroAmplitud[78] < 3 &&
    espectroAmplitud[27] < 7 &&
    zcr < 170;

  estados.tinguaAzul =
    segundos >= 88 && segundos <= 94 && espectroAmplitud[57] >= 0.1 && espectroAmplitud[58] >= 0.5 && zcr < 170;

  estados.tingua = segundos >= 108 && segundos <= 113 && espectroAmplitud[58] >= 0.5 && zcr < 170;

  estados.mosca = (segundos >= 119.5 && segundos < 120) || (segundos === 163 && espectroAmplitud[2] > 3);

  estados.abejorro = segundos >= 161 && segundos < 162;

  estados.abeja = segundos > 71 && segundos < 71.5;

  estados.carro = (segundos > 51 && segundos < 52.2) || (segundos > 53.9 && segundos < 53.95);

  estados.gallina = (segundos > 18 && segundos < 17.03) || (segundos > 27 && segundos < 27.02);
  estados.gallo = (segundos > 31 && segundos < 31.02) || (segundos > 38.2 && segundos < 38.22);

  estados.moto = (segundos > 46 && segundos < 46.1) || (segundos > 48.4 && segundos < 48.5);

  estados.pasos =
    segundos === 123 ||
    (segundos > 124 &&
      segundos < 137 &&
      espectroAmplitud[1] > 18 &&
      espectroAmplitud[2] > 30 &&
      espectroAmplitud[3] > 30);

  estados.perchas =
    (segundos > 144.5 && segundos < 144.6) ||
    (segundos > 146.5 && segundos < 146.6) ||
    (segundos > 148.5 && segundos < 148.6) ||
    (segundos > 150.5 && segundos < 150.6) ||
    (segundos > 151.5 && segundos < 151.6);

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
