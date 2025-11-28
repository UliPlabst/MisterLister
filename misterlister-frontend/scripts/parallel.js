const { spawn } = require("child_process");

const scripts = process.argv.slice(2);

if (scripts.length === 0) {
  console.error("Usage: node parallel.js <script1> <script2> [...]");
  process.exit(1);
}

function run(script) {
  const proc = spawn("npm", ["run", script], {
    stdio: "inherit",
    shell: true
  });

  proc.on("exit", code => {
    console.log(`[${script}] exited with code ${code}`);
  });

  return proc;
}

scripts.forEach(run);