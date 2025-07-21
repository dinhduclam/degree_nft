import React, { useState } from 'react';
import { Box, Typography, TextField, Button, CircularProgress, Card, CardContent, Alert, Divider } from '@mui/material';

function EmployerPage({ contract }) {
  const [nftId, setNftId] = useState('');
  const [loading, setLoading] = useState(false);
  const [cert, setCert] = useState(null);
  const [tokenURI, setTokenURI] = useState('');
  const [error, setError] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setCert(null);
    setTokenURI('');
    setLoading(true);
    try {
      const certData = await contract.getCertificate(nftId);
      const uri = await contract.tokenURI(nftId);
      setCert(certData);
      setTokenURI(uri);
    } catch (err) {
      setError('Certificate not found or invalid NFT ID.');
    }
    setLoading(false);
  };

  return (
    <Box sx={{ maxWidth: 500, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" fontWeight={700} color="primary" gutterBottom>
        Verify Certificate
      </Typography>
      <form onSubmit={handleVerify} style={{ marginBottom: 24 }}>
        <TextField
          label="NFT ID"
          value={nftId}
          onChange={e => setNftId(e.target.value)}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Verify'}
        </Button>
      </form>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {cert && (
        <Card elevation={3} sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" color="primary" fontWeight={700} gutterBottom>Certificate Details</Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body1"><b>Student Name:</b> {cert.studentName}</Typography>
            <Typography variant="body1"><b>Certificate Name:</b> {cert.certificateName}</Typography>
            <Typography variant="body1"><b>Issue Date:</b> {cert.issueDate}</Typography>
            <Typography variant="body1"><b>Extra Data:</b> {cert.extraData}</Typography>
            <Typography variant="body1" sx={{ mt: 1 }}>
              <b>Certificate File:</b> <a href={cert.ipfsLink} target="_blank" rel="noopener noreferrer">View File</a>
            </Typography>
            <Typography variant="body1">
              <b>Metadata:</b> <a href={tokenURI} target="_blank" rel="noopener noreferrer">View Metadata</a>
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

export default EmployerPage;