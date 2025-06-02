import { storage } from "../storage";
import fs from "fs";
import readline from "readline";
import { env } from "../env";

// npx tsx server/utils/examples.ts

export const addExampleHeadshots = async (id: number) => {
  const headshot = await storage.getHeadshot(id);
  if (!headshot) {
    throw new Error("Headshot not found");
  }
  // copy file to client/public/examples
  const filePath = headshot.filePath!;
  const fileName = filePath.split("/").pop()!;
  const file = fs.readFileSync(filePath);
  fs.writeFileSync(`${env.BASE_PATH}/client/public/examples/${fileName}`, file);
  return storage.createExampleHeadshot({
    ...headshot,
    filePath: `${env.BASE_PATH}/client/public/examples/${fileName}`,
    imageUrl: `/examples/${fileName}`,
    gender: headshot.gender,
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