import React, { useRef, useEffect, useState } from 'react';
import io from 'socket.io-client';
import WhiteboardToolbar from "./components/WhiteboardToolbar";


const socket = io("http://localhost:3000");

// Define a more structured data type for drawing events
interface Point {
    x: number;
    y: number;
}

type DrawData = 
    | { type: 'dot'; point: Point }
    | { type: 'curve'; startPoint: Point; midPoint: Point; endPoint: Point };

const Whiteboard = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
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
        context.strokeStyle = 'black';
        context.lineWidth = 5;
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

        // Draw a single point locally
        context.beginPath();
        context.arc(currentPoint.x, currentPoint.y, context.lineWidth / 2, 0, 2 * Math.PI);
        context.fillStyle = context.strokeStyle;
        context.fill();
        context.closePath();

        // Emit the drawing event for the single point
        socket.emit('drawing', { type: 'dot', point: currentPoint });
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
    };

    return (
  <>
    <WhiteboardToolbar />
    <canvas
      onMouseDown={startDrawing}
      onMouseUp={finishDrawing}
      onMouseMove={draw}
      onMouseLeave={finishDrawing}
      ref={canvasRef}
      style={{ border: '1px solid black', backgroundColor: 'white' }}
    />
  </>
);

};

export default Whiteboard;

