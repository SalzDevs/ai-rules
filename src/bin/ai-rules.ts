#!/usr/bin/env node
import { runAiRulesCli } from "../cli.js";

process.exitCode = await runAiRulesCli(process.argv.slice(2));
