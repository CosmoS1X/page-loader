#!/usr/bin/env node
import { program } from 'commander';
import app from '../src/index.js';

program
  .version('1.0.0')
  .description('Page loader utility')
  .argument('<url>')
  .option('-o, --output <dir>', 'output dir', `${process.cwd()}`)
  .parse();

const [url] = program.args;
const { output } = program.opts();

const catchError = ({ name, message }) => {
  console.error(message);

  if (name === 'NetworkError') {
    console.error('Error Code: 1');
    process.exit(1);
  }

  if (name === 'FileSystemError') {
    console.error('Error Code: 2');
    process.exit(2);
  }

  console.error('Error code 3');
  process.exit(3);
};

app(url, output)
  .then((htmlPath) => {
    console.log(`Page was successfully downloaded into ${htmlPath}`);
  })
  .catch((error) => catchError(error));
