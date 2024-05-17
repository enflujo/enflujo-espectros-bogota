import Meyda, { MeydaFeaturesObject } from 'meyda';
import './scss/estilos.scss';
import Transformacion from './tranformacion/Transformacion';
const lienzo = document.getElementById('lienzo') as HTMLCanvasElement;
const ctx = lienzo.getContext('2d') as CanvasRenderingContext2D;
const lienzoExt = new OffscreenCanvas(0, 0);
const lienzoBarras = new OffscreenCanvas(0, 0);
const lienzoBu = new OffscreenCanvas(0, 0);
const lienzoMontaña = new OffscreenCanvas(0, 0);
const ctxExt = lienzoExt.getContext('2d');
const ctxBarras = lienzoBarras.getContext('2d');
const ctxBu = lienzoBu.getContext('2d');
const ctxMontaña = lienzoMontaña.getContext('2d');
const dims = { ancho: 0, alto: 0, pasoX: 0 };
const centro = { x: 0, y: 0 };
const tamañoFFT = 2048;
const cantidadPuntos = tamañoFFT / 2;
let audioCargado = false;
let pasoX = 0;
let pasoY = 0;
const pasoR = (2 * Math.PI) / cantidadPuntos;
const tBu = new Transformacion();

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
let abuela: boolean = false;
let mirla: boolean = false;
let mosca: boolean = false;

let nivel: number = 0;

export function revisarEstados(caracteristicas: MeydaFeaturesObject) {
  const bin = encontrarBins(4000);

  //console.log('voz: ' + encontrarBins(500));

  const { amplitudeSpectrum, complexSpectrum, chroma, zcr, rms } = caracteristicas;
  //console.log(amplitudeSpectrum);
  const identificarabuela = amplitudeSpectrum[16] > 7 && amplitudeSpectrum[47] > 5 && zcr < 100 && zcr > 84;

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
  } else if (identificarabuela) {
    abuela = true;
  } else if (mirla) {
    mirla = true;
  } else {
    copeton = tingua = abuela = mirla = false;
  }

  nivel = caracteristicas.rms;
}

const imgCopeton = new Image();
const imgAbuela = new Image();
const imgMirla = new Image();

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
    imgMirla.src = '/mirla.PNG';
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
  ctx.fillStyle = 'pink';
  ctx.fillRect(0, 0, dims.ancho, dims.alto);
  // ctx.restore();

  // ctx.globalAlpha = 0.12;
}

function inicio(analizador: AnalyserNode) {
  const tamañoDatos = analizador.frequencyBinCount;
  const datos = new Uint8Array(tamañoDatos);
  const datos2 = new Uint8Array(tamañoDatos);

  requestAnimationFrame(animar);

  borrarTodo();

  function animar() {
    if (!ctxExt || !ctxBarras || !ctxBu || !ctxMontaña) return;
    /**
     * Borrar antes de pintar un nuevo fotograma
     */
    ctx.fillStyle = 'pink';
    ctx.fillRect(0, 0, dims.ancho, dims.alto);
    ctxBarras.clearRect(0, 0, dims.ancho, dims.alto);
    ctxBu.clearRect(0, 0, dims.ancho, dims.alto);
    ctxMontaña.clearRect(0, 0, dims.ancho, dims.alto);

    // analizador.getFloatFrequencyData(datos);

    /** Extraer datos */
    analizador.getByteTimeDomainData(datos);
    analizador.getByteFrequencyData(datos2);

    if (copeton) {
      ctxExt.drawImage(
        imgCopeton,
        dims.ancho - 250,
        (datos2[93] * dims.alto) / 255,
        imgCopeton.naturalWidth / 11,
        imgCopeton.naturalHeight / 11
      );
    }

    if (abuela) {
      ctxExt.drawImage(
        imgAbuela,
        dims.ancho - 250,
        (datos2[98] * dims.alto) / 255,
        imgAbuela.naturalWidth / 16,
        imgAbuela.naturalHeight / 16
      );
    }

    if (mirla) {
      ctxExt.drawImage(
        imgMirla,
        dims.ancho - 250,
        (datos2[98] * dims.alto) / 255,
        imgMirla.naturalWidth / 14,
        imgMirla.naturalHeight / 14
      );
    }

    ctx.fillStyle = 'blue';
    ctx.beginPath();
    ctx.moveTo(0, centro.y);
    ctxBarras.fillStyle = 'blue';
    ctxBu.beginPath();
    ctxBu.moveTo(centro.x, centro.y);
    ctxBu.strokeStyle = 'white';
    ctxMontaña.beginPath();
    ctxMontaña.moveTo(centro.x + centro.x / 2, centro.y - centro.y / 1.1);
    ctxMontaña.strokeStyle = 'white';
    for (let i = 0; i < cantidadPuntos; i++) {
      const punto = datos[i] / 128;
      const puntoF = datos2[i] * 2;

      ctxExt.setTransform(1, 0, 0, 1, 0, 0);
      ctxExt.fillStyle = `rgba(${(Math.random() * 200) | 0}, ${(puntoF / 2) | 50}, ${(puntoF / 2) | 200} )`; //`rgb(${(Math.random() * 255) | 0}, ${(Math.random() * 255) | 0}, ${(Math.random() * 255) | 0})`;
      ctxExt.fillRect(dims.ancho, i * pasoY, -1, pasoY);
      //y2 * sin(angle) + x2 * cos(angle)
      // y2 * cos(angle) - x2 * sin(angle)

      const xBu = puntoF * Math.acos(pasoR * i) + centro.x;
      const yBu = puntoF * Math.sin(pasoR * i) + centro.y;
      ctxBu.lineTo(xBu, yBu);

      // Montaña
      const xMontaña = (puntoF / 4) * Math.tan(pasoR * i) + centro.x + centro.x / 2;
      const yMontaña = (puntoF / 4) * Math.atan(pasoR * i) + centro.y - centro.y / 1.1;
      ctxMontaña.lineTo(xMontaña, yMontaña);

      ctx.lineTo(i * pasoX, punto * centro.y); // Línea del centro
      ctxBarras.fillRect(i * pasoX, dims.alto - puntoF, 5, puntoF); // Pintar barras
    }
    ctxBu.stroke();
    ctxMontaña.stroke();

    ctxExt.drawImage(lienzoExt, -1, 0);
    ctx.drawImage(lienzoExt, 0, 0);

    ctx.save();
    ctx.globalCompositeOperation = 'color-dodge';
    ctx.drawImage(lienzoBarras, 0, 0);
    ctx.restore();

    ctx.drawImage(lienzoBu, 0, 0);
    ctxBu.translate(dims.ancho, 0);
    ctxBu.scale(-1, 1);

    ctx.save();
    ctx.scale(0.4, 1);
    ctx.translate(dims.ancho + dims.ancho / 3, 0);
    ctx.drawImage(lienzoMontaña, 0, 0);
    ctx.restore();

    ctx.drawImage(lienzoBu, 0, 0, -dims.ancho, dims.alto);

    // Pintar onda central
    ctx.strokeStyle = '#85f5d6';
    ctx.lineTo(dims.ancho, centro.y);
    ctx.stroke();

    if (tingua) {
      ctxExt.font = '30px serif';
      ctxExt.fillText('tingua', dims.ancho - 250, (datos2[93] * dims.alto) / 255);
      ctxExt.strokeStyle = '#fed85d';
      ctxExt.beginPath();
      ctxExt.arc(centro.x, centro.y / 2, datos2[93] / 3, 0, 2 * Math.PI);
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctxExt.stroke();
      ctx.restore();
    }

    /** Probar transformador */
    // ctx.setTransform(...t.matriz);
    // ctx.fillRect(0, 0, 50, 50);
    // ctx.resetTransform();

    requestAnimationFrame(animar);
  }
}

function escalar() {
  dims.ancho =
    lienzo.width =
    lienzoExt.width =
    lienzoBarras.width =
    lienzoBu.width =
    lienzoMontaña.width =
      window.innerWidth;
  dims.alto =
    lienzo.height =
    lienzoExt.height =
    lienzoBarras.height =
    lienzoBu.height =
    lienzoMontaña.height =
      window.innerHeight;
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
