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
    console.log(`webmcpreg v${VERSION}`);
    break;
  case "--help":
  case "-h":
  case undefined:
    console.log(`
webmcpreg — CLI for the Web MCP Registry

Usage:
  webmcpreg validate [path|url]   Validate a webmcp.json manifest
  webmcpreg publish <origin>      Submit an origin to the registry
  webmcpreg check <origin>        Check an origin's registry status

Options:
  -v, --version                   Show version
  -h, --help                      Show this help

Examples:
  webmcpreg validate .well-known/webmcp.json
  webmcpreg validate https://example.com/.well-known/webmcp.json
  webmcpreg publish https://example.com
  webmcpreg check https://example.com
`.trim());
    break;
  default:
    console.error(`Unknown command: ${command}`);
    console.error("Run 'webmcpreg --help' for usage.");
    process.exit(1);
}
