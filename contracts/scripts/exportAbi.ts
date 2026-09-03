import * as fs from "fs";
import * as path from "path";

const ARTIFACTS_ROOT = path.join(__dirname, "..", "artifacts", "contracts");
const OUT_DIR = path.join(__dirname, "..", "abi");

const CONTRACTS: { artifactPath: string; outName: string }[] = [
  { artifactPath: "PolicyRegistry.sol/PolicyRegistry.json", outName: "PolicyRegistry.json" },
  { artifactPath: "SafeRootPolicyExecutor.sol/SafeRootPolicyExecutor.json", outName: "SafeRootPolicyExecutor.json" },
  { artifactPath: "mocks/MockUSDC.sol/MockUSDC.json", outName: "MockUSDC.json" },
  { artifactPath: "mocks/LendingPoolMock.sol/LendingPoolMock.json", outName: "LendingPoolMock.json" },
  {
    artifactPath: "interfaces/IAttestcoinVerifier.sol/IAttestcoinVerifier.json",
    outName: "IAttestcoinVerifier.json"
  },
  {
    artifactPath: "verifiers/AttestcoinVerifierAdapter.sol/AttestcoinVerifierAdapter.json",
    outName: "AttestcoinVerifierAdapter.json"
  }
];

function main(): void {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const entry of CONTRACTS) {
    const artifactFile = path.join(ARTIFACTS_ROOT, entry.artifactPath);
    if (!fs.existsSync(artifactFile)) {
      throw new Error(`Missing artifact ${artifactFile}. Run "npm run compile" first.`);
    }
    const artifact = JSON.parse(fs.readFileSync(artifactFile, "utf8"));
    const outFile = path.join(OUT_DIR, entry.outName);
    fs.writeFileSync(outFile, `${JSON.stringify(artifact.abi, null, 2)}\n`);
    console.log(`Wrote ${outFile}`);
  }
}

main();
