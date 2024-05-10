import { ascale, fscale, generateOctaveBands, idxWrapOver, map } from './ayudas';
import { visualizerSettings } from './constantes';

export default (lienzo: HTMLCanvasElement, ctx: CanvasRenderingContext2D, audioCtx: AudioContext) => {
  const isSpectrumandSpectrogram = visualizerSettings.display === 'both';
  const isSpectrogramOnly = visualizerSettings.display === 'spectrogram';
  const fgColor = visualizerSettings.darkMode ? '#c0c0c0' : '#222222';

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
    const freqLabels: number[] = [];
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

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
          lienzo.height * +isSpectrogramOnly,
          lienzo.width * +!isSpectrogramOnly
        );

      ctx.beginPath();
      ctx.lineTo(
        isSpectrogramOnly ? lienzo.width * +visualizerSettings.mirrorLabels : posX,
        isSpectrogramOnly ? posX : lienzo.height / (1 + +isSpectrumandSpectrogram)
      );
      ctx.lineTo(
        isSpectrogramOnly
          ? lienzo.width * +visualizerSettings.mirrorLabels +
              10 * devicePixelRatio * (1 - +visualizerSettings.mirrorLabels * 2)
          : posX,
        isSpectrogramOnly ? posX : 0
      );
      ctx.stroke();
      if (isSpectrogramOnly) ctx.textAlign = visualizerSettings.mirrorLabels ? 'end' : 'start';
      ctx.globalAlpha = 1;
      ctx.fillText(
        label,
        posX * +!isSpectrogramOnly + +isSpectrogramOnly * lienzo.width * +visualizerSettings.mirrorLabels,
        isSpectrogramOnly ? posX : lienzo.height / (1 + +isSpectrumandSpectrogram)
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
        posY = map(ascale(10 ** (x / 20)), 0, 1, lienzo.height / (1 + +isSpectrumandSpectrogram), 0);
      if (posY <= lienzo.height / 2 || !isSpectrumandSpectrogram) {
        ctx.beginPath();
        ctx.lineTo(0, posY);
        ctx.lineTo(lienzo.width, posY);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.textAlign = visualizerSettings.mirrorLabels ? 'end' : 'start';
        ctx.fillText(label, lienzo.width * +visualizerSettings.mirrorLabels, posY);
      }
    });
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'start';
  }
};
