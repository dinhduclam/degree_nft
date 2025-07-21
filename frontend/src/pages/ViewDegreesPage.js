import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button } from '@mui/material';

function ViewDegreesPage({ contract }) {
  const [allDegrees, setAllDegrees] = useState([]);
  const [loadingDegrees, setLoadingDegrees] = useState(false);
  const [revoking, setRevoking] = useState({});

  useEffect(() => {
    if (contract) {
      fetchAllDegrees();
    }
    // eslint-disable-next-line
  }, [contract]);

  const fetchAllDegrees = async () => {
    setLoadingDegrees(true);
    try {
      const total = await contract.totalSupply();
      const degrees = [];
      for (let i = 0; i < total; i++) {
        const tokenId = await contract.tokenByIndex(i);
        const cert = await contract.getCertificate(tokenId);
        const tokenURI = await contract.tokenURI(tokenId);
        const owner = await contract.ownerOf(tokenId);
        degrees.push({ tokenId: tokenId.toString(), ...cert, tokenURI, owner });
      }
      setAllDegrees(degrees);
    } catch (err) {
      setAllDegrees([]);
    }
    setLoadingDegrees(false);
  };

  const handleRevoke = async (tokenId) => {
    setRevoking(prev => ({ ...prev, [tokenId]: true }));
    try {
      const tx = await contract.revokeCertificate(tokenId);
      await tx.wait();
      fetchAllDegrees();
    } catch (err) {
      alert('Failed to revoke: ' + (err?.reason || err?.message || err));
    }
    setRevoking(prev => ({ ...prev, [tokenId]: false }));
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h5" gutterBottom>All Issued Degrees</Typography>
      {loadingDegrees ? <CircularProgress /> : (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Token ID</TableCell>
                <TableCell>Student Name</TableCell>
                <TableCell>Certificate Name</TableCell>
                <TableCell>Issue Date</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell>File</TableCell>
                <TableCell>Metadata</TableCell>
                {contract && <TableCell>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {allDegrees.map(degree => (
                <TableRow key={degree.tokenId}>
                  <TableCell>{degree.tokenId}</TableCell>
                  <TableCell>{degree.studentName}</TableCell>
                  <TableCell>{degree.certificateName}</TableCell>
                  <TableCell>{degree.issueDate}</TableCell>
                  <TableCell sx={{ maxWidth: 120, wordBreak: 'break-all' }}>{degree.owner}</TableCell>
                  <TableCell><a href={degree.ipfsLink} target="_blank" rel="noopener noreferrer">View</a></TableCell>
                  <TableCell><a href={degree.tokenURI} target="_blank" rel="noopener noreferrer">View</a></TableCell>
                  {contract && (
                    <TableCell>
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        disabled={!!revoking[degree.tokenId]}
                        onClick={() => handleRevoke(degree.tokenId)}
                      >
                        {revoking[degree.tokenId] ? 'Revoking...' : 'Revoke'}
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

export default ViewDegreesPage; 