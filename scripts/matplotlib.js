const { spawn } = require('child_process');
const path      = require("path");
const python    = spawn('python', ['pyscripts/plot.py', JSON.stringify({title: "title", x: [0, 1, 2], y: [5, 6, 3]})]);
python.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

python.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

python.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});

