# webmcpreg

CLI tool for validating and publishing [WebMCP](https://webmcpregistry.org) manifests to the Web MCP Registry.

## Install

Run commands directly with `npx` — no install needed:

```bash
npx webmcpreg --help
```

Or install globally:

```bash
npm install -g webmcpreg
```

On macOS/Linux with Homebrew:

```bash
brew tap nichochar/toolindex https://github.com/nichochar/toolindex
brew install webmcpreg
```

## Usage

### Validate a manifest

Validate a local file or a remote URL. Defaults to `.well-known/webmcp.json` in the current directory.

```bash
# Validate a local file
webmcpreg validate .well-known/webmcp.json

# Validate from a URL
webmcpreg validate https://example.com/.well-known/webmcp.json

# Default: validates .well-known/webmcp.json in cwd
webmcpreg validate
```

Exit code 0 on success, 1 on failure — CI-friendly.

### Publish to registry

Submit your origin to the Web MCP Registry. The registry will fetch and validate your manifest automatically.

```bash
webmcpreg publish https://example.com
```

### Check status

Check whether an origin is registered and its current verification status.

```bash
webmcpreg check https://example.com
```

## CI Integration

Add manifest validation to your CI pipeline:

```yaml
# GitHub Actions example
- name: Validate WebMCP manifest
  run: npx webmcpreg validate .well-known/webmcp.json
```

The CLI returns a non-zero exit code on validation failure, so your pipeline will fail if the manifest is invalid.

## Links

- [Web MCP Registry](https://webmcpregistry.org)
- [CLI docs](https://webmcpregistry.org/cli)

## License

MIT
