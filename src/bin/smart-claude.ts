#!/usr/bin/env node
import { runWrapper } from "../wrapper.js";

process.exitCode = await runWrapper("claude", process.argv.slice(2));
