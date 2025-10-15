import React, { useRef, useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io("http://localhost:3000");

// Define a more structured data type for drawing events
interface Point {
    x: number;
    y: number;
}

type DrawData = 
    | { type: 'dot'; point: Point }
    | { type: 'curve'; startPoint: Point; midPoint: Point; endPoint: Point }
    | { type: 'clear' }
    | { type: 'erase'; point: Point };

type Tool = 'pen' | 'eraser';

const Whiteboard = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentTool, setCurrentTool] = useState<Tool>('pen');
    const [brushSize, setBrushSize] = useState(5);
    const [brushColor, setBrushColor] = useState('#000000');
    const pointsRef = useRef<Point[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = window.innerWidth * 0.9;
        canvas.height = window.innerHeight * 0.8;
        const context = canvas.getContext('2d');
        if (!context) return;
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.strokeStyle = brushColor;
        context.lineWidth = brushSize;
        contextRef.current = context;

        const handleDrawing = (data: DrawData) => {
            const context = contextRef.current;
            if (!context) return;

            switch (data.type) {
                case 'dot':
                    context.beginPath();
                    context.arc(data.point.x, data.point.y, context.lineWidth / 2, 0, 2 * Math.PI);
                    context.fillStyle = context.strokeStyle;
                    context.fill();
                    context.closePath();
                    break;
                case 'curve':
                    context.beginPath();
                    context.moveTo(data.startPoint.x, data.startPoint.y);
                    context.bezierCurveTo(data.midPoint.x, data.midPoint.y, data.endPoint.x, data.endPoint.y, data.endPoint.x, data.endPoint.y);
                    context.stroke();
                    context.closePath();
                    break;
                case 'clear':
                    context.clearRect(0, 0, canvas.width, canvas.height);
                    break;
                case 'erase':
                    context.globalCompositeOperation = 'destination-out';
                    context.beginPath();
                    context.arc(data.point.x, data.point.y, brushSize / 2, 0, 2 * Math.PI);
                    context.fill();
                    context.closePath();
                    context.globalCompositeOperation = 'source-over';
                    break;
            }
        };

        socket.on('drawing', handleDrawing);

        return () => {
            socket.off('drawing', handleDrawing);
        };
    }, []);

    const startDrawing = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
        const { offsetX, offsetY } = nativeEvent;
        const context = contextRef.current;
        if (!context) return;

        setIsDrawing(true);
        const currentPoint = { x: offsetX, y: offsetY };
        pointsRef.current = [currentPoint];

        if (currentTool === 'eraser') {
            // Erase locally
            context.globalCompositeOperation = 'destination-out';
            context.beginPath();
            context.arc(currentPoint.x, currentPoint.y, brushSize / 2, 0, 2 * Math.PI);
            context.fill();
            context.closePath();
            context.globalCompositeOperation = 'source-over';
            
            // Emit erase event
            socket.emit('drawing', { type: 'erase', point: currentPoint });
        } else {
            // Draw a single point locally
            context.beginPath();
            context.arc(currentPoint.x, currentPoint.y, context.lineWidth / 2, 0, 2 * Math.PI);
            context.fillStyle = context.strokeStyle;
            context.fill();
            context.closePath();

            // Emit the drawing event for the single point
            socket.emit('drawing', { type: 'dot', point: currentPoint });
        }
    };

    const finishDrawing = () => {
        setIsDrawing(false);
        pointsRef.current = [];
    };

    const draw = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) {
            return;
        }
        const { offsetX, offsetY } = nativeEvent;
        const context = contextRef.current;
        if (!context) return;
        
        const currentPoint = { x: offsetX, y: offsetY };
        pointsRef.current.push(currentPoint);

        if (currentTool === 'eraser') {
            // Erase locally
            context.globalCompositeOperation = 'destination-out';
            context.beginPath();
            context.arc(currentPoint.x, currentPoint.y, brushSize / 2, 0, 2 * Math.PI);
            context.fill();
            context.closePath();
            context.globalCompositeOperation = 'source-over';
            
            // Emit erase event
            socket.emit('drawing', { type: 'erase', point: currentPoint });
        } else {
            if (pointsRef.current.length > 2) {
                const points = pointsRef.current;
                const lastPoint = points[points.length - 2];
                const midPoint = {
                    x: (lastPoint.x + currentPoint.x) / 2,
                    y: (lastPoint.y + currentPoint.y) / 2
                };
                const prevMidPoint = {
                    x: (points[points.length - 3].x + lastPoint.x) / 2,
                    y: (points[points.length - 3].y + lastPoint.y) / 2
                };

                // Draw the curve locally
                context.beginPath();
                context.moveTo(prevMidPoint.x, prevMidPoint.y);
                context.quadraticCurveTo(lastPoint.x, lastPoint.y, midPoint.x, midPoint.y);
                context.stroke();
                context.closePath();
                
                // Emit the curve data
                socket.emit('drawing', { 
                    type: 'curve', 
                    startPoint: prevMidPoint, 
                    midPoint: lastPoint, 
                    endPoint: midPoint 
                });
            }
        }
    };

    // Toolbar functions
    const clearCanvas = () => {
        const context = contextRef.current;
        if (!context) return;
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);
        socket.emit('drawing', { type: 'clear' });
    };

    const downloadCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const link = document.createElement('a');
        link.download = `whiteboard-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
        link.href = canvas.toDataURL();
        link.click();
    };

    const updateBrushSettings = () => {
        const context = contextRef.current;
        if (!context) return;
        context.strokeStyle = brushColor;
        context.lineWidth = brushSize;
    };

    // Update brush settings when they change
    useEffect(() => {
        updateBrushSettings();
    }, [brushColor, brushSize]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            {/* Toolbar */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px',
                backgroundColor: '#f5f5f5',
                borderBottom: '1px solid #ddd',
                flexWrap: 'wrap'
            }}>
                {/* Tool Selection */}
                <div style={{ display: 'flex', gap: '5px' }}>
                    <button
                        onClick={() => setCurrentTool('pen')}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: currentTool === 'pen' ? '#007bff' : '#fff',
                            color: currentTool === 'pen' ? '#fff' : '#000',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        ✏️ Pen
                    </button>
                    <button
                        onClick={() => setCurrentTool('eraser')}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: currentTool === 'eraser' ? '#007bff' : '#fff',
                            color: currentTool === 'eraser' ? '#fff' : '#000',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        🧹 Eraser
                    </button>
                </div>

                {/* Brush Size */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <label>Size:</label>
                    <input
                        type="range"
                        min="1"
                        max="20"
                        value={brushSize}
                        onChange={(e) => setBrushSize(Number(e.target.value))}
                        style={{ width: '100px' }}
                    />
                    <span>{brushSize}px</span>
                </div>

                {/* Color Picker */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <label>Color:</label>
                    <input
                        type="color"
                        value={brushColor}
                        onChange={(e) => setBrushColor(e.target.value)}
                        style={{ width: '40px', height: '30px', border: 'none', borderRadius: '4px' }}
                    />
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '5px', marginLeft: 'auto' }}>
                    <button
                        onClick={clearCanvas}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#dc3545',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        🗑️ Clear
                    </button>
                    <button
                        onClick={downloadCanvas}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#28a745',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        💾 Download
                    </button>
                </div>
            </div>

            {/* Canvas */}
            <canvas
                onMouseDown={startDrawing}
                onMouseUp={finishDrawing}
                onMouseMove={draw}
                onMouseLeave={finishDrawing}
                ref={canvasRef}
                style={{ 
                    border: '1px solid black', 
                    backgroundColor: 'white',
                    flex: 1,
                    cursor: currentTool === 'eraser' ? 'crosshair' : 'crosshair'
                }}
            />
        </div>
    );
};

export default Whiteboard;

