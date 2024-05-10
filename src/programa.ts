import './scss/estilos.scss';

import {
  applyWindow,
  ascale,
  calcComplexFFT,
  calcFFT,
  calcRGB,
  clamp,
  crearAnalizadorMeyda,
  fftBinToHertz,
  fscale,
  hertzToFFTBin,
  idxWrapOver,
  map,
  ncMethod,
  weightSpectrumAtFreq,
} from './ayudas';

import { visualizerSettings } from './constantes';
import { BarraEspectrograma } from './tipos';
import gui from './gui';
import pintarGrilla from './pintarGrilla';

const contenedor = document.getElementById('contenedor') as HTMLDivElement;
const reproductor = document.getElementById('reproductor') as HTMLAudioElement;
const cargarAudio = document.getElementById('cargarAudio') as HTMLInputElement;
const lienzo = document.getElementById('lienzo') as HTMLCanvasElement;
const ctx = lienzo.getContext('2d') as CanvasRenderingContext2D;
const lienzoInvisible = new OffscreenCanvas(0, 0);
const ctx2 = lienzoInvisible.getContext('2d');
const botonesSonidos = document.querySelectorAll<HTMLLIElement>('.botonSonido');
const fftData: number[] = new Array(visualizerSettings.fftSize).fill(0);
const verGrilla = false; // para que pinte o no la grilla
let contextoAudioCreado = false;

/**
 * Colores
 */
const rellenoMontañas = 'pink';
const bordeMontañas = '#d67e8e';
const rgbAgua = [61, 209, 235]; // Color base para el agua. En el espectrograma toca guardar los 3 colores en array para usarlos por separado para calcular la intensidad del color. Podemos pensar bien como crear el color del agua pero esto por ahora.

addEventListener('resize', escalar);

// gui();

function iniciarViaje(audioCtx: AudioContext, analizador: AnalyserNode, datos: Float32Array) {
  const min2 = fscale(visualizerSettings.minFreq, visualizerSettings.fscale, visualizerSettings.hzLinearFactor / 100);
  const max2 = fscale(visualizerSettings.maxFreq, visualizerSettings.fscale, visualizerSettings.hzLinearFactor / 100);
  const isReversed = visualizerSettings.minFreq > visualizerSettings.maxFreq;
  const minRange = hertzToFFTBin(
    visualizerSettings.minFreq,
    isReversed ? 'ceil' : 'floor',
    fftData.length,
    audioCtx.sampleRate
  );
  const maxRange = hertzToFFTBin(
    visualizerSettings.maxFreq,
    isReversed ? 'floor' : 'ceil',
    fftData.length,
    audioCtx.sampleRate
  );

  const ncDistance = visualizerSettings.ncDistance;
  const useNC = true; // ¿? Parece que tiene "más" resolución el espectrograma cuando esto es `true`
  const altAmplitude = visualizerSettings.decoupleAmplitudeFromSpectrum;
  const minIdx = hertzToFFTBin(visualizerSettings.minFreq, 'floor', fftData.length, audioCtx.sampleRate);
  const maxIdx = hertzToFFTBin(visualizerSettings.maxFreq, 'ceil', fftData.length, audioCtx.sampleRate);
  const min = Math.min(minIdx, maxIdx);
  const max = Math.max(minIdx, maxIdx);

  if (ctx2) ctx2.imageSmoothingEnabled = false;
  ctx.globalCompositeOperation = 'source-over';

  animar();

  function animar() {
    if (!ctx || !ctx2) return;
    analizador.getFloatTimeDomainData(datos); // nueva lectura de datos
    fftData.fill(0); // Reiniciar todos los puntos a posición 0

    for (let i = 0; i < visualizerSettings.inputSize; i++) {
      const x = map(i, 0, visualizerSettings.inputSize, -1, 1);
      const w = applyWindow(
        x,
        visualizerSettings.windowFunction,
        visualizerSettings.windowParameter,
        true,
        visualizerSettings.windowSkew
      );

      const magnitude = datos[i + analizador.fftSize - visualizerSettings.inputSize];
      fftData[idxWrapOver(i, fftData.length)] += magnitude * w;
    }

    const entradaFFT = fftData.map((x) => ((x * fftData.length) / fftData.length / 2) * Math.SQRT2);
    const espectro = useNC ? ncMethod(calcComplexFFT(entradaFFT), ncDistance) : calcFFT(entradaFFT);

    pintarMontañas(espectro, fftData.length);

    /** INICIO PINTAR ESPECTROGRAMA */
    ctx.globalAlpha = 0.5;
    ctx.globalCompositeOperation = 'source-over';
    // Color de forma de onda en Spectrum
    ctx.fillStyle = rellenoMontañas;
    ctx.strokeStyle = bordeMontañas;

    const spectrogramBars: BarraEspectrograma[] = [];

    for (let i = Math.min(minRange, maxRange); i <= Math.max(minRange, maxRange); i++) {
      const lowerBound = map(
        fscale(
          fftBinToHertz(i - 0.5, fftData.length, audioCtx.sampleRate),
          visualizerSettings.fscale,
          visualizerSettings.hzLinearFactor / 100
        ),
        min2,
        max2,
        0,
        1
      );

      const higherBound = map(
        fscale(
          fftBinToHertz(i + 0.5, fftData.length, audioCtx.sampleRate),
          visualizerSettings.fscale,
          visualizerSettings.hzLinearFactor / 100
        ),
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
      const mag = ascale(value, altAmplitude);
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

    /** FIN PINTAR ESPECTROGRAMA */

    if (verGrilla) pintarGrilla(lienzo, ctx, audioCtx);
    requestAnimationFrame(animar);
  }

  function pintarMontañas(espectro: number[], length: number) {
    if (!ctx) return;
    const piso = lienzo.height / 2;

    ctx.beginPath();
    ctx.lineTo(0, piso);

    ctx.lineTo(
      0,
      map(
        ascale(
          espectro[idxWrapOver(minIdx, espectro.length)] *
            weightSpectrumAtFreq(fftBinToHertz(minIdx, espectro.length, audioCtx.sampleRate))
        ),
        0,
        1,
        piso,
        0
      )
    );

    for (let i = min; i < max; i++) {
      ctx.lineTo(
        map(
          fscale(
            fftBinToHertz(i, length, audioCtx.sampleRate),
            visualizerSettings.fscale,
            visualizerSettings.hzLinearFactor / 100
          ),
          min2,
          max2,
          0,
          lienzo.width
        ),
        map(
          ascale(
            espectro[idxWrapOver(i, espectro.length)] *
              weightSpectrumAtFreq(fftBinToHertz(i, espectro.length, audioCtx.sampleRate))
          ),
          0,
          1,
          piso,
          0
        )
      );
    }

    ctx.lineTo(
      0,
      map(
        ascale(
          espectro[idxWrapOver(maxIdx, espectro.length)] *
            weightSpectrumAtFreq(fftBinToHertz(maxIdx, espectro.length, audioCtx.sampleRate))
        ),
        0,
        1,
        piso,
        0
      )
    );

    ctx.lineTo(lienzo.width, piso);
    ctx.globalAlpha = 0.1;
    ctx.fill();
    ctx.stroke();
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
  analizador.fftSize = 32768; // maxes out FFT size
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
  lienzoInvisible.width = lienzo.width;
  lienzoInvisible.height = visualizerSettings.display === 'both' ? Math.trunc(lienzo.height / 2) : lienzo.height;
}
