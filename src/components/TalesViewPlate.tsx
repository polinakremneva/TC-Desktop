import React, { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import Tooltip, { TooltipProps, tooltipClasses } from "@mui/material/Tooltip";
import { styled } from "@mui/material/styles";
import ImageViewer from "./ImageViewer";
import RecentImages from "./RecentImages"; // Adjust the import path as needed
import { FaImages } from "react-icons/fa";

interface PlateCell {
  id: string;
  content?: string;
}

interface PlateProps {
  images: { wellId: string; imagePath: string; filename: string }[];
}

const rows = ["A", "B", "C", "D", "E", "F", "G", "H"];
const columns = Array.from({ length: 12 }, (_, i) => i + 1);

const TalesViewPlate: React.FC<PlateProps> = ({ images }) => {
  // @ts-ignore
  const [selectedWell, setSelectedWell] = useState<string | null>(null);
  // @ts-ignore
  const [selectedImage, setSelectedImage] = useState<string | null>(null); // For tracking selected image

  const handleRecentImageSelect = (imagePath: string) => {
    const recentImages = JSON.parse(
      localStorage.getItem("recentImages") || "[]"
    );

    const updatedImages = [
      imagePath,
      ...recentImages.filter((img: string) => img !== imagePath),
    ];

    if (updatedImages.length > 5) updatedImages.pop();

    localStorage.setItem("recentImages", JSON.stringify(updatedImages));
  };

  const handleRecentImageClick = (imagePath: string) => {
    handleRecentImageSelect(imagePath);
    setSelectedImage(imagePath);
  };

  const generatePlateCells = (): PlateCell[] => {
    const cells: PlateCell[] = [];
    rows.forEach((row) => {
      columns.forEach((col) => {
        cells.push({ id: `${row}${col}`, content: undefined });
      });
    });
    return cells;
  };

  const LightTooltip = styled(({ className, ...props }: TooltipProps) => (
    <Tooltip {...props} classes={{ popper: className }} />
  ))(({ theme }) => ({
    [`& .${tooltipClasses.tooltip}`]: {
      backgroundColor: theme.palette.common.white,
      color: "rgba(0, 0, 0, 0.87)",
      boxShadow: theme.shadows[1],
      fontSize: 11,
    },
  }));

  const plateCells = generatePlateCells();

  useEffect(() => {
    console.log("Images being passed to Plate:", images);
  }, [images]);

  return (
    <div className=" rounded-lg big-screen bg-white items-center shadow-xl">
      <div className="flex text-[2em] text-white p-2 pr-8">
        <div className="flex items-center justify-center mx-auto py-[0.3em] underline text-center self-center gap-3 cursor-pointer">
          <FaImages className="text-indigo-500" />
          <RecentImages onImageSelect={handleRecentImageClick} />{" "}
        </div>
      </div>

      <div className="flex flex-col p-[2em] pt-0">
        <div className="flex pl-[3.7em] gap-[0.23em]">
          {columns.map((col) => (
            <div
              key={`column-${col}`}
              className="w-10 h-10 big-screen-text items-center text-blacktext-center font-bold"
            >
              {col}
            </div>
          ))}
        </div>

        {rows.map((row, rowIndex) => (
          <div className="flex items-center gap-1" key={`row-${rowIndex}`}>
            <React.Fragment key={row}>
              <div className="w-10 h-10 text-black big-screen-text-col flex justify-center items-center font-bold">
                {row}
              </div>

              {columns.map((col, colIndex) => {
                const cell = plateCells[rowIndex * columns.length + colIndex];
                const isDisabledRow = row === "A" || row === "H";
                const matchedImage = images.find(
                  (image) =>
                    image.wellId.toLowerCase() === cell.id.toLowerCase()
                );
                console.log("Matched Image:", matchedImage?.imagePath);

                return !isDisabledRow ? ( // Ensure conditional rendering is valid JSX
                  <Dialog key={`dialog-${row}-${col}`}>
                    <LightTooltip title={cell.id}>
                      <DialogTrigger asChild>
                        <div
                          className={`w-10 h-10 flex items-center mb-1 big-screen-pictures justify-center border border-gray-400 rounded-full ${
                            isDisabledRow
                              ? "bg-gray-200 disabled big-screen-pictures cursor-not-allowed"
                              : "cursor-pointer"
                          }`}
                          onClick={() => {
                            if (matchedImage) {
                              setSelectedWell(cell.id);
                              handleRecentImageClick(matchedImage.imagePath);
                            }
                          }}
                        >
                          {matchedImage ? (
                            <img
                              src={matchedImage.imagePath}
                              alt={cell.id}
                              className="w-8 h-8 rounded-full big-screen-pictures-inside"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full big-screen-pictures-inside border border-gray-400 flex items-center justify-center"></div>
                          )}
                        </div>
                      </DialogTrigger>
                    </LightTooltip>
                    <DialogContent className="sm:max-w-[550px]">
                      <>
                        <DialogHeader>
                          <DialogTitle className="">
                            You clicked {cell.id}
                          </DialogTitle>
                        </DialogHeader>
                        <DialogDescription asChild>
                          {matchedImage ? (
                            <>
                              <div className="text-[1.3em] text-black py-2">
                                <span className="bg-indigo-300 bg-opacity-45 rounded-lg px-2">
                                  File:
                                </span>{" "}
                                <span className="py-2">
                                  {matchedImage.filename}
                                </span>
                              </div>
                              <ImageViewer image={matchedImage.imagePath} />
                            </>
                          ) : (
                            <div>No image available for this well.</div>
                          )}
                        </DialogDescription>
                      </>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <div
                    key={`disabled-${row}-${col}`}
                    className="w-10 h-10 rounded-full border big-screen-pictures border-gray-400 mb-1 flex items-center justify-center bg-gray-200 cursor-not-allowed"
                  >
                    {/* Empty disabled cell */}
                  </div>
                );
              })}
            </React.Fragment>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TalesViewPlate;
