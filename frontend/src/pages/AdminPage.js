import React, { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import CreateDegreePage from './CreateDegreePage';
import ViewDegreesPage from './ViewDegreesPage';
import BatchMintPage from './BatchMintPage';

function AdminPage({ contract, signer }) {
  const [tab, setTab] = useState(0);

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', mt: 4 }}>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} centered sx={{ mb: 3 }}>
        <Tab label="Create Degree" />
        <Tab label="View All Degrees" />
        <Tab label="Batch Mint" />
      </Tabs>
      {tab === 0 && <CreateDegreePage contract={contract} signer={signer} />}
      {tab === 1 && <ViewDegreesPage contract={contract} />}
      {tab === 2 && <BatchMintPage contract={contract} />}
    </Box>
  );
}

export default AdminPage; 