import * as THREE from "three";
import { App, GpsReceivedEvent } from "locar";
import { useEffect } from "react";
interface ARViewProps {
  participationId: string;
}
const ARView = ({ participationId }: ARViewProps) => {
  useEffect(() => {
    const initLocar = async () => {
      const app = new App({
        cameraOptions: { hFov: 80, near: 0.001, far: 1000 },
      });
      const participation = await (
        await fetch(`/api/participations/${participationId}`)
      ).json();
      const currentStep = await (
        await fetch(`/api/steps/${participation.data.currentStep.stepId}`)
      ).json();
      try {
        let firstLocation = true;
        const locar = await app.start();
        locar.on("gpserror", (error: GeolocationPositionError) => {
          alert(`GPS error: ${error.code}`);
        });

        locar.on("gpsupdate", (ev: GpsReceivedEvent) => {
          if (firstLocation) {
            const geom = new THREE.BoxGeometry(10, 10, 10);
            const mesh = new THREE.Mesh(
              geom,
              new THREE.MeshBasicMaterial({ color: "0xff0000" }),
            );
            locar.add(
              mesh,
              currentStep.data.longitude,
              currentStep.data.latitude,
            );

            firstLocation = false;
          }
        });

        locar.startGps();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        alert(`${e.code} ${e.message}`);
      }
    };
    initLocar();
  }, [participationId]);
  return <></>;
};
export default ARView;
