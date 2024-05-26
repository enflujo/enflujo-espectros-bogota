import Meyda, { MeydaFeaturesObject } from 'meyda';
import './scss/estilos.scss';
import Transformacion from './tranformacion/Transformacion';
import subtitulos from './datos/subtitulos.json';

const etiquetaTiempo = document.getElementById('tiempo');
const contenedorSubtitulos = document.getElementById('subtitulos');
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
let audioCtx: AudioContext;
const empezarEn = 0;

// booleanos para mostrar elementos
let copeton: boolean = false;
let tingua_bogotana: boolean = false;
let tingua_azul: boolean = false;
let abuela: boolean = false;
let mirla: boolean = false;
let mosca: boolean = false;
let abejorro: boolean = false;
let abeja: boolean = false;
let pasos: boolean = false;
let risas: boolean = false;
let arboloco: boolean = false;

let nivel: number = 0;

// Variables para contador de tiempo
let segundos: number;

function mostrarTiempo() {
  segundos = audioCtx.currentTime + empezarEn;
  // console.log(segundos);
  const h = Math.floor(segundos / 3600)
    .toString()
    .padStart(2, '0');
  const m = Math.floor((segundos % 3600) / 60)
    .toString()
    .padStart(2, '0');
  const s = Math.floor(segundos % 60)
    .toString()
    .padStart(2, '0');

  const tiempo = `${h}:${m}:${s}`;

  if (!etiquetaTiempo) return;
  etiquetaTiempo.innerText = tiempo;

  requestAnimationFrame(mostrarTiempo);
}

function mostrarSubtitulos() {
  if (!contenedorSubtitulos) return;
  subtitulos.forEach((elemento) => {
    if (segundos >= elemento['tiempo-inicial']) {
      contenedorSubtitulos.innerText = elemento.texto;
      contenedorSubtitulos.style.display = 'block';
    }
    if (segundos > elemento['tiempo-final']) {
      contenedorSubtitulos.style.display = 'none';
      contenedorSubtitulos.innerText = '';
    }
  });
}

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

export function revisarEstados(caracteristicas: MeydaFeaturesObject) {
  const bin = encontrarBins(100);
  const { amplitudeSpectrum, zcr } = caracteristicas;
  //  console.log(amplitudeSpectrum, zcr);
  abuela =
    segundos > 10.5 &&
    segundos <= 12 &&
    amplitudeSpectrum[16] > 2 &&
    amplitudeSpectrum[14] >= 5 &&
    amplitudeSpectrum[9] > 3; //amplitudeSpectrum[16] > 7 && amplitudeSpectrum[47] > 5 && zcr < 100 && zcr > 84;

  // cambiar booleanos a verdadero para mostrar elementos si se cumplen condiciones de tiempo y frecuencia
  copeton =
    segundos > 8 &&
    segundos < 43 &&
    amplitudeSpectrum[92] >= 3 &&
    amplitudeSpectrum[78] <= 2 &&
    amplitudeSpectrum[27] < 3 &&
    zcr > 150;

  tingua_bogotana =
    segundos >= 87 &&
    segundos <= 99 &&
    amplitudeSpectrum[bin] > 5 &&
    amplitudeSpectrum[78] < 3 &&
    amplitudeSpectrum[27] < 7 &&
    zcr < 170;
  tingua_azul =
    (segundos >= 78.1 && segundos <= 78.2) ||
    (segundos >= 80 && segundos <= 88 && amplitudeSpectrum[57] >= 0.1 && amplitudeSpectrum[58] >= 0.5 && zcr < 170);
  mosca = (segundos >= 119.5 && segundos < 120) || (segundos === 163 && amplitudeSpectrum[2] > 3);
  abejorro = segundos >= 161 && segundos < 162;
  abeja = segundos >= 71 && segundos < 71.5;
  pasos =
    segundos === 124 ||
    (segundos > 124 &&
      segundos < 137 &&
      amplitudeSpectrum[1] > 20 &&
      amplitudeSpectrum[2] > 30 &&
      amplitudeSpectrum[3] > 30);
  risas =
    segundos > 157 &&
    segundos < 160 &&
    amplitudeSpectrum[8] >= 3.6 &&
    amplitudeSpectrum[7] >= 3.2 &&
    amplitudeSpectrum[10] >= 2;
  arboloco =
    (segundos > 124 &&
      segundos < 143 &&
      amplitudeSpectrum[1] >= 23 &&
      amplitudeSpectrum[2] >= 40 &&
      amplitudeSpectrum[3] >= 36) ||
    (segundos > 144 && segundos < 149 && amplitudeSpectrum[2] >= 30 && amplitudeSpectrum[3] >= 30);

  nivel = caracteristicas.rms;
}

const imagenes: { [nombre: string]: { ruta: string; img: HTMLImageElement; ancho: number; alto: number } } = {
  copeton: { ruta: '/copeton.png', img: new Image(), ancho: 0, alto: 0 },
  abuela: { ruta: '/abuela.png', img: new Image(), ancho: 0, alto: 0 },
  mirla: { ruta: '/mirla.png', img: new Image(), ancho: 0, alto: 0 },
  pasos: { ruta: '/pasos.png', img: new Image(), ancho: 0, alto: 0 },
  risas: { ruta: '/risas.png', img: new Image(), ancho: 0, alto: 0 },
  arboloco: { ruta: '/arboloco.png', img: new Image(), ancho: 0, alto: 0 },
};
escalar();
window.onresize = escalar;
const t = new Transformacion();
t.transladar(0, 0)
  //.rotar(Math.PI / 4)
  .escalar(10, 1);

async function cargarImgs(): Promise<void> {
  return new Promise((resolver, rechazar) => {
    let imagenesCargadas = 0;
    const totalImgs = Object.keys(imagenes).length;
    for (const nombre in imagenes) {
      imagenes[nombre].img.onload = () => {
        imagenesCargadas++;
        imagenes[nombre].ancho = imagenes[nombre].img.naturalWidth;
        imagenes[nombre].alto = imagenes[nombre].img.naturalHeight;

        if (imagenesCargadas === totalImgs) {
          resolver();
        }
      };

      imagenes[nombre].img.onerror = () => {
        rechazar(`La imagen ${imagenes[nombre].ruta} no esta disponible`);
      };
      imagenes[nombre].img.src = imagenes[nombre].ruta;
    }
  });
}
let analizadorMeyda;

lienzo.onclick = async () => {
  if (audioCargado) return;
  const archivo = await fetch('/S1_paisones Suba RvdH_V1.wav').then((respuesta) => respuesta.arrayBuffer());
  audioCtx = new AudioContext();
  const audio = await audioCtx.decodeAudioData(archivo);
  const fuente = new AudioBufferSourceNode(audioCtx);
  fuente.buffer = audio;

  analizadorMeyda = crearAnalizadorMeyda(audioCtx, fuente);

  const analizador = audioCtx.createAnalyser();
  analizador.fftSize = tamañoFFT;

  fuente.connect(analizador);
  fuente.connect(audioCtx.destination);

  audioCargado = true;
  fuente.start(0, empezarEn);

  try {
    await cargarImgs();
    inicio(analizador);
  } catch (error) {
    console.error(error);
  }
};

function borrarTodo() {
  ctx.fillStyle = 'pink';
  ctx.fillRect(0, 0, dims.ancho, dims.alto);
}

function inicio(analizador: AnalyserNode) {
  const tamañoDatos = analizador.frequencyBinCount;
  const datos = new Uint8Array(tamañoDatos);
  const datos2 = new Uint8Array(tamañoDatos);

  mostrarTiempo();

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

    mostrarSubtitulos();

    // Mostrar imágenes
    if (copeton) {
      ctxExt.drawImage(
        imagenes.copeton.img,
        dims.ancho - 240,
        (Math.random() * dims.alto) / 2 - 50,
        datos2[93] * 3,
        datos2[93] * 3
      );
      ctxExt.font = '30px serif';
      ctxExt.fillText('copetón', dims.ancho - 200, (datos2[93] * dims.alto) / 255);
      ctxExt.strokeStyle = '#feff5d';
      ctxExt.beginPath();
    }

    if (abuela) {
      ctxExt.drawImage(
        imagenes.abuela.img,
        dims.ancho - 250,
        (datos2[98] * dims.alto) / 255,
        imagenes.abuela.ancho / 16,
        imagenes.abuela.alto / 16
      );
    }

    if (mirla) {
      ctxExt.drawImage(
        imagenes.mirla.img,
        dims.ancho - 250,
        (datos2[98] * dims.alto) / 255,
        imagenes.mirla.ancho / 14,
        imagenes.mirla.alto / 14
      );
    }

    if (pasos) {
      ctxExt.drawImage(
        imagenes.pasos.img,
        dims.ancho - 400,
        (datos2[93] * dims.alto) / 255 - 200,
        imagenes.pasos.ancho / 5,
        imagenes.pasos.alto / 5
      );
    }

    if (risas) {
      ctxExt.drawImage(
        imagenes.risas.img,
        dims.ancho - 350,
        (datos2[6] * dims.alto) / 255 - dims.alto / 1.1,
        imagenes.risas.ancho / 5,
        imagenes.risas.alto / 5
      );
    }

    if (arboloco) {
      ctxExt.drawImage(
        imagenes.arboloco.img,
        dims.ancho - 700,
        (datos2[6] * dims.alto) / 255 - dims.alto / 1.1,
        imagenes.arboloco.ancho / 6,
        imagenes.arboloco.alto / 6
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
      /* const xMontaña = (puntoF / 4) * Math.tan(pasoR * i) + centro.x + centro.x / 2;
      const yMontaña = (puntoF / 4) * Math.atan(pasoR * i) + centro.y - centro.y / 1.1;
      ctxMontaña.lineTo(xMontaña, yMontaña);*/

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

    if (tingua_bogotana) {
      ctxExt.font = '30px serif';
      ctxExt.fillText('tingua bogotana', dims.ancho - 250, (datos2[93] * dims.alto) / 255);
      ctxExt.strokeStyle = '#fed85d';
      ctxExt.beginPath();
      ctxExt.arc(dims.ancho - 235, centro.y / 2, datos2[93] / 3, 0, 2 * Math.PI);
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctxExt.stroke();
      ctx.restore();
    }

    if (tingua_azul) {
      ctxExt.font = '30px serif';
      ctxExt.fillText('tingua azul', dims.ancho - 250, (datos2[93] * dims.alto) / 255);
      ctxExt.strokeStyle = '#2200ff';
      ctxExt.beginPath();
      ctxExt.arc(dims.ancho - 250, centro.y / 2, datos2[93] / 3, 0, 2 * Math.PI);
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctxExt.stroke();
      ctx.restore();
    }

    if (mosca) {
      ctxExt.font = `${datos[3]}px serif`;
      ctxExt.fillText('mosca', dims.ancho - dims.ancho * 0.4, (datos[3] * dims.alto) / 255);
      ctxExt.strokeStyle = '#fed85d';
      ctxExt.beginPath();
    }

    if (abejorro) {
      ctxExt.font = `${datos[3] * 1.5}px serif`;
      ctxExt.fillText('abejorro', dims.ancho - dims.ancho * 0.4, (datos[3] * dims.alto) / 180);
      ctxExt.strokeStyle = '#fed85d';
      ctxExt.beginPath();
    }

    if (abeja) {
      ctxExt.font = `${datos[3] * 1.5}px serif`;
      ctxExt.fillText('abeja', dims.ancho - dims.ancho * 0.4, (datos[3] * dims.alto) / 180);
      ctxExt.strokeStyle = '#fed85d';
      ctxExt.beginPath();
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
