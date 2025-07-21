import React, { useState, useEffect } from 'react';
import { Button, TextField, Box, Typography, MenuItem, CircularProgress, Alert, Autocomplete, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { getStudents, searchStudents, addStudent } from '../utils/api';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

const CERTIFICATE_NAMES = [
  'Bachelor of Science',
  'Master of Science',
  'Doctor of Philosophy',
  'Diploma',
  'Certificate of Completion',
];

function CreateDegreePage({ contract, signer }) {
  // State for create degree
  const [certificateName, setCertificateName] = useState(CERTIFICATE_NAMES[0]);
  const [issueDate, setIssueDate] = useState('');
  const [extraData, setExtraData] = useState('');
  const [file, setFile] = useState();
  const [ipfsLink, setIpfsLink] = useState('');
  const [minting, setMinting] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  // Student selection
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loadingStudents, setLoadingStudents] = useState(false);
  // Add student dialog
  const [addStudentDialog, setAddStudentDialog] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentAddress, setNewStudentAddress] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('');

  // Batch minting state
  const [batchRows, setBatchRows] = useState([]);
  const [batchError, setBatchError] = useState('');
  const [batchMinting, setBatchMinting] = useState(false);
  const [batchStatus, setBatchStatus] = useState('');

  // Load students on component mount
  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setLoadingStudents(true);
    try {
      const data = await getStudents();
      setStudents(data);
    } catch (err) {
      setError('Failed to load students: ' + err.message);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleSearchStudents = async (searchValue) => {
    if (searchValue.length >= 2) {
      setLoadingStudents(true);
      try {
        const data = await searchStudents(searchValue);
        setStudents(data);
      } catch (err) {
        setError('Failed to search students: ' + err.message);
      } finally {
        setLoadingStudents(false);
      }
    } else if (searchValue.length === 0) {
      loadStudents();
    }
  };

  const handleAddStudent = async () => {
    try {
      await addStudent(newStudentName, newStudentAddress, newStudentEmail, newStudentPhone);
      setAddStudentDialog(false);
      setNewStudentName('');
      setNewStudentAddress('');
      setNewStudentEmail('');
      setNewStudentPhone('');
      loadStudents(); // Reload students list
      setStatus('Student added successfully!');
    } catch (err) {
      setError('Failed to add student: ' + err.message);
    }
  };

  // Upload file to local IPFS
  const uploadToIPFS = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('http://localhost:5001/api/v0/add', {
        method: 'POST',
        body: formData,
      });
      const text = await res.text();
      const hash = text.match(/"Hash":"([^"]+)"/);
      if (hash && hash[1]) {
        return `http://localhost:8080/ipfs/${hash[1]}`;
      }
      throw new Error('IPFS upload failed');
    } catch (err) {
      setError('IPFS upload failed: ' + err.message);
      return '';
    }
  };

  // Mint certificate NFT
  const handleMint = async (e) => {
    e.preventDefault();
    if (!selectedStudent) {
      setError('Please select a student');
      return;
    }
    setError('');
    setStatus('');
    setMinting(true);
    let ipfsUrl = ipfsLink;
    if (file && !ipfsLink) {
      ipfsUrl = await uploadToIPFS(file);
      setIpfsLink(ipfsUrl);
    }
    if (!ipfsUrl) {
      setError('IPFS upload failed or file missing');
      setMinting(false);
      return;
    }
    try {
      // Compose metadata JSON and upload to IPFS
      const metadata = {
        studentName: selectedStudent.StudentName,
        certificateName,
        issueDate,
        ipfsLink: ipfsUrl,
        extraData,
      };
      const formData = new FormData();
      formData.append(
        'file',
        new Blob([JSON.stringify(metadata)], { type: 'application/json' }),
        'metadata.json'
      );
      const metaRes = await fetch('http://localhost:5001/api/v0/add', {
        method: 'POST',
        body: formData,
      });
      const metaText = await metaRes.text();
      const metaHash = metaText.match(/"Hash":"([^"]+)"/);
      const tokenURI = metaHash && metaHash[1] ? `http://localhost:8080/ipfs/${metaHash[1]}` : '';
      if (!tokenURI) throw new Error('Metadata IPFS upload failed');
      // Mint NFT to selected student's address
      const tx = await contract.mintCertificate(
        selectedStudent.StudentAddress,
        selectedStudent.StudentName,
        certificateName,
        issueDate,
        ipfsUrl,
        extraData,
        tokenURI
      );
      await tx.wait();
      setStatus('Certificate minted successfully!');
      setSelectedStudent(null);
      setIssueDate('');
      setExtraData('');
      setFile(null);
      setIpfsLink('');
    } catch (err) {
      setError('Minting failed: ' + err.message);
    }
    setMinting(false);
  };

  const handleBatchFile = (e) => {
    setBatchError('');
    setBatchRows([]);
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setBatchRows(results.data);
        },
        error: (err) => setBatchError('CSV parse error: ' + err.message)
      });
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const wb = XLSX.read(evt.target.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const [header, ...rows] = data;
        setBatchRows(rows.map(row => Object.fromEntries(header.map((h, i) => [h, row[i]]))));
      };
      reader.readAsBinaryString(file);
    } else {
      setBatchError('Unsupported file type. Please upload CSV or XLSX.');
    }
  };

  const handleBatchMint = async () => {
    setBatchMinting(true);
    setBatchStatus('');
    let success = 0, fail = 0;
    for (const row of batchRows) {
      try {
        // You may need to adjust these field names to match your file columns
        const tx = await contract.mintCertificate(
          row["StudentAddress"],
          row["StudentName"],
          row["CertificateName"],
          row["IssueDate"],
          row["IPFSLink"],
          row["ExtraData"],
          row["TokenURI"]
        );
        await tx.wait();
        success++;
      } catch (err) {
        fail++;
      }
    }
    setBatchStatus(`Batch minting complete. Success: ${success}, Failed: ${fail}`);
    setBatchMinting(false);
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>Mint Certificate NFT</Typography>
      {/* Student Selection */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>Select Student</Typography>
        <Autocomplete
          options={students}
          getOptionLabel={(option) => `${option.StudentName} (${option.StudentAddress})`}
          value={selectedStudent}
          onChange={(event, newValue) => setSelectedStudent(newValue)}
          onInputChange={(event, newInputValue) => handleSearchStudents(newInputValue)}
          loading={loadingStudents}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Search Student by Name or Address"
              variant="outlined"
              fullWidth
            />
          )}
        />
        <Button 
          variant="outlined" 
          onClick={() => setAddStudentDialog(true)}
          sx={{ mt: 1 }}
        >
          Add New Student
        </Button>
      </Box>
      <form onSubmit={handleMint}>
        <TextField
          select
          label="Certificate Name"
          value={certificateName}
          onChange={e => setCertificateName(e.target.value)}
          fullWidth margin="normal"
        >
          {CERTIFICATE_NAMES.map(name => (
            <MenuItem key={name} value={name}>{name}</MenuItem>
          ))}
        </TextField>
        <TextField
          label="Issue Date"
          type="date"
          value={issueDate}
          onChange={e => setIssueDate(e.target.value)}
          fullWidth margin="normal" InputLabelProps={{ shrink: true }} required
        />
        <TextField
          label="Extra Data"
          value={extraData}
          onChange={e => setExtraData(e.target.value)}
          fullWidth margin="normal"
        />
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 2 }}>
          <Typography sx={{ minWidth: 160 }} variant="body1" fontWeight={600}>Certificate File:</Typography>
          <TextField
            value={file ? file.name : ''}
            placeholder="Choose file..."
            InputProps={{ readOnly: true }}
            sx={{ flex: 1, mr: 2 }}
          />
          <Button
            variant="outlined"
            component="label"
          >
            Browse
            <input type="file" hidden onChange={e => setFile(e.target.files[0])} />
          </Button>
        </Box>
        <Box sx={{ mt: 2 }}>
          <Button type="submit" variant="contained" disabled={minting || !selectedStudent}>
            {minting ? <CircularProgress size={24} /> : 'Mint Certificate'}
          </Button>
        </Box>
        {status && <Alert severity="success" sx={{ mt: 2 }}>{status}</Alert>}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </form>
      {/* Add Student Dialog */}
      <Dialog open={addStudentDialog} onClose={() => setAddStudentDialog(false)}>
        <DialogTitle>Add New Student</DialogTitle>
        <DialogContent>
          <TextField
            label="Student Name"
            value={newStudentName}
            onChange={e => setNewStudentName(e.target.value)}
            fullWidth margin="normal" required
          />
          <TextField
            label="Student Address (Ethereum)"
            value={newStudentAddress}
            onChange={e => setNewStudentAddress(e.target.value)}
            fullWidth margin="normal" required
            placeholder="0x..."
          />
          <TextField
            label="Email"
            value={newStudentEmail}
            onChange={e => setNewStudentEmail(e.target.value)}
            fullWidth margin="normal"
          />
          <TextField
            label="Phone"
            value={newStudentPhone}
            onChange={e => setNewStudentPhone(e.target.value)}
            fullWidth margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddStudentDialog(false)}>Cancel</Button>
          <Button onClick={handleAddStudent} variant="contained">Add Student</Button>
        </DialogActions>
      </Dialog>
      <Box sx={{ mt: 4, mb: 4, p: 2, border: '1px solid #ccc', borderRadius: 2 }}>
        <Typography variant="h6" color="primary" gutterBottom>Batch Mint Degrees (CSV/XLSX)</Typography>
        <input type="file" accept=".csv,.xlsx,.xls" onChange={handleBatchFile} />
        {batchError && <Alert severity="error" sx={{ mt: 2 }}>{batchError}</Alert>}
        {batchRows.length > 0 && (
          <>
            <TableContainer component={Paper} sx={{ mt: 2, maxHeight: 300 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {Object.keys(batchRows[0]).map((col, idx) => (
                      <TableCell key={idx}>{col}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {batchRows.map((row, i) => (
                    <TableRow key={i}>
                      {Object.values(row).map((val, j) => (
                        <TableCell key={j}>{val}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Button variant="contained" color="primary" sx={{ mt: 2 }} onClick={handleBatchMint} disabled={batchMinting}>
              {batchMinting ? 'Minting...' : 'Mint All'}
            </Button>
            {batchStatus && <Alert severity="info" sx={{ mt: 2 }}>{batchStatus}</Alert>}
          </>
        )}
      </Box>
    </Box>
  );
}

export default CreateDegreePage;