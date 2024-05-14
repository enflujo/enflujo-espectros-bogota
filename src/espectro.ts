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

escalar();
window.onresize = escalar;
const t = new Transformacion();
t.transladar(300, 100)
  .rotar(Math.PI / 4)
  .escalar(2);

lienzo.onclick = async () => {
  if (audioCargado) return;
  const archivo = await fetch('/S1_paisones Suba RvdH_V1.wav').then((respuesta) => respuesta.arrayBuffer());
  const audioCtx = new AudioContext();
  const audio = await audioCtx.decodeAudioData(archivo);
  const fuente = new AudioBufferSourceNode(audioCtx);
  fuente.buffer = audio;

  const analizador = audioCtx.createAnalyser();
  analizador.fftSize = tamañoFFT;

  fuente.connect(analizador);
  fuente.connect(audioCtx.destination);

  audioCargado = true;
  fuente.start();
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
    ctx.fillStyle = 'pink';
    // analizador.getFloatFrequencyData(datos);
    analizador.getByteTimeDomainData(datos);
    analizador.getByteFrequencyData(datos2);
    // console.log(datos);

    ctx.beginPath();
    ctx.moveTo(0, centro.y);

    for (let i = 0; i < cantidadPuntos; i++) {
      const punto = datos[i] / 128; //* dims.alto;
      const puntoF = datos2[i] * 2;
      ctx.lineTo(i * pasoX, punto * centro.y);
      ctx.fillRect(i * pasoX, dims.alto - puntoF, 1, puntoF);
      ctxExt.fillStyle = `rgb(${(Math.random() * 255) | 0}, ${(Math.random() * 255) | 0}, ${(Math.random() * 255) | 0})`;
      ctxExt.fillRect(0, i * pasoY, 1, pasoY);
      // console.log(i * pasoX, dims.alto, 1, dims.alto - datos[i] / 2);
    }
    ctxExt.drawImage(lienzoExt, 1, 0);

    ctx.drawImage(lienzoExt, 0, 0);
    ctx.lineTo(dims.ancho, centro.y);
    ctx.stroke();

    /** Probar transformador */
    ctx.setTransform(...t.matriz);
    ctx.fillRect(0, 0, 50, 50);
    ctx.resetTransform();

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
