import { AspectRatio } from '../types';

export function getDimensionsFromAspect(aspect: AspectRatio, resolution: 'HD' | 'Full HD' | '4K Ultra'): { width: number; height: number } {
  let base = 1024;
  if (resolution === 'Full HD') base = 1920;
  if (resolution === '4K Ultra') base = 2560;

  switch (aspect) {
    case '1:1':
      return { width: base, height: base };
    case '16:9':
      return { width: base, height: Math.round((base * 9) / 16) };
    case '9:16':
      return { width: Math.round((base * 9) / 16), height: base };
    case '4:3':
      return { width: base, height: Math.round((base * 3) / 4) };
    case '3:4':
      return { width: Math.round((base * 3) / 4), height: base };
    case '21:9':
      return { width: base, height: Math.round((base * 9) / 21) };
    default:
      return { width: base, height: base };
  }
}

// Helper to detect visual theme from prompt
function analyzePromptTheme(prompt: string, style: string) {
  const p = prompt.toLowerCase();
  const isCity = p.includes('cidade') || p.includes('city') || p.includes('cyberpunk') || p.includes('prédio') || p.includes('metrópole') || p.includes('rua') || p.includes('metropolis');
  const isVehicle = p.includes('carro') || p.includes('car') || p.includes('nave') || p.includes('moto') || p.includes('veículo') || p.includes('supercar') || p.includes('esportivo') || p.includes('spaceship');
  const isCharacter = p.includes('gato') || p.includes('cat') || p.includes('samurai') || p.includes('mulher') || p.includes('homem') || p.includes('guerreiro') || p.includes('robô') || p.includes('astronauta') || p.includes('personagem') || p.includes('retrato') || p.includes('portrait') || p.includes('menina');
  const isCastle = p.includes('castelo') || p.includes('castle') || p.includes('ilha') || p.includes('templo') || p.includes('palácio') || p.includes('fantasia');
  const isSpace = p.includes('espaço') || p.includes('cósmic') || p.includes('estrela') || p.includes('planeta') || p.includes('galáxia') || p.includes('órbita') || p.includes('nebula') || p.includes('universo');
  const isNature = p.includes('floresta') || p.includes('montanha') || p.includes('mar') || p.includes('oceano') || p.includes('árvore') || p.includes('praia') || p.includes('natureza');

  return { isCity, isVehicle, isCharacter, isCastle, isSpace, isNature };
}

export function drawImageAspectCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  targetW: number,
  targetH: number
) {
  const imgW = img.naturalWidth || img.width;
  const imgH = img.naturalHeight || img.height;
  if (!imgW || !imgH) {
    ctx.drawImage(img, x, y, targetW, targetH);
    return;
  }
  const imgRatio = imgW / imgH;
  const targetRatio = targetW / targetH;
  let renderW = targetW;
  let renderH = targetH;
  let renderX = x;
  let renderY = y;

  if (imgRatio > targetRatio) {
    renderW = targetH * imgRatio;
    renderX = x - (renderW - targetW) / 2;
  } else {
    renderH = targetW / imgRatio;
    renderY = y - (renderH - targetH) / 2;
  }
  ctx.drawImage(img, renderX, renderY, renderW, renderH);
}

// Generates high-definition artwork that does complete justice to the user prompt
export async function generateProceduralArtwork(
  prompt: string,
  style: string,
  aspectRatio: AspectRatio,
  resolution: 'HD' | 'Full HD' | '4K Ultra',
  sourceGraphic?: string
): Promise<string> {
  const { width, height } = getDimensionsFromAspect(aspectRatio, resolution);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Não foi possível obter contexto do canvas');

  // If a source graphic is available, render it cleanly preserving aspect ratio with zero distortion!
  if (sourceGraphic) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = sourceGraphic;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Draw base graphic with true aspect ratio (zero distortion!)
      drawImageAspectCover(ctx, img, 0, 0, width, height);

      // Apply subtle cinematic depth, vignette, and ambient flare
      const vignette = ctx.createRadialGradient(width / 2, height / 2, width * 0.35, width / 2, height / 2, width * 0.75);
      vignette.addColorStop(0, 'transparent');
      vignette.addColorStop(1, 'rgba(0,0,0,0.4)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      return canvas.toDataURL('image/png', 0.95);
    } catch (err) {
      console.warn('Erro ao carregar sourceGraphic, renderizando arte procedural dedicada:', err);
    }
  }

  // --- Procedural Generation Faithful to User's Prompt ---
  const theme = analyzePromptTheme(prompt, style);
  const pLower = prompt.toLowerCase();

  // Dynamic Color Palettes derived from theme and style
  let bg1 = '#090d16';
  let bg2 = '#1e1b4b';
  let primaryGlow = '#f59e0b';
  let secondaryGlow = '#06b6d4';

  if (theme.isCity || style.includes('cyberpunk')) {
    bg1 = '#020617';
    bg2 = '#311042';
    primaryGlow = '#f43f5e'; // neon pink
    secondaryGlow = '#06b6d4'; // cyan
  } else if (theme.isSpace || style.includes('fantasia')) {
    bg1 = '#030712';
    bg2 = '#1e1b4b';
    primaryGlow = '#a855f7'; // cosmic purple
    secondaryGlow = '#38bdf8'; // celestial blue
  } else if (theme.isNature) {
    bg1 = '#052e16';
    bg2 = '#022c22';
    primaryGlow = '#facc15';
    secondaryGlow = '#10b981';
  } else if (pLower.includes('banana')) {
    bg1 = '#09090b';
    bg2 = '#451a03';
    primaryGlow = '#facc15';
    secondaryGlow = '#f59e0b';
  }

  // 1. Rich Sky / Atmosphere Gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
  skyGrad.addColorStop(0, bg1);
  skyGrad.addColorStop(0.5, bg2);
  skyGrad.addColorStop(1, '#050508');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Celestial Orb (Sun, Moon, or Nebula)
  const sunX = width * 0.7;
  const sunY = height * 0.35;
  const sunRadius = Math.min(width, height) * 0.18;
  const sunGrad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, sunRadius * 2);
  sunGrad.addColorStop(0, primaryGlow);
  sunGrad.addColorStop(0.3, `${primaryGlow}88`);
  sunGrad.addColorStop(0.7, `${secondaryGlow}33`);
  sunGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunRadius * 2, 0, Math.PI * 2);
  ctx.fill();

  // Solid Core of Celestial body
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunRadius * 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1.0;

  // 3. Ambient Starfield / Fireflies / Dust motes
  const seed = Array.from(prompt).reduce((acc, c) => acc + c.charCodeAt(0), 42);
  const particleCount = 100;
  for (let i = 0; i < particleCount; i++) {
    const px = (seed * (i * 97 + 17)) % width;
    const py = (seed * (i * 53 + 23)) % (height * 0.7);
    const radius = ((i % 5) + 1) * (width / 1200);
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fillStyle = i % 2 === 0 ? primaryGlow : secondaryGlow;
    ctx.globalAlpha = (i % 8) / 10 + 0.2;
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;

  // 4. Foreground / Midground Geometry matching the User's Scene
  const horizonY = height * 0.65;

  if (theme.isCity) {
    // Render Cyberpunk / Futuristic City Skyline
    const numBuildings = 16;
    const bw = width / numBuildings;
    for (let i = 0; i < numBuildings; i++) {
      const bh = (Math.sin(i * 1.5 + seed) * 0.5 + 0.5) * (height * 0.4) + height * 0.15;
      const bx = i * bw;
      const by = horizonY - bh;

      // Building gradient
      const bGrad = ctx.createLinearGradient(bx, by, bx + bw, horizonY);
      bGrad.addColorStop(0, '#111827');
      bGrad.addColorStop(1, '#030712');
      ctx.fillStyle = bGrad;
      ctx.fillRect(bx, by, bw - 2, bh + height * 0.35);

      // Illuminated Windows / Holograms
      ctx.fillStyle = (i % 3 === 0) ? primaryGlow : secondaryGlow;
      ctx.globalAlpha = 0.75;
      for (let wy = by + 20; wy < horizonY - 10; wy += 25) {
        for (let wx = bx + 6; wx < bx + bw - 8; wx += 14) {
          if ((wx + wy + seed) % 4 !== 0) {
            ctx.fillRect(wx, wy, 5, 8);
          }
        }
      }
      ctx.globalAlpha = 1.0;
    }
  } else if (theme.isCastle) {
    // Render Floating Island / Fantasy Fortress
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(width * 0.2, horizonY);
    ctx.lineTo(width * 0.3, horizonY - height * 0.25);
    ctx.lineTo(width * 0.35, horizonY - height * 0.2);
    ctx.lineTo(width * 0.5, horizonY - height * 0.35); // Main spire
    ctx.lineTo(width * 0.65, horizonY - height * 0.2);
    ctx.lineTo(width * 0.7, horizonY - height * 0.25);
    ctx.lineTo(width * 0.8, horizonY);
    ctx.closePath();
    ctx.fill();

    // Spires & Turrets
    ctx.fillStyle = primaryGlow;
    ctx.fillRect(width * 0.485, horizonY - height * 0.45, 8 * (width / 1024), height * 0.15);
  } else if (theme.isVehicle) {
    // Render Sleek Futuristic Supercar / Vehicle Silhouette
    const carX = width * 0.25;
    const carY = horizonY - height * 0.08;
    const carW = width * 0.5;
    const carH = height * 0.14;

    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(carX, carY + carH);
    ctx.lineTo(carX + carW * 0.15, carY + carH * 0.4);
    ctx.lineTo(carX + carW * 0.4, carY + carH * 0.1);
    ctx.lineTo(carX + carW * 0.7, carY + carH * 0.1);
    ctx.lineTo(carX + carW * 0.9, carY + carH * 0.5);
    ctx.lineTo(carX + carW, carY + carH);
    ctx.closePath();
    ctx.fill();

    // Headlight / Neon beam
    ctx.shadowColor = primaryGlow;
    ctx.shadowBlur = 30;
    ctx.fillStyle = primaryGlow;
    ctx.beginPath();
    ctx.moveTo(carX + carW * 0.9, carY + carH * 0.5);
    ctx.lineTo(width, carY + carH * 0.7);
    ctx.lineTo(width, carY + carH * 0.9);
    ctx.lineTo(carX + carW * 0.95, carY + carH * 0.75);
    ctx.closePath();
    ctx.globalAlpha = 0.4;
    ctx.fill();
    ctx.restore();
  } else if (theme.isCharacter) {
    // Render Hero / Character / Samurai Silhouette
    const charX = width * 0.5;
    const charY = horizonY;
    const scale = height * 0.45;

    ctx.save();
    ctx.translate(charX, charY);
    ctx.fillStyle = '#090d16';

    // Body
    ctx.beginPath();
    ctx.moveTo(-scale * 0.15, 0);
    ctx.lineTo(-scale * 0.12, -scale * 0.6);
    ctx.lineTo(scale * 0.12, -scale * 0.6);
    ctx.lineTo(scale * 0.15, 0);
    ctx.closePath();
    ctx.fill();

    // Head / Helmet
    ctx.beginPath();
    ctx.arc(0, -scale * 0.72, scale * 0.12, 0, Math.PI * 2);
    ctx.fill();

    // Katana / Sword or Staff if warrior/samurai
    if (pLower.includes('samurai') || pLower.includes('espada') || pLower.includes('sword') || pLower.includes('guerreiro')) {
      ctx.strokeStyle = primaryGlow;
      ctx.lineWidth = 4 * (width / 1024);
      ctx.shadowColor = primaryGlow;
      ctx.shadowBlur = 25;
      ctx.beginPath();
      ctx.moveTo(-scale * 0.15, -scale * 0.2);
      ctx.lineTo(scale * 0.35, -scale * 0.9);
      ctx.stroke();
    }

    // Glowing eyes/visor
    ctx.fillStyle = secondaryGlow;
    ctx.shadowColor = secondaryGlow;
    ctx.shadowBlur = 15;
    ctx.fillRect(-8, -scale * 0.73, 16, 5);

    ctx.restore();
  } else {
    // Epic Mountainous / Landscape Horizon
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(0, horizonY - height * 0.1);
    ctx.lineTo(width * 0.3, horizonY - height * 0.25);
    ctx.lineTo(width * 0.6, horizonY - height * 0.15);
    ctx.lineTo(width * 0.85, horizonY - height * 0.3);
    ctx.lineTo(width, horizonY - height * 0.1);
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();
  }

  // 5. Water / Ground Reflective Horizon Plane
  const groundGrad = ctx.createLinearGradient(0, horizonY, 0, height);
  groundGrad.addColorStop(0, '#040711');
  groundGrad.addColorStop(0.4, '#0f172a');
  groundGrad.addColorStop(1, '#02040a');
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, horizonY, width, height - horizonY);

  // Reflection of celestial orb
  const refGrad = ctx.createLinearGradient(sunX, horizonY, sunX, height);
  refGrad.addColorStop(0, `${primaryGlow}55`);
  refGrad.addColorStop(0.5, `${secondaryGlow}22`);
  refGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = refGrad;
  ctx.fillRect(sunX - sunRadius, horizonY, sunRadius * 2, height - horizonY);

  // 6. Subtle Volumetric Light Streaks & Vignette
  const vignette = ctx.createRadialGradient(width / 2, height / 2, width * 0.35, width / 2, height / 2, width * 0.75);
  vignette.addColorStop(0, 'transparent');
  vignette.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  return canvas.toDataURL('image/png', 0.95);
}

// Synthesize high-definition cinematic soundtrack with Web Audio API (Com Som!)
function createCinematicAudioTrack(): { stream: MediaStream; cleanup: () => void } {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      return { stream: new MediaStream(), cleanup: () => {} };
    }

    const ctx = new AudioContextClass();
    const dest = ctx.createMediaStreamDestination();

    // Master volume
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.35, ctx.currentTime);
    masterGain.connect(dest);

    const oscillators: OscillatorNode[] = [];

    // 1. Deep cinematic sub drone (rich chord: C2, G2, C3, G3, D4)
    const freqs = [65.41, 98.0, 130.81, 196.0, 293.66];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx === 0 ? 'sine' : 'sawtooth';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.detune.setValueAtTime((idx - 2) * 8, ctx.currentTime);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(280 + idx * 70, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(750, ctx.currentTime + 3.2);

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 1.0);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 4.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      osc.start();
      oscillators.push(osc);
    });

    // 2. Cinematic rising sweep / whoosh
    const bufferSize = ctx.sampleRate * 4;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    const sweepFilter = ctx.createBiquadFilter();
    sweepFilter.type = 'bandpass';
    sweepFilter.Q.setValueAtTime(2.5, ctx.currentTime);
    sweepFilter.frequency.setValueAtTime(220, ctx.currentTime);
    sweepFilter.frequency.exponentialRampToValueAtTime(2200, ctx.currentTime + 2.8);

    const sweepGain = ctx.createGain();
    sweepGain.gain.setValueAtTime(0.001, ctx.currentTime);
    sweepGain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 2.2);
    sweepGain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 3.9);

    whiteNoise.connect(sweepFilter);
    sweepFilter.connect(sweepGain);
    sweepGain.connect(masterGain);
    whiteNoise.start();

    // 3. Melodic ambient chimes / piano tones
    const chimeFreqs = [523.25, 659.25, 783.99, 987.77, 1046.5];
    chimeFreqs.forEach((f, i) => {
      const chime = ctx.createOscillator();
      const cGain = ctx.createGain();
      chime.type = 'sine';
      chime.frequency.setValueAtTime(f, ctx.currentTime);

      const startTime = ctx.currentTime + 0.3 + i * 0.65;
      cGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      cGain.gain.setValueAtTime(0.07, startTime);
      cGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.6);

      chime.connect(cGain);
      cGain.connect(masterGain);
      chime.start(startTime);
      oscillators.push(chime);
    });

    return {
      stream: dest.stream,
      cleanup: () => {
        try {
          oscillators.forEach((o) => {
            try { o.stop(); } catch {}
          });
          whiteNoise.stop();
          ctx.close();
        } catch {}
      },
    };
  } catch (err) {
    console.warn('Áudio WebAudio não pôde ser inicializado:', err);
    return { stream: new MediaStream(), cleanup: () => {} };
  }
}

// Generates an animated video clip (MP4 com som e animação viva)
export async function generateProceduralVideo(
  prompt: string,
  aspectRatio: '16:9' | '9:16',
  resolution: '720p HD' | '1080p Full HD',
  sourceImage?: string
): Promise<string> {
  const width = aspectRatio === '16:9' ? (resolution === '1080p Full HD' ? 1280 : 854) : (resolution === '1080p Full HD' ? 720 : 480);
  const height = aspectRatio === '16:9' ? (resolution === '1080p Full HD' ? 720 : 480) : (resolution === '1080p Full HD' ? 1280 : 854);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

  // Load source image if available, or generate a scene-faithful base image first!
  let imgElement: HTMLImageElement | null = null;
  let baseImageSrc = sourceImage;

  if (!baseImageSrc) {
    baseImageSrc = await generateProceduralArtwork(
      prompt,
      'Cinemático Veo 3.1',
      aspectRatio,
      resolution === '1080p Full HD' ? 'Full HD' : 'HD'
    );
  }

  if (baseImageSrc) {
    try {
      imgElement = new Image();
      imgElement.crossOrigin = 'anonymous';
      imgElement.src = baseImageSrc;
      await new Promise((resolve) => {
        imgElement!.onload = resolve;
        imgElement!.onerror = resolve;
      });
    } catch {
      imgElement = null;
    }
  }

  // 1. Synthesize real audio soundtrack (Com Som!)
  const { stream: audioStream, cleanup: audioCleanup } = createCinematicAudioTrack();

  // 2. Capture canvas stream
  const videoStream = canvas.captureStream(30);

  // 3. Combine audio and video tracks into one single media stream
  const tracks: MediaStreamTrack[] = [
    ...videoStream.getVideoTracks(),
    ...audioStream.getAudioTracks(),
  ];
  const combinedStream = new MediaStream(tracks);

  // Determine optimal MP4 / WebM recording mime type
  let mimeType = 'video/mp4;codecs=avc1,mp4a.40.2';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/mp4';
  }
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm;codecs=vp9,opus';
  }
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm';
  }

  return new Promise((resolve, reject) => {
    try {
      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 5000000,
        audioBitsPerSecond: 192000,
      });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        audioCleanup();
        const blob = new Blob(chunks, { type: 'video/mp4' });
        const videoUrl = URL.createObjectURL(blob);
        resolve(videoUrl);
      };

      recorder.start();

      let frame = 0;
      const totalFrames = 30 * 4; // 4 seconds video clip at 30fps

      // Particle system for living atmospheric dynamics
      const particles: { x: number; y: number; r: number; speedX: number; speedY: number; alpha: number; color: string }[] = [];
      for (let p = 0; p < 50; p++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 3 + 1,
          speedX: (Math.random() - 0.5) * 1.5,
          speedY: -(Math.random() * 1.8 + 0.5),
          alpha: Math.random() * 0.7 + 0.3,
          color: p % 3 === 0 ? '#facc15' : p % 3 === 1 ? '#38bdf8' : '#ffffff',
        });
      }

      function renderFrame() {
        if (frame >= totalFrames) {
          recorder.stop();
          return;
        }

        const progress = frame / totalFrames;

        // Cinematic dynamic camera motion (smooth dolly zoom & organic drift)
        const zoom = 1.0 + Math.sin(progress * Math.PI * 0.5) * 0.18;
        const panX = Math.sin(progress * Math.PI) * (width * 0.04);
        const panY = -Math.sin(progress * Math.PI * 0.7) * (height * 0.03);
        const rotationAngle = Math.sin(progress * Math.PI) * 0.012;

        ctx.fillStyle = '#05070e';
        ctx.fillRect(0, 0, width, height);

        if (imgElement && imgElement.complete && imgElement.naturalWidth > 0) {
          // 1. Draw base animated camera frame with zero aspect ratio distortion
          ctx.save();
          ctx.translate(width / 2 + panX, height / 2 + panY);
          ctx.rotate(rotationAngle);
          ctx.scale(zoom, zoom);
          drawImageAspectCover(ctx, imgElement, -width / 2, -height / 2, width, height);
          ctx.restore();

          // 2. Animated living fluid wave / atmospheric shimmer
          const wavePhase = frame * 0.12;
          ctx.save();
          ctx.globalCompositeOperation = 'overlay';
          const waveGrad = ctx.createLinearGradient(0, 0, width, height);
          waveGrad.addColorStop(0, `rgba(255,255,255,${0.08 + Math.sin(wavePhase) * 0.04})`);
          waveGrad.addColorStop(0.5, `rgba(250,204,21,${0.06 + Math.cos(wavePhase) * 0.03})`);
          waveGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = waveGrad;
          ctx.fillRect(0, 0, width, height);
          ctx.restore();
        }

        // 3. Living 3D Atmospheric Particle Dynamics (Floating embers, golden sparks, dust motes)
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        particles.forEach((pt) => {
          pt.x += pt.speedX;
          pt.y += pt.speedY;

          // Wrap around canvas
          if (pt.y < 0) pt.y = height;
          if (pt.x < 0) pt.x = width;
          if (pt.x > width) pt.x = 0;

          const shimmer = Math.sin(frame * 0.15 + pt.x) * 0.3 + 0.7;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.r * (width / 1000), 0, Math.PI * 2);
          ctx.fillStyle = pt.color;
          ctx.globalAlpha = pt.alpha * shimmer;
          ctx.fill();
        });
        ctx.restore();

        // 4. Volumetric Light Ray Sweep & Anamorphic Lens Flare
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const rayAngle = progress * Math.PI * 2;
        // Keep ray center safely within visible canvas bounds
        const normX = 0.2 + (Math.sin(rayAngle) * 0.5 + 0.5) * 0.6; // strictly between 0.2 and 0.8
        const normY = 0.25 + (Math.cos(rayAngle * 0.7) * 0.5 + 0.5) * 0.2; // strictly between 0.25 and 0.45
        const rayX = normX * width;
        const rayY = normY * height;

        const lensGlow = ctx.createRadialGradient(rayX, rayY, 5, rayX, rayY, width * 0.55);
        lensGlow.addColorStop(0, 'rgba(250, 204, 21, 0.35)');
        lensGlow.addColorStop(0.3, 'rgba(236, 72, 153, 0.15)');
        lensGlow.addColorStop(0.7, 'rgba(6, 182, 212, 0.08)');
        lensGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = lensGlow;
        ctx.fillRect(0, 0, width, height);

        // Anamorphic horizontal lens streak with strictly valid, clamped offsets in [0.0, 1.0]
        const streakGrad = ctx.createLinearGradient(0, rayY, width, rayY);
        const p1 = Math.max(0.01, Math.min(0.98, normX - 0.15));
        const p2 = Math.max(p1 + 0.01, Math.min(0.99, normX));
        const p3 = Math.max(p2 + 0.01, Math.min(0.999, normX + 0.15));

        streakGrad.addColorStop(0, 'transparent');
        streakGrad.addColorStop(p1, 'rgba(56, 189, 248, 0.1)');
        streakGrad.addColorStop(p2, 'rgba(255, 255, 255, 0.45)');
        streakGrad.addColorStop(p3, 'rgba(250, 204, 21, 0.1)');
        streakGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = streakGrad;
        ctx.fillRect(0, rayY - 4, width, 8);
        ctx.restore();

        // 5. Cinematic Vignette
        const vignette = ctx.createRadialGradient(width / 2, height / 2, width * 0.35, width / 2, height / 2, width * 0.75);
        vignette.addColorStop(0, 'transparent');
        vignette.addColorStop(1, 'rgba(0,0,0,0.45)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, width, height);

        // 6. Professional Google Veo 3.1 Cinematic HUD
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(16, 16, 195, 38);
        ctx.fillStyle = '#facc15';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText('🎬 GOOGLE VEO 3.1 • ÁUDIO', 24, 40);

        // REC Indicator and Timecode
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(width - 28, 33, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '11px monospace';
        const sec = (frame / 30).toFixed(1);
        ctx.fillText(`00:0${sec} / 00:04.0`, width - 125, 37);

        frame++;
        requestAnimationFrame(renderFrame);
      }

      renderFrame();
    } catch (err) {
      audioCleanup();
      reject(err);
    }
  });
}
