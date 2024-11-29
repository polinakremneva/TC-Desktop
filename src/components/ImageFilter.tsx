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

export interface ImageFilterProps {
  onFilterChange: (filters: FilterValues) => void;
  directoryPath: string | null;
}

const ImageFilter: React.FC<ImageFilterProps> = ({
  onFilterChange,
  directoryPath,
}) => {
  const [isInputsEnabled, setIsInputsEnabled] = useState(false);
  const [plateImages, setPlateImages] = useState<
    { wellId: string; imagePath: string; filename: string }[]
  >([]);
  const [filters, setFilters] = useState<FilterValues>({
    experiment: "",
    plate: "",
    patientCode: "",
    stage: "",
  });
  const [isChecked, setIsChecked] = useState(false);

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

  const updatePlateImages = useCallback(
    async (currentFilters: FilterValues) => {
      if (!directoryPath) return;

      try {
        const imageFiles: string[] = await window.electron.getImages(
          directoryPath
        );

        const filteredImages = imageFiles.filter((image) => {
          const lowerCaseImage = image.toLowerCase();
          const filenameParts = lowerCaseImage.split("_"); // Assuming parts are separated by underscores
          const plateInFile = filenameParts.find((part) =>
            part.startsWith(currentFilters.plate.toLowerCase())
          );

          const filterParts = [
            currentFilters.experiment.toLowerCase(),
            currentFilters.patientCode.toLowerCase(),
            currentFilters.stage.toLowerCase(),
          ];
          return (
            plateInFile === currentFilters.plate.toLowerCase() &&
            filterParts.every(
              (part) => part === "" || lowerCaseImage.includes(part)
            )
          );
        });

        const newPlateImages = filteredImages.map((image) => {
          const filename = image.split("\\").pop() || "";
          const wellId = filename.split("_").pop()?.split(".")[0] || "";
          return {
            wellId,
            imagePath: `file://${directoryPath}/${filename}`,
            filename,
          };
        });

        setPlateImages(newPlateImages);
      } catch (error) {
        console.error("Error updating plate images:", error);
      }
    },
    [directoryPath]
  );

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
    updatePlateImages(filters);
  }, [filters, updatePlateImages]);

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
            <Label>{isChecked ? "Tales View" : "Normal View"}</Label>
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
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </form>
      {isChecked ? (
        <TalesViewPlate images={plateImages} />
      ) : (
        <NormalViewPlate images={plateImages} />
      )}
    </>
  );
};

export default ImageFilter;
