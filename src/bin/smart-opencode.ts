#!/usr/bin/env node
import { runWrapper } from "../wrapper.js";

process.exitCode = await runWrapper("opencode", process.argv.slice(2));
