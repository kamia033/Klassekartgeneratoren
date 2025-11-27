import React, { useRef, useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import type { CanvasItem, Desk, RoundTable, Label } from '../../types';
import ContextMenu from '../UI/ContextMenu';
import CanvasToolbar from './CanvasToolbar';
import './CanvasGrid.css';

interface CanvasGridProps {
  width: number;
  height: number;
  cellSize: number;
}

const CanvasGrid: React.FC<CanvasGridProps> = ({ width, height, cellSize }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const isDeletingRef = useRef(false);
  const { canvasItems, setCanvasItems, uniformTextSize } = useApp();
  const { addToast } = useToast();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; visible: boolean; gridX: number; gridY: number }>({ x: 0, y: 0, visible: false, gridX: 0, gridY: 0 });
  const [draggingItem, setDraggingItem] = useState<{ id: string; offsetX: number; offsetY: number; startX: number; startY: number } | null>(null);
  const [resizingItem, setResizingItem] = useState<{ id: string; startX: number; startY: number; startWidth: number; startHeight: number } | null>(null);
  const [scale, setScale] = useState(1);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const gridColor = "#E0E0E0";
  const deskColor = "#FF0000";
  const borderColor = "#424242";
  const roundtableFill = deskColor;
  const otherColor = "#FFB74D";

  const getContrastColor = (hex: string) => {
    if (!hex) return "black";
    hex = hex.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? "black" : "white";
  };

  const calculateMaxFontSize = (ctx: CanvasRenderingContext2D, text: string, width: number, initialFontSize: number): number => {
      let fontSize = initialFontSize;
      ctx.font = `${fontSize}px Arial`;
      let measuredWidth = ctx.measureText(text).width;
      while (measuredWidth > width * 0.9 && fontSize > 5) {
          fontSize -= 1;
          ctx.font = `${fontSize}px Arial`;
          measuredWidth = ctx.measureText(text).width;
      }
      return fontSize;
  };

  const drawFittedText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, height: number, textColor: string, fixedFontSize?: number) => {
    let fontSize = fixedFontSize || height * 0.8;
    ctx.font = `${fontSize}px Arial`;
    let measuredWidth = ctx.measureText(text).width;
    
    if (!fixedFontSize) {
        while (measuredWidth > width * 0.9 && fontSize > 5) {
            fontSize -= 1;
            ctx.font = `${fontSize}px Arial`;
            measuredWidth = ctx.measureText(text).width;
        }
    }
    
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + width / 2, y + height / 2);
  };

  const drawRotatedText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, height: number, angle: number, textColor: string, fixedFontSize?: number) => {
    const cx = x + width / 2;
    const cy = y + height / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    
    let fontSize = fixedFontSize || height * 0.8;
    ctx.font = `${fontSize}px Arial`;
    let measuredWidth = ctx.measureText(text).width;

    if (!fixedFontSize) {
        while (measuredWidth > width * 0.9 && fontSize > 5) {
            fontSize -= 1;
            ctx.font = `${fontSize}px Arial`;
            measuredWidth = ctx.measureText(text).width;
        }
    }

    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, 0);
    ctx.restore();
  };

  const drawCanvas = (ctx: CanvasRenderingContext2D, width: number, height: number, cellSize: number, items: CanvasItem[], currentMousePos: { x: number, y: number } | null, clear: boolean = true, showGrid: boolean = true) => {
    // Clear canvas
    if (clear) {
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, width, height);
    }

    const deleteIconSize = 15;

    let commonFontSize: number | undefined = undefined;

    if (uniformTextSize) {
        let minSize = cellSize * 0.8; // Start with max possible size
        
        items.forEach(item => {
            if (item.type === 'desk') {
                const desk = item as Desk;
                if (desk.studentId) {
                    const size = calculateMaxFontSize(ctx, desk.studentId, cellSize - 4, cellSize * 0.8);
                    if (size < minSize) minSize = size;
                }
            } else if (item.type === 'roundtable') {
                const table = item as RoundTable;
                if (table.numSeats > 0) {
                    for (let i = 0; i < table.numSeats; i++) {
                        if (table.studentIds[i]) {
                            let availableWidth = cellSize * 0.8;
                            if (table.numSeats === 4) {
                                availableWidth = cellSize; // Rotated text has more width potentially
                            }
                            const size = calculateMaxFontSize(ctx, table.studentIds[i]!, availableWidth, cellSize * 0.8);
                            if (size < minSize) minSize = size;
                        }
                    }
                }
            }
        });
        commonFontSize = minSize;
    }

    // Draw grid
    if (showGrid) {
        const numCols = Math.ceil(width / cellSize);
        const numRows = Math.ceil(height / cellSize);

        for (let col = 0; col <= numCols; col++) {
        let x = col * cellSize;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        ctx.stroke();
        }
        for (let row = 0; row <= numRows; row++) {
        let y = row * cellSize;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        ctx.stroke();
        }
    }

    // Draw items
    items.forEach(item => {
      if (item.type === 'desk') {
        const desk = item as Desk;
        let x = desk.gridX * cellSize;
        let y = desk.gridY * cellSize;
        let fill = desk.color || deskColor;
        ctx.fillStyle = fill;
        ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
        
        if (desk.studentId) {
            let textColor = getContrastColor(fill);
            drawFittedText(ctx, desk.studentId, x + 2, y + 2, cellSize - 4, cellSize - 4, textColor, commonFontSize);
        }

        if (desk.marked && showGrid) { // Only show marked 'X' if grid is shown (edit mode)
            ctx.strokeStyle = 'blue';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x + 5, y + 5);
            ctx.lineTo(x + cellSize - 5, y + cellSize - 5);
            ctx.moveTo(x + cellSize - 5, y + 5);
            ctx.lineTo(x + 5, y + cellSize - 5);
            ctx.stroke();
        }

        // Draw delete icon if hovered
        if (currentMousePos && 
            currentMousePos.x >= x && currentMousePos.x <= x + cellSize &&
            currentMousePos.y >= y && currentMousePos.y <= y + cellSize) {
            ctx.fillStyle = 'red';
            ctx.fillRect(x + cellSize - deleteIconSize, y, deleteIconSize, deleteIconSize);
            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('x', x + cellSize - deleteIconSize / 2, y + deleteIconSize / 2);
        }

      } else if (item.type === 'roundtable') {
        const table = item as RoundTable;
        let tableX = table.gridX * cellSize;
        let tableY = table.gridY * cellSize;
        let cx = tableX + cellSize;
        let cy = tableY + cellSize;
        let radius = cellSize;
        let tableColor = table.color || roundtableFill;

        ctx.fillStyle = tableColor;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        ctx.stroke();

        if (table.numSeats > 0) {
            for (let i = 0; i < table.numSeats; i++) {
                let angle;
                if (table.numSeats === 2) {
                    angle = (i === 0) ? 0 : Math.PI;
                } else if (table.numSeats === 4) {
                    angle = (2 * Math.PI / table.numSeats) * i - Math.PI / 2;
                } else {
                    angle = (2 * Math.PI / table.numSeats) * i - Math.PI / 2;
                }

                let seatRectWidth = cellSize * 0.8;
                let seatRectHeight = cellSize * 0.8;
                let seatCenterX = cx + Math.cos(angle) * radius * 0.7;
                let seatCenterY = cy + Math.sin(angle) * radius * 0.7;
                let seatX = seatCenterX - seatRectWidth / 2;
                let seatY = seatCenterY - seatRectHeight / 2;

                if (table.studentIds[i]) {
                    let textColor = getContrastColor(tableColor);
                    if (table.numSeats === 4) {
                        const angles = [-Math.PI / 4, Math.PI / 4, Math.PI / 4, -Math.PI / 4];
                        let seatX4 = tableX + (i % 2) * cellSize;
                        let seatY4 = tableY + (i < 2 ? 0 : cellSize);
                        drawRotatedText(ctx, table.studentIds[i]!, seatX4, seatY4, cellSize, cellSize, angles[i], textColor, commonFontSize);
                    } else {
                        drawFittedText(ctx, table.studentIds[i]!, seatX, seatY, seatRectWidth, seatRectHeight, textColor, commonFontSize);
                    }
                }
                
                // Draw lines
                let boundaryAngle;
                if (table.numSeats === 2) {
                    boundaryAngle = (i === 0) ? Math.PI / 2 : -Math.PI / 2;
                } else if (table.numSeats === 4) {
                    boundaryAngle = (2 * Math.PI / table.numSeats) * i - Math.PI / 4 + (Math.PI / table.numSeats);
                } else {
                    boundaryAngle = (2 * Math.PI / table.numSeats) * i - Math.PI / 2 + (Math.PI / table.numSeats);
                }

                let innerDistance = 0;
                let outerDistance = radius * 0.6 + (seatRectHeight / 2);
                let bx1 = cx + innerDistance * Math.cos(boundaryAngle);
                let by1 = cy + innerDistance * Math.sin(boundaryAngle);
                let bx2 = cx + outerDistance * Math.cos(boundaryAngle);
                let by2 = cy + outerDistance * Math.sin(boundaryAngle);

                ctx.beginPath();
                ctx.moveTo(bx1, by1);
                ctx.lineTo(bx2, by2);
                ctx.strokeStyle = borderColor;
                ctx.lineWidth = 1;
                ctx.stroke();

                // Draw marked seat cross
                if (table.markedSeats[i] && showGrid) { // Only show marked 'X' if grid is shown (edit mode)
                    ctx.strokeStyle = 'blue';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(seatX, seatY);
                    ctx.lineTo(seatX + seatRectWidth, seatY + seatRectHeight);
                    ctx.moveTo(seatX + seatRectWidth, seatY);
                    ctx.lineTo(seatX, seatY + seatRectHeight);
                    ctx.stroke();
                }
            }
        }

        // Draw delete icon if hovered
        if (currentMousePos && 
            currentMousePos.x >= tableX && currentMousePos.x <= tableX + 2 * cellSize &&
            currentMousePos.y >= tableY && currentMousePos.y <= tableY + 2 * cellSize) {
            ctx.fillStyle = 'red';
            ctx.fillRect(tableX + 2 * cellSize - deleteIconSize, tableY, deleteIconSize, deleteIconSize);
            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('x', tableX + 2 * cellSize - deleteIconSize / 2, tableY + deleteIconSize / 2);
        }

      } else if (item.type === 'blackboard') {
          // ... implementation for blackboard
      } else if (item.type === 'label') {
          const label = item as Label;
          ctx.fillStyle = label.color || otherColor;
          ctx.fillRect(label.x, label.y, label.width, label.height);
          ctx.strokeStyle = borderColor;
          ctx.lineWidth = 1;
          ctx.strokeRect(label.x, label.y, label.width, label.height);
          drawFittedText(ctx, label.text, label.x, label.y, label.width, label.height, "black");

          // Draw resize handle
          const handleSize = 10;
          ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
          ctx.beginPath();
          ctx.moveTo(label.x + label.width - handleSize, label.y + label.height);
          ctx.lineTo(label.x + label.width, label.y + label.height);
          ctx.lineTo(label.x + label.width, label.y + label.height - handleSize);
          ctx.fill();

          // Draw delete icon if hovered
          if (currentMousePos && 
            currentMousePos.x >= label.x && currentMousePos.x <= label.x + label.width &&
            currentMousePos.y >= label.y && currentMousePos.y <= label.y + label.height) {
            ctx.fillStyle = 'red';
            ctx.fillRect(label.x + label.width - deleteIconSize, label.y, deleteIconSize, deleteIconSize);
            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('x', label.x + label.width - deleteIconSize / 2, label.y + deleteIconSize / 2);
        }
      }
    });
  };

  const getBoundingBox = () => {
    if (canvasItems.length === 0) return { x: 0, y: 0, width: width, height: height };
    
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;

    canvasItems.forEach(item => {
        if (item.type === 'desk') {
            const d = item as Desk;
            minX = Math.min(minX, d.gridX * cellSize);
            minY = Math.min(minY, d.gridY * cellSize);
            maxX = Math.max(maxX, (d.gridX + 1) * cellSize);
            maxY = Math.max(maxY, (d.gridY + 1) * cellSize);
        } else if (item.type === 'roundtable') {
            const t = item as RoundTable;
            minX = Math.min(minX, t.gridX * cellSize);
            minY = Math.min(minY, t.gridY * cellSize);
            maxX = Math.max(maxX, (t.gridX + 2) * cellSize);
            maxY = Math.max(maxY, (t.gridY + 2) * cellSize);
        } else if (item.type === 'label') {
            const l = item as Label;
            minX = Math.min(minX, l.x);
            minY = Math.min(minY, l.y);
            maxX = Math.max(maxX, l.x + l.width);
            maxY = Math.max(maxY, l.y + l.height);
        }
    });

    const padding = 0;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(width, maxX + padding);
    maxY = Math.min(height, maxY + padding);

    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  };

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
      const handleFsChange = () => {
          setIsFullscreen(!!document.fullscreenElement);
      };
      document.addEventListener('fullscreenchange', handleFsChange);
      return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let targetWidth = width;
    let targetHeight = height;
    
    if (isFullscreen) {
        targetWidth = window.innerWidth;
        targetHeight = window.innerHeight;
    } else {
        // In normal mode, we want the canvas to be large enough to hold the scaled content
        // to avoid clipping and ensure high quality rendering.
        targetWidth = width * scale;
        targetHeight = height * scale;
    }

    // High DPI support
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = targetWidth * dpr;
    canvas.height = targetHeight * dpr;
    
    canvas.style.width = `${targetWidth}px`;
    canvas.style.height = `${targetHeight}px`;
    
    // Reset transform to clear the whole screen
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Apply scale for DPI
    ctx.scale(dpr, dpr);

    if (isFullscreen) {
        const box = getBoundingBox();
        // Add some padding around the content in fullscreen
        const padding = 40; 
        const contentWidth = box.width + padding * 2;
        const contentHeight = box.height + padding * 2;
        
        // Calculate scale to fit content into targetWidth/Height
        const scaleX = targetWidth / contentWidth;
        const scaleY = targetHeight / contentHeight;
        const fitScale = Math.min(scaleX, scaleY);
        
        // Calculate centering offset
        const boxCenterX = box.x + box.width / 2;
        const boxCenterY = box.y + box.height / 2;
        
        const screenCenterX = targetWidth / 2;
        const screenCenterY = targetHeight / 2;
        
        // Translate to center of screen
        ctx.translate(screenCenterX, screenCenterY);
        // Scale
        ctx.scale(fitScale, fitScale);
        // Translate back from box center
        ctx.translate(-boxCenterX, -boxCenterY);
        
    } else {
        // Normal mode
        // Use the user defined scale
        ctx.scale(scale, scale);
    }

    drawCanvas(ctx, width, height, cellSize, canvasItems, mousePos, false, !isFullscreen);

  }, [width, height, cellSize, canvasItems, scale, mousePos, isFullscreen, uniformTextSize]);

  const getMousePos = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale
    };
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const pos = getMousePos(e);
    const gridX = Math.floor(pos.x / cellSize);
    const gridY = Math.floor(pos.y / cellSize);

    // Check for RoundTable seat click
    for (let item of canvasItems) {
        if (item.type === 'roundtable') {
            const table = item as RoundTable;
            let tableX = table.gridX * cellSize;
            let tableY = table.gridY * cellSize;
            let cx = tableX + cellSize;
            let cy = tableY + cellSize;
            let radius = cellSize;

            for (let i = 0; i < table.numSeats; i++) {
                let angle;
                if (table.numSeats === 2) {
                    angle = (i === 0) ? 0 : Math.PI;
                } else if (table.numSeats === 4) {
                    angle = (2 * Math.PI / table.numSeats) * i - Math.PI / 2;
                } else {
                    angle = (2 * Math.PI / table.numSeats) * i - Math.PI / 2;
                }

                let seatRectWidth = cellSize * 0.8;
                let seatRectHeight = cellSize * 0.8;
                let seatCenterX = cx + Math.cos(angle) * radius * 0.7;
                let seatCenterY = cy + Math.sin(angle) * radius * 0.7;
                let seatX = seatCenterX - seatRectWidth / 2;
                let seatY = seatCenterY - seatRectHeight / 2;

                if (pos.x >= seatX && pos.x <= seatX + seatRectWidth && pos.y >= seatY && pos.y <= seatY + seatRectHeight) {
                    const newItems = canvasItems.map(it => {
                        if (it.id === table.id) {
                            const newMarkedSeats = [...(it as RoundTable).markedSeats];
                            newMarkedSeats[i] = !newMarkedSeats[i];
                            return { ...it, markedSeats: newMarkedSeats };
                        }
                        return it;
                    });
                    setCanvasItems(newItems);
                    return;
                }
            }
        }
    }

    // Check for Desk click
    const clickedDesk = canvasItems.find(item => 
        item.type === 'desk' && 
        (item as Desk).gridX === gridX && 
        (item as Desk).gridY === gridY
    );

    if (clickedDesk) {
        const newItems = canvasItems.map(item => {
            if (item.id === clickedDesk.id) {
                return { ...item, marked: !(item as Desk).marked };
            }
            return item;
        });
        setCanvasItems(newItems);
        return;
    }

    // Check for Label click
    const clickedLabel = canvasItems.find(item => 
        item.type === 'label' && 
        pos.x >= (item as Label).x && pos.x <= (item as Label).x + (item as Label).width &&
        pos.y >= (item as Label).y && pos.y <= (item as Label).y + (item as Label).height
    );

    if (clickedLabel) {
        const labelColors = ["#FFB74D", "#4DB6AC", "#9575CD", "#F06292", "#E0E0E0"];
        const newItems = canvasItems.map(item => {
            if (item.id === clickedLabel.id) {
                const currentColor = (item as Label).color || "#FFB74D";
                const currentIndex = labelColors.indexOf(currentColor);
                const nextColor = labelColors[(currentIndex + 1) % labelColors.length];
                return { ...item, color: nextColor };
            }
            return item;
        });
        setCanvasItems(newItems);
        return;
    }

    setContextMenu({
        x: e.clientX,
        y: e.clientY,
        visible: true,
        gridX,
        gridY
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
      if (e.button !== 0) return; // Only left click
      const pos = getMousePos(e);
      const gridX = Math.floor(pos.x / cellSize);
      const gridY = Math.floor(pos.y / cellSize);
      
      isDraggingRef.current = false;

      // Check for delete icon click
      const deleteIconSize = 15;
      for (let i = canvasItems.length - 1; i >= 0; i--) {
          const item = canvasItems[i];
          let deleteX = -1, deleteY = -1;

          if (item.type === 'desk') {
              const desk = item as Desk;
              deleteX = (desk.gridX + 1) * cellSize - deleteIconSize;
              deleteY = desk.gridY * cellSize;
          } else if (item.type === 'roundtable') {
              const table = item as RoundTable;
              deleteX = (table.gridX + 2) * cellSize - deleteIconSize;
              deleteY = table.gridY * cellSize;
          } else if (item.type === 'label') {
              const label = item as Label;
              deleteX = label.x + label.width - deleteIconSize;
              deleteY = label.y;
          }

          if (deleteX !== -1 && 
              pos.x >= deleteX && pos.x <= deleteX + deleteIconSize &&
              pos.y >= deleteY && pos.y <= deleteY + deleteIconSize) {
              
              // Check if we are hovering over the item (delete icon is only visible on hover)
              // Actually, the delete icon logic in drawCanvas checks if mouse is over the ITEM, not just the icon.
              // But if we click the icon, we are definitely over the item.
              // However, we should probably only allow deleting if the icon is actually visible (i.e. we are hovering the item).
              // Since we are clicking, the mouse is there.
              
              // Delete item
              setCanvasItems(canvasItems.filter(it => it.id !== item.id));
              isDeletingRef.current = true;
              return;
          }
      }

      // Check for resize handle on Labels
      for (let i = canvasItems.length - 1; i >= 0; i--) {
          const item = canvasItems[i];
          if (item.type === 'label') {
              const label = item as Label;
              const handleSize = 10;
              if (pos.x >= label.x + label.width - handleSize && pos.x <= label.x + label.width &&
                  pos.y >= label.y + label.height - handleSize && pos.y <= label.y + label.height) {
                  setResizingItem({
                      id: label.id,
                      startX: pos.x,
                      startY: pos.y,
                      startWidth: label.width,
                      startHeight: label.height
                  });
                  return;
              }
          }
      }

      // Check for items to drag
      for (let i = canvasItems.length - 1; i >= 0; i--) {
          const item = canvasItems[i];
          if (item.type === 'desk') {
              const desk = item as Desk;
              if (desk.gridX === gridX && desk.gridY === gridY) {
                  setDraggingItem({
                      id: desk.id,
                      offsetX: pos.x - desk.gridX * cellSize,
                      offsetY: pos.y - desk.gridY * cellSize,
                      startX: desk.gridX,
                      startY: desk.gridY
                  });
                  return;
              }
          } else if (item.type === 'roundtable') {
              const table = item as RoundTable;
              if (gridX >= table.gridX && gridX < table.gridX + 2 &&
                  gridY >= table.gridY && gridY < table.gridY + 2) {
                  setDraggingItem({
                      id: table.id,
                      offsetX: pos.x - table.gridX * cellSize,
                      offsetY: pos.y - table.gridY * cellSize,
                      startX: table.gridX,
                      startY: table.gridY
                  });
                  return;
              }
          } else if (item.type === 'label') {
              const label = item as Label;
              if (pos.x >= label.x && pos.x <= label.x + label.width &&
                  pos.y >= label.y && pos.y <= label.y + label.height) {
                  setDraggingItem({
                      id: label.id,
                      offsetX: pos.x - label.x,
                      offsetY: pos.y - label.y,
                      startX: label.x,
                      startY: label.y
                  });
                  return;
              }
          }
      }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      const pos = getMousePos(e);
      setMousePos(pos);

      // Update cursor
      let cursor = 'default';
      // Check for resize handle hover
      for (let item of canvasItems) {
          if (item.type === 'label') {
              const label = item as Label;
              const handleSize = 10;
              if (pos.x >= label.x + label.width - handleSize && pos.x <= label.x + label.width &&
                  pos.y >= label.y + label.height - handleSize && pos.y <= label.y + label.height) {
                  cursor = 'nwse-resize';
                  break;
              }
          }
      }
      if (draggingItem) cursor = 'move';
      if (resizingItem) cursor = 'nwse-resize';
      if (canvasRef.current) canvasRef.current.style.cursor = cursor;

      if (resizingItem) {
          const dx = pos.x - resizingItem.startX;
          const dy = pos.y - resizingItem.startY;
          const newWidth = Math.max(20, resizingItem.startWidth + dx);
          const newHeight = Math.max(20, resizingItem.startHeight + dy);

          setCanvasItems(canvasItems.map(item => 
              item.id === resizingItem.id ? { ...item, width: newWidth, height: newHeight } : item
          ));
          return;
      }

      if (draggingItem) {
          isDraggingRef.current = true;
          const newItems = canvasItems.map(item => {
              if (item.id === draggingItem.id) {
                  if (item.type === 'desk') {
                      const newGridX = Math.floor((pos.x - draggingItem.offsetX + cellSize / 2) / cellSize);
                      const newGridY = Math.floor((pos.y - draggingItem.offsetY + cellSize / 2) / cellSize);
                      return { ...item, gridX: newGridX, gridY: newGridY };
                  } else if (item.type === 'roundtable') {
                      const newGridX = Math.floor((pos.x - draggingItem.offsetX + cellSize) / cellSize);
                      const newGridY = Math.floor((pos.y - draggingItem.offsetY + cellSize) / cellSize);
                      return { ...item, gridX: newGridX, gridY: newGridY };
                  } else if (item.type === 'label') {
                      return { ...item, x: pos.x - draggingItem.offsetX, y: pos.y - draggingItem.offsetY };
                  }
              }
              return item;
          });
          setCanvasItems(newItems);
      }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
      if (isDeletingRef.current) {
          isDeletingRef.current = false;
          return;
      }

      if (resizingItem) {
          setResizingItem(null);
          return;
      }

      if (draggingItem) {
          setDraggingItem(null);
          // If we were dragging, we don't want to trigger a click
          if (isDraggingRef.current) {
              isDraggingRef.current = false;
              return;
          }
      }

      // Handle click (add desk) if not dragging and not resizing
      // Only if left click
      if (e.button !== 0) return;

      const pos = getMousePos(e);
      const gridX = Math.floor(pos.x / cellSize);
      const gridY = Math.floor(pos.y / cellSize);

      // Check if click is on a label
      const clickedLabel = canvasItems.find(item => 
        item.type === 'label' && 
        pos.x >= (item as Label).x && pos.x <= (item as Label).x + (item as Label).width &&
        pos.y >= (item as Label).y && pos.y <= (item as Label).y + (item as Label).height
      );
      
      if (clickedLabel) return;

      // Check if space is occupied
      const isOccupied = canvasItems.some(item => {
          if (item.type === 'desk') {
              return (item as Desk).gridX === gridX && (item as Desk).gridY === gridY;
          } else if (item.type === 'roundtable') {
              const t = item as RoundTable;
              return gridX >= t.gridX && gridX < t.gridX + 2 &&
                     gridY >= t.gridY && gridY < t.gridY + 2;
          }
          // Labels don't block grid cells
          return false;
      });

      if (!isOccupied) {
          const newDesk: Desk = {
              id: crypto.randomUUID(),
              type: 'desk',
              gridX,
              gridY,
              studentId: null,
              color: '#FFFFFF',
              marked: false
          };
          setCanvasItems([...canvasItems, newDesk]);
      }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
      const pos = getMousePos(e);
      const gridX = Math.floor(pos.x / cellSize);
      const gridY = Math.floor(pos.y / cellSize);

      // Check for Label double click (edit text)
      const clickedLabel = canvasItems.find(item => 
        item.type === 'label' && 
        pos.x >= (item as Label).x && pos.x <= (item as Label).x + (item as Label).width &&
        pos.y >= (item as Label).y && pos.y <= (item as Label).y + (item as Label).height
      );

      if (clickedLabel) {
          const newText = prompt("Endre tekst:", (clickedLabel as Label).text);
          if (newText !== null) {
              setCanvasItems(canvasItems.map(item => 
                  item.id === clickedLabel.id ? { ...item, text: newText } : item
              ));
          }
          return;
      }

      // Check for Desk double click (remove student)
      const clickedDesk = canvasItems.find(item => 
        item.type === 'desk' && 
        (item as Desk).gridX === gridX && 
        (item as Desk).gridY === gridY
      );

      if (clickedDesk) {
          // Only remove student if assigned, do not delete desk on double click
          if ((clickedDesk as Desk).studentId) {
              setCanvasItems(canvasItems.map(item => 
                  item.id === clickedDesk.id ? { ...item, studentId: null } : item
              ));
          }
          return;
      }

      // Check for RoundTable double click
      // ... similar logic for RoundTable
      const clickedTable = canvasItems.find(item => {
          if (item.type !== 'roundtable') return false;
          const table = item as RoundTable;
          return gridX >= table.gridX && gridX < table.gridX + 2 &&
                 gridY >= table.gridY && gridY < table.gridY + 2;
      });

      if (clickedTable) {
          if (confirm("Slette rundbord?")) {
              setCanvasItems(canvasItems.filter(item => item.id !== clickedTable.id));
          }
      }
  };

  const handleSelect = (type: string, subType?: any) => {
    const id = crypto.randomUUID();
    let newItem: CanvasItem | null = null;

    if (type === 'desk') {
        newItem = {
            id,
            type: 'desk',
            gridX: contextMenu.gridX,
            gridY: contextMenu.gridY,
            studentId: null,
            color: null,
            marked: false
        };
    } else if (type === 'roundtable') {
        const numSeats = subType as number;
        newItem = {
            id,
            type: 'roundtable',
            gridX: contextMenu.gridX,
            gridY: contextMenu.gridY,
            numSeats,
            studentIds: new Array(numSeats).fill(null),
            markedSeats: new Array(numSeats).fill(false),
            color: null
        };
    } else if (type === 'merkelapp') {
        newItem = {
            id,
            type: 'label',
            x: contextMenu.gridX * cellSize,
            y: contextMenu.gridY * cellSize,
            width: 100,
            height: 50,
            text: 'Merkelapp',
            crossed: false
        };
    }

    if (newItem) {
        setCanvasItems([...canvasItems, newItem]);
    }
    setContextMenu({ ...contextMenu, visible: false });
  };
  
  const handleFullscreen = () => {
      if (!containerRef.current) return;
      if (!document.fullscreenElement) {
          containerRef.current.requestFullscreen().catch(err => {
              console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
          });
      } else {
          document.exitFullscreen();
      }
  };



  const handleCopy = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const box = getBoundingBox();
      const exportScale = 3; // High resolution for export
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = box.width * exportScale;
      tempCanvas.height = box.height * exportScale;
      const ctx = tempCanvas.getContext('2d');
      if (!ctx) return;
      
      // Scale context for high res drawing
      ctx.scale(exportScale, exportScale);
      // Translate to move the bounding box to 0,0
      ctx.translate(-box.x, -box.y);

      // Draw the scene
      // We need to pass the full width/height to drawCanvas, but it will be clipped by the tempCanvas size anyway
      // Actually, drawCanvas clears the rect (0,0,width,height).
      // We should modify drawCanvas to not clear if we don't want it to, or just let it clear the area it draws.
      // But drawCanvas draws the grid lines for the whole width/height.
      // We only want the items and grid within the bounding box.
      // Let's just draw everything and let the canvas clipping handle it.
      // But we need to make sure we don't clear the wrong area.
      
      // Let's make a version of drawCanvas that doesn't clear, or just manually draw here.
      // Re-using drawCanvas is better.
      // But drawCanvas clears (0,0,width,height).
      // If we translate, (0,0) is now (-box.x, -box.y).
      // So clearing (0,0,width,height) will clear relative to that.
      // It should be fine.
      
      // Wait, drawCanvas uses `width` and `height` for loops.
      // We should pass the original width/height.
      drawCanvas(ctx, width, height, cellSize, canvasItems, null, true, false);
      
      try {
          const blob = await new Promise<Blob | null>(resolve => tempCanvas.toBlob(resolve));
          if (blob) {
              await navigator.clipboard.write([
                  new ClipboardItem({ 'image/png': blob })
              ]);
              addToast('Kopiert til utklippstavle!', 'success');
          }
      } catch (err) {
          console.error('Failed to copy: ', err);
          addToast('Kunne ikke kopiere til utklippstavle.', 'error');
      }
  };

  const handleDownload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const box = getBoundingBox();
      const exportScale = 3;
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = box.width * exportScale;
      tempCanvas.height = box.height * exportScale;
      const ctx = tempCanvas.getContext('2d');
      if (!ctx) return;
      
      ctx.scale(exportScale, exportScale);
      ctx.translate(-box.x, -box.y);

      drawCanvas(ctx, width, height, cellSize, canvasItems, null, true, false);

      const link = document.createElement('a');
      link.download = 'klassekart.png';
      link.href = tempCanvas.toDataURL();
      link.click();
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#f0f0f0' }}>
        <CanvasToolbar 
            scale={scale} 
            setScale={setScale} 
            onFullscreen={handleFullscreen} 
            onCopy={handleCopy} 
            onDownload={handleDownload} 
        />
        <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
            <div style={{ width: width * scale, height: height * scale }}>
                <canvas 
                    ref={canvasRef} 
                    width={width} 
                    height={height} 
                    style={{ display: 'block', backgroundColor: 'white', width: '100%', height: '100%' }}
                    onContextMenu={handleContextMenu}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onDoubleClick={handleDoubleClick}
                />
            </div>
        </div>
        <ContextMenu 
            x={contextMenu.x} 
            y={contextMenu.y} 
            visible={contextMenu.visible} 
            onClose={() => setContextMenu({ ...contextMenu, visible: false })}
            onSelect={handleSelect}
        />
    </div>
  );
};

export default CanvasGrid;
