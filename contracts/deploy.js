const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const CertificateNFT = await hre.ethers.getContractFactory("CertificateNFT");
  const contract = await CertificateNFT.deploy();
  console.log("CertificateNFT deployed to:", contract.target);

  // Save contract address and ABI for frontend
  const data = {
    address: contract.target,
    abi: JSON.parse(
      fs.readFileSync("./artifacts/contracts/CertificateNFT.sol/CertificateNFT.json", "utf8")
    ).abi,
  };
  fs.mkdirSync("./frontend/src/contracts", { recursive: true });
  fs.writeFileSync("./frontend/src/contracts/CertificateNFT.json", JSON.stringify(data, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});