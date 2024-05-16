import Meyda, { MeydaFeaturesObject } from 'meyda';
import './scss/estilos.scss';
import Transformacion from './tranformacion/Transformacion';
const lienzo = document.getElementById('lienzo') as HTMLCanvasElement;
const ctx = lienzo.getContext('2d') as CanvasRenderingContext2D;
const lienzoExt = new OffscreenCanvas(0, 0);
const ctxExt = lienzoExt.getContext('2d');
const dims = { ancho: 0, alto: 0, pasoX: 0 };
const centro = { x: 0, y: 0 };
const tamañoFFT = 2048;
let audioCargado = false;
let pasoX = 0;
let pasoY = 0;

export function encontrarBins(frecuencia: number) {
  const bins: number[] = [];
  for (let i: number = 0; i <= 512; i++) {
    bins.push(i * 43 + 20);
  }
  const i = bins.findIndex((f) => f > frecuencia);
  return i;
}

function crearAnalizadorMeyda(contexto: AudioContext, fuente) {
  const analizadorMeyda = Meyda.createMeydaAnalyzer({
    audioContext: contexto,
    source: fuente,
    bufferSize: 1024,
    sampleRate: 44100,
    featureExtractors: ['amplitudeSpectrum', 'zcr', 'rms'],
    callback: revisarEstados,
  });

  analizadorMeyda.start();
  return analizadorMeyda;
}

let copeton: boolean = false;
let tingua: boolean = false;
let nivel: number = 0;

export function revisarEstados(caracteristicas: MeydaFeaturesObject) {
  const bin = encontrarBins(4000);

  const { amplitudeSpectrum, complexSpectrum, chroma, zcr, rms } = caracteristicas;
  const identificarCopeton =
    amplitudeSpectrum[bin] > 5 && amplitudeSpectrum[78] < 3 && amplitudeSpectrum[27] < 7 && zcr > 170;

  const identificarTingua =
    amplitudeSpectrum[bin] > 5 && amplitudeSpectrum[78] < 3 && amplitudeSpectrum[27] < 7 && zcr < 170;
  // console.log(amplitudeSpectrum);
  if (identificarCopeton) {
    copeton = true;
  } else if (identificarTingua) {
    console.log('tingua');
    tingua = true;
  } else {
    copeton = false;
    tingua = false;
  }

  nivel = caracteristicas.rms;
}

const imgCopeton = new Image();
const imgAbuela = new Image();

escalar();
window.onresize = escalar;
const t = new Transformacion();
t.transladar(0, 0)
  //.rotar(Math.PI / 4)
  .escalar(10, 1);

async function cargarImgs(): Promise<void> {
  return new Promise((resolver) => {
    imgCopeton.onload = () => {
      resolver();
    };
    imgCopeton.src = '/copeton.PNG';
    imgAbuela.src = '/abuela.PNG';
  });
}
let analizadorMeyda;
lienzo.onclick = async () => {
  if (audioCargado) return;
  const archivo = await fetch('/S1_paisones Suba RvdH_V1.wav').then((respuesta) => respuesta.arrayBuffer());
  const audioCtx = new AudioContext();
  const audio = await audioCtx.decodeAudioData(archivo);
  const fuente = new AudioBufferSourceNode(audioCtx);
  fuente.buffer = audio;

  analizadorMeyda = crearAnalizadorMeyda(audioCtx, fuente);

  const analizador = audioCtx.createAnalyser();
  analizador.fftSize = tamañoFFT;

  fuente.connect(analizador);
  fuente.connect(audioCtx.destination);

  audioCargado = true;
  fuente.start();
  await cargarImgs();
  inicio(analizador);
};

function borrarTodo() {
  // ctx.save();
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, dims.ancho, dims.alto);
  // ctx.restore();

  // ctx.globalAlpha = 0.12;
}

function inicio(analizador: AnalyserNode) {
  const cantidadPuntos = tamañoFFT / 2;
  const tamañoDatos = analizador.frequencyBinCount;
  const datos = new Uint8Array(tamañoDatos);
  const datos2 = new Uint8Array(tamañoDatos);

  requestAnimationFrame(animar);

  borrarTodo();

  function animar() {
    if (!ctxExt) return;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, dims.ancho, dims.alto);
    // console.log(nivel);
    // analizador.getFloatFrequencyData(datos);
    analizador.getByteTimeDomainData(datos);
    analizador.getByteFrequencyData(datos2);

    if (copeton) {
      ctxExt.drawImage(
        imgCopeton,
        dims.ancho - 250,
        (datos2[93] * dims.alto) / 255,
        imgCopeton.naturalWidth / 14,
        imgCopeton.naturalHeight / 14
      );
    }
    if (tingua) {
      ctxExt.drawImage(
        imgAbuela,
        dims.ancho - 250,
        (datos2[98] * dims.alto) / 255,
        imgAbuela.naturalWidth / 14,
        imgAbuela.naturalHeight / 14
      );
    }

    // pintar barras
    ctx.fillStyle = 'blue';
    ctx.beginPath();
    ctx.moveTo(0, centro.y);

    for (let i = 0; i < cantidadPuntos; i++) {
      const punto = datos[i] / 128;
      const puntoF = datos2[i] * 2;

      // if (puntoF > 230) {
      //   ctxExt.setTransform(...t.matriz);
      //   ctxExt.fillStyle = `rgba(${puntoF | 0}, ${puntoF | 0}, ${(Math.random() * 255) | 0})`;
      // } else {
      ctxExt.setTransform(1, 0, 0, 1, 0, 0);
      ctxExt.fillStyle = `rgba(${(Math.random() * 200) | 0}, ${(puntoF / 2) | 50}, ${(puntoF / 2) | 200} )`; //`rgb(${(Math.random() * 255) | 0}, ${(Math.random() * 255) | 0}, ${(Math.random() * 255) | 0})`;
      //}
      ctx.lineTo(i * pasoX, punto * centro.y);
      ctx.fillRect(i * pasoX, dims.alto - puntoF, 1, puntoF);

      ctxExt.fillRect(dims.ancho, i * pasoY, -1, pasoY);
    }

    ctxExt.drawImage(lienzoExt, -1, 0);
    ctx.drawImage(lienzoExt, 0, 0);
    ctx.strokeStyle = '#85f5d6';
    ctx.lineTo(dims.ancho, centro.y);
    ctx.stroke();

    ctx.strokeStyle = '#fed85d';
    ctx.beginPath();
    ctx.arc(centro.x / 2, 100, nivel * 2000, 0, 2 * Math.PI);
    ctx.stroke();

    /** Probar transformador */
    // ctx.setTransform(...t.matriz);
    // ctx.fillRect(0, 0, 50, 50);
    // ctx.resetTransform();

    requestAnimationFrame(animar);
  }
}

function escalar() {
  dims.ancho = lienzo.width = lienzoExt.width = window.innerWidth;
  dims.alto = lienzo.height = lienzoExt.height = window.innerHeight;
  centro.x = dims.ancho / 2;
  centro.y = dims.alto / 2;
  ctx.fillStyle = 'pink';

  ctx.fillRect(0, 0, lienzo.width, lienzo.height);
  pasoX = dims.ancho / (tamañoFFT / 2);
  pasoY = dims.alto / (tamañoFFT / 2);

  if (!audioCargado) {
    ctx.save();
    ctx.fillStyle = 'white';
    ctx.font = 'bold 50px serif';
    ctx.fillText('▶', centro.x - 30, centro.y);
    ctx.restore();
  } else {
    borrarTodo();
  }
}
