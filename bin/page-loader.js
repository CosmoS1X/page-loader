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

app(url, output);
