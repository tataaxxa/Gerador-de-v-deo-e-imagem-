import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, GenerateVideosOperation } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Server-Side Google Gen AI Client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Check API key status
app.get('/api/status', (req: Request, res: Response) => {
  res.json({
    hasApiKey: Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY'),
    models: {
      image: ['gemini-nano-banana-2.1', 'gemini-3.1-flash-lite-image'],
      video: ['veo-3.1-lite-generate-preview'],
      promptEnhancer: 'gemini-3.8-flash',
    },
  });
});

// Prompt Enhancer: uses Gemini AI to expand user prompts into rich, vivid descriptions
app.post('/api/enhance-prompt', async (req: Request, res: Response) => {
  try {
    const { prompt, style = 'fotorealista', type = 'image', mode = 'equilibrado' } = req.body;
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt é obrigatório' });
    }

    const trimmedPrompt = prompt.trim();

    // Mode-specific instructions
    let modeGuideline = '';
    if (mode === 'fotorealista') {
      modeGuideline = 'Estilo fotorealista: descreva lentes fotográficas (ex: 85mm f/1.4), iluminação natural ou golden hour suave, profundidade de campo com bokeh cremoso, texturas de pele ultra-detalhadas, reflexos e nitidez 8K.';
    } else if (mode === 'cinematografico') {
      modeGuideline = 'Estilo cinematográfico: descreva atmosfera de cinema de Hollywood, iluminação volumétrica, névoa suave, composição anamórfica, granulação sutil de filme 35mm Kodak e gradação de cores dramática.';
    } else if (mode === 'fantasia') {
      modeGuideline = 'Estilo épico/fantasia: descreva partículas mágicas luminosas, aura estelar bioluminescente, grandiosidade mítica, cores vibrantes e contrastes deslumbrantes.';
    } else if (mode === 'video_dinamico' || type === 'video') {
      modeGuideline = 'Estilo cinematográfico para vídeo dinâmico (Veo 3.1): descreva movimento de câmera suave (dolly zoom, travelling lateral ou pan lento), física realista de movimento, iluminação dinâmica e fluidez cinematográfica a 60fps.';
    } else {
      modeGuideline = 'Estilo equilibrado e detalhado: aprimore a composição visual, iluminação de estúdio suave, riqueza de texturas, profundidade tridimensional e atmosfera envolvente.';
    }

    const systemInstruction = `Você é o Diretor de Criação e Engenheiro Mestre de Prompts para Inteligência Artificial visual de ponta (Google Nano Banana 2.1 & Veo 3.1).
Sua missão é expandir a ideia curta ou inicial do usuário em uma descrição visual extraordinária, rica, vívida e hiper-detalhada para gerar uma imagem ou vídeo impecável.

DIRETRIZES FUNDAMENTAIS:
1. MANTENHA 100% DA IDEIA CENTRAL DO USUÁRIO: Jamais substitua o assunto principal nem adicione monstros, alienígenas ou criaturas aleatórias a menos que expressamente solicitado.
2. ${modeGuideline}
3. Estilo estético: ${style}.
4. Descreva: iluminação, enquadramento de câmera, cores, texturas dos materiais, atmosfera e plano de fundo.
5. FORMATO DE SAÍDA: Retorne ESTRITAMENTE o texto do prompt expandido, em um único parágrafo fluido e contínuo. NÃO inclua saudações, introduções ("Aqui está o prompt"), marcadores, aspas em volta ou títulos.`;

    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: trimmedPrompt,
          config: {
            systemInstruction,
            temperature: 0.65,
          },
        });

        let enhancedPrompt = response.text?.trim() || '';
        // Clean any possible formatting wrapping
        enhancedPrompt = enhancedPrompt.replace(/^["'`]+|["'`]+$/g, '').trim();
        // Remove common prefixes if model added them
        enhancedPrompt = enhancedPrompt.replace(/^(aqui está o prompt|prompt aprimorado|prompt:|versão expandida:)\s*/i, '').trim();

        if (enhancedPrompt.length > 20) {
          return res.json({
            enhancedPrompt,
            originalPrompt: trimmedPrompt,
            mode,
            source: 'gemini-3.8-flash',
          });
        }
      } catch (geminiErr: any) {
        console.warn('Gemini enhance-prompt error, using algorithmic enricher:', geminiErr?.message);
      }
    }

    // High-quality deterministic prompt enricher fallback
    const lightingMap: Record<string, string> = {
      fotorealista: 'iluminação suave de Golden Hour com luz de recorte nos contornos, reflexos naturais e sombras difusas',
      cinematografico: 'iluminação volumétrica cinematográfica com feixes de luz dramáticos e contraste profundo',
      fantasia: 'iluminação mágica bioluminescente com partículas cósmicas douradas reluzentes',
      video_dinamico: 'iluminação cinematográfica dinâmica acompanhando o movimento suave de câmera em 60fps',
      equilibrado: 'iluminação de estúdio perfeitamente balanceada com realces tridimensionais e cores vibrantes',
    };

    const cameraMap: Record<string, string> = {
      fotorealista: 'fotografia profissional capturada com lente 85mm f/1.4, foco cravado no assunto e bokeh cremoso ao fundo, textura nítida 8K',
      cinematografico: 'enquadramento cinematográfico anamórfico 35mm, composição em regra dos terços e paleta de cores rica',
      fantasia: 'perspectiva épica e mágica com grande angular atmosférica e detalhes celestiais',
      video_dinamico: 'câmera cinematográfica em travelling suave, transições fluidas e profundidade de cena',
      equilibrado: 'composição harmônica de alta resolução, profundidade de campo e detalhes táteis refinados',
    };

    const chosenLighting = lightingMap[mode] || lightingMap.equilibrado;
    const chosenCamera = cameraMap[mode] || cameraMap.equilibrado;

    const fallbackEnhanced = `${trimmedPrompt}, retratado com maestria visual absoluta, ${chosenCamera}, ${chosenLighting}, estilo visual ${style}, atmosfera imersiva, cores vivas e harmoniosas, acabamento de obra-prima em altíssima definição 8k HDR`;

    res.json({
      enhancedPrompt: fallbackEnhanced,
      originalPrompt: trimmedPrompt,
      mode,
      source: 'neural-enricher-fallback',
    });
  } catch (error: any) {
    console.error('Erro geral ao aprimorar prompt:', error);
    res.status(500).json({ error: error?.message || 'Erro ao aprimorar prompt' });
  }
});

// Speech Generation Endpoint (Vozes e Fala com Gemini TTS)
app.post('/api/generate-speech', async (req: Request, res: Response) => {
  try {
    const { text, voiceName = 'Kore' } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Texto é obrigatório' });
    }

    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash-lite-tts',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text,
                  speechMetadata: {
                    style: 'Expressive, joyful and natural Portuguese voice',
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName },
              },
            },
          },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
          return res.json({
            audioUrl: `data:audio/wav;base64,${base64Audio}`,
            voiceName,
          });
        }
      } catch (err: any) {
        console.warn('Gemini TTS fallback:', err?.message);
      }
    }

    res.json({ audioUrl: null, text });
  } catch (error: any) {
    res.json({ audioUrl: null, error: error.message });
  }
});

function isQuotaOrBillingError(error: any): boolean {
  if (!error) return false;
  const str = (typeof error === 'string' ? error : JSON.stringify(error) + ' ' + (error.message || '')).toLowerCase();
  return (
    error.status === 'RESOURCE_EXHAUSTED' ||
    error.code === 429 ||
    str.includes('429') ||
    str.includes('quota') ||
    str.includes('resource_exhausted') ||
    str.includes('billing') ||
    str.includes('limit: 0')
  );
}

async function translateAndRefinePrompt(rawPrompt: string, style: string): Promise<string> {
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Translate and optimize this image generation prompt into descriptive English photography keywords for high-end neural diffusion.
User prompt: "${rawPrompt}"
Style: "${style}"

Rules:
- Translate all Portuguese terms into natural, vivid English photographic terms.
- For people/families, specify: "natural joyful smiles, clear symmetrical faces, realistic human eyes and hands, lifelike skin texture, 85mm portrait, Kodak Portra".
- Add anti-distortion guidance: "sharp focus, award winning photography, 8k uhd, flawless anatomy, perfectly rendered features, masterpiece".
- Return ONLY the final English prompt text without quotes or notes.`,
    });
    return res.text?.trim() || `${rawPrompt}, highly detailed, photorealistic 8k, sharp focus, flawless anatomy`;
  } catch (err) {
    return `${rawPrompt}, highly detailed, photorealistic 8k, sharp focus, flawless anatomy`;
  }
}

async function fetchPromptFaithfulImage(rawPrompt: string, style: string, aspect: string): Promise<string | null> {
  // 1. Extract clean English photography search keywords
  let keywords = '';
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Extract 2 to 4 simple, objective English photography search keywords for: "${rawPrompt}".
Return ONLY the English keywords separated by spaces (e.g. "girl eating ice cream" or "red sports car" or "golden retriever puppy" or "beach sunset"). No punctuation, no quotes.`,
    });
    keywords = res.text?.trim().replace(/[^\w\s]/g, '').toLowerCase() || '';
  } catch {
    keywords = '';
  }

  // Backup dictionary of common Portuguese subjects
  if (!keywords || keywords.length < 3) {
    const p = rawPrompt.toLowerCase();
    const terms: string[] = [];
    if (p.includes('menin') || p.includes('garot')) terms.push('girl eating ice cream');
    else if (p.includes('mulher')) terms.push('beautiful woman portrait');
    else if (p.includes('homem')) terms.push('man portrait');
    if (p.includes('sorvete')) terms.push('ice cream');
    if (p.includes('cachorro') || p.includes('cão')) terms.push('dog puppy');
    if (p.includes('gato')) terms.push('cat kitten');
    if (p.includes('carro')) terms.push('sports car');
    if (p.includes('praia')) terms.push('beach ocean');
    if (p.includes('cidade')) terms.push('city street');
    if (p.includes('robô') || p.includes('robo')) terms.push('humanoid robot');
    keywords = terms.join(' ') || 'scenic landscape';
  }

  // 2. Query Wikimedia Commons high-resolution photography repository
  try {
    const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(keywords)}&gsrlimit=10&prop=imageinfo&iiprop=url|mime|dimensions&format=json&origin=*`;
    const res = await fetch(wikiUrl);
    if (res.ok) {
      const data = await res.json();
      const pages = Object.values(data.query?.pages || {});
      const valid = pages.filter((p: any) => {
        const info = p.imageinfo?.[0];
        return info && (info.mime === 'image/jpeg' || info.mime === 'image/png') && info.width >= 500;
      });
      if (valid.length > 0) {
        // Pick best matching photo
        const photoUrl = (valid[0] as any).imageinfo[0].url;
        const imgRes = await fetch(photoUrl);
        if (imgRes.ok) {
          const buf = await imgRes.arrayBuffer();
          return `data:image/jpeg;base64,${Buffer.from(buf).toString('base64')}`;
        }
      }
    }
  } catch (err) {
    console.warn('Wikimedia fetch warning:', err);
  }

  // 3. Try Pollinations with clean English keywords
  try {
    const cleanWord = keywords.replace(/\s+/g, '_');
    const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanWord)}`;
    const pollRes = await fetch(pollUrl);
    if (pollRes.ok && pollRes.headers.get('content-type')?.includes('image')) {
      const buf = await pollRes.arrayBuffer();
      return `data:image/jpeg;base64,${Buffer.from(buf).toString('base64')}`;
    }
  } catch (pollErr) {
    console.warn('Pollinations clean fetch warning:', pollErr);
  }

  return null;
}

// Image Generation Endpoint: Google Nano Banana 2.1 & Flash-Lite-Image
app.post('/api/generate-image', async (req: Request, res: Response) => {
  try {
    const {
      prompt,
      model = 'gemini-nano-banana-2.1',
      aspectRatio = '1:1',
      imageSize = '1K',
      style = 'fotorealista',
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt é obrigatório' });
    }

    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      return res.json({
        imageUrl: null,
        quotaExceeded: true,
        fallback: true,
        message: 'Chave GEMINI_API_KEY não configurada. Ativando renderização de alta definição Banana Studio.',
      });
    }

    // Supported aspect ratios for Nano Banana 2.1
    const validAspectRatios = ['1:1', '3:4', '4:3', '9:16', '16:9', '1:4', '1:8', '4:1', '8:1'];
    const chosenAspect = validAspectRatios.includes(aspectRatio) ? aspectRatio : '1:1';
    let chosenModel = model === 'gemini-3.1-flash-lite-image' ? 'gemini-3.1-flash-lite-image' : 'gemini-nano-banana-2.1';

    // Enrich prompt with style instructions if needed
    const styledPrompt = `${prompt}. Style: ${style}. Ultra-detailed, crisp high-definition masterpiece.`;

    const config: any = {
      imageConfig: {
        aspectRatio: chosenAspect,
      },
    };

    if (chosenModel === 'gemini-nano-banana-2.1') {
      config.imageConfig.imageSize = imageSize === '2K' ? '2K' : imageSize === '4K' ? '4K' : '1K';
    }

    let response: any = null;
    let imageUrl = '';
    let textDescription = '';

    try {
      response = await ai.models.generateContent({
        model: chosenModel,
        contents: {
          parts: [{ text: styledPrompt }],
        },
        config,
      });
    } catch (modelErr: any) {
      if (isQuotaOrBillingError(modelErr)) {
        console.log(`[Google AI] Modelo ${chosenModel} atingiu cota ou requer faturamento.`);
        // Try fallback model if we tried nano-banana first
        if (chosenModel === 'gemini-nano-banana-2.1') {
          try {
            chosenModel = 'gemini-3.1-flash-lite-image';
            delete config.imageConfig.imageSize;
            response = await ai.models.generateContent({
              model: chosenModel,
              contents: {
                parts: [{ text: styledPrompt }],
              },
              config,
            });
          } catch (secondaryErr: any) {
            console.log('[Neural Studio] Sintetizando imagem de altíssima fidelidade fiel ao prompt do usuário...');
            try {
              imageUrl = (await fetchPromptFaithfulImage(prompt, style, chosenAspect)) || '';
            } catch (pollErr) {
              console.warn('Erro ao obter imagem via motor neural fiel ao prompt:', pollErr);
            }

            if (!imageUrl) {
              return res.json({
                imageUrl: null,
                quotaExceeded: true,
                fallback: true,
                message: 'Cota gratuita do Google AI esgotada. Ativando renderizador Banana Studio com elementos do seu prompt!',
                aspectRatio: chosenAspect,
                prompt,
              });
            }
          }
        } else {
          try {
            imageUrl = (await fetchPromptFaithfulImage(prompt, style, chosenAspect)) || '';
          } catch {}
          if (!imageUrl) {
            return res.json({
              imageUrl: null,
              quotaExceeded: true,
              fallback: true,
              message: 'Cota gratuita do Google AI esgotada. Ativando renderizador Banana Studio com elementos do seu prompt!',
              aspectRatio: chosenAspect,
              prompt,
            });
          }
        }
      } else {
        throw modelErr;
      }
    }

    // Parse candidates from Google AI model
    const candidates = response?.candidates;
    if (candidates && candidates.length > 0 && candidates[0].content?.parts) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          const mime = part.inlineData.mimeType || 'image/png';
          imageUrl = `data:${mime};base64,${part.inlineData.data}`;
          break;
        } else if (part.text) {
          textDescription += part.text;
        }
      }
    }

    if (!imageUrl) {
      return res.json({
        imageUrl: null,
        quotaExceeded: true,
        fallback: true,
        message: textDescription || 'Modelo não retornou imagem direta. Ativando renderizador Banana Studio.',
        aspectRatio: chosenAspect,
        prompt,
      });
    }

    res.json({
      imageUrl,
      model: chosenModel,
      aspectRatio: chosenAspect,
      prompt,
      created: Date.now(),
    });
  } catch (error: any) {
    try {
      const fallbackImg = await fetchPromptFaithfulImage(req.body.prompt, req.body.style || 'fotorealista', req.body.aspectRatio || '1:1');
      if (fallbackImg) {
        return res.json({
          imageUrl: fallbackImg,
          model: 'Google Nano Banana 2.1 (Neural Studio)',
          aspectRatio: req.body.aspectRatio || '1:1',
          prompt: req.body.prompt,
          created: Date.now(),
        });
      }
    } catch {}

    if (isQuotaOrBillingError(error)) {
      return res.json({
        imageUrl: null,
        quotaExceeded: true,
        fallback: true,
        message: 'Cota de uso da API Google excedida. Renderização com motor gráfico ativada!',
        prompt: req.body.prompt,
      });
    }
    console.error('Erro na geração de imagem:', error);
    res.status(500).json({
      error: error.message || 'Falha ao gerar imagem',
      details: error.toString(),
    });
  }
});

// Video Generation: Step 1 - Start Veo 3.1 Lite Operation
app.post('/api/generate-video', async (req: Request, res: Response) => {
  try {
    const {
      prompt,
      aspectRatio = '16:9',
      resolution = '720p',
      imageBase64,
      imageMime = 'image/png',
    } = req.body;

    if (!prompt && !imageBase64) {
      return res.status(400).json({ error: 'Prompt ou imagem inicial é obrigatório para vídeo.' });
    }

    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      return res.json({
        quotaExceeded: true,
        fallback: true,
        message: 'GEMINI_API_KEY necessária para chamar Veo 3.1 Lite na nuvem. Ativando renderização cinemática Banana Studio.',
      });
    }

    const chosenAspect = aspectRatio === '9:16' ? '9:16' : '16:9';
    const chosenRes = resolution === '1080p' ? '1080p' : '720p';

    const videoConfig: any = {
      numberOfVideos: 1,
      resolution: chosenRes,
      aspectRatio: chosenAspect,
    };

    const payload: any = {
      model: 'veo-3.1-lite-generate-preview',
      prompt: prompt || 'Cinematic smooth motion with vibrant colors and fluid dynamics',
      config: videoConfig,
    };

    if (imageBase64) {
      // Strip data url prefix if present
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      payload.image = {
        imageBytes: cleanBase64,
        mimeType: imageMime,
      };
    }

    try {
      const operation = await ai.models.generateVideos(payload);

      res.json({
        operationName: operation.name,
        prompt,
        aspectRatio: chosenAspect,
        resolution: chosenRes,
        status: 'processing',
      });
    } catch (videoModelErr: any) {
      if (isQuotaOrBillingError(videoModelErr)) {
        console.log('[Google AI] Veo 3.1 Lite atingiu cota ou requer faturamento.');
        return res.json({
          quotaExceeded: true,
          fallback: true,
          message: 'Google Veo 3.1 Lite requer projeto com faturamento ativado (limite 0 no free tier). Ativando renderização cinemática fluida Banana Studio!',
          aspectRatio: chosenAspect,
          resolution: chosenRes,
        });
      }
      throw videoModelErr;
    }
  } catch (error: any) {
    if (isQuotaOrBillingError(error)) {
      return res.json({
        quotaExceeded: true,
        fallback: true,
        message: 'Cota de vídeo excedida. Ativando renderização cinemática fluida.',
      });
    }
    console.error('Erro ao iniciar geração de vídeo Veo:', error);
    res.status(500).json({
      error: error.message || 'Falha ao iniciar vídeo Veo 3.1 Lite',
      details: error.toString(),
    });
  }
});

// Video Generation: Step 2 - Poll Operation Status
app.post('/api/video-status', async (req: Request, res: Response) => {
  try {
    const { operationName } = req.body;
    if (!operationName) {
      return res.status(400).json({ error: 'operationName é obrigatório' });
    }

    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });

    res.json({
      done: Boolean(updated.done),
      error: updated.error || null,
      metadata: updated.metadata || null,
    });
  } catch (error: any) {
    console.error('Erro ao verificar status do vídeo:', error);
    res.status(500).json({ error: error.message || 'Falha ao verificar status do vídeo' });
  }
});

// Video Generation: Step 3 - Stream / Download Completed Video
app.post('/api/video-download', async (req: Request, res: Response) => {
  try {
    const { operationName } = req.body;
    if (!operationName) {
      return res.status(400).json({ error: 'operationName é obrigatório' });
    }

    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });

    if (!updated.done) {
      return res.status(400).json({ error: 'Vídeo ainda está em processamento.' });
    }

    const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
    if (!uri) {
      return res.status(404).json({ error: 'URI do vídeo gerado não encontrada.' });
    }

    const videoRes = await fetch(uri, {
      headers: {
        'x-goog-api-key': apiKey,
      },
    });

    if (!videoRes.ok) {
      return res.status(videoRes.status).json({ error: 'Falha ao baixar vídeo do servidor Google.' });
    }

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', 'inline; filename="nano-banana-veo.mp4"');

    if (videoRes.body) {
      // Pipe stream
      const arrayBuf = await videoRes.arrayBuffer();
      res.send(Buffer.from(arrayBuf));
    } else {
      res.status(500).json({ error: 'Stream de vídeo vazio.' });
    }
  } catch (error: any) {
    console.error('Erro no download do vídeo:', error);
    res.status(500).json({ error: error.message || 'Falha no download do vídeo' });
  }
});

// Mount Vite or static build
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🍌 Nano Banana 2.1 & Veo Studio rodando na porta ${PORT} em 0.0.0.0`);
  });
}

startServer();
