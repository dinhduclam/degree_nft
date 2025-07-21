// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract CertificateNFT is ERC721URIStorage, ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    struct CertificateMetadata {
        string studentName;
        string certificateName;
        string issueDate;
        string ipfsLink;
        string extraData;
    }

    mapping(uint256 => CertificateMetadata) public certificateData;
    mapping(address => bool) public admins;

    event AdminAdded(address indexed newAdmin);
    event AdminRemoved(address indexed removedAdmin);
    event CertificateMinted(uint256 indexed tokenId, address indexed to);
    event CertificateRevoked(uint256 indexed tokenId, address indexed revokedFrom);

    modifier onlyAdmin() {
        require(admins[msg.sender] || msg.sender == owner(), "Not admin");
        _;
    }

    constructor() ERC721("CertificateNFT", "CERT") {
        admins[msg.sender] = true;
    }

    function addAdmin(address newAdmin) external onlyOwner {
        admins[newAdmin] = true;
        emit AdminAdded(newAdmin);
    }

    function removeAdmin(address admin) external onlyOwner {
        require(admin != owner(), "Cannot remove owner");
        admins[admin] = false;
        emit AdminRemoved(admin);
    }

    function mintCertificate(
        address to,
        string memory studentName,
        string memory certificateName,
        string memory issueDate,
        string memory ipfsLink,
        string memory extraData,
        string memory tokenUri_
    ) public onlyAdmin returns (uint256) {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        _mint(to, newTokenId);
        _setTokenURI(newTokenId, tokenUri_);
        certificateData[newTokenId] = CertificateMetadata(
            studentName,
            certificateName,
            issueDate,
            ipfsLink,
            extraData
        );
        emit CertificateMinted(newTokenId, to);
        return newTokenId;
    }

    function getCertificate(uint256 tokenId) public view returns (CertificateMetadata memory) {
        require(_exists(tokenId), "Token does not exist");
        return certificateData[tokenId];
    }

    function isAdmin(address user) public view returns (bool) {
        return admins[user] || user == owner();
    }

    function revokeCertificate(uint256 tokenId) public onlyAdmin {
        address owner = ownerOf(tokenId);
        _burn(tokenId);
        emit CertificateRevoked(tokenId, owner);
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
}