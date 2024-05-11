import React, { useState } from 'react';
import { Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, Tab, Box, TextField, FormGroup, FormControlLabel, Checkbox, Radio, RadioGroup, Grid, Typography, IconButton } from '@mui/material';
import { CloudDownload as CloudDownloadIcon } from '@mui/icons-material';
import CryptoJS from 'crypto-js';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

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
  const [fileName, setFileName] = useState(''); // State to track the loaded file name

  const handleDrop = (event) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      setFileName(file.name); // Update the file name
      const reader = new FileReader();
      reader.onload = (e) => {
        const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
        setWorkbook(wb); // Store the workbook object for later use
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleLoadSheet = () => {
    if (!workbook) {
      alert('No file loaded or invalid file!');
      return;
    }
    if (!workbook.Sheets[sheetName]) {
      alert('Sheet not found in the loaded workbook!');
      return;
    }
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData && Array.isArray(jsonData) && jsonData.length >= headerRow) {
      const headers = jsonData[headerRow - 1].map((header, index) => ({
        label: header.toString(),
        key: `col${index + 1}`
      }));
      setColumns(headers);
      setParticipantIdColumn(headers[0].key); // Default to the first column if available

      const newData = jsonData.slice(headerRow).map(row => {
        let rowData = {};
        row.forEach((cell, index) => {
          rowData[headers[index] ? headers[index].key : `col${index + 1}`] = cell;
        });
        return rowData;
      });
      setData(newData);
    } else {
      alert('Header row is out of range or the data is not as expected!');
    }
  };

  const handleColumnSelectionChange = (event) => {
    const column = event.target.name;
    setSelectedColumns(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(column)) {
        newSelected.delete(column);
      } else {
        newSelected.add(column);
      }
      return newSelected;
    });
  };

  const handleParticipantIdChange = (event) => {
    setParticipantIdColumn(event.target.value);
  };

  const computeHashes = () => {
    const newData = data.map(row => {
      const rowData = Object.keys(row)
        .filter(key => selectedColumns.has(key))
        .map(key => row[key])
        .join('');
      const hash = CryptoJS.SHA1(rowData).toString(CryptoJS.enc.Hex);
      return { participant_id: row[participantIdColumn], hash }; // Use the selected participant_id column
    });

    setHashedData(newData);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
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
      <div onDragOver={handleDragOver} onDrop={handleDrop} style={{ width: '100%', height: '100px', border: '2px dashed #ccc', margin: '20px 0', padding: '10px', textAlign: 'center' }}>
        Drag and drop an Excel file here
        {fileName && <p>Loaded File: {fileName}</p>} {/* Display the loaded file name */}
      </div>
      <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '10px' }}>
        <TextField label="Sheet Name" variant="outlined" value={sheetName} onChange={(e) => setSheetName(e.target.value)} />
        <TextField label="Header Row" variant="outlined" type="number" value={headerRow} onChange={(e) => setHeaderRow(parseInt(e.target.value, 10))} />
        <Button variant="contained" onClick={handleLoadSheet} style={{ alignSelf: 'flex-start' }}>Load Sheet</Button>
      </Box>
      {columns.length > 0 && (
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="h6">Select Columns for Hash Calculation</Typography>
            <FormGroup>
              {columns.map(column => (
                <FormControlLabel
                  control={<Checkbox checked={selectedColumns.has(column.key)} onChange={handleColumnSelectionChange} name={column.key} />}
                  label={column.label}
                  key={column.key}
                />
              ))}
            </FormGroup>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="h6">Select Participant ID Column</Typography>
            <RadioGroup value={participantIdColumn} onChange={handleParticipantIdChange}>
              {columns.map(column => (
                <FormControlLabel value={column.key} control={<Radio />} label={column.label} key={column.key} />
              ))}
            </RadioGroup>
          </Grid>
        </Grid>
      )}
      <Box sx={{ width: '100%', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="Data Tabs">
          <Tab label="Original Data" />
          <Tab label="Hashed Data" />
        </Tabs>
        <Box>
          <Button variant="contained" onClick={computeHashes} style={{ marginRight: '10px' }}>Compute Hashes</Button>
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
