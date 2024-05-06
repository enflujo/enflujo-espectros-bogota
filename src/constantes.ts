export const visualizerSettings = {
  inputSize: 4096,
  fftSize: 4096,
  minFreq: 20,
  maxFreq: 20000,
  fscale: 'logarithmic',
  windowFunction: 'hann',
  windowParameter: 1,
  windowSkew: 0,
  useNC: false,
  ncDistance: 1,
  hzLinearFactor: 0,
  minDecibels: -90,
  maxDecibels: 0,
  useDecibels: true,
  gamma: 1,
  useAbsolute: true,
  decoupleAmplitudeFromSpectrum: false,
  altMinDecibels: -90,
  altMaxDecibels: 0,
  altUseDecibels: true,
  altGamma: 1,
  altUseAbsolute: true,
  equalizeAmount: 0,
  equalizeOffset: 44100,
  equalizeDepth: 1024,
  slope: 0,
  slopeOffset: 1000,
  weightingAmount: 0,
  weightingType: 'a',
  slopeFunctionsOffset: 1,
  channelMode: 'mono',
  treatAsComplex: false,
  freeze: false,
  showResponse: true,
  showLabels: true,
  showLabelsY: true,
  amplitudeLabelInterval: 6,
  showDC: true,
  showNyquist: true,
  mirrorLabels: true,
  diffLabels: false,
  noteLabels: false,
  labelTuning: 440,
  useGradient: false,
  alternateColor: false,
  drawMode: 'stroke',
  useBars: false,
  darkMode: false,
  compensateDelay: false,
  display: 'spectrum',
};

export const drawModes = {
  Line: 'stroke',
  Fill: 'fill',
  Both: 'both',
};

export const displayModes = {
  Spectrum: 'spectrum',
  Spectrogram: 'spectrogram',
  'Spectrum and spectrogram': 'both',
};

export const windowFunctionSettings = {
  Rectangular: 'rectangular',
  'Triangular (Bartlett)': 'triangular',
  Quadratic: 'quadratic spline',
  Parzen: 'parzen',
  Welch: 'welch',
  'Power of sine': 'power of sine',
  'Power of circle': 'circle',
  'Tukey (tapered cosine)': 'tukey',
  Vorbis: 'vorbis',
  'Cascaded sine': 'cascaded sine',
  Hann: 'hann',
  Hamming: 'hamming',
  Blackman: 'blackman',
  Nuttall: 'nuttall',
  'Flat top': 'flattop',
  Gaussian: 'gauss',
  'Hyperbolic cosine': 'cosh',
  'Hyperbolic cosine 2': 'cosh 2',
  Kaiser: 'kaiser',
  Poisson: 'exponential',
  'Hyperbolic secant': 'sech',
  Galss: 'galss', // Name derived from a particular program name (Aimp Galss Player) in Titanic Tools that pre-installed on Windows 7 Titanic Edition bootleg
};

export const fscaleSettings = {
  Bark: 'bark',
  ERB: 'erb',
  Cams: 'cam',
  'Mel (AIMP)': 'mel',
  Linear: 'linear',
  Logarithmic: 'logarithmic',
  'Hyperbolic sine': 'sinh',
  'Shifted logarithmic': 'shifted log',
  'Nth root': 'nth root',
  'Negative exponential': 'negative exponential',
  'Adjustable Bark': 'adjustable bark',
  Period: 'period',
};

export const channelModes = {
  Mono: 'mono',
  Stereo: 'stereo',
  'Mid/Side': 'ms',
  'L/R and M/S': 'both',
};

export const weightingTypes = {
  A: 'a',
  B: 'b',
  C: 'c',
  D: 'd',
  'ITU-R 468': 'm',
};
