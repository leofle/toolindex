#!/usr/bin/env node

import { validate } from "./commands/validate";
import { publish } from "./commands/publish";
import { check } from "./commands/check";

const VERSION = "0.1.0";

const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
  case "validate":
    validate(arg);
    break;
  case "publish":
    publish(arg);
    break;
  case "check":
    check(arg);
    break;
  case "--version":
  case "-v":
    console.log(`webmcp v${VERSION}`);
    break;
  case "--help":
  case "-h":
  case undefined:
    console.log(`
webmcp — CLI for the Web MCP Registry

Usage:
  webmcp validate [path|url]   Validate a webmcp.json manifest
  webmcp publish <origin>      Submit an origin to the registry
  webmcp check <origin>        Check an origin's registry status

Options:
  -v, --version                Show version
  -h, --help                   Show this help

Examples:
  webmcp validate .well-known/webmcp.json
  webmcp validate https://example.com/.well-known/webmcp.json
  webmcp publish https://example.com
  webmcp check https://example.com
`.trim());
    break;
  default:
    console.error(`Unknown command: ${command}`);
    console.error("Run 'webmcp --help' for usage.");
    process.exit(1);
}
