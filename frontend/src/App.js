import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import Web3Modal from 'web3modal';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import CertificateNFTData from './contracts/CertificateNFT.json';
import AdminPage from './pages/AdminPage';
import StudentPage from './pages/StudentPage';
import EmployerPage from './pages/EmployerPage';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const ADMIN_ROLE = 'admin';
const STUDENT_ROLE = 'student';
const EMPLOYER_ROLE = 'employer';

async function fetchStudentInfo(address) {
  const res = await fetch(`http://localhost:5002/students?search=${address}`);
  if (!res.ok) return null;
  const data = await res.json();
  return Array.isArray(data) ? data.find(s => s.StudentAddress?.toLowerCase() === address.toLowerCase()) : null;
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#aa261b',
    },
  },
});

function App() {
  const [signer, setSigner] = useState();
  const [address, setAddress] = useState('');
  const [role, setRole] = useState('');
  const [contract, setContract] = useState();
  const [checking, setChecking] = useState(false);
  const [studentInfo, setStudentInfo] = useState(null);

  // Connect wallet
  const connectWallet = async () => {
    const web3Modal = new Web3Modal();
    const instance = await web3Modal.connect();
    const prov = new ethers.providers.Web3Provider(instance);
    const signer = prov.getSigner();
    setSigner(signer);
    const addr = await signer.getAddress();
    setAddress(addr);
    // Set up contract
    const cert = new ethers.Contract(
      CertificateNFTData.address,
      CertificateNFTData.abi,
      signer
    );
    setContract(cert);
    // Check admin role
    const admin = await cert.isAdmin(addr);
    if (admin) {
      setRole(ADMIN_ROLE);
      setStudentInfo(null);
    } else {
      setChecking(true);
      // Check if address exists in students table
      const info = await fetchStudentInfo(addr);
      setRole(info ? STUDENT_ROLE : EMPLOYER_ROLE);
      setStudentInfo(info || null);
      setChecking(false);
    }
  };

  useEffect(() => {
    // Auto-connect if already authorized
    if (window.ethereum && window.ethereum.selectedAddress && !address) {
      connectWallet();
    }
    // eslint-disable-next-line
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: 4, bgcolor: '#f7fafd', minHeight: '100vh' }}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Grid item>
            <Typography variant="h4" fontWeight={700} color="primary.main" gutterBottom>
              NFT Certificate System
            </Typography>
          </Grid>
          <Grid item>
            {!address ? (
              <Button variant="contained" onClick={connectWallet} size="large">
                Connect Wallet
              </Button>
            ) : (
              role === STUDENT_ROLE && studentInfo && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
                  <Typography variant="h5" fontWeight={700} color="primary.main">Student Profile</Typography>
                  <Typography variant="body1" fontWeight={600}>Name: <span style={{ fontWeight: 400 }}>{studentInfo.StudentName}</span></Typography>
                  <Typography variant="body1" fontWeight={600}>Email: <span style={{ fontWeight: 400 }}>{studentInfo.Email || 'N/A'}</span></Typography>
                  <Typography variant="body1" fontWeight={600}>Phone: <span style={{ fontWeight: 400 }}>{studentInfo.Phone || 'N/A'}</span></Typography>
                </Box>
              )
            )}
          </Grid>
        </Grid>
        {checking && <Typography>Checking role...</Typography>}
        {role === ADMIN_ROLE && contract && signer && <AdminPage contract={contract} signer={signer} />}
        {role === STUDENT_ROLE && contract && address && <StudentPage contract={contract} address={address} />}
        {role === EMPLOYER_ROLE && contract && <EmployerPage contract={contract} />}
      </Box>
    </ThemeProvider>
  );
}

export default App;
