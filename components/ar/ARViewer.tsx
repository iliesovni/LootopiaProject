import * as THREE from "three";
import { App, GpsReceivedEvent } from "locar";
import { useEffect } from "react";

interface ARViewProps {
  huntId: string;
}

interface Step {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  orderIndex: number;
  pointsReward: number;
  arMarkerType: string;
  arAssetUrl: string;
  huntId: string;
}

interface StepsResponse {
  success: boolean;
  message: string;
  data: Step[];
}

const ARView = ({ huntId }: ARViewProps) => {
  useEffect(() => {
    const app = new App({
      cameraOptions: { hFov: 80, near: 0.001, far: 1000 },
    });

    const initLocar = async () => {
      try {
        const stepResponse = await fetch(`/api/hunts/${huntId}/listSteps`);
        const response: StepsResponse = await stepResponse.json();
        const stepData = response.data; // Access the `data` array

        const locar = await app.start();

        locar.on("gpserror", (error: GeolocationPositionError) => {
          alert(`GPS error: ${error.code}`);
        });

        let firstLocation = true;

        locar.on("gpsupdate", async (ev: GpsReceivedEvent) => {
          if (stepData && firstLocation) {
            const geom = new THREE.BoxGeometry(10, 10, 10);
            const mesh = new THREE.Mesh(
              geom,
              new THREE.MeshBasicMaterial({ color: "0xff0000" }),
            );
            for (const step of stepData) {
              locar.add(mesh, step.longitude, step.latitude);
            }
            firstLocation = false;
          }
        });

        locar.startGps();
      } catch (e: any) {
        alert(`${e.code} ${e.message}`);
      }
    };

    initLocar();
  }, [huntId]);

  return <></>;
};

export default ARView;
