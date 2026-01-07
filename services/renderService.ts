import { RenderConfig, LogEntry } from '../types';
import { Ffmpegkit } from 'capacitor-ffmpeg-kit';
import { Filesystem, Directory } from '@capacitor/filesystem';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
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
  try {
    onLog({ timestamp: new Date().toLocaleTimeString(), message: "Initializing Native High-Speed Engine...", type: 'info' });

    if (!config.visualFile || !config.audioFile) throw new Error("Files missing");

    // 1. Prepare files in Cache
    const vExt = config.visualFile.name.split('.').pop();
    const aExt = config.audioFile.name.split('.').pop();
    const vName = `input_v.${vExt}`;
    const aName = `input_a.${aExt}`;
    const oName = `render_${Date.now()}.mp4`;

    await Filesystem.writeFile({ path: vName, data: await fileToBase64(config.visualFile), directory: Directory.Cache });
    await Filesystem.writeFile({ path: aName, data: await fileToBase64(config.audioFile), directory: Directory.Cache });

    const vUri = await Filesystem.getUri({ path: vName, directory: Directory.Cache });
    const aUri = await Filesystem.getUri({ path: aName, directory: Directory.Cache });
    const oUri = await Filesystem.getUri({ path: oName, directory: Directory.Cache });

    onLog({ timestamp: new Date().toLocaleTimeString(), message: "Rendering Video...", type: 'warning' });

    // 2. The REAL FFmpeg command
    // Loop image + merge audio + high speed
    const cmd = `-y -loop 1 -i ${vUri.uri} -i ${aUri.uri} -c:v mpeg4 -preset ultrafast -tune stillimage -c:a aac -shortest ${oUri.uri}`;

    await Ffmpegkit.exec({ command: cmd, name: "main" });

    onLog({ timestamp: new Date().toLocaleTimeString(), message: "Render Success!", type: 'success' });
    
    return oUri.uri;
  } catch (error: any) {
    onLog({ timestamp: new Date().toLocaleTimeString(), message: `Error: ${error.message}`, type: 'error' });
    throw error;
  }
};
