import React, { useState, useEffect } from 'react';
import { Music, Image as ImageIcon, Cpu, Video, Settings, Download, AlertTriangle, Code, Package, Terminal, CheckCircle, XCircle, Play, FileJson } from 'lucide-react';
import FileUploader from './components/FileUploader';
import TerminalLog from './components/TerminalLog';
import { renderVideo } from './services/renderService';
import { RenderStatus, LogEntry } from './types';
import { CAPACITOR_CONFIG, GITHUB_WORKFLOW, RESOLUTIONS } from './constants';

type Tab = 'renderer' | 'builder';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('renderer');
  
  // Renderer State
  const [visualFile, setVisualFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [status, setStatus] = useState<RenderStatus>(RenderStatus.IDLE);
  const [progress, setProgress] = useState<number>(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [resolution, setResolution] = useState<'480p' | '720p' | '1080p'>('720p');
  const [renderedFileUri, setRenderedFileUri] = useState<string | null>(null);
  
  // Builder State
  const [buildStep, setBuildStep] = useState<number>(0);
  const [buildLogs, setBuildLogs] = useState<LogEntry[]>([]);

  // Auto-switch to logs when rendering
  useEffect(() => {
    if (status === RenderStatus.PROCESSING) {
      setLogs(prev => [...prev]); // trigger refresh if needed
    }
  }, [status]);

  const handleRender = async () => {
    if (!visualFile || !audioFile) return;

    setStatus(RenderStatus.PROCESSING);
    setLogs([]);
    setProgress(0);
    setRenderedFileUri(null);

    try {
      const resultUri = await renderVideo(
        { visualFile, audioFile, fps: 24, resolution },
        (log) => setLogs(prev => [...prev, log]),
        (prog) => setProgress(prog)
      );
      setRenderedFileUri(resultUri);
      setStatus(RenderStatus.COMPLETED);
    } catch (error) {
      setLogs(prev => [...prev, { timestamp: new Date().toLocaleTimeString(), message: "Error: Native Bridge Failed", type: 'error' }]);
      setStatus(RenderStatus.ERROR);
    }
  };

  const handleDownload = () => {
    if (renderedFileUri) {
        // In a real native app, the file is already on disk.
        // We can show a success message or trigger a share action.
        setLogs(prev => [...prev, { 
            timestamp: new Date().toLocaleTimeString(), 
            message: `Video is saved at: ${renderedFileUri}`, 
            type: 'success' 
        }]);
        
        // On web preview, we still might want to 'download' something if it's a blob
        if (renderedFileUri.startsWith('blob:') || renderedFileUri.startsWith('data:')) {
            const a = document.createElement('a');
            a.href = renderedFileUri;
            a.download = `video_render_${Date.now()}.mp4`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
        return;
    }

    // Fallback for simulation
    const dummyContent = `Video Engine Native Render Output\nResolution: ${resolution}`;
    const blob = new Blob([dummyContent], { type: 'video/mp4' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simulated_render.mp4`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const startBuildSimulation = () => {
    setBuildStep(1);
    setBuildLogs([]);
    
    const steps = [
      { msg: "Initializing Node.js Environment...", type: 'info', delay: 500 },
      { msg: "Compiling TypeScript & React Components...", type: 'info', delay: 1500 },
      { msg: "Optimizing Tailwind CSS assets...", type: 'info', delay: 2500 },
      { msg: "Injecting Capacitor Native Bridge...", type: 'info', delay: 3500 },
      { msg: "Configuring @capgo/capacitor-ffmpeg...", type: 'success', delay: 4500 },
      { msg: "Searching for Android SDK (Gradle)...", type: 'warning', delay: 6000 },
      { msg: "ERROR: Android SDK not found in Browser Environment.", type: 'error', delay: 7500 },
      { msg: "Falling back to Cloud Configuration Generator...", type: 'info', delay: 8500 },
      { msg: "Generated: capacitor.config.ts", type: 'success', delay: 9000 },
      { msg: "Generated: .github/workflows/android.yml", type: 'success', delay: 9500 },
      { msg: "READY FOR EXPORT.", type: 'success', delay: 10000 },
    ];

    let currentDelay = 0;
    steps.forEach((step, index) => {
      currentDelay = step.delay;
      setTimeout(() => {
        setBuildLogs(prev => [...prev, { 
          timestamp: new Date().toLocaleTimeString(), 
          message: step.msg, 
          type: step.type as any 
        }]);
        if (index === steps.length - 1) {
          setBuildStep(2);
        }
      }, step.delay);
    });
  };

  const handleDownloadSource = () => {
    // Create the workflow file
    const blob = new Blob([GITHUB_WORKFLOW], {type: 'text/yaml'});
    const url = window.URL.createObjectURL(blob);
    
    const element = document.createElement("a");
    element.href = url;
    element.download = "android-build-workflow.yml";
    document.body.appendChild(element);
    element.click();
    
    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(element);
  };

  const handleDownloadConfig = () => {
      const blob = new Blob([CAPACITOR_CONFIG], {type: 'text/typescript'});
      const url = window.URL.createObjectURL(blob);
      
      const element = document.createElement("a");
      element.href = url;
      element.download = "capacitor.config.ts";
      document.body.appendChild(element);
      element.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(element);
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
      <div className="absolute top-20 right-20 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Container */}
      <div className="w-full max-w-2xl bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col relative z-10 transition-all duration-500">
        
        {/* Header with Tabs */}
        <div className="border-b border-slate-800 flex items-center bg-slate-900/80">
          <div className="p-6 flex-1">
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Video className="text-cyan-400" size={24} />
              VIDEO ENGINE <span className="text-xs bg-cyan-900 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-700">V1.0</span>
            </h1>
          </div>
          <div className="flex pr-6 space-x-2">
             <button 
               onClick={() => setActiveTab('renderer')}
               className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2
                 ${activeTab === 'renderer' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
             >
               <Play size={16} /> Renderer
             </button>
             <button 
               onClick={() => setActiveTab('builder')}
               className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2
                 ${activeTab === 'builder' ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-800/50' : 'text-slate-500 hover:text-slate-300'}`}
             >
               <Package size={16} /> Build APK
             </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 min-h-[500px] flex flex-col">
          
          {activeTab === 'renderer' && (
            <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-6">
                 <p className="text-slate-400 text-sm mb-4">
                   Select media files to test the Native FFmpeg engine simulation.
                 </p>
                 
                 <FileUploader 
                  label="Select Visual (Image/GIF)"
                  accept="image/*"
                  icon={<ImageIcon size={28} />}
                  file={visualFile}
                  onFileSelect={setVisualFile}
                  onClear={() => { setVisualFile(null); setStatus(RenderStatus.IDLE); }}
                  disabled={status === RenderStatus.PROCESSING}
                />

                <FileUploader 
                  label="Select Audio (MP3)"
                  accept="audio/*"
                  icon={<Music size={28} />}
                  file={audioFile}
                  onFileSelect={setAudioFile}
                  onClear={() => { setAudioFile(null); setStatus(RenderStatus.IDLE); }}
                  disabled={status === RenderStatus.PROCESSING}
                />

                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                     <label className="text-slate-400 text-sm">Output Quality</label>
                     <span className="text-[10px] text-slate-600 font-mono border border-slate-800 px-1.5 py-0.5 rounded">Preset: Ultrafast</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {RESOLUTIONS.map((res) => (
                      <button
                        key={res.value}
                        onClick={() => setResolution(res.value as any)}
                        disabled={status === RenderStatus.PROCESSING}
                        className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-all border ${
                          resolution === res.value
                            ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.1)]'
                            : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:bg-slate-800 hover:border-slate-700'
                        } ${status === RenderStatus.PROCESSING ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {res.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Terminal / Status Area */}
              {(status === RenderStatus.PROCESSING || status === RenderStatus.COMPLETED) && (
                <TerminalLog logs={logs} />
              )}

              {/* Actions */}
              <div className="mt-auto pt-4">
                {status === RenderStatus.PROCESSING ? (
                  <div className="w-full bg-slate-800 rounded-full h-12 relative overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full bg-cyan-600 transition-all duration-300 ease-out flex items-center justify-end pr-3"
                      style={{ width: `${progress}%` }}
                    >
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white mix-blend-difference">
                      RENDERING: {progress}%
                    </div>
                  </div>
                ) : status === RenderStatus.COMPLETED ? (
                  <button 
                    onClick={handleDownload}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Download size={20} />
                    {renderedFileUri ? 'Access Rendered Video' : 'Download Video (Simulated)'}
                  </button>
                ) : (
                  <button 
                    onClick={handleRender}
                    disabled={!visualFile || !audioFile}
                    className={`w-full font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95
                      ${(!visualFile || !audioFile) 
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-900/20'
                      }`}
                  >
                    <Cpu size={20} />
                    Start Native Render
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'builder' && (
            <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="bg-black/50 rounded-xl border border-slate-800 p-4 mb-4 flex-1 font-mono text-sm overflow-hidden flex flex-col">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-2 text-slate-500">
                    <Terminal size={14} />
                    <span>build_output.log</span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-2">
                    {buildStep === 0 && (
                      <div className="text-slate-500 italic text-center mt-20">
                        Waiting to start build process...
                      </div>
                    )}
                    {buildLogs.map((log, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-slate-600">[{log.timestamp.split(' ')[0]}]</span>
                        <span className={
                          log.type === 'error' ? 'text-red-500 font-bold' : 
                          log.type === 'success' ? 'text-green-400' : 
                          log.type === 'warning' ? 'text-yellow-400' : 'text-slate-300'
                        }>{log.message}</span>
                      </div>
                    ))}
                  </div>
               </div>

               {buildStep === 0 && (
                 <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 mb-4">
                    <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                      <AlertTriangle size={18} className="text-yellow-500"/>
                      Environment Warning
                    </h3>
                    <p className="text-sm text-slate-400 mb-2">
                      <strong>Cannot compile binary (.apk) in browser.</strong>
                    </p>
                    <p className="text-sm text-slate-400">
                      However, we can generate the CI/CD configuration files. Upload these to GitHub to trigger the automated build pipeline.
                    </p>
                 </div>
               )}

               <div className="mt-auto">
                 {buildStep === 0 ? (
                   <button 
                    onClick={startBuildSimulation}
                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-cyan-900/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                   >
                     <Code size={20} />
                     Generate Build Config
                   </button>
                 ) : buildStep === 2 ? (
                   <div className="flex flex-col gap-3">
                     <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={handleDownloadConfig}
                            className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                        >
                            <FileJson size={18} />
                            Save Config
                        </button>
                        <button 
                            onClick={handleDownloadSource}
                            className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                            <Package size={18} />
                            Save Workflow
                        </button>
                     </div>
                     <button 
                       onClick={() => setBuildStep(0)}
                       className="text-slate-500 hover:text-slate-300 text-sm py-2"
                     >
                       Reset Build Process
                     </button>
                   </div>
                 ) : (
                   <button disabled className="w-full bg-slate-800 text-slate-500 font-bold py-4 rounded-xl cursor-wait flex items-center justify-center gap-2">
                     <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
                     Building...
                   </button>
                 )}
               </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="bg-slate-950/50 p-3 text-center border-t border-slate-800 flex justify-between px-6">
          <p className="text-[10px] text-slate-600 font-mono">
            ENV: {activeTab === 'renderer' ? 'WEB_PREVIEW' : 'BUILD_SERVER_SIM'}
          </p>
          <p className="text-[10px] text-slate-600 font-mono">
             CORE: 2026.1.25
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;