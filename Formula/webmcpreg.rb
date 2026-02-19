class Webmcpreg < Formula
  desc "CLI tool for validating and publishing WebMCP manifests"
  homepage "https://webmcp.org/cli"
  url "https://registry.npmjs.org/webmcpreg/-/webmcpreg-0.1.0.tgz"
  sha256 ""
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    assert_match "webmcpreg v#{version}", shell_output("#{bin}/webmcpreg --version")
  end
end
