class Webmcpreg < Formula
  desc "CLI tool for validating and publishing WebMCP manifests"
  homepage "https://webmcpregistry.org/cli"
  url "https://registry.npmjs.org/webmcpreg/-/webmcpreg-0.1.2.tgz"
  sha256 "2df8fa524470a4083061092a4e483d138f39add67b74ff1a3ad86c53e78204ae"
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
