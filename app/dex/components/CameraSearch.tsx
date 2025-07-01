import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { moveCamPosition } from "@/hooks/CamTools";
import { Skull } from "lucide-react";
import { TokenCard } from "@/app/dex/components/tokens/TokenCard";
import OuijAi from "@/components-3d/Ouija/OuijaAndFletcha";

interface CameraSearchProps {
  cameraRef?: React.RefObject<any>;
  onSecretFound: () => void;
  showSecret: boolean;
}

const cursedToken = {
  name: "Cursed Memecoin",
  symbol: "CURSE",
  address: "0x666666666666666666666666666666666666666",
  imageUrl: "/cursed-token.jpg", // You can add a spooky image here
  description: "The forbidden token that should never have been found...",
};

export const CameraSearch = ({
  cameraRef,
  onSecretFound,
  showSecret,
}: CameraSearchProps) => {
  const [position, setPosition] = useState("");
  const [lastPosition, setLastPosition] = useState([0, 0, -7]);
  const [ouijaResult, setOuijaResult] = useState<string | null>(null);

  const checkSecretPosition = (pos: number[]) => {
    return (
      (pos[0] === 6 && pos[1] === 6 && pos[2] === 6) ||
      (pos[0] === 666 && pos[1] === 666 && pos[2] === 666)
    );
  };

  const handleCameraPosition = (e: React.FormEvent) => {
    e.preventDefault();
    const coordinates = position.split(",").map(Number);
    if (
      coordinates.length === 3 &&
      coordinates.every((coord) => !isNaN(coord)) &&
      cameraRef?.current
    ) {
      const [x, y, z] = coordinates;
      setLastPosition([x, y, z]);
      moveCamPosition({ cameraRef, x, y, z, scale: 3 });

      if (checkSecretPosition([x, y, z])) {
        onSecretFound();
      }
    }
  };

  const getCurrentPosition = () => {
    if (cameraRef?.current) {
      const camera = cameraRef.current;
      const currentPos = [
        Math.round(camera.position.x),
        Math.round(camera.position.y),
        Math.round(camera.position.z),
      ];
      setPosition(currentPos.join(","));

      if (checkSecretPosition(currentPos)) {
        onSecretFound();
      }
    }
  };

  return (
    <div className="flex flex-col items-center">
      <motion.form
        animate={{ y: showSecret ? 500 : 0 }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30,
        }}
        onSubmit={handleCameraPosition}
        className="flex items-center space-x-4 mb-8 w-full"
      >
        <Input
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          type="text"
          placeholder="x,y,z (e.g. 1,2,3)"
          className="flex-grow z-40 bg-white/15 border-blue-500"
        />
        <Button type="button" onClick={getCurrentPosition} className="z-40">
          Current
        </Button>
        <Button type="submit" className="z-40">
          Look
        </Button>
      </motion.form>

      <AnimatePresence>
        {showSecret && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{
              opacity: 1,
              height: "auto",
              transition: {
                height: {
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                },
                opacity: { duration: 0.2 },
              },
            }}
            exit={{
              opacity: 0,
              height: 0,
              transition: {
                height: {
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                },
                opacity: { duration: 0.2 },
              },
            }}
            className="overflow-hidden w-full max-w-md mx-auto"
          >
            <motion.div
              initial={{ rotateY: 180 }}
              animate={{ rotateY: 0 }}
              transition={{ duration: 1 }}
              className="mb-8"
            >
              <TokenCard
                // @ts-expect-error not a real token
                token={cursedToken}
                price={ouijaResult || "6.66666666"}
              />
            </motion.div>

            <motion.div className="w-full">
              {/* <Skull className="w-16 h-16 text-red-500 mx-auto mb-4" /> */}
              <OuijAi onResultChange={setOuijaResult} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
