import * as THREE from "three";
import { App, GpsReceivedEvent } from "locar";
import { useEffect, useState } from "react";

interface ARViewProps {
  participationId: string;
}

interface Participation {
  data: {
    currentStep: {
      stepId: string;
    };
  };
}

interface Step {
  data: {
    longitude: number;
    latitude: number;
    id: string;
    nextStepId?: string; // Add nextStepId to the Step interface
  };
}

const ARView = ({ participationId }: ARViewProps) => {
  const radiusToLocationMeter = 10;
  const [participation, setParticipation] = useState<Participation | null>(
    null,
  );
  const [currentStep, setCurrentStep] = useState<Step | null>(null);
  const [stepCompleted, setStepCompleted] = useState(false);
  const [isInsideRadius, setIsInsideRadius] = useState(false);

  useEffect(() => {
    const app = new App({
      cameraOptions: { hFov: 80, near: 0.001, far: 1000 },
    });

    const initLocar = async () => {
      try {
        // Fetch participation first
        const participationResponse = await fetch(
          `/api/participations/${participationId}`,
        );
        const participationData: Participation =
          await participationResponse.json();
        setParticipation(participationData);

        // Fetch current step using the stepId from participation
        const stepId = participationData.data.currentStep.stepId;
        const stepResponse = await fetch(`/api/steps/${stepId}`);
        const stepData: Step = await stepResponse.json();
        setCurrentStep(stepData);

        // Initialize Locar only after both fetches are done
        const locar = await app.start();

        locar.on("gpserror", (error: GeolocationPositionError) => {
          alert(`GPS error: ${error.code}`);
        });

        let firstLocation = true;

        locar.on("gpsupdate", async (ev: GpsReceivedEvent) => {
          if (!currentStep) return; // Skip if currentStep is not loaded yet

          // Add the 3D object on first GPS update
          if (participation && currentStep && firstLocation) {
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

          // Check if the user is within the radius
          const withinRadius =
            Math.abs(ev.position.coords.latitude - currentStep.data.latitude) <
              radiusToLocationMeter / 111320 && // Convert meters to degrees (approx)
            Math.abs(
              ev.position.coords.longitude - currentStep.data.longitude,
            ) <
              radiusToLocationMeter /
                (111320 *
                  Math.cos(currentStep.data.latitude * (Math.PI / 180))); // Adjust for longitude

          // If the user was outside and is now inside, complete the step
          if (!isInsideRadius && withinRadius && !stepCompleted) {
            // Mark the current step as completed
            await fetch(
              `/api/participation/${participationId}/complete-steps`,
              {
                method: "POST",
                body: JSON.stringify({ stepId: currentStep.data.id }),
              },
            );

            // Fetch the next step if available
            if (currentStep.data.nextStepId) {
              const nextStepResponse = await fetch(
                `/api/steps/${currentStep.data.nextStepId}`,
              );
              const nextStepData: Step = await nextStepResponse.json();
              setCurrentStep(nextStepData);
              setStepCompleted(false);
              setIsInsideRadius(false);
              firstLocation = true; // Reset for the new step
            } else {
              setStepCompleted(true); // No more steps
            }
          }

          // Update the radius state
          setIsInsideRadius(withinRadius);
        });

        locar.startGps();
      } catch (e: any) {
        alert(`${e.code} ${e.message}`);
      }
    };

    initLocar();
  }, [participationId]);

  return <></>;
};

export default ARView;
