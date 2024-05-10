import * as dat from 'dat.gui';
import {
  displayModes,
  drawModes,
  fscaleSettings,
  visualizerSettings,
  weightingTypes,
  windowFunctionSettings,
} from './constantes';
import { escalar } from './programa';

export default () => {
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
  channelFolder.add(visualizerSettings, 'channelMode', channelFolder).name('Channel mode');
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
};
