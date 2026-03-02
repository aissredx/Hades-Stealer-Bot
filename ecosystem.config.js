module.exports = {
  apps : [{
    name: "api",
    script: "src/index.ts",
    interpreter: "node",
    interpreter_args: "-r ts-node/register",
    env: {
      NODE_ENV: "development",
    }
  }]
}