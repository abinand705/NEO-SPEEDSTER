/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';

interface HistoryPoint {
  time: number;
  value: number;
}

interface InteractiveGraphProps {
  downloadHistory: HistoryPoint[];
  uploadHistory: HistoryPoint[];
  pingHistory: HistoryPoint[];
  currentSpeed: number;
  stage: 'idle' | 'ping' | 'download' | 'upload' | 'complete';
}

export default function InteractiveGraph({
  downloadHistory,
  uploadHistory,
  pingHistory,
  currentSpeed,
  stage,
}: InteractiveGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState<{ x: number; y: number; text: string; color: string } | null>(null);

  // Redraw whenever inputs change
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Make canvas sharp on high-DPI screens
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear Canvas
    ctx.fillStyle = '#060608';
    ctx.fillRect(0, 0, width, height);

    // 1. Draw Retro Sci-Fi Grid Lines
    ctx.strokeStyle = 'rgba(63, 63, 70, 0.12)';
    ctx.lineWidth = 1;

    const gridRows = 5;
    const gridCols = 10;

    for (let r = 0; r <= gridRows; r++) {
      const y = (r / gridRows) * (height - 40) + 20;
      ctx.beginPath();
      ctx.moveTo(35, y);
      ctx.lineTo(width - 15, y);
      ctx.stroke();

      // Add simple scale helpers
      ctx.fillStyle = '#71717a';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      const pct = 100 - (r / gridRows) * 100;
      ctx.fillText(`${Math.round(pct)}%`, 30, y + 4);
    }

    for (let c = 0; c <= gridCols; c++) {
      const x = (c / gridCols) * (width - 50) + 35;
      ctx.beginPath();
      ctx.moveTo(x, 20);
      ctx.lineTo(x, height - 20);
      ctx.stroke();
    }

    // Help function to draw smooth neon spline lines
    const drawSparkline = (
      points: HistoryPoint[],
      strokeColor: string,
      glowColor: string,
      fillColorStart: string,
      maxVal: number
    ) => {
      if (points.length < 2) return;

      const paddingLeft = 35;
      const paddingRight = 15;
      const plotWidth = width - paddingLeft - paddingRight;
      const plotHeight = height - 40;
      const paddingTop = 20;

      // Draw the main spline curve
      ctx.beginPath();
      points.forEach((p, index) => {
        const x = paddingLeft + (index / (points.length - 1)) * plotWidth;
        // avoid dividing by 0
        const displayVal = maxVal > 0 ? p.value / maxVal : 0;
        const y = paddingTop + plotHeight - displayVal * plotHeight;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          // Quadratic curve interpolation for dynamic liquid waves
          const prevX = paddingLeft + ((index - 1) / (points.length - 1)) * plotWidth;
          const prevDisplay = maxVal > 0 ? points[index - 1].value / maxVal : 0;
          const prevY = paddingTop + plotHeight - prevDisplay * plotHeight;
          const midX = (prevX + x) / 2;
          const midY = (prevY + y) / 2;
          ctx.quadraticCurveTo(prevX, prevY, midX, midY);
        }
      });

      // Style curve path
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0; // reset glow shadow

      // Draw standard glowing fill area underneath
      ctx.beginPath();
      ctx.moveTo(paddingLeft, paddingTop + plotHeight);
      
      points.forEach((p, index) => {
        const x = paddingLeft + (index / (points.length - 1)) * plotWidth;
        const displayVal = maxVal > 0 ? p.value / maxVal : 0;
        const y = paddingTop + plotHeight - displayVal * plotHeight;
        ctx.lineTo(x, y);
      });
      ctx.lineTo(paddingLeft + plotWidth, paddingTop + plotHeight);
      ctx.closePath();

      // Set elegant dynamic transparency path gradient
      const fillGrad = ctx.createLinearGradient(0, paddingTop, 0, paddingTop + plotHeight);
      fillGrad.addColorStop(0, fillColorStart);
      fillGrad.addColorStop(1, 'rgba(6, 6, 8, 0)');
      ctx.fillStyle = fillGrad;
      ctx.fill();

      // Draw end neon node pulse
      const lastPt = points[points.length - 1];
      const lastX = paddingLeft + plotWidth;
      const lastDisplay = maxVal > 0 ? lastPt.value / maxVal : 0;
      const lastY = paddingTop + plotHeight - lastDisplay * plotHeight;

      // Outer ripple
      ctx.beginPath();
      ctx.arc(lastX, lastY, 6, 0, 2 * Math.PI);
      ctx.fillStyle = fillColorStart;
      ctx.globalAlpha = 0.4;
      ctx.fill();

      // Inner dot
      ctx.beginPath();
      ctx.arc(lastX, lastY, 3, 0, 2 * Math.PI);
      ctx.fillStyle = strokeColor;
      ctx.globalAlpha = 1.0;
      ctx.fill();
    };

    // Calculate dynamic scales
    const maxDownload = Math.max(...downloadHistory.map((p) => p.value), 100);
    const maxUpload = Math.max(...uploadHistory.map((p) => p.value), 100);
    const maxPing = Math.max(...pingHistory.map((p) => p.value), 30);

    // Draw active curves
    drawSparkline(downloadHistory, '#ef4444', 'rgba(239, 68, 68, 0.6)', 'rgba(239, 68, 68, 0.25)', maxDownload);
    drawSparkline(uploadHistory, '#f97316', 'rgba(249, 115, 22, 0.6)', 'rgba(249, 115, 22, 0.25)', maxUpload);
    drawSparkline(pingHistory, '#dc2626', 'rgba(220, 38, 38, 0.6)', 'rgba(220, 38, 38, 0.25)', maxPing);

    // Grid status overlay
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Real-Time Data Streams (Live Telemetry)', 45, 33);

  }, [downloadHistory, uploadHistory, pingHistory, currentSpeed, stage]);

  const showStats = downloadHistory.length > 0 || uploadHistory.length > 0 || pingHistory.length > 0;

  return (
    <div
      ref={containerRef}
      id="telemetry-graph-wrapper"
      className="relative w-full h-[180px] md:h-[220px] rounded-xl border border-zinc-900 bg-black/60 p-1 flex items-center justify-center overflow-hidden"
    >
      <canvas ref={canvasRef} id="telemetry-canvas" className="w-full h-full block" />

      {/* Decorative Cybernetic Frame Corners */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-red-500/20 pointer-events-none" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-red-500/20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-red-500/20 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-red-500/20 pointer-events-none" />

      {/* Legend absolute badges */}
      <div className="absolute top-2.5 right-3.5 flex items-center gap-3.5 text-[10px] md:text-xs font-mono font-medium pointer-events-none">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.7)]" />
          <span className="text-zinc-400">Download</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.7)]" />
          <span className="text-zinc-400">Upload</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-700 shadow-[0_0_6px_rgba(220,38,38,0.7)]" />
          <span className="text-zinc-400">Latency</span>
        </div>
      </div>

      {/* Dynamic current speed tooltip inside graph if running */}
      {stage !== 'idle' && stage !== 'complete' && (
        <div className="absolute bottom-3 left-4 flex items-center gap-2 bg-black/80 border border-zinc-800 rounded-md px-2.5 py-1 text-[10px] md:text-xs font-mono">
          <span className="animate-ping w-1.5 h-1.5 rounded-full bg-green-500" />
          <span className="text-zinc-400 uppercase tracking-wider">{stage}:</span>
          <span className="font-extrabold text-white">{currentSpeed.toFixed(1)} Mb/s</span>
        </div>
      )}
    </div>
  );
}
