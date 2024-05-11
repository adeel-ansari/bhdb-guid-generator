import React, { useState } from 'react';
import { Box, Grid, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, Tab, TextField, Button } from '@mui/material';
import { CloudDownload as CloudDownloadIcon } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { computeHashes, handleFileRead, handleSheetLoad } from './utils';
import ColumnSelection from './ColumnSelection';
import RadioSelection from './RadioSelection';

function DataTable() {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [hashedData, setHashedData] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [workbook, setWorkbook] = useState(null);
  const [sheetName, setSheetName] = useState('');
  const [headerRow, setHeaderRow] = useState(1);
  const [selectedColumns, setSelectedColumns] = useState(new Set());
  const [participantIdColumn, setParticipantIdColumn] = useState('');
  const [fileName, setFileName] = useState('');

  const handleColumnSelectionChange = (event) => {
    const columnKey = event.target.name;
    setSelectedColumns(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(columnKey)) {
        newSelected.delete(columnKey);
      } else {
        newSelected.add(columnKey);
      }
      return newSelected;
    });
  };

  const handleParticipantIdChange = (event) => {
    setParticipantIdColumn(event.target.value);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const downloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(hashedData.map(row => ({
      'Participant ID': row.participant_id,
      'Hash': row.hash
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Hashed Data');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
    const s2ab = s => {
      const buf = new ArrayBuffer(s.length);
      const view = new Uint8Array(buf);
      for (let i = 0; i < s.length; i++) {
        view[i] = s.charCodeAt(i) & 0xFF;
      }
      return buf;
    };
    saveAs(new Blob([s2ab(wbout)], {type: "application/octet-stream"}), 'hashed_data.xlsx');
  };

  return (
    <div>
      <div onDragOver={(e) => e.preventDefault()} onDrop={e => handleFileRead(e, setWorkbook, setFileName)} style={{ width: '100%', height: '100px', border: '2px dashed #ccc', margin: '20px 0', padding: '10px', textAlign: 'center' }}>
        Drag and drop an Excel file here
        {fileName && <p>Loaded File: {fileName}</p>}
      </div>
      <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '10px' }}>
        <TextField label="Sheet Name" variant="outlined" value={sheetName} onChange={(e) => setSheetName(e.target.value)} />
        <TextField label="Header Row" variant="outlined" type="number" value={headerRow} onChange={(e) => setHeaderRow(parseInt(e.target.value, 10))} />
        <Button variant="contained" onClick={() => handleSheetLoad(workbook, sheetName, headerRow, setData, setColumns, setParticipantIdColumn)} style={{ alignSelf: 'flex-start' }}>Load Sheet</Button>
      </Box>
      {columns.length > 0 && (
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <ColumnSelection title="Select Columns for Hash Calculation" columns={columns} selectedColumns={selectedColumns} handleChange={handleColumnSelectionChange} />
          </Grid>
          <Grid item xs={6}>
            <RadioSelection title="Select Participant ID Column" columns={columns} participantIdColumn={participantIdColumn} handleChange={handleParticipantIdChange} />
          </Grid>
        </Grid>
      )}
      <Box sx={{ width: '100%', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="Data Tabs">
          <Tab label="Original Data" />
          <Tab label="Hashed Data" />
        </Tabs>
        <Box>
          <Button variant="contained" onClick={() => computeHashes(data, selectedColumns, participantIdColumn, setHashedData)} style={{ marginRight: '10px' }}>Compute Hashes</Button>
          {tabValue === 1 && (
            <IconButton onClick={downloadExcel} color="primary" aria-label="download excel">
              <CloudDownloadIcon />
            </IconButton>
          )}
        </Box>
      </Box>
      <TableContainer component={Paper}>
        <Table aria-label="simple table">
          <TableHead>
            <TableRow>
              {tabValue === 0 ? columns.map((column, index) => (
                <TableCell key={index}>{column.label}</TableCell>
              )) : ["Participant ID", "Hash"].map((label, index) => (
                <TableCell key={index}>{label}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {(tabValue === 0 ? data : hashedData).map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {tabValue === 0 ? columns.map((column, colIndex) => (
                  <TableCell key={colIndex}>{row[column.key]}</TableCell>
                )) : ["participant_id", "hash"].map((key, colIndex) => (
                  <TableCell key={colIndex}>{row[key]}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}

export default DataTable;
