#!/usr/bin/env node
import { program } from 'commander';
import axios from 'axios';
import app from '../src/index.js';

program
  .version('1.0.0')
  .description('Page loader utility')
  .argument('<url>')
  .option('-o, --output <dir>', 'output dir', `${process.cwd()}`)
  .parse();

const [url] = program.args;
const { output } = program.opts();

app(url, output)
  .then((htmlPath) => {
    console.log(`Page was successfully downloaded into ${htmlPath}`);
  })
  .catch((error) => {
    if (axios.isAxiosError(error)) {
      console.error(`${error.code}: ${error.message}, fetch ${error.config.url}`);
      console.error('Error code: 1');
      process.exit(1);
    }

    console.error(error.message);
    console.error('Error code: 2');
    process.exit(2);
  });
