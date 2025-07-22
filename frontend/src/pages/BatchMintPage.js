import React, { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Box, Typography, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button } from '@mui/material';

function BatchMintPage({ contract }) {
  const [batchRows, setBatchRows] = useState([]);
  const [batchError, setBatchError] = useState('');
  const [batchMinting, setBatchMinting] = useState(false);
  const [batchStatus, setBatchStatus] = useState('');
  const [ipfsUploading, setIpfsUploading] = useState(false);
  const [ipfsError, setIpfsError] = useState('');
  const [ipfsLinks, setIpfsLinks] = useState([]);
  const [metaUploading, setMetaUploading] = useState(false);
  const [metaUploadStatus, setMetaUploadStatus] = useState('');

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

  const handleFilesUpload = async (e) => {
    setIpfsError('');
    setIpfsUploading(true);
    setIpfsLinks([]);
    const files = Array.from(e.target.files);
    const links = [];
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('http://localhost:5001/api/v0/add', {
          method: 'POST',
          body: formData,
        });
        const text = await res.text();
        const hash = text.match(/"Hash":"([^"]+)"/);
        if (hash && hash[1]) {
          links.push({ name: file.name, link: `http://localhost:8080/ipfs/${hash[1]}` });
        } else {
          links.push({ name: file.name, link: 'UPLOAD_FAILED' });
        }
      } catch (err) {
        links.push({ name: file.name, link: 'UPLOAD_FAILED' });
      }
    }
    setIpfsLinks(links);
    setIpfsUploading(false);
  };

  const handleDownloadLinks = (type) => {
    if (type === 'csv') {
      const csv = ['FileName,IPFSLink'];
      ipfsLinks.forEach(f => csv.push(`${f.name},${f.link}`));
      const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ipfs_links.csv';
      a.click();
      URL.revokeObjectURL(url);
    } else if (type === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(ipfsLinks.map(f => ({ FileName: f.name, IPFSLink: f.link })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'IPFSLinks');
      XLSX.writeFile(wb, 'ipfs_links.xlsx');
    }
  };

  const handleDownloadExample = (type) => {
    const exampleData = [
      {
        StudentAddress: '0x1234...abcd',
        StudentName: 'Đình Đức Lâm',
        CertificateName: 'Bachelor of Science',
        IssueDate: '2025-07-01',
        IPFSLink: 'http://localhost:8080/ipfs/EXAMPLE_HASH',
        ExtraData: ''
      },
      {
        StudentAddress: '0xabcd...1234',
        StudentName: 'Trần Đức Việt',
        CertificateName: 'Master of Science',
        IssueDate: '2025-07-02',
        IPFSLink: 'http://localhost:8080/ipfs/EXAMPLE_HASH2',
        ExtraData: ''
      }
    ];
    if (type === 'csv') {
      const header = Object.keys(exampleData[0]).join(',');
      const rows = exampleData.map(row => Object.values(row).join(','));
      const csv = [header, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'batch_mint_example.csv';
      a.click();
      URL.revokeObjectURL(url);
    } else if (type === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(exampleData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'BatchMintExample');
      XLSX.writeFile(wb, 'batch_mint_example.xlsx');
    }
  };

  const handleBatchMint = async () => {
    setBatchMinting(true);
    setBatchStatus('');
    setMetaUploading(true);
    setMetaUploadStatus('Uploading metadata to IPFS...');
    let success = 0, fail = 0;
    for (let i = 0; i < batchRows.length; i++) {
      const row = batchRows[i];
      try {
        // Build metadata JSON
        const metadata = {
          studentName: row["StudentName"],
          certificateName: row["CertificateName"],
          issueDate: row["IssueDate"],
          ipfsLink: row["IPFSLink"],
          extraData: row["ExtraData"]
        };
        const blob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
        const formData = new FormData();
        formData.append('file', blob, `metadata_${i}.json`);
        const res = await fetch('http://localhost:5001/api/v0/add', {
          method: 'POST',
          body: formData,
        });
        const text = await res.text();
        const hash = text.match(/"Hash":"([^"]+)"/);
        let tokenUri = '';
        if (hash && hash[1]) {
          tokenUri = `http://localhost:8080/ipfs/${hash[1]}`;
        } else {
          throw new Error('Metadata IPFS upload failed');
        }
        setMetaUploadStatus(`Minting degree ${i + 1} of ${batchRows.length}...`);
        console.log(row)
        const tx = await contract.mintCertificate(
          row["StudentAddress"],
          row["StudentName"],
          row["CertificateName"],
          row["IssueDate"],
          row["IPFSLink"],
          row["ExtraData"],
          tokenUri
        );
        console.log(tx)
        await tx.wait();
        success++;
      } catch (err) {
        fail++;
      }
    }
    setMetaUploading(false);
    setMetaUploadStatus('');
    setBatchStatus(`Batch minting complete. Success: ${success}, Failed: ${fail}`);
    setBatchMinting(false);
  };

  return (
    <>
      <Box sx={{ mt: 4, mb: 4, p: 2, border: '1px solid #ccc', borderRadius: 2 }}>
        <Typography variant="h6" color="primary" gutterBottom>Batch Upload Certificate Files to IPFS</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Step 1: Upload all certificate files (e.g., PDFs). The system will process them and generate a downloadable list of IPFS links.
        </Typography>
        <input type="file" multiple onChange={handleFilesUpload} />
        {ipfsUploading && <Alert severity="info" sx={{ mt: 2 }}>Uploading files to IPFS...</Alert>}
        {ipfsError && <Alert severity="error" sx={{ mt: 2 }}>{ipfsError}</Alert>}
        {ipfsLinks.length > 0 && (
          <>
            <TableContainer component={Paper} sx={{ mt: 2, maxHeight: 300 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>File Name</TableCell>
                    <TableCell>IPFS Link</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ipfsLinks.map((f, i) => (
                    <TableRow key={i}>
                      <TableCell>{f.name}</TableCell>
                      <TableCell>{f.link === 'UPLOAD_FAILED' ? 'UPLOAD_FAILED' : <a href={f.link} target="_blank" rel="noopener noreferrer">{f.link}</a>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Button variant="outlined" sx={{ mt: 2, mr: 2 }} onClick={() => handleDownloadLinks('csv')}>Download CSV</Button>
            <Button variant="outlined" sx={{ mt: 2 }} onClick={() => handleDownloadLinks('xlsx')}>Download XLSX</Button>
          </>
        )}
      </Box>
      <Box sx={{ mt: 4, mb: 4, p: 2, border: '1px solid #ccc', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" color="primary">Batch Mint Degrees (CSV/XLSX)</Typography>
          <Button variant="outlined" onClick={() => handleDownloadExample('xlsx')}>Download Example</Button>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Step 2: Download the example file. Fill it with student data and the IPFS links from Step 1. Then, upload the completed file here to mint all degrees.
        </Typography>
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
            {metaUploading && <Alert severity="info" sx={{ mt: 2 }}>{metaUploadStatus}</Alert>}
          </>
        )}
      </Box>
    </>
  );
}

export default BatchMintPage; 