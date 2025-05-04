module.exports = {
  apps: [{
    name: "aiheadshot",
    script: "npm",
    args: "run start",
    cwd: "/home/duchovs/code/AIHeadshotgenerator",
    env: {
      NODE_ENV: 'production',
    }
  }]
};
