import React from 'react';
import DataTable from './DataTable';
import { CssBaseline, Container, Typography } from '@mui/material';

function App() {
  return (
    <div className="App">
      <CssBaseline />
      <Container maxWidth="lg">
        <Typography variant="h4" component="h1" gutterBottom>
          BHDB GUID Generator
        </Typography>
        <DataTable />
      </Container>
    </div>
  );
}

export default App;
