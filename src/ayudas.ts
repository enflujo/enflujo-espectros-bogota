import Meyda from 'meyda';
import { visualizerSettings } from './constantes';
import type { FFTComplejo, TBandas } from './tipos';

export function map(x: number, min: number, max: number, targetMin: number, targetMax: number) {
  return ((x - min) / (max - min)) * (targetMax - targetMin) + targetMin;
}

export function clamp(x: number, min: number, max: number) {
  return Math.min(Math.max(x, min), max);
}

export function idxWrapOver(x: number, length: number) {
  return ((x % length) + length) % length;
}

// Hz and FFT bin conversion
export function hertzToFFTBin(x: number, y = 'round', bufferSize = 4096, sampleRate = 44100) {
  const bin = (x * bufferSize) / sampleRate;
  let func = y;

  if (!['floor', 'ceil', 'trunc'].includes(func)) func = 'round'; // always use round if you specify an invalid/undefined value

  return Math[func](bin);
}

export function fftBinToHertz(x: number, bufferSize = 4096, sampleRate = 44100) {
  return (x * sampleRate) / bufferSize;
}

// Calculate the FFT
export function calcFFT(input: number[]) {
  const fft = [...input];
  const fft2 = [...input];

  transform(fft, fft2);
  const respuesta = new Array(Math.round(fft.length)).fill(0);

  for (let i = 0; i < respuesta.length; i++) {
    respuesta[i] = Math.hypot(fft[i], fft2[i]) / fft.length;
  }

  return respuesta;
}

export function calcComplexFFT(input: number[], includeImag = false) {
  const fft = input.map((x) => x * Math.sqrt(1 - +includeImag));
  const fft2 = input.map((x) => x * +includeImag);

  transform(fft, fft2);

  return input.map((_, i, arr) => {
    return {
      re: fft[i] / (arr.length / 2),
      im: fft2[i] / (arr.length / 2),
      magnitude: Math.hypot(fft[i], fft2[i]) / (arr.length / 2),
      phase: Math.atan2(fft2[i], fft[i]),
    };
  });
}

export function calcComplexInputFFT(real: number[], imag: number[]) {
  if (real.length !== imag.length) return [];

  const fft1 = [...real];
  const fft2 = [...imag];
  transform(fft1, fft2);

  return real.map((_, i, arr) => {
    return {
      re: fft1[i] / arr.length,
      im: fft2[i] / arr.length,
      magnitude: Math.hypot(fft1[i], fft2[i]) / arr.length,
      phase: Math.atan2(fft2[i], fft1[i]),
    };
  });
}
/**
 * FFT and convolution (JavaScript)
 *
 * Copyright (c) 2017 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/free-small-fft-in-multiple-languages
 */

/*
 * Computes the discrete Fourier transform (DFT) of the given complex vector, storing the result back into the vector.
 * The vector can have any length. This is a wrapper function.
 */
export function transform(real: number[], imag: number[]) {
  const n = real.length;
  if (n != imag.length) throw 'Mismatched lengths';
  if (n <= 0) return;
  else if (2 ** Math.trunc(Math.log2(n)) === n)
    // Is power of 2
    transformRadix2(real, imag);
  // More complicated algorithm for arbitrary sizes
  else transformBluestein(real, imag);
}

/*
 * Computes the inverse discrete Fourier transform (IDFT) of the given complex vector, storing the result back into the vector.
 * The vector can have any length. This is a wrapper function. This transform does not perform scaling, so the inverse is not a true inverse.
 */
export function inverseTransform(real: number[], imag: number[]) {
  transform(imag, real);
}

/*
 * Computes the discrete Fourier transform (DFT) of the given complex vector, storing the result back into the vector.
 * The vector's length must be a power of 2. Uses the Cooley-Tukey decimation-in-time radix-2 algorithm.
 */
export function transformRadix2(real: number[], imag: number[]) {
  // Length variables
  const n = real.length;
  if (n != imag.length) throw 'Mismatched lengths';
  if (n <= 1)
    // Trivial transform
    return;
  const logN = Math.log2(n);
  if (2 ** Math.trunc(logN) !== n) throw 'Length is not a power of 2';

  // Trigonometric tables
  const cosTable = new Array(n / 2);
  const sinTable = new Array(n / 2);
  for (let i = 0; i < n / 2; i++) {
    cosTable[i] = Math.cos((2 * Math.PI * i) / n);
    sinTable[i] = Math.sin((2 * Math.PI * i) / n);
  }

  // Bit-reversed addressing permutation
  for (let i = 0; i < n; i++) {
    const j = reverseBits(i, logN);
    if (j > i) {
      let temp = real[i];
      real[i] = real[j];
      real[j] = temp;
      temp = imag[i];
      imag[i] = imag[j];
      imag[j] = temp;
    }
  }

  // Cooley-Tukey decimation-in-time radix-2 FFT
  for (let size = 2; size <= n; size *= 2) {
    const halfsize = size / 2;
    const tablestep = n / size;
    for (let i = 0; i < n; i += size) {
      for (let j = i, k = 0; j < i + halfsize; j++, k += tablestep) {
        const l = j + halfsize;
        const tpre = real[l] * cosTable[k] + imag[l] * sinTable[k];
        const tpim = -real[l] * sinTable[k] + imag[l] * cosTable[k];
        real[l] = real[j] - tpre;
        imag[l] = imag[j] - tpim;
        real[j] += tpre;
        imag[j] += tpim;
      }
    }
  }

  // Returns the integer whose value is the reverse of the lowest 'bits' bits of the integer 'x'.
  function reverseBits(x: number, bits: number) {
    let y = 0;
    for (let i = 0; i < bits; i++) {
      y = (y << 1) | (x & 1);
      x >>>= 1;
    }
    return y;
  }
}

/*
 * Computes the discrete Fourier transform (DFT) of the given complex vector, storing the result back into the vector.
 * The vector can have any length. This requires the convolution function, which in turn requires the radix-2 FFT function.
 * Uses Bluestein's chirp z-transform algorithm.
 */
export function transformBluestein(real: number[], imag: number[]) {
  // Find a power-of-2 convolution length m such that m >= n * 2 + 1
  const n = real.length;
  if (n != imag.length) throw 'Mismatched lengths';
  const m = 2 ** Math.trunc(Math.log2(n * 2) + 1);

  // Trignometric tables
  const cosTable = new Array(n);
  const sinTable = new Array(n);

  for (let i = 0; i < n; i++) {
    const j = (i * i) % (n * 2); // This is more accurate than j = i * i
    cosTable[i] = Math.cos((Math.PI * j) / n);
    sinTable[i] = Math.sin((Math.PI * j) / n);
  }

  // Temporary vectors and preprocessing
  const areal = newArrayOfZeros(m);
  const aimag = newArrayOfZeros(m);
  for (let i = 0; i < n; i++) {
    areal[i] = real[i] * cosTable[i] + imag[i] * sinTable[i];
    aimag[i] = -real[i] * sinTable[i] + imag[i] * cosTable[i];
  }

  const breal = newArrayOfZeros(m);
  const bimag = newArrayOfZeros(m);
  breal[0] = cosTable[0];
  bimag[0] = sinTable[0];
  for (let i = 1; i < n; i++) {
    breal[i] = breal[m - i] = cosTable[i];
    bimag[i] = bimag[m - i] = sinTable[i];
  }

  // Convolution
  const creal = new Array(m);
  const cimag = new Array(m);
  convolveComplex(areal, aimag, breal, bimag, creal, cimag);

  // Postprocessing
  for (let i = 0; i < n; i++) {
    real[i] = creal[i] * cosTable[i] + cimag[i] * sinTable[i];
    imag[i] = -creal[i] * sinTable[i] + cimag[i] * cosTable[i];
  }
}

/*
 * Computes the circular convolution of the given real vectors. Each vector's length must be the same.
 */
export function convolveReal(x: number[], y: number[], out: number[]) {
  const n = x.length;
  if (n != y.length || n != out.length) throw 'Mismatched lengths';
  convolveComplex(x, newArrayOfZeros(n), y, newArrayOfZeros(n), out, newArrayOfZeros(n));
}

/*
 * Computes the circular convolution of the given complex vectors. Each vector's length must be the same.
 */
export function convolveComplex(
  xreal: number[],
  ximag: number[],
  yreal: number[],
  yimag: number[],
  outreal: number[],
  outimag: number[]
) {
  const n = xreal.length;
  if (n != ximag.length || n != yreal.length || n != yimag.length || n != outreal.length || n != outimag.length)
    throw 'Mismatched lengths';

  xreal = xreal.slice();
  ximag = ximag.slice();
  yreal = yreal.slice();
  yimag = yimag.slice();
  transform(xreal, ximag);
  transform(yreal, yimag);

  for (let i = 0; i < n; i++) {
    const temp = xreal[i] * yreal[i] - ximag[i] * yimag[i];
    ximag[i] = ximag[i] * yreal[i] + xreal[i] * yimag[i];
    xreal[i] = temp;
  }
  inverseTransform(xreal, ximag);

  for (let i = 0; i < n; i++) {
    // Scaling (because this FFT implementation omits it)
    outreal[i] = xreal[i] / n;
    outimag[i] = ximag[i] / n;
  }
}

export function newArrayOfZeros(n: number) {
  let result = new Array(n).fill(0);
  return result;
}

// NC method
export function ncMethod(fftData: FFTComplejo[], distancia = 1) {
  const magnitudeData: number[] = [];
  const offset = Math.trunc(distancia / 2);

  for (let i = 0; i < fftData.length; i++) {
    const cosL = fftData[idxWrapOver(i - offset, fftData.length)].re;
    const sinL = fftData[idxWrapOver(i - offset, fftData.length)].im;
    const cosR = fftData[idxWrapOver(i - offset + distancia, fftData.length)].re;
    const sinR = fftData[idxWrapOver(i - offset + distancia, fftData.length)].im;
    magnitudeData[i] = Math.sqrt(Math.max(0, -(cosL * cosR) - sinL * sinR));
  }
  return magnitudeData;
}

export function generateOctaveBands(
  bandsPerOctave = 12,
  lowerNote = 4,
  higherNote = 123,
  detune = 0,
  tuningFreq = 440,
  bandwidth = 0.5
) {
  const tuningNote = isFinite(Math.log2(tuningFreq)) ? Math.round((Math.log2(tuningFreq) - 4) * 12) * 2 : 0;
  const root24 = 2 ** (1 / 24);
  const c0 = tuningFreq * root24 ** -tuningNote; // ~16.35 Hz
  const groupNotes = 24 / bandsPerOctave;
  const bands: TBandas[] = [];

  for (let i = Math.round((lowerNote * 2) / groupNotes); i <= Math.round((higherNote * 2) / groupNotes); i++) {
    bands.push({
      lo: c0 * root24 ** ((i - bandwidth) * groupNotes + detune),
      ctr: c0 * root24 ** (i * groupNotes + detune),
      hi: c0 * root24 ** ((i + bandwidth) * groupNotes + detune),
    });
  }
  return bands;
}

export function calcRGB(r = 0, g = 0, b = 0) {
  return {
    r: isNaN(r) ? 0 : clamp(r, 0, 255),
    g: isNaN(g) ? 0 : clamp(g, 0, 255),
    b: isNaN(b) ? 0 : clamp(b, 0, 255),
  };
}

// Weighting and frequency slope functions
function calcFreqTilt(x: number, amount = 3, offset = 1000) {
  return (x / offset) ** (amount / 6);
}

function applyEqualize(x: number, amount = 6, depth = 1024, offset = 44100) {
  const pos = (x * depth) / offset,
    bias = 1.0025 ** -pos * 0.04;
  return (10 * Math.log10(1 + bias + ((pos + 1) * (9 - bias)) / depth)) ** (amount / 6);
}

function applyWeight(x: number, weightAmount = 1, weightType = 'a') {
  const f2 = x ** 2;
  switch (weightType) {
    case 'a':
      return (
        ((1.2588966 * 148840000 * f2 ** 2) /
          ((f2 + 424.36) * Math.sqrt((f2 + 11599.29) * (f2 + 544496.41)) * (f2 + 148840000))) **
        weightAmount
      );
    case 'b':
      return (
        ((1.019764760044717 * 148840000 * x ** 3) / ((f2 + 424.36) * Math.sqrt(f2 + 25122.25) * (f2 + 148840000))) **
        weightAmount
      );
    case 'c':
      return ((1.0069316688518042 * 148840000 * f2) / ((f2 + 424.36) * (f2 + 148840000))) ** weightAmount;
    case 'd':
      return (
        ((x / 6.8966888496476e-5) *
          Math.sqrt(
            ((1037918.48 - f2) * (1037918.48 - f2) + 1080768.16 * f2) /
              ((9837328 - f2) * (9837328 - f2) + 11723776 * f2) /
              ((f2 + 79919.29) * (f2 + 1345600))
          )) **
        weightAmount
      );
    case 'm':
      const h1 = -4.737338981378384e-24 * f2 ** 3 + 2.043828333606125e-15 * f2 ** 2 - 1.363894795463638e-7 * f2 + 1,
        h2 = 1.306612257412824e-19 * x ** 5 - 2.118150887518656e-11 * x ** 3 + 5.559488023498642e-4 * x;

      return ((8.128305161640991 * 1.246332637532143e-4 * x) / Math.hypot(h1, h2)) ** weightAmount;
    default:
      return 1;
  }
}

export function weightSpectrumAtFreq(x: number) {
  return (
    calcFreqTilt(x, visualizerSettings.slope, visualizerSettings.slopeOffset) *
    applyEqualize(
      x,
      visualizerSettings.equalizeAmount,
      visualizerSettings.equalizeDepth,
      visualizerSettings.equalizeOffset
    ) *
    applyWeight(x, visualizerSettings.weightingAmount / 100, visualizerSettings.weightingType)
  );
}

export function ascale(x: number, alt = false) {
  const minDecibels = alt ? visualizerSettings.altMinDecibels : visualizerSettings.minDecibels;
  const maxDecibels = alt ? visualizerSettings.altMaxDecibels : visualizerSettings.maxDecibels;
  const useAbsolute = alt ? visualizerSettings.altUseAbsolute : visualizerSettings.useAbsolute;
  const gamma = alt ? visualizerSettings.altGamma : visualizerSettings.gamma;
  const useDecibels = alt ? visualizerSettings.altUseDecibels : visualizerSettings.useDecibels;

  if (useDecibels) return map(20 * Math.log10(x), minDecibels, maxDecibels, 0, 1);
  else
    return map(
      x ** (1 / gamma),
      +!useAbsolute * (10 ** (minDecibels / 20)) ** (1 / gamma),
      (10 ** (maxDecibels / 20)) ** (1 / gamma),
      0,
      1
    );
}

export function crearAnalizadorMeyda(contexto, fuente) {
  // console.log(analizar);
  // const { ctx, fuente } = analizar;

  let datosAnalizador;
  let analizadorMeyda;
  if (typeof Meyda === 'undefined') {
    console.log('No se encuentra Meyda.');
  } else {
    analizadorMeyda = Meyda.createMeydaAnalyzer({
      audioContext: contexto,
      source: fuente,
      bufferSize: 1024,
      sampleRate: 44100,
      featureExtractors: ['amplitudeSpectrum', 'zcr', 'spectralSpread', 'spectralSkewness'],
      callback: revisarEstados,
    });

    const tamañoBuffer = analizadorMeyda.buffersize;

    analizadorMeyda.start();
    return Object.assign({ contexto, fuente }, { analizadorMeyda, datosAnalizador, bufferSize: 1024 });
  }

  // console.log(datosAnalizador);
}

export function revisarEstados(features) {
  const { amplitudeSpectrum, zcr, spectralSpread, spectralSkewness } = features;
  const caracteristicas = { amplitudeSpectrum, zcr, spectralSpread, spectralSkewness };
  mostrarImagen('pajaros', 4000, features);
}

export function encontrarBins(frecuencia: number) {
  let bins: number[] = [];
  for (let i: number = 0; i <= 512; i++) {
    bins.push(i * 43 + 20);
  }
  const i = bins.findIndex((f) => f > frecuencia);
  return i;
}

function mostrarImagen(imagenes: string, frecuencia: number, caracteristicasAudio) {
  let bin = encontrarBins(frecuencia);
  const contenedorImagenes = document.getElementById(`${imagenes}`) as HTMLDivElement;

  const identificarCopeton =
    caracteristicasAudio.amplitudeSpectrum[bin] > 5 &&
    caracteristicasAudio.amplitudeSpectrum[78] < 3 &&
    caracteristicasAudio.amplitudeSpectrum[27] < 7 &&
    caracteristicasAudio.zcr > 170;

  const identificarTingua =
    caracteristicasAudio.amplitudeSpectrum[bin] > 5 &&
    caracteristicasAudio.amplitudeSpectrum[78] < 3 &&
    caracteristicasAudio.amplitudeSpectrum[27] < 7 &&
    caracteristicasAudio.zcr < 170;

  if (identificarCopeton) {
    //console.log('copetón', caracteristicasAudio.amplitudeSpectrum);
    const imagen = document.createElement('img');
    imagen.classList.add('imagen');
    imagen.style.right = `${(bin * 100) / 512 + numeroAleatorio(-5, 5)}vw`; //`${Math.random() * 10 + 65}vw`;
    imagen.style.top = `${caracteristicasAudio.amplitudeSpectrum[bin]}vh`;
    imagen.src = '../estaticos/copeton.PNG';

    contenedorImagenes.appendChild(imagen);

    setTimeout(() => {
      // texto.innerText = '';
    }, 500);
  } else if (identificarTingua) {
    console.log('tingua');
  }
}

function numeroAleatorio(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
