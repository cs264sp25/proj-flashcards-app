import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import {
  // Copy,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/core/components/button";
import { useTheme } from "../hooks/use-theme";

interface MermaidDiagramProps {
  code: string;
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ code }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const { theme } = useTheme();

  useEffect(() => {
    const mermaidTheme =
      theme === "dark" ? "dark" : theme === "light" ? "forest" : "default";
    mermaid.initialize({
      startOnLoad: false,
      theme: mermaidTheme,
      securityLevel: "loose",
      fontFamily: "sans-serif",
    });

    const renderDiagram = async () => {
      if (containerRef.current) {
        try {
          containerRef.current.innerHTML = "";
          const id = "mermaid-" + Math.random().toString(36).substr(2, 9);
          const { svg } = await mermaid.render(id, code);
          containerRef.current.innerHTML = svg;
        } catch (error) {
          console.error("Failed to render mermaid diagram:", error);
          containerRef.current.innerHTML =
            '<div class="text-red-500">Failed to render diagram</div>';
        }
      }
    };

    renderDiagram();
  }, [code, theme]);

  const handleZoom = (delta: number) => {
    setScale((prev) => {
      const newScale = prev - delta * 0.01;
      return Math.min(Math.max(newScale, 0.5), 3);
    });
  };

  const handleZoomIn = () => {
    handleZoom(-20); // Equivalent to 0.2 scale increase
  };

  const handleZoomOut = () => {
    handleZoom(20); // Equivalent to 0.2 scale decrease
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
  };

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      handleZoom(e.deltaY);
    }
  };

  const handlePan = (direction: "up" | "down" | "left" | "right") => {
    const panAmount = 50;
    setPosition((prev) => {
      switch (direction) {
        case "up":
          return { ...prev, y: prev.y - panAmount };
        case "down":
          return { ...prev, y: prev.y + panAmount };
        case "left":
          return { ...prev, x: prev.x - panAmount };
        case "right":
          return { ...prev, x: prev.x + panAmount };
      }
    });
  };

  return (
    <div
      className={`bg-background rounded-lg overflow-hidden border my-4 ${
        isFullscreen ? "fixed inset-0 z-50" : ""
      }`}
    >
      <div className="border-b p-1 flex justify-between items-center text-primary/60">
        <div className="flex gap-1">
          <Button
            onClick={() => handlePan("up")}
            variant={"ghost"}
            size={"icon"}
            title="Pan Up"
          >
            <ArrowUp size={16} />
          </Button>
          <Button
            onClick={() => handlePan("down")}
            variant={"ghost"}
            size={"icon"}
            title="Pan Down"
          >
            <ArrowDown size={16} />
          </Button>
          <Button
            onClick={() => handlePan("left")}
            variant={"ghost"}
            size={"icon"}
            title="Pan Left"
          >
            <ArrowLeft size={16} />
          </Button>
          <Button
            onClick={() => handlePan("right")}
            variant={"ghost"}
            size={"icon"}
            title="Pan Right"
          >
            <ArrowRight size={16} />
          </Button>
        </div>
        <div className="flex gap-1">
          <Button
            onClick={handleZoomIn}
            variant={"ghost"}
            size={"icon"}
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </Button>
          <Button
            onClick={handleZoomOut}
            variant={"ghost"}
            size={"icon"}
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </Button>
          <Button
            onClick={handleReset}
            variant={"ghost"}
            size={"icon"}
            title="Reset View"
          >
            <RotateCcw size={16} />
          </Button>
          {/* <Button
            onClick={handleCopyCode}
            variant={"ghost"}
            size={"icon"}
            title="Copy Code"
          >
            <Copy size={16} />
          </Button> */}
          <Button
            onClick={handleToggleFullscreen}
            variant={"ghost"}
            size={"icon"}
            title="Toggle Fullscreen"
          >
            <Maximize2 size={16} />
          </Button>
        </div>
      </div>
      <div
        className={`overflow-hidden p-4 ${
          isFullscreen ? "h-[calc(100vh-64px)]" : "h-fit"
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
      >
        <div
          ref={containerRef}
          style={{
            transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
            transformOrigin: "center top",
            transition: isDragging ? "none" : "transform 0.2s ease-in-out",
            cursor: isDragging ? "grabbing" : "grab",
          }}
          className="flex justify-center items-center"
        />
      </div>
    </div>
  );
};

export default MermaidDiagram;
