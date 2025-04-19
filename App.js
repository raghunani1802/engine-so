
import { useState, useEffect, useRef } from "react";
import { Button } from "@shadcn/ui";
import { Input } from "@shadcn/ui/input";
import { Card, CardContent } from "@shadcn/ui/card";
import { motion } from "framer-motion";

export default function ExhaustSoundSimulator() {
  const [engineConfig, setEngineConfig] = useState("Inline");
  const [pistons, setPistons] = useState([]);
  const [crankAngleInput, setCrankAngleInput] = useState(0);
  const [rpm, setRpm] = useState(1000);
  const [currentRpm, setCurrentRpm] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const rpmRef = useRef(rpm);
  const popAudio = useRef(null);

  useEffect(() => {
    rpmRef.current = rpm;
  }, [rpm]);

  useEffect(() => {
    popAudio.current = new Audio("/pop.mp3");
  }, []);

  useEffect(() => {
    let soundInterval;
    if (isRunning) {
      soundInterval = setInterval(() => {
        pistons.forEach((piston) => {
          if (shouldFire(currentRpm, piston.crankAngle)) {
            playPopSound();
          }
        });
      }, calculateInterval(currentRpm));
    }
    return () => clearInterval(soundInterval);
  }, [isRunning, currentRpm, pistons]);

  function shouldFire(rpm, crankAngle) {
    const rotationTime = 60000 / (rpm * 2); // Two rotations per cycle
    return Math.random() < 1 / (rotationTime / 10); // Simulate firing roughly
  }

  function playPopSound() {
    if (popAudio.current) {
      popAudio.current.currentTime = 0;
      popAudio.current.play().catch((err) => {
        console.log("Audio playback prevented:", err);
      });
    }
  }

  function calculateInterval(rpm) {
    return Math.max(30, 60000 / (rpm * 2));
  }

  const handleAddPiston = () => {
    setPistons([...pistons, { crankAngle: parseInt(crankAngleInput) }]);
    setCrankAngleInput(0);
  };

  const handleStart = () => {
    setIsRunning(true);
    setCurrentRpm(rpm);
  };

  const handleStop = () => {
    setIsRunning(false);
    setCurrentRpm(0);
  };

  const handleAcceleration = () => {
    const accelInterval = setInterval(() => {
      setCurrentRpm((prev) => prev + 50);
    }, 100);
    const handleRelease = () => {
      clearInterval(accelInterval);
      let decel = setInterval(() => {
        setCurrentRpm((prev) => {
          const newRpm = prev - 250;
          if (newRpm <= rpmRef.current) {
            clearInterval(decel);
            return rpmRef.current;
          }
          return newRpm;
        });
      }, 200);
      window.removeEventListener("mouseup", handleRelease);
    };
    window.addEventListener("mouseup", handleRelease);
  };

  return (
    <div className="p-8 space-y-6">
      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <label>Engine Configuration:</label>
            <select
              value={engineConfig}
              onChange={(e) => setEngineConfig(e.target.value)}
              className="border p-2 rounded"
            >
              <option value="Inline">Inline</option>
              <option value="V">V</option>
              <option value="W">W</option>
              <option value="Boxer">Boxer</option>
            </select>
          </div>

          <div className="flex items-center space-x-4">
            <Input
              type="number"
              placeholder="Crank Angle"
              value={crankAngleInput}
              onChange={(e) => setCrankAngleInput(e.target.value)}
            />
            <Button onClick={handleAddPiston}>Add Piston</Button>
          </div>

          <div>
            <h2 className="font-semibold">Pistons:</h2>
            <ul className="list-disc ml-4">
              {pistons.map((piston, index) => (
                <li key={index}>Piston {index + 1} - Crank Angle: {piston.crankAngle}°</li>
              ))}
            </ul>
          </div>

          <div className="flex items-center space-x-4">
            <Input
              type="number"
              value={rpm}
              onChange={(e) => setRpm(parseInt(e.target.value))}
              placeholder="RPM"
            />
            <Button onClick={handleStart}>Start</Button>
            <Button onClick={handleStop} variant="destructive">Stop</Button>
          </div>

          <Button
            onMouseDown={handleAcceleration}
            className="bg-yellow-500 hover:bg-yellow-600"
          >
            Acceleration Mode
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h2 className="font-bold text-lg mb-2">Engine Animation (Wireframe)</h2>
          <motion.div
            className="border border-dashed p-6 rounded-xl flex justify-around"
            animate={{ rotate: isRunning ? 360 : 0 }}
            transition={{ repeat: Infinity, duration: 60 / currentRpm || 10, ease: "linear" }}
          >
            {pistons.map((_, index) => (
              <motion.div
                key={index}
                className="w-8 h-8 border border-white rounded-full"
                animate={{ y: isRunning ? [0, -20, 0] : 0 }}
                transition={{ repeat: Infinity, duration: 60 / currentRpm || 10, ease: "linear" }}
              />
            ))}
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
}
