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
    onLog({ timestamp: new Date().toLocaleTimeString(), message: "Initializing Native Engine...", type: 'info' });

    if (!config.visualFile || !config.audioFile) throw new Error("Missing files");

    const visualFileName = `input_${Date.now()}.${config.visualFile.name.split('.').pop()}`;
    const audioFileName = `input_${Date.now()}.${config.audioFile.name.split('.').pop()}`;
    const outputFileName = `render_${Date.now()}.mp4`;

    await Filesystem.writeFile({
        path: visualFileName,
        data: await fileToBase64(config.visualFile),
        directory: Directory.Cache
    });

    await Filesystem.writeFile({
        path: audioFileName,
        data: await fileToBase64(config.audioFile),
        directory: Directory.Cache
    });

    const vUri = await Filesystem.getUri({ path: visualFileName, directory: Directory.Cache });
    const aUri = await Filesystem.getUri({ path: audioFileName, directory: Directory.Cache });
    const oUri = await Filesystem.getUri({ path: outputFileName, directory: Directory.Cache });

    // HIZLI VE BASİT KOMUT
    const cmd = `-y -loop 1 -i ${vUri.uri} -i ${aUri.uri} -c:v mpeg4 -preset ultrafast -tune stillimage -c:a aac -shortest ${oUri.uri}`;

    await Ffmpegkit.exec({ command: cmd, name: "main_render" });

    return oUri.uri;
  } catch (error: any) {
    onLog({ timestamp: new Date().toLocaleTimeString(), message: `Error: ${error.message}`, type: 'error' });
    throw error;
  }
};
