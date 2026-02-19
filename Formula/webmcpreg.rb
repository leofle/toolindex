class Webmcpreg < Formula
  desc "CLI tool for validating and publishing WebMCP manifests"
  homepage "https://webmcpregistry.org/cli"
  url "https://registry.npmjs.org/webmcpreg/-/webmcpreg-0.1.1.tgz"
  sha256 "ef9ddce8a30deee1072a5fe2921cc2e31308728546ba66a3c8dac6308ec680fb"
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
