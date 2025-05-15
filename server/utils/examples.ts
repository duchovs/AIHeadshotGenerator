import { storage } from "../storage";
import fs from "fs";
import readline from "readline";

export const addExampleHeadshots = async (id: number) => {
  const headshot = await storage.getHeadshot(id);
  if (!headshot) {
    throw new Error("Headshot not found");
  }
  // copy file to client/public/examples
  const filePath = headshot.filePath!;
  const fileName = filePath.split("/").pop()!;
  const file = fs.readFileSync(filePath);
  fs.writeFileSync(`/home/duchovs/code/AIHeadshotgenerator/client/public/examples/${fileName}`, file);
  return storage.createExampleHeadshot({
    ...headshot,
    filePath: `/home/duchovs/code/AIHeadshotgenerator/client/public/examples/${fileName}`,
    imageUrl: `/examples/${fileName}`,
  });
};

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask() {
  rl.question("Enter a headshot id (0 to exit): ", async (answer) => {
    const i = Number(answer);
    if (i === 0) {
      rl.close();
      return;
    }
    try {
      await addExampleHeadshots(i);
      console.log("Example headshots added");
    } catch (error) {
      console.error("Error adding example headshots", error);
    }
    ask(); // Ask again
  });
}

ask();