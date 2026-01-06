import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface TerminalLogProps {
  logs: LogEntry[];
}

const TerminalLog: React.FC<TerminalLogProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  if (logs.length === 0) return null;

  return (
    <div className="w-full bg-black/90 rounded-lg border border-slate-800 p-4 font-mono text-xs h-48 overflow-y-auto mb-4 shadow-inner shadow-black">
      {logs.map((log, index) => (
        <div key={index} className="mb-1 flex">
          <span className="text-slate-600 mr-2">[{log.timestamp.split(' ')[0]}]</span>
          <span className={`
            ${log.type === 'error' ? 'text-red-500' : ''}
            ${log.type === 'success' ? 'text-green-400' : ''}
            ${log.type === 'warning' ? 'text-yellow-400' : ''}
            ${log.type === 'info' ? 'text-cyan-300' : ''}
          `}>
            {log.message}
          </span>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
};

export default TerminalLog;