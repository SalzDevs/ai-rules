#!/usr/bin/env node
import { runWrapper } from "../wrapper.js";

process.exitCode = await runWrapper("pi", process.argv.slice(2));
