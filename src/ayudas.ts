import type { FFTComplejo } from './tipos';

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
