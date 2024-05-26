import './scss/estilos.scss';

import {
  applyWindow,
  ascale,
  calcComplexFFT,
  calcFFT,
  calcRGB,
  clamp,
  encontrarBins,
  fftBinToHertz,
  fscale,
  hertzToFFTBin,
  idxWrapOver,
  map,
  ncMethod,
  numeroAleatorio,
  weightSpectrumAtFreq,
} from './ayudas';

import { visualizerSettings } from './constantes';
import { BarraEspectrograma } from './tipos';
import gui from './gui';
import pintarGrilla from './pintarGrilla';
import { Punto } from './tranformacion/Punto';
import Meyda, { MeydaFeaturesObject } from 'meyda';

const contenedor = document.getElementById('contenedor') as HTMLDivElement;
const reproductor = document.getElementById('reproductor') as HTMLAudioElement;
const cargarAudio = document.getElementById('cargarAudio') as HTMLInputElement;
const lienzo = document.getElementById('lienzo') as HTMLCanvasElement;
const ctx = lienzo.getContext('2d') as CanvasRenderingContext2D;
const lienzoInvisible = new OffscreenCanvas(0, 0);
const ctx2 = lienzoInvisible.getContext('2d') as OffscreenCanvasRenderingContext2D;
const botonesSonidos = document.querySelectorAll<HTMLLIElement>('.botonSonido');
const fftData: number[] = new Array(visualizerSettings.fftSize).fill(0);
const centro = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
const verGrilla = true; // para que pinte o no la grilla
let contextoAudioCreado = false;
let reloj = 0;

/**
 * Colores
 */
const rellenoMontañas = 'pink';
const bordeMontañas = '#d67e8e';
const rgbAgua = [61, 209, 235]; // Color base para el agua. En el espectrograma toca guardar los 3 colores en array para usarlos por separado para calcular la intensidad del color. Podemos pensar bien como crear el color del agua pero esto por ahora.

addEventListener('resize', escalar);

// gui();

function crearAnalizadorMeyda(contexto: AudioContext, fuente: MediaElementAudioSourceNode) {
  const analizadorMeyda = Meyda.createMeydaAnalyzer({
    audioContext: contexto,
    source: fuente,
    bufferSize: 1024,
    sampleRate: 44100,
    featureExtractors: ['amplitudeSpectrum', 'zcr'],
    callback: revisarEstados,
  });

  analizadorMeyda.start();
}

export function revisarEstados(caracteristicas: MeydaFeaturesObject) {
  const bin = encontrarBins(4000);
  const contenedorImagenes = document.getElementById('pajaros') as HTMLDivElement;
  const { amplitudeSpectrum, complexSpectrum, chroma, zcr } = caracteristicas;
  const identificarCopeton =
    amplitudeSpectrum[bin] > 5 && amplitudeSpectrum[78] < 3 && amplitudeSpectrum[27] < 7 && zcr > 170;

  const identificarTingua =
    amplitudeSpectrum[bin] > 5 && amplitudeSpectrum[78] < 3 && amplitudeSpectrum[27] < 7 && zcr < 170;
  // console.log(amplitudeSpectrum);
  if (identificarCopeton) {
    const imagen = document.createElement('img');
    imagen.classList.add('imagen');
    imagen.style.right = `${(bin * 100) / 512 + numeroAleatorio(-5, 5)}vw`; //`${Math.random() * 10 + 65}vw`;
    imagen.style.top = `${amplitudeSpectrum[bin]}vh`;
    imagen.src = '../copeton.PNG';

    contenedorImagenes.appendChild(imagen);
  } else if (identificarTingua) {
    console.log('tingua');
  }
}

function iniciarViaje(audioCtx: AudioContext, analizador: AnalyserNode, datos: Float32Array) {
  const { minFreq, maxFreq, inputSize, ncDistance } = visualizerSettings;
  const min2 = fscale(minFreq, visualizerSettings.fscale, 0);
  const max2 = fscale(maxFreq, visualizerSettings.fscale, 0);
  const minRange = hertzToFFTBin(minFreq, 'floor', fftData.length, audioCtx.sampleRate);
  const maxRange = hertzToFFTBin(maxFreq, 'ceil', fftData.length, audioCtx.sampleRate);
  const useNC = false; // ¿? Parece que tiene "más" resolución el espectrograma cuando esto es `true`, pero se ven mejor los colores en `false`
  const minIdx = hertzToFFTBin(minFreq, 'floor', fftData.length, audioCtx.sampleRate);
  const maxIdx = hertzToFFTBin(maxFreq, 'ceil', fftData.length, audioCtx.sampleRate);
  const minI = Math.min(minIdx, maxIdx);
  const maxI = Math.max(minIdx, maxIdx);

  if (ctx2) ctx2.imageSmoothingEnabled = false;

  reloj = requestAnimationFrame(animar);

  function animar() {
    analizador.getFloatTimeDomainData(datos); // nueva lectura de datos
    fftData.fill(0); // Reiniciar todos los puntos a posición 0

    for (let i = 0; i < inputSize; i++) {
      const x = map(i, 0, inputSize, -1, 1);
      const ancho = applyWindow(x);
      const magnitud = datos[i + analizador.fftSize - inputSize];
      fftData[idxWrapOver(i, fftData.length)] += magnitud * ancho;
    }

    const entradaFFT = fftData.map((x) => ((x * fftData.length) / fftData.length / 2) * Math.SQRT2);
    const espectro = useNC ? ncMethod(calcComplexFFT(entradaFFT), ncDistance) : calcFFT(entradaFFT);

    /**
     * MONTAÑAS
     */
    /** Borrar fotogramas anteriores */
    ctx.globalAlpha = 0.1; // Para dejar rastro se usa opacidad menor a 1.0, sin rastro con opacidad 1.
    // ctx.globalCompositeOperation = 'lighten'; // Se pueden usar tipos de mezcla para crear diferentes efectos al borrar
    ctx.fillRect(0, 0, lienzo.width, centro.y); // Pintar un cuadro del color, opacidad y efecto definidas en las líneas anteriores, sobre todo el area de las montañas.

    /** Estilos para pintar montañas */
    // ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = rellenoMontañas;
    ctx.strokeStyle = bordeMontañas;
    pintarMontañas(espectro, fftData.length);

    /**
     * AGUA
     */
    ctx.globalAlpha = 0.5;
    // ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'white';
    pintarEspectrograma(espectro, fftData.length);

    if (verGrilla) pintarGrilla(lienzo, ctx, audioCtx);
    reloj = requestAnimationFrame(animar);
  }

  function montañaY(i: number, espectro: number[]) {
    const largoE = espectro.length;
    return map(
      ascale(espectro[idxWrapOver(i, largoE)] * weightSpectrumAtFreq(fftBinToHertz(i, largoE, audioCtx.sampleRate))),
      0,
      1,
      centro.y,
      0
    );
  }

  function pintarMontañas(espectro: number[], numPuntos: number) {
    const datos: Punto[] = [];
    datos.push(
      new Punto(0, centro.y), // primer punto
      new Punto(0, montañaY(minIdx, espectro)) // Primer punto con datos
    );

    for (let i = minI + 1; i < maxI; i++) {
      const x = map(
        fscale(fftBinToHertz(i, numPuntos, audioCtx.sampleRate), visualizerSettings.fscale, 0),
        min2,
        max2,
        0,
        lienzo.width
      );
      const y = montañaY(i, espectro);

      datos.push(new Punto(x, y));
    }

    datos.push(new Punto(0, montañaY(maxIdx, espectro)), new Punto(lienzo.width, centro.y));

    ctx.beginPath();
    ctx.moveTo(datos[0].x, datos[0].y);

    for (let i = 1; i < datos.length; i++) {
      const { x, y } = datos[i];
      ctx.lineTo(x, y);
    }

    ctx.fill();
    ctx.stroke();
  }

  function pintarEspectrograma(espectro: number[], numPuntos: number) {
    const spectrogramBars: BarraEspectrograma[] = [];
    const rangoMin = Math.min(minRange, maxRange);
    const rangoMax = Math.max(minRange, maxRange);

    for (let i = rangoMin; i <= rangoMax; i++) {
      const lowerBound = map(
        fscale(fftBinToHertz(i - 0.5, numPuntos, audioCtx.sampleRate), visualizerSettings.fscale, 0),
        min2,
        max2,
        0,
        1
      );

      const higherBound = map(
        fscale(fftBinToHertz(i + 0.5, numPuntos, audioCtx.sampleRate), visualizerSettings.fscale, 0),
        min2,
        max2,
        0,
        1
      );
      const size = lienzoInvisible.width;
      const lowerVisible = clamp(Math.round(lowerBound * size), 0, size);
      const higherVisible = clamp(Math.round(higherBound * size), 0, size);

      if (lowerVisible !== higherVisible) {
        spectrogramBars.push({
          lo: i,
          hi: i,
          start: lowerVisible,
          end: higherVisible,
        });
      } else if (spectrogramBars.length > 0) {
        const lastBin = spectrogramBars[spectrogramBars.length - 1];
        lastBin.lo = Math.min(lastBin.lo, i);
        lastBin.hi = Math.max(lastBin.hi, i);
      }
    }

    const largoEspectro = espectro.length;

    for (let i = 0; i < spectrogramBars.length; i++) {
      let value = 0;

      for (let idx = spectrogramBars[i].lo; idx <= spectrogramBars[i].hi; idx++) {
        const binIdx = idxWrapOver(idx, fftData.length);

        if (largoEspectro)
          value = Math.max(
            value,
            espectro[binIdx] *
              weightSpectrumAtFreq(
                fftBinToHertz(idx + visualizerSettings.slopeFunctionsOffset, largoEspectro, audioCtx.sampleRate)
              )
          );
      }

      const [rojo, verde, azul] = rgbAgua;
      const mag = ascale(value);
      const { r, g, b } = calcRGB(mag * rojo * -1 + rojo, mag * verde * -1 + verde, mag * azul * -1 + azul);
      const x1 = clamp(spectrogramBars[i].start, 0, lienzoInvisible.width);
      const x2 = clamp(spectrogramBars[i].end, 0, lienzoInvisible.width);
      const delta = x2 - x1;
      ctx2.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx2.fillRect(x1, 0, delta, 1);
    }

    ctx2.drawImage(lienzoInvisible, 0, 1);
    ctx.fillRect(0, lienzo.height - lienzoInvisible.height, lienzoInvisible.width, lienzoInvisible.height);
    ctx.drawImage(lienzoInvisible, 0, lienzo.height - lienzoInvisible.height);
  }
}

/**
 * Si hay botones, crear eventos para reproducir cada uno.
 */
if (botonesSonidos.length) {
  botonesSonidos.forEach((boton) => {
    const { archivo } = boton.dataset;
    if (!archivo) return;

    boton.addEventListener('click', () => {
      document.querySelector<HTMLLIElement>('.botonSonido.activo')?.classList.remove('activo');
      boton.classList.add('activo');
      iniciarAudio(archivo);
    });
  });
}

/**
 * Si un audio se sube como archivo
 */
cargarAudio.addEventListener('change', (evento) => {
  const elemento = evento.target as HTMLInputElement;
  const archivo = elemento.files?.item(0);
  if (!archivo) return;
  const lector = new FileReader();

  lector.onload = (e) => {
    if (!e.target?.result) return;
    iniciarAudio(e.target.result as string);
  };
  lector.readAsDataURL(archivo);
});

function crearContexto() {
  const audioCtx = new AudioContext();
  const fuenteAudio = audioCtx.createMediaElementSource(reproductor);
  // Crear analizador Meyda
  crearAnalizadorMeyda(audioCtx, fuenteAudio);
  /* Analyser: a node able to provide real-time frequency and time-domain analysis information. 
  It is an AudioNode that passes the audio stream unchanged from the input to the output, 
  but allows you to take the generated data, process it, and create audio visualizations.
   https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode */
  const analizador = audioCtx.createAnalyser();
  /* fftSize: An unsigned integer, representing the window size of the FFT, given in number of samples. 
  A higher value will result in more details in the frequency domain but fewer details in the amplitude domain.
  Must be a power of 2 between 2^5 and 2^15. 
  https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/fftSize */
  analizador.fftSize = visualizerSettings.fftSize;
  // Los datos del audio guardados en un array de Float32
  const datos = new Float32Array(analizador.fftSize);
  fuenteAudio.connect(analizador);
  analizador.connect(audioCtx.destination);

  contextoAudioCreado = true;

  escalar();
  iniciarViaje(audioCtx, analizador, datos);
}

function iniciarAudio(ruta: string) {
  if (!contextoAudioCreado) crearContexto();
  reproductor.src = ruta;
  reproductor.oncanplay = () => {
    escalar();
    reproductor.play();
  };
}

export function escalar() {
  const escala = devicePixelRatio;
  lienzo.width = contenedor.clientWidth * escala;
  lienzo.height = contenedor.clientHeight * escala;
  centro.x = lienzo.width / 2;
  centro.y = lienzo.height / 2;
  lienzoInvisible.width = lienzo.width;
  lienzoInvisible.height = visualizerSettings.display === 'both' ? Math.trunc(centro.y) : lienzo.height;
}
