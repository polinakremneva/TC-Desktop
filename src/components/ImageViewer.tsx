import React, { useState, useEffect, useRef } from 'react';

interface ImageViewerProps {
  image: string;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ image }) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleWheel = (event: WheelEvent) => {
    event.preventDefault();
    const zoomStep = 0.3;
    const newZoomLevel = Math.max(1, Math.min(8, zoomLevel + (event.deltaY > 0 ? -zoomStep : zoomStep)));
    setZoomLevel(newZoomLevel);
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setStartPosition({ x: event.clientX - offset.x, y: event.clientY - offset.y });
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const newX = event.clientX - startPosition.x;
    const newY = event.clientY - startPosition.y;
    setOffset({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        container.removeEventListener('wheel', handleWheel);
      };
    }
  }, [zoomLevel]);

  useEffect(() => {
    const image = imageRef.current;
    const container = containerRef.current;
    if (image && container) {
      const resetPosition = () => {
        setOffset({ x: 0, y: 0 });
      };
      image.onload = resetPosition;
      resetPosition();
    }
  }, [image]);

  if (!image) {
    return <p>No image selected</p>;
  }

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        cursor: isDragging ? 'grabbing' : 'grab',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <img
        ref={imageRef}
        src={image}
        alt="Selected"
        className='min-w-[100%]'
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoomLevel})`,
          transition: 'transform 0.1s ease-out',
        }}
      />
    </div>
  );
};

export default ImageViewer;