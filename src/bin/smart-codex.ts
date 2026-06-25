#!/usr/bin/env node
import { runWrapper } from "../wrapper.js";

process.exitCode = await runWrapper("codex", process.argv.slice(2));
