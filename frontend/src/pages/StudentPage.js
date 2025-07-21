import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, CardActions, Button, CircularProgress, Dialog, DialogTitle, DialogContent, Grid, Avatar, Chip, Divider } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

function StudentPage({ contract, address }) {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (contract && address) {
      fetchCertificates();
    }
    // eslint-disable-next-line
  }, [contract, address]);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const balance = await contract.balanceOf(address);
      const certs = [];
      for (let i = 0; i < balance; i++) {
        const tokenId = await contract.tokenOfOwnerByIndex(address, i);
        const cert = await contract.getCertificate(tokenId);
        const tokenURI = await contract.tokenURI(tokenId);
        certs.push({ tokenId: tokenId.toString(), ...cert, tokenURI });
      }
      setCertificates(certs);
    } catch (err) {
      setCertificates([]);
    }
    setLoading(false);
  };

  const handleView = (cert) => {
    setSelectedCert(cert);
    setOpen(true);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom fontWeight={700} color="primary">
        My Certificates
      </Typography>
      <Divider sx={{ mb: 3 }} />
      {loading ? <CircularProgress /> : (
        certificates.length === 0 ? (
          <Typography>No certificates found.</Typography>
        ) : (
          <Grid container spacing={3}>
            {certificates.map(cert => (
              <Grid item xs={12} sm={6} md={4} key={cert.tokenId}>
                <Card elevation={4} sx={{ borderRadius: 3, p: 2, minHeight: 260 }}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <SchoolIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight={600}>{cert.certificateName}</Typography>
                      <Chip label={`Token #${cert.tokenId}`} size="small" color="secondary" sx={{ mt: 0.5 }} />
                    </Box>
                  </Box>
                  <CardContent sx={{ pt: 0 }}>
                    <Typography variant="body2" color="text.secondary">Student: {cert.studentName}</Typography>
                    <Typography variant="body2" color="text.secondary">Issue Date: {cert.issueDate}</Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>IPFS: <a href={cert.ipfsLink} target="_blank" rel="noopener noreferrer">View File</a></Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'flex-end' }}>
                    <Button size="small" variant="outlined" endIcon={<InsertDriveFileIcon />} onClick={() => handleView(cert)}>
                      Details
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )
      )}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Certificate Details</DialogTitle>
        <DialogContent>
          {selectedCert && (
            <Box>
              <Typography variant="h6" fontWeight={600} color="primary">{selectedCert.certificateName}</Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body1"><b>Student:</b> {selectedCert.studentName}</Typography>
              <Typography variant="body1"><b>Issue Date:</b> {selectedCert.issueDate}</Typography>
              <Typography variant="body1"><b>Token ID:</b> {selectedCert.tokenId}</Typography>
              <Typography variant="body1"><b>Extra Data:</b> {selectedCert.extraData}</Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                <b>IPFS File:</b> <a href={selectedCert.ipfsLink} target="_blank" rel="noopener noreferrer">View File</a>
              </Typography>
              <Typography variant="body1">
                <b>Metadata:</b> <a href={selectedCert.tokenURI} target="_blank" rel="noopener noreferrer">View Metadata</a>
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default StudentPage; 