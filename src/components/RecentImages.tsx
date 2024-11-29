import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ImageViewer from "./ImageViewer";

interface RecentImagesProps {
  onImageSelect: (image: string) => void;
}

const RecentImages: React.FC<RecentImagesProps> = ({ onImageSelect }) => {
  const [recentImages, setRecentImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const loadRecentImages = useCallback(() => {
    const storedImages = JSON.parse(
      localStorage.getItem("recentImages") || "[]"
    );
    setRecentImages(storedImages);
  }, []);

  useEffect(() => {
    loadRecentImages();
    const intervalId = setInterval(loadRecentImages, 1000);
    return () => clearInterval(intervalId);
  }, [loadRecentImages]);

  const getFilename = (imagePath: string) => {
    return imagePath.split("/").pop();
  };

  const handleImageClick = (image: string) => {
    setSelectedImage(image);
    onImageSelect(image);
    setIsViewerOpen(true);
  };

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <button className="text-[0.7em] text-black underline ">
            Recent Images
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recent Images</DialogTitle>
            <DialogDescription>Select a recent image</DialogDescription>
          </DialogHeader>
          <ul>
            {recentImages.map((image: string, index: number) => (
              <li key={index}>
                <button onClick={() => handleImageClick(image)}>
                  {getFilename(image)}
                </button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>

      {isViewerOpen && selectedImage && (
        <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{getFilename(selectedImage)}</DialogTitle>
              <DialogDescription>View the selected image</DialogDescription>
            </DialogHeader>
            <ImageViewer image={selectedImage} />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default RecentImages;
