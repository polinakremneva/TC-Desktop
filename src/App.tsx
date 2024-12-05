import React, { useState, useEffect, useCallback } from "react";
import ImageFilter from "./components/ImageFilter";
import imageCompression from "browser-image-compression";
import { set, get } from "idb-keyval";
import { DoorOpen, FolderOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog";
import { Button } from "./components/ui/button";

interface FilterValues {
  experiment: string;
  plate: string;
  patientCode: string;
  stage: string;
}

interface ImageData {
  filename: string;
  wellId: string;
  imagePath: string;
}

const App: React.FC = () => {
  // @ts-ignore
  const [images, setImages] = useState<ImageData[]>([]);
  const [currentFilters, setCurrentFilters] = useState<FilterValues>({
    experiment: "",
    plate: "",
    patientCode: "",
    stage: "",
  });

  const [directoryPath, setDirectoryPath] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const savedDirectory = localStorage.getItem("workingDirectory");
    if (savedDirectory) {
      setDirectoryPath(savedDirectory);
    } else {
      setIsDialogOpen(true);
    }
  }, []);

  const handleChangeDirectory = () => {
    setIsDialogOpen(true);
  };

  const handleSelectDirectory = async () => {
    const selectedDirectory = await window.electron.selectDirectory();
    if (selectedDirectory) {
      setDirectoryPath(selectedDirectory);
      localStorage.setItem("workingDirectory", selectedDirectory);
      setIsDialogOpen(false);
    }
  };

  const compressImage = async (imageFile: File): Promise<string> => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
    };

    try {
      const compressedFile = await imageCompression(imageFile, options);
      return URL.createObjectURL(compressedFile);
    } catch (error) {
      console.error("Error compressing image:", error);
      return URL.createObjectURL(imageFile);
    }
  };

  const getCachedOrCompressedImage = async (
    imagePath: string
  ): Promise<string> => {
    if (!imagePath) {
      throw new Error("Image path is null or undefined");
    }
    const cacheKey = `compressed_${imagePath}`;
    const cachedImage = await get(cacheKey);

    if (cachedImage) {
      return cachedImage;
    }

    try {
      //@ts-ignore
      const imageBase64 = await window.electron.readImageFile(imagePath);
      if (!imageBase64) {
        throw new Error("Image could not be read");
      }

      const isJpeg =
        imagePath.toLowerCase().endsWith(".jpg") ||
        imagePath.toLowerCase().endsWith(".jpeg");

      // Ensure that the base64 data is correctly handled
      const binaryString = atob(imageBase64); // Convert base64 to binary string
      const length = binaryString.length;
      const bytes = new Uint8Array(length); // Create a new Uint8Array

      // Convert binary string to Uint8Array
      for (let i = 0; i < length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], {
        type: isJpeg ? "image/jpeg" : "image/png",
      });
      const file = new File([blob], isJpeg ? "image.jpg" : "image.png", {
        type: isJpeg ? "image/jpeg" : "image/png",
      });

      console.log({ isJpeg, imagePath });

      const compressedImageUrl = await compressImage(file);

      await set(cacheKey, compressedImageUrl);
      return compressedImageUrl;
    } catch (error) {
      console.error("Error fetching or compressing image:", error);
      return imagePath;
    }
  };

  const fetchAndFilterImages = useCallback(async () => {
    if (
      currentFilters.experiment &&
      currentFilters.plate &&
      currentFilters.stage &&
      directoryPath
    ) {
      try {
        const imageFiles: string[] = await window.electron.getImages(
          directoryPath
        );

        const filteredImages = await Promise.all(
          imageFiles
            .filter(
              (image) =>
                image.includes(currentFilters.experiment) &&
                image.includes(currentFilters.plate) &&
                image.includes(currentFilters.stage) &&
                (currentFilters.patientCode
                  ? image.includes(currentFilters.patientCode)
                  : true) &&
                (currentFilters.stage
                  ? image.includes(currentFilters.stage)
                  : true)
            )
            .map(async (image) => {
              const filename = image.split("\\").pop()!;
              const wellId =
                filename
                  .split("_")
                  .pop()
                  ?.replace(".jpg", "")
                  ?.replace(".png", "")
                  .toLowerCase() || "Unknown";
              const originalImagePath = `${directoryPath}/${filename}`; // Remove 'file://'
              const optimizedImagePath = await getCachedOrCompressedImage(
                originalImagePath
              );
              return {
                filename,
                wellId,
                imagePath: optimizedImagePath,
              };
            })
        );

        setImages(filteredImages);
      } catch (error) {
        console.error("Error fetching images:", error);
      }
    }
  }, [currentFilters, directoryPath]);

  const closeProgram = async () => {
    try {
      await window.electron.appExit();
    } catch (error) {
      console.error("Failed to close the program:", error);
    }
  };

  useEffect(() => {
    fetchAndFilterImages();
  }, [fetchAndFilterImages]);

  const handleFilterChange = (filters: FilterValues) => {
    setCurrentFilters(filters);
  };

  return (
    <div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Working Directory</DialogTitle>
            <DialogDescription>
              Please select a directory to work with. This is where your images
              are stored.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={handleSelectDirectory}
              className=" bg-indigo-500 hover:bg-indigo-600"
            >
              Select Directory
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {directoryPath ? (
        <div className="bg-slate-200 flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center">
            <div className="flex gap-[5em] rounded-lg p-6 mb-4">
              <ImageFilter
                onFilterChange={handleFilterChange}
                directoryPath={directoryPath}
              />
            </div>
            <div className="flex justify-between w-full px-6">
              <Button
                onClick={handleChangeDirectory}
                className=" big-screen-filter-text-button bg-indigo-500 hover:bg-indigo-600"
              >
                Change Directory <FolderOpen className="ml-1" />
              </Button>
              <Button
                className=" bg-violet-700 hover:bg-violet-900 big-screen-filter-text-button "
                onClick={closeProgram}
              >
                Exit <DoorOpen className="ml-1" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <p>Please select a working directory to continue.</p>
      )}
    </div>
  );
};

export default App;
