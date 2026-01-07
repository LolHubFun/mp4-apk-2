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
    onLog({ timestamp: new Date().toLocaleTimeString(), message: "Starting Native High-Speed Engine...", type: 'info' });

    if (!config.visualFile || !config.audioFile) throw new Error("Files missing");

    // 1. Write to Cache
    const visualExt = config.visualFile.name.split('.').pop();
    const audioExt = config.audioFile.name.split('.').pop();
    const visualFileName = `input_visual.${visualExt}`;
    const audioFileName = `input_audio.${audioExt}`;
    const outputFileName = `video_${Date.now()}.mp4`;

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

    const visualUri = await Filesystem.getUri({ path: visualFileName, directory: Directory.Cache });
    const audioUri = await Filesystem.getUri({ path: audioFileName, directory: Directory.Cache });
    const outputUri = await Filesystem.getUri({ path: outputFileName, directory: Directory.Cache });

    onLog({ timestamp: new Date().toLocaleTimeString(), message: "Native resources ready. Rendering...", type: 'warning' });

    // 2. Command with High Performance Settings
    // Using mpeg4 for max speed and compatibility
    // Using -preset ultrafast for immediate processing
    const cmd = `-y -loop 1 -i ${visualUri.uri} -i ${audioUri.uri} -c:v mpeg4 -q:v 5 -preset ultrafast -c:a aac -shortest ${outputUri.uri}`;

    onLog({ timestamp: new Date().toLocaleTimeString(), message: "Processing in background...", type: 'info' });

    await Ffmpegkit.exec({ 
        command: cmd, 
        name: `render_${Date.now()}` 
    });

    onLog({ timestamp: new Date().toLocaleTimeString(), message: "Native Render Success!", type: 'success' });
    
    return outputUri.uri;

  } catch (error: any) {
      onLog({ timestamp: new Date().toLocaleTimeString(), message: `Native Error: ${error.message}`, type: 'error' });
      throw error;
  }
};