import { moveCamPosition } from "@/hooks/CamTools";
import { Button } from "@/components/ui/button";

export const CameraAngles = (cameraRef: any, controlRef: any) => {
  return (
    <div className="z-30 flex gap-2 py-2">
      <Button
        className="z-60"
        onClick={() => {
          // moveCamPosition({ cameraRef, x: 600, y: 666, z: 500, scale: 3 }); //far out
          // moveCamPosition({ cameraRef, x: 1, y: 0, z: 0 });
          // defaultCam(controlRef, cameraRef);
          moveCamPosition({ cameraRef, x: -50, y: 150, z: 600, scale: 3 });
        }}
      >
        Moon
      </Button>
      <Button
        className="z-60"
        onClick={() => {
          // moveCamPosition({ cameraRef, x: 600, y: 666, z: 500, scale: 3 }); //far out
          // moveCamPosition({ cameraRef, x: 1, y: 0, z: 0 });
          // defaultCam(controlRef, cameraRef);
          moveCamPosition({ cameraRef, x: -50, y: 150, z: 600, scale: 3 });
        }}
      >
        Camera
      </Button>
    </div>
  );
};
