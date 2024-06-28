import './scss/estilos.scss';

import Meyda, { type MeydaFeaturesObject } from 'meyda';
import type { MeydaAnalyzer } from 'meyda/dist/esm/meyda-wa';
import * as datosLugares from './datos/lugares';
import { cargarImgs, reducirDecimales } from './ayudas';
import type { TImagenes, TLugar, TSubtitulo } from './tipos';
import estadosSuba from './estadosSuba';
import estadosBosa from './estadosBosa';
import estadosZuque from './estadosZuque';

/**
 * Elementos de HTML
 */
const botonesAudios = document.querySelectorAll<HTMLLIElement>('.botonAudio');
const etiquetaTiempo: HTMLParagraphElement = document.getElementById('tiempo') as HTMLParagraphElement;
const botonPausa: HTMLDivElement = document.getElementById('pausa') as HTMLDivElement;
const contenedorSubtitulos: HTMLParagraphElement = document.getElementById('subtitulos') as HTMLParagraphElement;
const botonCreditos = document.getElementById('saberMas');
const botonCerrarCreditos = document.getElementById('cerrar');
const creditos = document.getElementById('creditos');
const lienzo: HTMLCanvasElement = document.getElementById('lienzo') as HTMLCanvasElement;
const ctx = lienzo.getContext('2d') as CanvasRenderingContext2D;
const lienzoExt: OffscreenCanvas = new OffscreenCanvas(0, 0);
const lienzoBarras: OffscreenCanvas = new OffscreenCanvas(0, 0);
const lienzoBu: OffscreenCanvas = new OffscreenCanvas(0, 0);
// const lienzoMontaña: OffscreenCanvas = new OffscreenCanvas(0, 0);
const ctxExt = lienzoExt.getContext('2d');
const ctxBarras = lienzoBarras.getContext('2d');
const ctxBu = lienzoBu.getContext('2d');
// const ctxMontaña = lienzoMontaña.getContext('2d');

/**
 * Configuración general
 */
// Variable para no empezar el audio en 0
let empezarEn = 0;
let tiempoInicial = 0;
const base = import.meta.env.BASE_URL;
const tamañoFFT = 2048;
const cantidadPuntos = tamañoFFT / 2;
const pasoR = (2 * Math.PI) / cantidadPuntos;

/**
 *
 */
let analizadorMeyda: MeydaAnalyzer;
let fuente: AudioBufferSourceNode;
let analizador: AnalyserNode;

/**
 * Variables globales
 */
const dims: { ancho: number; alto: number; pasoX: number } = { ancho: 0, alto: 0, pasoX: 0 };
const centro: { x: number; y: number } = { x: 0, y: 0 };
let reloj = 0;
let segundos = 0;
let pasoX = 0;
let pasoY = 0;
let audioCtx: AudioContext;
let lugarElegido = 'suba';
let animacionCorriendo = false;
// booleanos para mostrar elementos
const estados = {
  aguaFuego: false,
  abeja: false,
  abejorro: false,
  abuela: false,
  alcaravan: false,
  arboloco: false,
  avion: false,
  biciMotor: false,
  carro: false,
  copeton: false,
  curi: false,
  gallina: false,
  gallo: false,
  gavilanMaromero: false,
  mirla: false,
  mosca: false,
  moto: false,
  narizPerro: false,
  pasos: false,
  perchas: false,
  pito: false,
  pingPong: false,
  risas: false,
  tinguaBogotana: false,
  tinguaAzul: false,
  tingua: false,
};

/**
 * Pintar estado inicial y definir eventos
 */
escalar();
lienzo.onclick = pausarReproducir;
window.onresize = escalar;

function mostrarTiempo() {
  if (!etiquetaTiempo) return;
  segundos = audioCtx.currentTime - tiempoInicial + empezarEn;

  const h = reducirDecimales(segundos / 3600);
  const m = reducirDecimales((segundos % 3600) / 60);
  const s = reducirDecimales(segundos % 60);
  const tiempo = `${h}:${m}:${s}`;
  etiquetaTiempo.innerText = tiempo;
}

function pausarReproducir() {
  if (audioCtx.state === 'running') {
    audioCtx.suspend();
    botonPausa.classList.add('play');
    botonPausa.innerText = '  ▶';
    animacionCorriendo = false;
  } else if (audioCtx.state === 'suspended') {
    audioCtx.resume();
    botonPausa.classList.remove('play');
    botonPausa.innerText = '▐▐';
    animacionCorriendo = true;
  }
}

function mostrarSubtitulos(subtitulos: TSubtitulo[]) {
  if (!contenedorSubtitulos) return;
  subtitulos.forEach((elemento) => {
    if (segundos >= elemento.tiempoInicial) {
      contenedorSubtitulos.innerText = elemento.texto;
      contenedorSubtitulos.style.display = 'block';
    }
    if (segundos > elemento.tiempoFinal) {
      contenedorSubtitulos.style.display = 'none';
      contenedorSubtitulos.innerText = '';
    }
  });
}

function crearAnalizadorMeyda(contexto: AudioContext, fuente: AudioBufferSourceNode) {
  const analizadorMeyda = Meyda.createMeydaAnalyzer({
    audioContext: contexto,
    source: fuente,
    bufferSize: cantidadPuntos,
    sampleRate: 44100,
    featureExtractors: ['amplitudeSpectrum', 'zcr'],
    callback: revisarEstados,
  });

  analizadorMeyda.start();
  return analizadorMeyda;
}

function revisarEstados(caracteristicas: MeydaFeaturesObject) {
  const { amplitudeSpectrum, zcr } = caracteristicas;

  if (lugarElegido === 'suba') {
    estadosSuba(estados, segundos, amplitudeSpectrum, zcr);
  } else if (lugarElegido === 'bosa') {
    estadosBosa(estados, segundos, amplitudeSpectrum, zcr);
  } else if (lugarElegido === 'zuque') {
    estadosZuque(estados, segundos, amplitudeSpectrum, zcr);
  }
}

function crearContextoAudio() {
  if (audioCtx) {
    return;
  }

  audioCtx = new AudioContext();
  analizador = audioCtx.createAnalyser();
  analizador.fftSize = tamañoFFT;
}

async function empezar(lugar: TLugar) {
  crearContextoAudio();

  if (fuente) {
    fuente.stop();
    fuente.disconnect();
    analizadorMeyda.stop();
    cancelAnimationFrame(reloj);
    escalar();
  }

  const archivo = await fetch(`${base}/${lugar.rutaAudio}`).then((respuesta) => respuesta.arrayBuffer());
  const audio = await audioCtx.decodeAudioData(archivo);
  fuente = new AudioBufferSourceNode(audioCtx);
  analizadorMeyda = crearAnalizadorMeyda(audioCtx, fuente);
  fuente.buffer = audio;
  fuente.connect(analizador);
  fuente.connect(audioCtx.destination);
  fuente.start(0, empezarEn);
  tiempoInicial = audioCtx.currentTime;

  try {
    const imagenes: TImagenes = {};

    lugar.imagenes.forEach((nombre) => {
      imagenes[nombre] = { ruta: `${base}/${nombre}.png`, img: new Image(), ancho: 0, alto: 0 };
    });

    await cargarImgs(imagenes);
    inicio(analizador, imagenes, lugar.subtitulos);
  } catch (error) {
    console.error(error);
  }
}

function borrarTodo() {
  if (!contenedorSubtitulos) return;
  contenedorSubtitulos.innerText = '';
  contenedorSubtitulos.style.display = 'none';
  ctx.fillStyle = 'pink';
  ctx.fillRect(0, 0, dims.ancho, dims.alto);
}

function inicio(analizador: AnalyserNode, imagenes: TImagenes, subtitulos: TSubtitulo[]) {
  const tamañoDatos = analizador.frequencyBinCount;
  const datosTiempo = new Uint8Array(tamañoDatos);
  const datosFrec = new Uint8Array(tamañoDatos);

  reloj = requestAnimationFrame(animar);

  borrarTodo();

  function animar() {
    if (!ctxExt || !ctxBarras || !ctxBu) return;
    reloj = requestAnimationFrame(animar);

    if (!animacionCorriendo) return;
    mostrarTiempo();

    /** Extraer datos */
    analizador.getByteTimeDomainData(datosTiempo);
    analizador.getByteFrequencyData(datosFrec);
    const { ancho, alto } = dims;

    /**
     * Borrar antes de pintar un nuevo fotograma
     */
    ctx.fillStyle = 'pink';
    ctx.fillRect(0, 0, ancho, alto);
    ctxBarras.clearRect(0, 0, ancho, alto);
    ctxBu.clearRect(0, 0, ancho, alto);
    // ctxMontaña.clearRect(0, 0, dims.ancho, dims.alto);

    if (subtitulos.length) {
      mostrarSubtitulos(subtitulos);
    }

    // Mostrar imágenes
    if (estados.copeton) {
      ctxExt.drawImage(
        imagenes.copeton.img,
        ancho - 240,
        (Math.random() * alto) / 2 - 50,
        datosFrec[93] * 3,
        datosFrec[93] * 3
      );
      ctxExt.font = '30px serif';
      ctxExt.fillText('copetón', ancho - 200, (datosFrec[93] * alto) / 255);
    }

    if (estados.abuela) {
      ctxExt.drawImage(
        imagenes.abuela.img,
        ancho - 250,
        (datosFrec[98] * alto) / 255,
        imagenes.abuela.ancho / 16,
        imagenes.abuela.alto / 16
      );
    }

    if (estados.aguaFuego) {
      ctxExt.drawImage(
        imagenes.aguaFuego.img,
        ancho - 250,
        (datosFrec[3] * alto) / 255,
        imagenes.aguaFuego.ancho / 10,
        imagenes.aguaFuego.alto / 10
      );
    }

    if (estados.alcaravan) {
      ctxExt.drawImage(
        imagenes.alcaravan.img,
        ancho - ancho * 0.4,
        (datosFrec[58] * alto) / 255 - alto * 0.4,
        imagenes.alcaravan.ancho / 8,
        imagenes.alcaravan.alto / 8
      );
    }

    if (estados.carro) {
      ctxExt.drawImage(imagenes.carro.img, ancho * 0.6, alto * 0.4, imagenes.carro.ancho / 8, imagenes.carro.alto / 8);
    }

    if (estados.gallina) {
      ctxExt.drawImage(
        imagenes.gallina.img,
        ancho * 0.5,
        alto * 0.4,
        imagenes.gallina.ancho / 10,
        imagenes.gallina.alto / 10
      );
    }

    if (estados.gallo) {
      ctxExt.drawImage(imagenes.gallo.img, ancho * 0.6, alto * 0.4, imagenes.gallo.ancho / 9, imagenes.gallo.alto / 9);
    }

    if (estados.gavilanMaromero) {
      ctxExt.drawImage(
        imagenes.gavilanMaromero.img,
        ancho - ancho * 0.4,
        (datosFrec[5] * alto) / 255 - alto * 0.4,
        imagenes.gavilanMaromero.ancho / 8,
        imagenes.gavilanMaromero.alto / 8
      );
    }

    if (estados.mirla) {
      ctxExt.drawImage(
        imagenes.mirla.img,
        ancho - 250,
        (datosFrec[98] * alto) / 255,
        imagenes.mirla.ancho / 14,
        imagenes.mirla.alto / 14
      );
    }

    if (estados.moto) {
      ctxExt.drawImage(
        imagenes.moto.img,
        ancho * 0.6,
        (datosFrec[2] * alto) / 255,
        imagenes.moto.ancho / 9,
        imagenes.moto.alto / 9
      );
    }

    if (estados.pasos) {
      ctxExt.drawImage(
        imagenes.pasos.img,
        ancho - 400,
        (datosFrec[93] * alto) / 255 - 200,
        imagenes.pasos.ancho / 5,
        imagenes.pasos.alto / 5
      );
    }

    if (estados.perchas) {
      ctxExt.drawImage(
        imagenes.perchas.img,
        ancho - ancho / 2,
        alto / 255 - 100,
        imagenes.perchas.ancho / 5,
        imagenes.perchas.alto / 5
      );
    }

    if (estados.narizPerro) {
      ctxExt.drawImage(
        imagenes.narizPerro.img,
        ancho - ancho * 0.4,
        alto / 255 + datosFrec[6],
        imagenes.narizPerro.ancho / 6,
        imagenes.narizPerro.alto / 7
      );
    }

    if (estados.risas) {
      ctxExt.drawImage(
        imagenes.risas.img,
        ancho - 350,
        (datosFrec[6] * alto) / 255 - alto / 1.1,
        imagenes.risas.ancho / 5,
        imagenes.risas.alto / 5
      );
    }

    if (estados.arboloco) {
      ctxExt.drawImage(
        imagenes.arboloco.img,
        ancho - 700,
        (datosFrec[6] * alto) / 255 - alto / 1.1,
        imagenes.arboloco.ancho / 6,
        imagenes.arboloco.alto / 6
      );
    }

    if (estados.curi) {
      ctxExt.drawImage(
        imagenes.curi.img,
        ancho - 700,
        (datosFrec[6] * alto) / 255 - alto * 0.2,
        imagenes.curi.ancho / 10,
        imagenes.curi.alto / 10
      );
    }

    if (estados.avion) {
      ctxExt.drawImage(
        imagenes.avionDer.img,
        ancho - 700,
        (datosFrec[1] * alto) / 255 - alto * 0.7,
        imagenes.avionDer.ancho / 10,
        imagenes.avionDer.alto / 10
      );
    }

    if (estados.biciMotor) {
      ctxExt.drawImage(
        imagenes.biciMotor.img,
        ancho - ancho / 2,
        (datosFrec[1] * alto) / 255 - alto * 0.3,
        imagenes.biciMotor.ancho / 10,
        imagenes.biciMotor.alto / 10
      );
    }

    ctx.fillStyle = 'blue';
    ctx.beginPath();
    ctx.moveTo(0, centro.y);
    ctxBarras.fillStyle = 'blue';
    ctxBu.beginPath();
    ctxBu.moveTo(centro.x, centro.y);
    ctxBu.strokeStyle = 'white';
    // ctxMontaña.beginPath();
    // ctxMontaña.moveTo(centro.x + centro.x / 2, centro.y - centro.y / 1.1);
    // ctxMontaña.strokeStyle = 'white';
    for (let i = 0; i < cantidadPuntos; i++) {
      const punto = datosTiempo[i] / 128;
      const puntoF = datosFrec[i] * 2;

      ctxExt.fillStyle = `rgba(${(Math.random() * 200) | 0}, ${(puntoF / 2) | 50}, ${(puntoF / 2) | 200} )`; //`rgb(${(Math.random() * 255) | 0}, ${(Math.random() * 255) | 0}, ${(Math.random() * 255) | 0})`;
      ctxExt.fillRect(ancho, i * pasoY, -1, pasoY);

      const xBu = puntoF * Math.acos(pasoR * i) + centro.x;
      const yBu = puntoF * Math.sin(pasoR * i) + centro.y;
      ctxBu.lineTo(xBu, yBu);

      // Montaña
      /* const xMontaña = (puntoF / 4) * Math.tan(pasoR * i) + centro.x + centro.x / 2;
      const yMontaña = (puntoF / 4) * Math.atan(pasoR * i) + centro.y - centro.y / 1.1;
      ctxMontaña.lineTo(xMontaña, yMontaña);*/

      ctx.lineTo(i * pasoX, punto * centro.y); // Línea del centro
      ctxBarras.fillRect(i * pasoX, alto - puntoF, 5, puntoF); // Pintar barras
    }
    ctxBu.stroke();
    // ctxMontaña.stroke();

    ctxExt.drawImage(lienzoExt, -1, 0);
    ctx.drawImage(lienzoExt, 0, 0);

    ctx.save();
    ctx.globalCompositeOperation = 'color-dodge';
    ctx.drawImage(lienzoBarras, 0, 0);
    ctx.restore();

    ctx.drawImage(lienzoBu, 0, 0);
    ctxBu.translate(ancho, 0);
    ctxBu.scale(-1, 1);
    ctx.drawImage(lienzoBu, 0, 0, -ancho, alto);

    // ctx.save();
    // ctx.scale(0.4, 1);
    // ctx.translate(dims.ancho + dims.ancho / 3, 0);
    // ctx.drawImage(lienzoMontaña, 0, 0);
    // ctx.restore();

    // Pintar onda central
    ctx.strokeStyle = '#85f5d6';
    ctx.lineTo(ancho, centro.y);
    ctx.stroke();

    if (estados.tinguaBogotana) {
      ctxExt.font = '30px serif';
      ctxExt.fillText('tingua bogotana', ancho - 250, (datosFrec[93] * alto) / 255);
      ctxExt.strokeStyle = '#fed85d';
      ctxExt.beginPath();
      ctxExt.arc(ancho - 235, centro.y / 2, datosFrec[93] / 3, 0, 2 * Math.PI);
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctxExt.stroke();
      ctx.restore();
    }

    if (estados.tinguaAzul) {
      ctxExt.font = '30px serif';
      ctxExt.fillText('tingua azul', ancho - 250, (datosFrec[93] * alto) / 255);
      ctxExt.strokeStyle = '#2200ff';
      ctxExt.beginPath();
      ctxExt.arc(ancho - 250, centro.y / 2, datosFrec[93] / 3, 0, 2 * Math.PI);
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctxExt.stroke();
      ctx.restore();
    }

    if (estados.tingua) {
      ctxExt.font = '30px serif';
      ctxExt.fillText('tingua', ancho - 250, (datosFrec[93] * alto) / 255);
      ctxExt.strokeStyle = '#2200ff';
      ctxExt.beginPath();
      ctxExt.arc(ancho - 250, centro.y / 2, datosFrec[93] / 3, 0, 2 * Math.PI);
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctxExt.stroke();
      ctx.restore();
    }

    if (estados.mosca) {
      ctxExt.font = `${datosTiempo[3]}px serif`;
      ctxExt.fillText('mosca', ancho - ancho * 0.4, (datosTiempo[3] * alto) / 255);
      ctxExt.strokeStyle = '#fed85d';
      ctxExt.beginPath();
      ctxExt.drawImage(
        imagenes.mosca.img,
        ancho - ancho / 2,
        (datosTiempo[3] * alto) / 255 - alto * 0.5,
        imagenes.mosca.ancho / 10,
        imagenes.mosca.alto / 10
      );
    }

    if (estados.abejorro) {
      ctxExt.font = `${datosTiempo[3] * 1.5}px serif`;
      ctxExt.fillText('abejorro', ancho - ancho * 0.4, (datosTiempo[3] * alto) / 180);
      ctxExt.strokeStyle = '#fed85d';
      ctxExt.beginPath();
      ctxExt.drawImage(
        imagenes.abejorro.img,
        ancho - ancho / 2,
        (datosTiempo[3] * alto) / 255 - alto * 0.5,
        imagenes.abejorro.ancho / 10,
        imagenes.abejorro.alto / 10
      );
    }

    if (estados.abeja) {
      ctxExt.font = `${datosTiempo[3] * 1.5}px serif`;
      ctxExt.fillText('abeja', ancho - ancho * 0.4, (datosTiempo[3] * alto) / 180);
      ctxExt.strokeStyle = '#fed85d';
      ctxExt.beginPath();
      ctxExt.drawImage(
        imagenes.abeja.img,
        ancho - ancho / 2,
        (datosFrec[3] * alto) / 255 - alto * 0.2,
        imagenes.abeja.ancho / 8,
        imagenes.abeja.alto / 8
      );
    }

    if (estados.pingPong) {
      for (let i = 30; i > 0; i = i - 30) {
        ctxExt.font = '25px serif';
        ctxExt.fillText('ping pong', ancho - 250, (datosFrec[9] * alto) / 255);
        ctxExt.strokeStyle = '#ffeeee';
        ctxExt.beginPath();
        ctxExt.arc(ancho - 235, centro.y + datosFrec[9], i, 0, 2 * Math.PI);
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctxExt.stroke();
        ctx.restore();
      }
    }
  }
}

function escalar() {
  dims.ancho =
    lienzo.width =
    lienzoExt.width =
    lienzoBarras.width =
    lienzoBu.width =
      // lienzoMontaña.width =
      window.innerWidth;
  dims.alto =
    lienzo.height =
    lienzoExt.height =
    lienzoBarras.height =
    lienzoBu.height =
      // lienzoMontaña.height =
      window.innerHeight;
  centro.x = dims.ancho / 2;
  centro.y = dims.alto / 2;
  ctx.fillStyle = 'pink';

  ctx.fillRect(0, 0, lienzo.width, lienzo.height);
  pasoX = dims.ancho / cantidadPuntos;
  pasoY = dims.alto / cantidadPuntos;
}

/**
 * Interfaz
 */
if (botonesAudios.length) {
  botonesAudios.forEach((boton) => {
    boton.addEventListener('click', () => {
      const elegidoActualmente = document.querySelector('.elegido');
      if (elegidoActualmente) elegidoActualmente.classList.remove('elegido');
      boton.classList.add('elegido');

      const { nombre } = boton.dataset;

      if (nombre) {
        botonPausa.innerText = '▐▐';
        animacionCorriendo = true;
        empezar(datosLugares[nombre]);
        lugarElegido = nombre;
      }
    });
  });
}

botonPausa.addEventListener('click', () => {
  pausarReproducir();
});

botonCreditos?.addEventListener('click', () => {
  creditos?.classList.toggle('visible');
});

botonCerrarCreditos?.addEventListener('click', () => {
  creditos?.classList.remove('visible');
});
