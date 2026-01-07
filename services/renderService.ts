import { RenderConfig, LogEntry } from '../types';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { Filesystem, Directory } from '@capacitor/filesystem';

// Helper to convert Blob to Base64 for Capacitor writing
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

export const renderVideo = async (
  config: RenderConfig,
  onLog: (log: LogEntry) => void,
  onProgress: (progress: number) => void
): Promise<string> => {
  const ffmpeg = new FFmpeg();

  try {
    // 1. Initialize & Load Engine
    onLog({ timestamp: new Date().toLocaleTimeString(), message: "Loading FFmpeg WASM Engine...", type: 'info' });
    
    // We load from a reliable CDN. 
    // In a production offline app, these files should be local, but for this build to pass instantly, we use CDN.
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    onLog({ timestamp: new Date().toLocaleTimeString(), message: "Engine Loaded. Preparing files...", type: 'info' });

    // Progress Handler
    ffmpeg.on('progress', ({ progress }) => {
        onProgress(Math.floor(progress * 100));
    });

    ffmpeg.on('log', ({ message }) => {
        // Filter noisy logs if needed
        console.log("FFmpeg:", message);
    });

    if (!config.visualFile || !config.audioFile) throw new Error("Missing files");

    // 2. Write Files to WASM Memory
    const visualExt = config.visualFile.name.split('.').pop();
    const audioExt = config.audioFile.name.split('.').pop();
    const visualName = `input_visual.${visualExt}`;
    const audioName = `input_audio.${audioExt}`;
    const outputName = 'output.mp4';

    await ffmpeg.writeFile(visualName, await fetchFile(config.visualFile));
    await ffmpeg.writeFile(audioName, await fetchFile(config.audioFile));

    onLog({ timestamp: new Date().toLocaleTimeString(), message: "Files Loaded. Starting Render...", type: 'warning' });

    // 3. Construct & Execute Command
    // Loop image + Audio + x264 encoding
    // -pix_fmt yuv420p is crucial for compatibility
    // -shortest stops video when audio ends
    const cmd = [
        '-loop', '1',
        '-i', visualName,
        '-i', audioName,
        '-c:v', 'libx264',
        '-tune', 'stillimage',
        '-c:a', 'aac', // browser friendly audio
        '-b:a', '192k',
        '-pix_fmt', 'yuv420p',
        '-shortest',
        '-y',
        outputName
    ];

    onLog({ timestamp: new Date().toLocaleTimeString(), message: `Exec: ffmpeg ${cmd.join(' ')}`, type: 'info' });

    await ffmpeg.exec(cmd);

    onLog({ timestamp: new Date().toLocaleTimeString(), message: "Render Complete! Saving to device...", type: 'success' });

    // 4. Read Output & Save to Device
    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data], { type: 'video/mp4' });
    
    // Write to device filesystem (Gallery/Documents/Cache)
    const savedFileName = `video_${Date.now()}.mp4`;
    const base64Data = await blobToBase64(blob);

    // Save to Cache (safe zone)
    const result = await Filesystem.writeFile({
        path: savedFileName,
        data: base64Data,
        directory: Directory.Documents
    });

    onLog({ timestamp: new Date().toLocaleTimeString(), message: `Saved to Documents/${savedFileName}`, type: 'success' });

    // Return the URI for playback/sharing if needed
    return result.uri;

  } catch (error: any) {
    onLog({ timestamp: new Date().toLocaleTimeString(), message: `Error: ${error.message}`, type: 'error' });
    throw error;
  }
};
