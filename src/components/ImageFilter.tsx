import React, { useState, useEffect, useCallback } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { AiTwotoneExperiment } from "react-icons/ai";
import { Bandage } from "lucide-react";
import { IoMdBarcode } from "react-icons/io";
import { GrSteps } from "react-icons/gr";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import NormalViewPlate from "./NormalViewPlate";
import TalesViewPlate from "./TalesViewPlate";

interface FilterValues {
  experiment: string;
  plate: string;
  patientCode: string;
  stage: string;
}

interface ImageInfo {
  wellId: string;
  imagePath: string;
  filename: string;
}

export interface ImageFilterProps {
  onFilterChange: (filters: FilterValues) => void;
  directoryPath: string | null;
}

const ImageFilter: React.FC<ImageFilterProps> = ({
  onFilterChange,
  directoryPath,
}) => {
  const [isInputsEnabled, setIsInputsEnabled] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({
    experiment: "",
    plate: "",
    patientCode: "",
    stage: "",
  });
  const [isChecked, setIsChecked] = useState(false);
  const [plateImages, setPlateImages] = useState<ImageInfo[]>([]);
  const [tilesImages, setTilesImages] = useState<ImageInfo[]>([]);

  const handleChange = useCallback(
    (field: keyof FilterValues, value: string) => {
      setFilters((prev) => {
        const newFilters = { ...prev, [field]: value };
        onFilterChange(newFilters);
        return newFilters;
      });
    },
    [onFilterChange]
  );

  const handleSwitchChange = (checked: boolean) => {
    setIsChecked(checked);
  };

  const updateImages = async (
    directoryPath: string | null,
    filters: FilterValues,
    imageType: "normal" | "tiles"
  ): Promise<ImageInfo[]> => {
    if (!directoryPath) return [];

    try {
      const subDirectory =
        imageType === "tiles"
          ? `${directoryPath}\\5x_attention`
          : directoryPath;

      const imageFiles: string[] = await window.electron.getImages(
        subDirectory
      );

      const filteredImages = imageFiles.filter((image) => {
        const lowerCaseImage = image.toLowerCase();
        const filenameParts = lowerCaseImage.split("_");
        const plateInFile = filenameParts.find((part) =>
          part.startsWith(filters.plate.toLowerCase())
        );

        const filterParts = [
          filters.experiment.toLowerCase(),
          filters.patientCode.toLowerCase(),
          filters.stage.toLowerCase(),
        ];

        return (
          plateInFile === filters.plate.toLowerCase() &&
          filterParts.every(
            (part) => part === "" || lowerCaseImage.includes(part)
          )
        );
      });

      return filteredImages.map((image) => {
        const filename = image.split("\\").pop() || "";

        // Remove "_attention_map" if it exists
        const baseFilename = filename.replace("_attention_map", "");

        // Extract wellId as the last underscore-separated segment
        const wellId = baseFilename.split("_").slice(-1)[0].split(".")[0];

        // Determine the correct imagePath
        const imagePath =
          imageType === "tiles"
            ? `file://${subDirectory}/${filename}` // Use original filename for path
            : `file://${directoryPath}/${filename}`;

        return { wellId, imagePath, filename };
      });
    } catch (error) {
      console.error("Error updating images:", error);
      return [];
    }
  };

  const checkFileExists = useCallback(async () => {
    if (!filters.experiment || !filters.plate || !directoryPath) {
      setIsInputsEnabled(false);
      return;
    }

    try {
      const imageFiles: string[] = await window.electron.getImages(
        directoryPath
      );

      const lowerCaseExperiment = filters.experiment.toLowerCase();
      const lowerCasePlate = filters.plate.toLowerCase();

      const foundImage = imageFiles.some((image) => {
        const lowerCaseImage = image.toLowerCase();
        return (
          lowerCaseImage.includes(lowerCaseExperiment) &&
          lowerCaseImage.includes(lowerCasePlate)
        );
      });

      setIsInputsEnabled(foundImage);
    } catch (error) {
      console.error("Error checking file existence:", error);
      setIsInputsEnabled(false);
    }
  }, [filters.experiment, filters.plate, directoryPath]);

  useEffect(() => {
    checkFileExists();
  }, [checkFileExists]);

  useEffect(() => {
    const fetchImages = async () => {
      const normalImages = await updateImages(directoryPath, filters, "normal");
      const tileImages = await updateImages(directoryPath, filters, "tiles");

      setPlateImages(normalImages);
      setTilesImages(tileImages);
    };

    fetchImages();
  }, [filters, directoryPath]);

  return (
    <>
      <form className="bg-white shadow-lg rounded-lg big-screen-filter-text p-6 min-w-[20em] flex flex-col gap-2 ">
        <div className="flex items-center space-x-2">
          <Switch checked={isChecked} onCheckedChange={handleSwitchChange} />
          <motion.div
            key={isChecked ? "Tales View" : "Normal View"}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{
              duration: 0.8,
              ease: [0.25, 0.8, 0.25, 1],
            }}
          >
            <Label>{isChecked ? "Tiles View" : "Normal View"}</Label>
          </motion.div>{" "}
        </div>
        {/* Experiment Input */}
        <div className="mb-4 my-7">
          <label className="flex items-center gap-2 text-gray-700 font-bold mb-2">
            <AiTwotoneExperiment className="text-indigo-500 text-[1.3em]" />
            Experiment:
          </label>
          <input
            type="text"
            value={filters.experiment}
            onChange={(e) => handleChange("experiment", e.target.value)}
            placeholder="DF195 for example"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-200"
          />
        </div>

        {/* Plate Input */}
        <div className="mb-4">
          <label className="flex items-center gap-2 text-gray-700 font-bold mb-2">
            <Bandage className="text-indigo-500" size={23} />
            Plate:
          </label>
          <input
            type="text"
            value={filters.plate}
            onChange={(e) => handleChange("plate", e.target.value)}
            placeholder="P1 for example"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-200"
          />
        </div>

        {/* Patient Code Input */}
        <div className="mb-4">
          <label className="flex items-center gap-2 text-gray-700 font-bold mb-2">
            <IoMdBarcode className="text-indigo-500 text-[1.2em]" />
            Patient Code:
          </label>
          <input
            type="text"
            value={filters.patientCode}
            onChange={(e) => handleChange("patientCode", e.target.value)}
            placeholder="L52 for example"
            disabled={!isInputsEnabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-200"
          />
        </div>

        {/* Stage Dropdown */}
        <div className="mb-4">
          <DropdownMenu>
            <label className="flex items-center gap-2 font-bold mb-2">
              <GrSteps className="text-indigo-500 text-[1.2em]" />
              Stage:
            </label>
            <DropdownMenuTrigger disabled={!isInputsEnabled}>
              <div>
                <input
                  type="text"
                  value={filters.stage}
                  readOnly
                  placeholder="Select Stage"
                  disabled={!isInputsEnabled}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-200"
                />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Stage</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={filters.stage}
                onValueChange={(value) => handleChange("stage", value)}
              >
                <DropdownMenuRadioItem value="PreFix">
                  PreFix
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="PostFix">
                  PostFix
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="PostStain">
                  PostStain
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="5xh_data-pipeline">
                  data-pipeline-5xh
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="20xh_data-pipeline">
                  data-pipeline-20xh
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="BrightField">
                  BrightField
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </form>
      {isChecked ? (
        <TalesViewPlate images={tilesImages} />
      ) : (
        <NormalViewPlate images={plateImages} />
      )}
    </>
  );
};

export default ImageFilter;
