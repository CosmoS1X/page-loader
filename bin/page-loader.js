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

  switch (name) {
    case 'NetworkError':
      console.error('Error Code: 1');
      return process.exit(1);
    case 'FileSystemError':
      console.error('Error Code: 2');
      return process.exit(2);
    default:
      console.error('Error code 3');
      return process.exit(3);
  }
};

app(url, output)
  .then((htmlPath) => {
    console.log(`Page was successfully downloaded into ${htmlPath}`);
  })
  .catch((error) => catchError(error));
