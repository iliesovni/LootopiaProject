import * as THREE from "three";
import { App, GpsReceivedEvent } from "locar";
import { useEffect } from "react";

const ARView = () => {
  useEffect(() => {
    const initLocar = async () => {
      const app = new App({
        cameraOptions: { hFov: 80, near: 0.001, far: 1000 },
      });

      try {
        let firstLocation = true;
        const locar = await app.start();
        locar.on("gpserror", (error: GeolocationPositionError) => {
          alert(`GPS error: ${error.code}`);
        });

        locar.on("gpsupdate", (ev: GpsReceivedEvent) => {
          if (firstLocation) {
            alert(
              `Got the initial location: longitude ${ev.position.coords.longitude}, latitude ${ev.position.coords.latitude}`,
            );

            const boxProps = [
              {
                latDis: 0.0005,
                lonDis: 0,
                colour: 0xff0000,
              },
              {
                latDis: -0.0005,
                lonDis: 0,
                colour: 0xffff00,
              },
              {
                latDis: 0,
                lonDis: -0.0005,
                colour: 0x00ffff,
              },
              {
                latDis: 0,
                lonDis: 0.0005,
                colour: 0x00ff00,
              },
            ];

            const geom = new THREE.BoxGeometry(10, 10, 10);

            for (const boxProp of boxProps) {
              const mesh = new THREE.Mesh(
                geom,
                new THREE.MeshBasicMaterial({ color: boxProp.colour }),
              );

              locar.add(
                mesh,
                ev.position.coords.longitude + boxProp.lonDis,
                ev.position.coords.latitude + boxProp.latDis,
              );
            }

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
  });
  return <></>;
};
export default ARView;
