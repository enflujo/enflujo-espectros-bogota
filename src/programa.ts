import './scss/estilos.scss';

import {
  calcComplexFFT,
  calcComplexInputFFT,
  calcFFT,
  clamp,
  fftBinToHertz,
  hertzToFFTBin,
  idxWrapOver,
  map,
  ncMethod,
} from './ayudas';

import {
  channelModes,
  displayModes,
  drawModes,
  fscaleSettings,
  visualizerSettings,
  weightingTypes,
  windowFunctionSettings,
} from './constantes';
import { BarraEspectrograma, TColor } from './tipos';

const contenedor = document.getElementById('contenedor') as HTMLDivElement;
const audioCtx = new AudioContext();
const reproductor = document.getElementById('reproductor') as HTMLAudioElement;
const audioLocal = document.getElementById('cargarAudio') as HTMLInputElement;
const lienzo = document.getElementById('lienzo') as HTMLCanvasElement;
const ctx = lienzo.getContext('2d');

audioLocal.addEventListener('change', loadLocalFile);

// necessary for spectrogram visualization
const auxCanvas = new OffscreenCanvas(0, 0);
const auxCtx = auxCanvas.getContext('2d');
// audio part
const audioSource = audioCtx.createMediaElementSource(reproductor);
const analyser = audioCtx.createAnalyser();
const analyserL = audioCtx.createAnalyser();
const analyserR = audioCtx.createAnalyser();
analyser.fftSize = 32768; // maxes out FFT size
analyserL.fftSize = analyser.fftSize;
analyserR.fftSize = analyser.fftSize;
const dataArray = new Float32Array(analyser.fftSize);
const dataArrayL = new Float32Array(analyserL.fftSize);
const dataArrayR = new Float32Array(analyserR.fftSize);
// DelayNode (optional to mimic reaction time for non-realtime visualizations or even foobar2000 visualizations)
const delay = audioCtx.createDelay();
const splitter = audioCtx.createChannelSplitter(2); // only work well for stereo signal, not sure how it works on the surround sound

audioSource.connect(delay);
delay.connect(audioCtx.destination);
//audioSource.connect(audioCtx.destination);
audioSource.connect(analyser);
audioSource.connect(splitter);
splitter.connect(analyserL, 0);
splitter.connect(analyserR, 1);

const gui = new dat.GUI();
let settings = gui.addFolder('Visualization settings');

const freqDistFolder = settings.addFolder('Frequency distribution');
freqDistFolder.add(visualizerSettings, 'minFreq', 0, 96000).name('Minimum frequency'); // up to 192kHz sample rate
freqDistFolder.add(visualizerSettings, 'maxFreq', 0, 96000).name('Maximum frequency');
freqDistFolder.add(visualizerSettings, 'fscale', fscaleSettings).name('Frequency scale');
freqDistFolder.add(visualizerSettings, 'hzLinearFactor', 0, 100).name('Hz linear factor');

const transformFolder = settings.addFolder('Transform algorithm and window functions');
transformFolder.add(visualizerSettings, 'inputSize', 32, 32768, 1).name('Input size');
transformFolder.add(visualizerSettings, 'fftSize', 32, 32768, 1).name('FFT size');
transformFolder.add(visualizerSettings, 'windowFunction', windowFunctionSettings).name('Window function');
transformFolder.add(visualizerSettings, 'windowParameter', 0, 10).name('Window parameter');
transformFolder.add(visualizerSettings, 'windowSkew', -1, 1).name('Window skew');
transformFolder.add(visualizerSettings, 'useNC').name('Use NC method');
transformFolder.add(visualizerSettings, 'ncDistance', 1, 1024, 1).name('NC method distance');

const amplitudeFolder = settings.addFolder('Amplitude');
amplitudeFolder.add(visualizerSettings, 'useDecibels').name('Use logarithmic amplitude/decibel scale');
amplitudeFolder.add(visualizerSettings, 'useAbsolute').name('Use absolute value');
amplitudeFolder.add(visualizerSettings, 'gamma', 0.5, 10).name('Gamma');
amplitudeFolder.add(visualizerSettings, 'minDecibels', -120, 6).name('Lower amplitude range');
amplitudeFolder.add(visualizerSettings, 'maxDecibels', -120, 6).name('Higher amplitude range');
amplitudeFolder
  .add(visualizerSettings, 'decoupleAmplitudeFromSpectrum')
  .name('Decouple amplitude scaling of spectrogram from spectrum');

const altAmplitudeFolder = amplitudeFolder.addFolder('Spectrogram colormap scaling');
altAmplitudeFolder.add(visualizerSettings, 'altUseDecibels').name('Use logarithmic amplitude/decibel scale');
altAmplitudeFolder.add(visualizerSettings, 'altUseAbsolute').name('Use absolute value');
altAmplitudeFolder.add(visualizerSettings, 'altGamma', 0.5, 10).name('Gamma');
altAmplitudeFolder.add(visualizerSettings, 'altMinDecibels', -120, 6).name('Lower amplitude range');
altAmplitudeFolder.add(visualizerSettings, 'altMaxDecibels', -120, 6).name('Higher amplitude range');

const weightingFolder = amplitudeFolder.addFolder('Frequency weighting');
weightingFolder.add(visualizerSettings, 'slope', -12, 12).name('Frequency slope (dB per-octave)');
weightingFolder.add(visualizerSettings, 'slopeOffset', 0, 96000).name('Slope offset (Hz = 0dB)');
weightingFolder.add(visualizerSettings, 'equalizeAmount', -12, 12).name('Equalize amount');
weightingFolder.add(visualizerSettings, 'equalizeOffset', 0, 96000).name('Equalize offset');
weightingFolder.add(visualizerSettings, 'equalizeDepth', 0, 96000).name('Equalize depth');
weightingFolder.add(visualizerSettings, 'weightingAmount', -100, 100).name('Weighting amount');
weightingFolder.add(visualizerSettings, 'weightingType', weightingTypes).name('Weighting type');
weightingFolder
  .add(visualizerSettings, 'slopeFunctionsOffset', 0, 8)
  .name('Slope functions offset (offset by sample rate/FFT size in samples)');

const channelFolder = settings.addFolder('Channel configuration');
channelFolder.add(visualizerSettings, 'channelMode', channelModes).name('Channel mode');
channelFolder.add(visualizerSettings, 'treatAsComplex').name('Treat channel pairs as complex input');

const labelFolder = settings.addFolder('Labels and grid');
labelFolder.add(visualizerSettings, 'showLabels').name('Show horizontal-axis labels');
labelFolder.add(visualizerSettings, 'showLabelsY').name('Show vertical-axis labels');
labelFolder.add(visualizerSettings, 'amplitudeLabelInterval', 0.5, 48).name('dB label interval');
labelFolder.add(visualizerSettings, 'showDC').name('Show DC label');
labelFolder.add(visualizerSettings, 'showNyquist').name('Show Nyquist frequency label');
labelFolder.add(visualizerSettings, 'mirrorLabels').name('Mirror Y-axis labels');
labelFolder.add(visualizerSettings, 'diffLabels').name('Use difference coloring for labels');
labelFolder.add(visualizerSettings, 'noteLabels').name('Note labels');
labelFolder
  .add(visualizerSettings, 'labelTuning', 0, 96000)
  .name('Note labels tuning (nearest note = tuning frequency in Hz)');

const appearanceFolder = settings.addFolder('Appearance');
appearanceFolder.add(visualizerSettings, 'display', displayModes).name('Display which').onChange(escalar);
appearanceFolder.add(visualizerSettings, 'alternateColor').name('Use alternate channel color');
appearanceFolder.add(visualizerSettings, 'useGradient').name('Use color gradient');
appearanceFolder.add(visualizerSettings, 'drawMode', drawModes).name('Draw mode');
appearanceFolder.add(visualizerSettings, 'useBars').name('Draw bars instead of lines');
appearanceFolder.add(visualizerSettings, 'darkMode').name('Dark mode');
settings.add(visualizerSettings, 'freeze').name('Freeze analyser');
settings.add(visualizerSettings, 'compensateDelay').name('Delay compensation');

addEventListener('resize', escalar);
escalar();
visualize();

function escalar() {
  const escala = devicePixelRatio;
  lienzo.width = contenedor.clientWidth * escala;
  lienzo.height = contenedor.clientHeight * escala;
  auxCanvas.width = lienzo.width;
  auxCanvas.height = visualizerSettings.display === 'both' ? Math.trunc(lienzo.height / 2) : lienzo.height;
}

function loadLocalFile(evento: Event) {
  const elemento = evento.target as HTMLInputElement;
  const archivo = elemento.files?.item(0);

  if (!archivo) return;

  const lector = new FileReader();
  lector.onload = (e) => {
    if (!e.target?.result) return;
    reproductor.src = e.target.result as string;
    reproductor.play();
  };

  lector.readAsDataURL(archivo);
}

function visualize() {
  if (!ctx || !auxCtx) return;
  delay.delayTime.value = (visualizerSettings.inputSize / audioCtx.sampleRate) * +visualizerSettings.compensateDelay;
  // Visualization part
  if (!visualizerSettings.freeze) {
    analyser.getFloatTimeDomainData(dataArray);
    if (visualizerSettings.mode !== 'mono') {
      analyserL.getFloatTimeDomainData(dataArrayL);
      analyserR.getFloatTimeDomainData(dataArrayR);
    }
  }
  const fftData: number[] = new Array(visualizerSettings.fftSize).fill(0);
  const fftData1 = Array.from(fftData);
  const fftData2 = Array.from(fftData);
  const fftData3 = Array.from(fftData);
  const fftData4 = Array.from(fftData);
  let norm = 0;
  let spectrum0: number[];
  let spectrum1: number[];
  let spectrum2: number[];
  let spectrum3: number[];
  let spectrum4: number[];

  for (let i = 0; i < visualizerSettings.inputSize; i++) {
    const x = map(i, 0, visualizerSettings.inputSize, -1, 1),
      w = applyWindow(
        x,
        visualizerSettings.windowFunction,
        visualizerSettings.windowParameter,
        true,
        visualizerSettings.windowSkew
      ),
      magnitude = dataArray[i + analyser.fftSize - visualizerSettings.inputSize],
      l = dataArrayL[i + analyserL.fftSize - visualizerSettings.inputSize],
      r = dataArrayR[i + analyserR.fftSize - visualizerSettings.inputSize],
      m = (l + r) / 2,
      s = (l - r) / 2;
    norm += w;
    fftData[idxWrapOver(i, fftData.length)] += magnitude * w;
    fftData1[idxWrapOver(i, fftData1.length)] += l * w;
    fftData2[idxWrapOver(i, fftData2.length)] += r * w;
    fftData3[idxWrapOver(i, fftData3.length)] += m * w;
    fftData4[idxWrapOver(i, fftData4.length)] += s * w;
  }

  const isMono =
      visualizerSettings.channelMode !== 'stereo' &&
      visualizerSettings.channelMode !== 'ms' &&
      visualizerSettings.channelMode !== 'both',
    // Color de fondo espectro
    bgColor = visualizerSettings.darkMode
      ? !visualizerSettings.alternateColor && isMono
        ? '#202020'
        : '#000'
      : '#fff',
    // Color líneas espectro
    fgColor = visualizerSettings.darkMode
      ? !visualizerSettings.alternateColor && isMono
        ? '#c0c0c0'
        : '#fff'
      : '#000',
    cL = 'rgb(79, 0, 0)',
    cR = 'rgb(192, 0, 7)',
    cM = 'rgb(155, 0, 0)',
    cS = 'rgb(128, 0, 162)',
    isSpectrogramOnly = visualizerSettings.display === 'spectrogram',
    isSpectrogram = visualizerSettings.display === 'spectrogram' || visualizerSettings.display === 'both',
    isSpectrumandSpectrogram = visualizerSettings.display === 'both',
    ncDistance = visualizerSettings.ncDistance,
    useNC = visualizerSettings.useNC,
    altAmplitude = visualizerSettings.decoupleAmplitudeFromSpectrum;
  auxCtx.imageSmoothingEnabled = false;
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = bgColor;
  ctx.strokeStyle = bgColor;
  ctx.fillRect(0, 0, lienzo.width, lienzo.height);

  switch (visualizerSettings.channelMode) {
    case 'stereo':
    case 'ms':
    case 'both':
      const isAlternate = visualizerSettings.alternateColor,
        color1 = isAlternate ? cM : cL,
        color2 = isAlternate ? cS : cR,
        color3 = visualizerSettings.channelMode === 'ms' ? color1 : isAlternate ? cL : cM,
        color4 = visualizerSettings.channelMode === 'ms' ? color2 : isAlternate ? cR : cS,
        isComplex = visualizerSettings.treatAsComplex;
      ctx.globalCompositeOperation = visualizerSettings.darkMode ? 'lighten' : 'darken';

      if (visualizerSettings.channelMode === 'stereo' || visualizerSettings.channelMode === 'both') {
        const value1 = fftData1.map((x) => ((x * fftData1.length) / norm) * Math.SQRT2);
        const value2 = fftData2.map((x) => ((x * fftData2.length) / norm) * Math.SQRT2);

        if (isComplex) {
          const complexSpectrum = calcComplexInputFFT(value1, value2);
          const ncSpectrum = useNC ? ncMethod(complexSpectrum, ncDistance) : [];
          spectrum1 = new Array(complexSpectrum.length);
          spectrum2 = new Array(complexSpectrum.length);
          for (let i = 0; i < complexSpectrum.length; i++) {
            const j = complexSpectrum.length - i;

            spectrum1[i] = useNC
              ? ncSpectrum[idxWrapOver(i, ncSpectrum.length)]
              : complexSpectrum[idxWrapOver(i, complexSpectrum.length)].magnitude;
            spectrum2[i] = useNC
              ? ncSpectrum[idxWrapOver(j, ncSpectrum.length)]
              : complexSpectrum[idxWrapOver(j, complexSpectrum.length)].magnitude;
          }
        } else {
          if (useNC) {
            const temp1 = calcComplexFFT(value1);
            const temp2 = calcComplexFFT(value2);
            spectrum1 = ncMethod(temp1, ncDistance);
            spectrum2 = ncMethod(temp2, ncDistance);
          } else {
            (spectrum1 = calcFFT(value1)), (spectrum2 = calcFFT(value2));
          }
        }
        ctx.fillStyle = color1;
        ctx.strokeStyle = color1;
        if (!isSpectrogramOnly) drawSpectrum(spectrum1, fftData1.length, isSpectrumandSpectrogram);
        ctx.fillStyle = color2;
        ctx.strokeStyle = color2;
        if (!isSpectrogramOnly) drawSpectrum(spectrum2, fftData2.length, isSpectrumandSpectrogram);
      }

      if (visualizerSettings.channelMode === 'ms' || visualizerSettings.channelMode === 'both') {
        let value3 = fftData3.map((x) => ((x * fftData3.length) / norm) * Math.SQRT2),
          value4 = fftData4.map((x) => ((x * fftData4.length) / norm) * Math.SQRT2);
        if (isComplex) {
          const complexSpectrum = calcComplexInputFFT(value3, value4),
            ncSpectrum = useNC ? ncMethod(complexSpectrum, ncDistance) : [];
          spectrum3 = new Array(complexSpectrum.length);
          spectrum4 = new Array(complexSpectrum.length);
          for (let i = 0; i < complexSpectrum.length; i++) {
            const j = complexSpectrum.length - i;
            spectrum3[i] = useNC
              ? ncSpectrum[idxWrapOver(i, ncSpectrum.length)]
              : complexSpectrum[idxWrapOver(i, complexSpectrum.length)].magnitude;
            spectrum4[i] = useNC
              ? ncSpectrum[idxWrapOver(j, ncSpectrum.length)]
              : complexSpectrum[idxWrapOver(j, complexSpectrum.length)].magnitude;
          }
        } else {
          if (useNC) {
            const temp1 = calcComplexFFT(value3),
              temp2 = calcComplexFFT(value4);
            spectrum3 = ncMethod(temp1, ncDistance);
            spectrum4 = ncMethod(temp2, ncDistance);
          } else {
            (spectrum3 = calcFFT(value3)), (spectrum4 = calcFFT(value4));
          }
        }
        ctx.fillStyle = color3;
        ctx.strokeStyle = color3;
        if (!isSpectrogramOnly) drawSpectrum(spectrum3, fftData1.length, isSpectrumandSpectrogram);
        ctx.fillStyle = color4;
        ctx.strokeStyle = color4;
        if (!isSpectrogramOnly) drawSpectrum(spectrum4, fftData2.length, isSpectrumandSpectrogram);
      }
      break;
    default:
      if (useNC)
        spectrum0 = ncMethod(
          calcComplexFFT(fftData.map((x) => ((x * fftData.length) / norm) * Math.SQRT2)),
          ncDistance
        );
      else spectrum0 = calcFFT(fftData.map((x) => ((x * fftData.length) / norm) * Math.SQRT2));
      if (visualizerSettings.useGradient) {
        const grad = ctx.createLinearGradient(0, 0, 0, lienzo.height);
        grad.addColorStop(
          0,
          visualizerSettings.darkMode
            ? visualizerSettings.alternateColor
              ? 'rgb(0, 128, 255)'
              : '#569cd6'
            : visualizerSettings.alternateColor
              ? '#008'
              : 'rgb(0, 102, 204)'
        );
        grad.addColorStop(
          1 / (1 + +isSpectrumandSpectrogram),
          visualizerSettings.darkMode ? (visualizerSettings.alternateColor ? '#fff' : '#c0c0c0') : '#000'
        );
        ctx.fillStyle = grad;
        ctx.strokeStyle = grad;
      } else {
        // Color de forma de onda en Spectrum
        ctx.fillStyle = fgColor;
        ctx.strokeStyle = fgColor;
      }
      if (!isSpectrogramOnly) drawSpectrum(spectrum0, fftData.length, isSpectrumandSpectrogram);
  }

  /** INICIO PINTAR ESPECTROGRAMA */
  if (isSpectrogram) {
    ctx.globalCompositeOperation = 'source-over';
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
    const spectrogramBars: BarraEspectrograma[] = [];

    for (let i = Math.min(minRange, maxRange); i <= Math.max(minRange, maxRange); i++) {
      const lowerBound = map(
          fscale(
            fftBinToHertz(i - 0.5, fftData.length, audioCtx.sampleRate),
            visualizerSettings.fscale,
            visualizerSettings.hzLinearFactor / 100
          ),
          fscale(visualizerSettings.minFreq, visualizerSettings.fscale, visualizerSettings.hzLinearFactor / 100),
          fscale(visualizerSettings.maxFreq, visualizerSettings.fscale, visualizerSettings.hzLinearFactor / 100),
          0,
          1
        ),
        higherBound = map(
          fscale(
            fftBinToHertz(i + 0.5, fftData.length, audioCtx.sampleRate),
            visualizerSettings.fscale,
            visualizerSettings.hzLinearFactor / 100
          ),
          fscale(visualizerSettings.minFreq, visualizerSettings.fscale, visualizerSettings.hzLinearFactor / 100),
          fscale(visualizerSettings.maxFreq, visualizerSettings.fscale, visualizerSettings.hzLinearFactor / 100),
          0,
          1
        ),
        size = isSpectrumandSpectrogram ? auxCanvas.width : auxCanvas.height,
        lowerVisible = clamp(Math.round(lowerBound * size), 0, size),
        higherVisible = clamp(Math.round(higherBound * size), 0, size);

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

    for (let i = 0; i < spectrogramBars.length; i++) {
      let value = 0,
        value1 = 0,
        value2 = 0,
        value3 = 0,
        value4 = 0;
      for (let idx = spectrogramBars[i].lo; idx <= spectrogramBars[i].hi; idx++) {
        const binIdx = idxWrapOver(idx, fftData.length);
        if (spectrum0 !== undefined)
          value = Math.max(
            value,
            spectrum0[binIdx] *
              weightSpectrumAtFreq(
                fftBinToHertz(idx + visualizerSettings.slopeFunctionsOffset, spectrum0.length, audioCtx.sampleRate)
              )
          );
        if (spectrum1 !== undefined)
          value1 = Math.max(
            value1,
            spectrum1[binIdx] *
              weightSpectrumAtFreq(
                fftBinToHertz(idx + visualizerSettings.slopeFunctionsOffset, spectrum1.length, audioCtx.sampleRate)
              )
          );
        if (spectrum2 !== undefined)
          value2 = Math.max(
            value2,
            spectrum2[binIdx] *
              weightSpectrumAtFreq(
                fftBinToHertz(idx + visualizerSettings.slopeFunctionsOffset, spectrum2.length, audioCtx.sampleRate)
              )
          );
        if (spectrum3 !== undefined)
          value3 = Math.max(
            value3,
            spectrum3[binIdx] *
              weightSpectrumAtFreq(
                fftBinToHertz(idx + visualizerSettings.slopeFunctionsOffset, spectrum3.length, audioCtx.sampleRate)
              )
          );
        if (spectrum4 !== undefined)
          value4 = Math.max(
            value4,
            spectrum4[binIdx] *
              weightSpectrumAtFreq(
                fftBinToHertz(idx + visualizerSettings.slopeFunctionsOffset, spectrum4.length, audioCtx.sampleRate)
              )
          );
      }

      let color: TColor;

      const darkMode = visualizerSettings.darkMode;
      const valOscuro = +darkMode;

      switch (visualizerSettings.channelMode) {
        case 'stereo':
        case 'ms':
        case 'both':
          const mag1 = spectrum1 !== undefined ? ascale(value1, altAmplitude) : 0;
          const mag2 = spectrum2 !== undefined ? ascale(value2, altAmplitude) : 0;
          const mag3 = spectrum3 !== undefined ? ascale(value3, altAmplitude) : 0;
          const mag4 = spectrum4 !== undefined ? ascale(value4, altAmplitude) : 0;
          const sign = visualizerSettings.darkMode * 2 - 1;
          const isMSOnly = visualizerSettings.channelMode === 'ms';
          const isAlternate = visualizerSettings.alternateColor;
          const compliment1 = (isMSOnly && !isAlternate) || (!isMSOnly && isAlternate) ? mag3 : mag1;
          const compliment2 = (isMSOnly && !isAlternate) || (!isMSOnly && isAlternate) ? mag4 : mag2;
          const compliment3 = (isMSOnly && !isAlternate) || (!isMSOnly && isAlternate) ? mag1 : mag3;
          const compliment4 = (isMSOnly && !isAlternate) || (!isMSOnly && isAlternate) ? mag2 : mag4;
          const mathFunc = darkMode ? 'max' : 'min';
          const colors = [
              {
                r: 79,
                g: 129,
                b: 189,
              },
              {
                r: 192,
                g: 80,
                b: 77,
              },
              {
                r: 155,
                g: 187,
                b: 67,
              },
              {
                r: 128,
                g: 100,
                b: 162,
              },
            ],
            background = 255 * +!darkMode,
            colorFunc = (x, y) => map(x, 0, 1, background, y);

          color = calcRGB(
            Math[mathFunc](
              background,
              colorFunc(compliment1, colors[0].r),
              colorFunc(compliment2, colors[1].r),
              colorFunc(compliment3, colors[2].r),
              colorFunc(compliment4, colors[3].r)
            ),
            Math[mathFunc](
              background,
              colorFunc(compliment1, colors[0].g),
              colorFunc(compliment2, colors[1].g),
              colorFunc(compliment3, colors[2].g),
              colorFunc(compliment4, colors[3].g)
            ),
            Math[mathFunc](
              background,
              colorFunc(compliment1, colors[0].b),
              colorFunc(compliment2, colors[1].b),
              colorFunc(compliment3, colors[2].b),
              colorFunc(compliment4, colors[3].b)
            )
          );
          break;
        default:
          const mag = ascale(value, altAmplitude),
            bg = 32 * +(!visualizerSettings.alternateColor && darkMode);
          if (visualizerSettings.useGradient) {
            // Color espectrograma
            const colors = [
                // foobar2000 color scheme
                {
                  r: 255, //visualizerSettings.alternateColor ? 0 : 0,
                  g: 100, //visualizerSettings.alternateColor ? 0 : 102,
                  b: 0, //visualizerSettings.alternateColor ? 136 : 204,
                },
                // for dark mode in DUI
                {
                  r: visualizerSettings.alternateColor ? 0 : 86,
                  g: visualizerSettings.alternateColor ? 128 : 156,
                  b: visualizerSettings.alternateColor ? 255 : 214,
                },
              ],
              foreground = (visualizerSettings.alternateColor ? 255 : 192) * valOscuro,
              halfway = mag > 0.5;

            color = calcRGB(
              map(
                mag,
                halfway / 2,
                halfway / 2 + 0.5,
                halfway ? colors[valOscuro * 1].r + bg : 255 * +!darkMode + bg,
                halfway ? foreground : colors[valOscuro * 1].r + bg
              ),
              map(
                mag,
                halfway / 2,
                halfway / 2 + 0.5,
                halfway ? colors[valOscuro * 1].g + bg : 255 * +!darkMode + bg,
                halfway ? foreground : colors[valOscuro * 1].g + bg
              ),
              map(
                mag,
                halfway / 2,
                halfway / 2 + 0.5,
                halfway ? colors[valOscuro * 1].b + bg : 255 * +!darkMode + bg,
                halfway ? foreground : colors[valOscuro * 1].b + bg
              )
            );
          } else
            color = calcRGB(
              mag * 255 * (valOscuro * 2 - 1) + 255 * !darkMode + bg,
              mag * 255 * (valOscuro * 2 - 1) + 255 * !darkMode + bg,
              mag * 255 * (valOscuro * 2 - 1) + 255 * !darkMode + bg
            );
      }
      const r = color.r,
        g = color.g,
        b = color.b,
        segmentStart = isNaN(spectrogramBars[i].start)
          ? 0
          : clamp(spectrogramBars[i].start, 0, isSpectrumandSpectrogram ? auxCanvas.width : auxCanvas.height),
        segmentEnd = isNaN(spectrogramBars[i].end)
          ? 0
          : clamp(spectrogramBars[i].end, 0, isSpectrumandSpectrogram ? auxCanvas.width : auxCanvas.height),
        pos = segmentStart,
        delta = segmentEnd - segmentStart;
      auxCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      auxCtx.fillRect(
        pos * isSpectrumandSpectrogram + (auxCanvas.width - 1) * isSpectrogramOnly,
        (auxCanvas.height - pos) * isSpectrogramOnly,
        delta * isSpectrumandSpectrogram + 1 * isSpectrogramOnly,
        -delta * isSpectrogramOnly + 1 * isSpectrumandSpectrogram
      );
    }
    if (auxCanvas.width > 0 && auxCanvas.height > 0)
      auxCtx.drawImage(auxCanvas, -1 * isSpectrogramOnly, 1 * isSpectrumandSpectrogram);
    ctx.fillStyle = bgColor;
    ctx.fillRect(lienzo.width - auxCanvas.width, lienzo.height - auxCanvas.height, auxCanvas.width, auxCanvas.height);
    if (auxCanvas.width > 0 && auxCanvas.height > 0) ctx.drawImage(auxCanvas, 0, lienzo.height - auxCanvas.height);
  }
  /** FIN PINTAR ESPECTROGRAMA */

  ctx.globalCompositeOperation = visualizerSettings.diffLabels ? 'difference' : 'source-over';
  // label part
  ctx.fillStyle = visualizerSettings.diffLabels ? '#fff' : fgColor;
  ctx.strokeStyle = visualizerSettings.diffLabels ? '#fff' : fgColor;
  ctx.font = `${Math.trunc(10 * devicePixelRatio)}px sans-serif`;
  ctx.textAlign = isSpectrumandSpectrogram ? 'center' : 'start';
  ctx.textBaseline = isSpectrumandSpectrogram ? 'middle' : 'alphabetic';
  // Frequency label part
  if (visualizerSettings.showLabels || visualizerSettings.showDC || visualizerSettings.showNyquist) {
    ctx.globalAlpha = 0.5;
    ctx.setLineDash([]);
    const freqLabels = [],
      notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    if (visualizerSettings.showLabels)
      freqLabels.push(
        ...(visualizerSettings.noteLabels
          ? generateOctaveBands(12, 0, 132, 0, visualizerSettings.labelTuning).map((x) => x.ctr)
          : [
              10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 2000, 3000, 4000,
              5000, 6000, 7000, 8000, 9000, 10000, 20000,
            ])
      );
    if (visualizerSettings.showDC) freqLabels.push(0);
    if (visualizerSettings.showNyquist) freqLabels.push(audioCtx.sampleRate / 2);
    freqLabels.map((x) => {
      const note = isFinite(Math.log2(x)) ? notes[idxWrapOver(Math.round(Math.log2(x) * 12), notes.length)] : 'DC',
        isSharp = note.includes('#'),
        isC = note === 'C',
        isFirstFreq = x === 0,
        isLastFreq = x === audioCtx.sampleRate / 2 && visualizerSettings.showNyquist;

      ctx.globalAlpha =
        isLastFreq || isFirstFreq ? 1 : visualizerSettings.noteLabels ? (isSharp ? 0.2 : isC ? 0.8 : 0.5) : 0.5;
      const label = isLastFreq
          ? 'Nyquist'
          : visualizerSettings.noteLabels || isFirstFreq
            ? `${note}${isC ? Math.trunc(Math.log2(x) - 4) : ''}`
            : x >= 1000
              ? `${x / 1000}kHz`
              : `${x}Hz`,
        posX = map(
          fscale(x, visualizerSettings.fscale, visualizerSettings.hzLinearFactor / 100),
          fscale(visualizerSettings.minFreq, visualizerSettings.fscale, visualizerSettings.hzLinearFactor / 100),
          fscale(visualizerSettings.maxFreq, visualizerSettings.fscale, visualizerSettings.hzLinearFactor / 100),
          lienzo.height * isSpectrogramOnly,
          lienzo.width * !isSpectrogramOnly
        );

      ctx.beginPath();
      ctx.lineTo(
        isSpectrogramOnly ? lienzo.width * visualizerSettings.mirrorLabels : posX,
        isSpectrogramOnly ? posX : lienzo.height / (1 + isSpectrumandSpectrogram)
      );
      ctx.lineTo(
        isSpectrogramOnly
          ? lienzo.width * visualizerSettings.mirrorLabels +
              10 * devicePixelRatio * (1 - visualizerSettings.mirrorLabels * 2)
          : posX,
        isSpectrogramOnly ? posX : 0
      );
      ctx.stroke();
      if (isSpectrogramOnly) ctx.textAlign = visualizerSettings.mirrorLabels ? 'end' : 'start';
      ctx.globalAlpha = 1;
      ctx.fillText(
        label,
        posX * !isSpectrogramOnly + isSpectrogramOnly * lienzo.width * visualizerSettings.mirrorLabels,
        isSpectrogramOnly ? posX : lienzo.height / (1 + isSpectrumandSpectrogram)
      );
    });
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
  }
  // Amplitude/decibel label part
  if (visualizerSettings.showLabelsY && !isSpectrogramOnly) {
    const dBLabelData = [-Infinity],
      mindB = Math.min(visualizerSettings.minDecibels, visualizerSettings.maxDecibels),
      maxdB = Math.max(visualizerSettings.minDecibels, visualizerSettings.maxDecibels),
      minLabelIdx = Math.round(mindB / visualizerSettings.amplitudeLabelInterval),
      maxLabelIdx = Math.round(maxdB / visualizerSettings.amplitudeLabelInterval);

    if (isFinite(minLabelIdx) && isFinite(maxLabelIdx)) {
      for (let i = maxLabelIdx; i >= minLabelIdx; i--) {
        dBLabelData.push(i * visualizerSettings.amplitudeLabelInterval);
      }
    }
    ctx.globalAlpha = 0.5;
    ctx.setLineDash([]);
    dBLabelData.map((x) => {
      ctx.globalAlpha = 0.5;
      const label = `${x}dB`,
        posY = map(ascale(10 ** (x / 20)), 0, 1, lienzo.height / (1 + isSpectrumandSpectrogram), 0);
      if (posY <= lienzo.height / 2 || !isSpectrumandSpectrogram) {
        ctx.beginPath();
        ctx.lineTo(0, posY);
        ctx.lineTo(lienzo.width, posY);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.textAlign = visualizerSettings.mirrorLabels ? 'end' : 'start';
        ctx.fillText(label, lienzo.width * visualizerSettings.mirrorLabels, posY);
      }
    });
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'start';
  }
  requestAnimationFrame(visualize);
}

function applyWindow(posX, windowType = 'Hann', windowParameter = 1, truncate = true, windowSkew = 0) {
  let x =
    windowSkew > 0
      ? ((posX / 2 - 0.5) / (1 - (posX / 2 - 0.5) * 10 * windowSkew ** 2) / (1 / (1 + 10 * windowSkew ** 2))) * 2 + 1
      : ((posX / 2 + 0.5) / (1 + (posX / 2 + 0.5) * 10 * windowSkew ** 2) / (1 / (1 + 10 * windowSkew ** 2))) * 2 - 1;

  if (truncate && Math.abs(x) > 1) return 0;

  switch (windowType.toLowerCase()) {
    default:
      return 1;
    case 'hanning':
    case 'cosine squared':
    case 'hann':
      return Math.cos((x * Math.PI) / 2) ** 2;
    case 'raised cosine':
    case 'hamming':
      return 0.54 + 0.46 * Math.cos(x * Math.PI);
    case 'power of sine':
      return Math.cos((x * Math.PI) / 2) ** windowParameter;
    case 'circle':
    case 'power of circle':
      return Math.sqrt(1 - x ** 2) ** windowParameter;
    case 'tapered cosine':
    case 'tukey':
      return Math.abs(x) <= 1 - windowParameter
        ? 1
        : x > 0
          ? (-Math.sin(((x - 1) * Math.PI) / windowParameter / 2)) ** 2
          : Math.sin(((x + 1) * Math.PI) / windowParameter / 2) ** 2;
    case 'blackman':
      return 0.42 + 0.5 * Math.cos(x * Math.PI) + 0.08 * Math.cos(x * Math.PI * 2);
    case 'nuttall':
      return (
        0.355768 +
        0.487396 * Math.cos(x * Math.PI) +
        0.144232 * Math.cos(2 * x * Math.PI) +
        0.012604 * Math.cos(3 * x * Math.PI)
      );
    case 'flat top':
    case 'flattop':
      return (
        0.21557895 +
        0.41663158 * Math.cos(x * Math.PI) +
        0.277263158 * Math.cos(2 * x * Math.PI) +
        0.083578947 * Math.cos(3 * x * Math.PI) +
        0.006947368 * Math.cos(4 * x * Math.PI)
      );
    case 'kaiser':
      return Math.cosh(Math.sqrt(1 - x ** 2) * windowParameter ** 2) / Math.cosh(windowParameter ** 2);
    case 'gauss':
    case 'gaussian':
      return Math.exp(-(windowParameter ** 2) * x ** 2);
    case 'cosh':
    case 'hyperbolic cosine':
      return Math.E ** (-(windowParameter ** 2) * (Math.cosh(x) - 1));
    case 'cosh 2':
    case 'hyperbolic cosine 2':
      return Math.E ** -(Math.cosh(x * windowParameter) - 1);
    case 'bartlett':
    case 'triangle':
    case 'triangular':
      return 1 - Math.abs(x);
    case 'poisson':
    case 'exponential':
      return Math.exp(-Math.abs(x * windowParameter ** 2));
    case 'hyperbolic secant':
    case 'sech':
      return 1 / Math.cosh(x * windowParameter ** 2);
    case 'quadratic spline':
      return Math.abs(x) <= 0.5 ? -((x * Math.sqrt(2)) ** 2) + 1 : (Math.abs(x * Math.sqrt(2)) - Math.sqrt(2)) ** 2;
    case 'parzen':
      return Math.abs(x) > 0.5
        ? -2 * (-1 + Math.abs(x)) ** 3
        : 1 - 24 * Math.abs(x / 2) ** 2 + 48 * Math.abs(x / 2) ** 3;
    case 'welch':
      return (1 - x ** 2) ** windowParameter;
    case 'ogg':
    case 'vorbis':
      return Math.sin((Math.PI / 2) * Math.cos((x * Math.PI) / 2) ** 2);
    case 'cascaded sine':
    case 'cascaded cosine':
    case 'cascaded sin':
    case 'cascaded cos':
      return 1 - Math.sin((Math.PI / 2) * Math.sin((x * Math.PI) / 2) ** 2);
    case 'galss':
      return (
        (((1 - 1 / (x + 2)) * (1 - 1 / (-x + 2)) * 4) ** 2 *
          -(Math.tanh(Math.SQRT2 * (-x + 1)) * Math.tanh(Math.SQRT2 * (-x - 1)))) /
        Math.tanh(Math.SQRT2) ** 2
      );
  }
}

function fscale(x, freqScale = 'logarithmic', freqSkew = 0.5) {
  switch (freqScale.toLowerCase()) {
    default:
      return x;
    case 'log':
    case 'logarithmic':
      return Math.log2(x);
    case 'mel':
      return Math.log2(1 + x / 700);
    case 'critical bands':
    case 'bark':
      return (26.81 * x) / (1960 + x) - 0.53;
    case 'equivalent rectangular bandwidth':
    case 'erb':
      return Math.log2(1 + 0.00437 * x);
    case 'cam':
    case 'cams':
      return Math.log2((x / 1000 + 0.312) / (x / 1000 + 14.675));
    case 'sinh':
    case 'arcsinh':
    case 'asinh':
      return Math.asinh(x / 10 ** (freqSkew * 4));
    case 'shifted log':
    case 'shifted logarithmic':
      return Math.log2(10 ** (freqSkew * 4) + x);
    case 'nth root':
      return x ** (1 / (11 - freqSkew * 10));
    case 'negative exponential':
      return -(2 ** (-x / 2 ** (7 + freqSkew * 8)));
    case 'adjustable bark':
      return (26.81 * x) / (10 ** (freqSkew * 4) + x);
    case 'period':
      return 1 / x;
  }
}

function invFscale(x, freqScale = 'logarithmic', freqSkew = 0.5) {
  switch (freqScale.toLowerCase()) {
    default:
      return x;
    case 'log':
    case 'logarithmic':
      return 2 ** x;
    case 'mel':
      return 700 * (2 ** x - 1);
    case 'critical bands':
    case 'bark':
      return 1960 / (26.81 / (x + 0.53) - 1);
    case 'equivalent rectangular bandwidth':
    case 'erb':
      return (1 / 0.00437) * (2 ** x - 1);
    case 'cam':
    case 'cams':
      return ((14.675 * 2 ** x - 0.312) / (1 - 2 ** x)) * 1000;
    case 'sinh':
    case 'arcsinh':
    case 'asinh':
      return Math.sinh(x) * 10 ** (freqSkew * 4);
    case 'shifted log':
    case 'shifted logarithmic':
      return 2 ** x - 10 ** (freqSkew * 4);
    case 'nth root':
      return x ** (11 - freqSkew * 10);
    case 'negative exponential':
      return -Math.log2(-x) * 2 ** (7 + freqSkew * 8);
    case 'adjustable bark':
      return 10 ** (freqSkew * 4) / (26.81 / x - 1);
    case 'period':
      return 1 / x;
  }
}
function ascale(x, alt = false) {
  const minDecibels = alt ? visualizerSettings.altMinDecibels : visualizerSettings.minDecibels,
    maxDecibels = alt ? visualizerSettings.altMaxDecibels : visualizerSettings.maxDecibels,
    useAbsolute = alt ? visualizerSettings.altUseAbsolute : visualizerSettings.useAbsolute,
    gamma = alt ? visualizerSettings.altGamma : visualizerSettings.gamma,
    useDecibels = alt ? visualizerSettings.altUseDecibels : visualizerSettings.useDecibels;
  if (useDecibels) return map(20 * Math.log10(x), minDecibels, maxDecibels, 0, 1);
  else
    return map(
      x ** (1 / gamma),
      !useAbsolute * (10 ** (minDecibels / 20)) ** (1 / gamma),
      (10 ** (maxDecibels / 20)) ** (1 / gamma),
      0,
      1
    );
}

function generateOctaveBands(
  bandsPerOctave = 12,
  lowerNote = 4,
  higherNote = 123,
  detune = 0,
  tuningFreq = 440,
  bandwidth = 0.5
) {
  const tuningNote = isFinite(Math.log2(tuningFreq)) ? Math.round((Math.log2(tuningFreq) - 4) * 12) * 2 : 0,
    root24 = 2 ** (1 / 24),
    c0 = tuningFreq * root24 ** -tuningNote, // ~16.35 Hz
    groupNotes = 24 / bandsPerOctave;
  let bands = [];
  for (let i = Math.round((lowerNote * 2) / groupNotes); i <= Math.round((higherNote * 2) / groupNotes); i++) {
    bands.push({
      lo: c0 * root24 ** ((i - bandwidth) * groupNotes + detune),
      ctr: c0 * root24 ** (i * groupNotes + detune),
      hi: c0 * root24 ** ((i + bandwidth) * groupNotes + detune),
    });
  }
  return bands;
}

function drawSpectrum(spectrum, length, half = false) {
  // Spectrum (FFT) visualization part
  const isFill = visualizerSettings.drawMode === 'fill' || visualizerSettings.drawMode === 'both',
    isStroke = visualizerSettings.drawMode === 'stroke' || visualizerSettings.drawMode === 'both',
    isFlipped = visualizerSettings.minFreq > visualizerSettings.maxFreq,
    minIdx = hertzToFFTBin(visualizerSettings.minFreq, isFlipped ? 'ceil' : 'floor', length, audioCtx.sampleRate),
    maxIdx = hertzToFFTBin(visualizerSettings.maxFreq, isFlipped ? 'floor' : 'ceil', length, audioCtx.sampleRate);

  if (visualizerSettings.useBars) {
    const spectrogramBars: BarraEspectrograma[] = [];

    for (let i = Math.min(minIdx, maxIdx); i <= Math.max(minIdx, maxIdx); i++) {
      const lowerBound = map(
          fscale(
            fftBinToHertz(i - 0.5, length, audioCtx.sampleRate),
            visualizerSettings.fscale,
            visualizerSettings.hzLinearFactor / 100
          ),
          fscale(visualizerSettings.minFreq, visualizerSettings.fscale, visualizerSettings.hzLinearFactor / 100),
          fscale(visualizerSettings.maxFreq, visualizerSettings.fscale, visualizerSettings.hzLinearFactor / 100),
          0,
          1
        ),
        higherBound = map(
          fscale(
            fftBinToHertz(i + 0.5, length, audioCtx.sampleRate),
            visualizerSettings.fscale,
            visualizerSettings.hzLinearFactor / 100
          ),
          fscale(visualizerSettings.minFreq, visualizerSettings.fscale, visualizerSettings.hzLinearFactor / 100),
          fscale(visualizerSettings.maxFreq, visualizerSettings.fscale, visualizerSettings.hzLinearFactor / 100),
          0,
          1
        ),
        size = lienzo.width,
        lowerVisible = clamp(Math.round(lowerBound * size), 0, size),
        higherVisible = clamp(Math.round(higherBound * size), 0, size);

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
    for (let i = 0; i < spectrogramBars.length; i++) {
      let mag = 0;
      for (let j = spectrogramBars[i].lo; j <= spectrogramBars[i].hi; j++) {
        mag = Math.max(
          mag,
          spectrum[idxWrapOver(j, spectrum.length)] *
            weightSpectrumAtFreq(
              fftBinToHertz(j + visualizerSettings.slopeFunctionsOffset, spectrum.length, audioCtx.sampleRate)
            )
        );
      }
      const x = spectrogramBars[i].start,
        y = lienzo.height / (1 + half),
        delta = spectrogramBars[i].end - spectrogramBars[i].start,
        w = Math[delta < 0 ? 'min' : 'max'](Math.sign(delta), delta - Math.sign(delta)),
        h = (-ascale(mag) * lienzo.height) / (1 + half);
      ctx.globalAlpha = visualizerSettings.drawMode === 'both' ? 0.5 : 1;
      if (isFill) ctx.fillRect(x, y, w, h);
      ctx.globalAlpha = 1;
      if (isStroke) ctx.strokeRect(x, y, w, h);
    }
  } else {
    ctx.beginPath();
    if (isFill) {
      ctx.lineTo(lienzo.width * isFlipped, lienzo.height);
    }
    ctx.lineTo(
      lienzo.width * isFlipped,
      map(
        ascale(
          spectrum[idxWrapOver(minIdx, spectrum.length)] *
            weightSpectrumAtFreq(
              fftBinToHertz(minIdx + visualizerSettings.slopeFunctionsOffset, spectrum.length, audioCtx.sampleRate)
            )
        ),
        0,
        1,
        lienzo.height / (1 + half),
        0
      )
    );
    for (let i = Math.min(minIdx, maxIdx); i < Math.max(minIdx, maxIdx); i++) {
      ctx.lineTo(
        map(
          fscale(
            fftBinToHertz(i, length, audioCtx.sampleRate),
            visualizerSettings.fscale,
            visualizerSettings.hzLinearFactor / 100
          ),
          fscale(visualizerSettings.minFreq, visualizerSettings.fscale, visualizerSettings.hzLinearFactor / 100),
          fscale(visualizerSettings.maxFreq, visualizerSettings.fscale, visualizerSettings.hzLinearFactor / 100),
          0,
          lienzo.width
        ),
        map(
          ascale(
            spectrum[idxWrapOver(i, spectrum.length)] *
              weightSpectrumAtFreq(
                fftBinToHertz(i + visualizerSettings.slopeFunctionsOffset, spectrum.length, audioCtx.sampleRate)
              )
          ),
          0,
          1,
          lienzo.height / (1 + half),
          0
        )
      );
    }
    ctx.lineTo(
      lienzo.width * (1 - isFlipped),
      map(
        ascale(
          spectrum[idxWrapOver(maxIdx, spectrum.length)] *
            weightSpectrumAtFreq(
              fftBinToHertz(maxIdx + visualizerSettings.slopeFunctionsOffset, spectrum.length, audioCtx.sampleRate)
            )
        ),
        0,
        1,
        lienzo.height / (1 + half),
        0
      )
    );
    if (isFill) {
      ctx.lineTo(lienzo.width * (1 - isFlipped), lienzo.height);
    }
    ctx.globalAlpha = visualizerSettings.drawMode === 'both' ? 0.5 : 1;
    if (isFill) ctx.fill();
    ctx.globalAlpha = 1;
    if (isStroke) ctx.stroke();
  }
}

function calcRGB(r = 0, g = 0, b = 0) {
  return {
    r: isNaN(r) ? 0 : clamp(r, 0, 255),
    g: isNaN(g) ? 0 : clamp(g, 0, 255),
    b: isNaN(b) ? 0 : clamp(b, 0, 255),
  };
}

// Weighting and frequency slope functions
function calcFreqTilt(x, amount = 3, offset = 1000) {
  return (x / offset) ** (amount / 6);
}

function applyEqualize(x, amount = 6, depth = 1024, offset = 44100) {
  const pos = (x * depth) / offset,
    bias = 1.0025 ** -pos * 0.04;
  return (10 * Math.log10(1 + bias + ((pos + 1) * (9 - bias)) / depth)) ** (amount / 6);
}

function applyWeight(x, weightAmount = 1, weightType = 'a') {
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

function weightSpectrumAtFreq(x) {
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
