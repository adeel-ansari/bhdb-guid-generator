import React, { useState } from 'react';
import { Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, Tab, Box } from '@mui/material';
import CryptoJS from 'crypto-js';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

function DataTable() {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [hashedData, setHashedData] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [participantIdKey, setParticipantIdKey] = useState(''); // Store the key for participant_id

  const handleDrop = (event) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length > 0) {
          const newColumns = jsonData[0].map((col, index) => ({
            label: col,
            key: `col${index + 1}`
          }));
          setColumns(newColumns);

          // Identify and save the key for 'participant_id'
          const participantIdIndex = jsonData[0].indexOf('participant_id');
          if (participantIdIndex !== -1) {
            setParticipantIdKey(`col${participantIdIndex + 1}`);
          }
          
          const newData = jsonData.slice(1).map(row => {
            let rowData = {};
            row.forEach((cell, index) => {
              rowData[newColumns[index].key] = cell;
            });
            return rowData;
          });
          setData(newData);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const computeHashes = () => {
    const newData = data.map(row => {
      // Concatenate all column values except 'participant_id' to compute the hash
      const rowData = Object.keys(row)
        .filter(key => key !== participantIdKey)
        .map(key => row[key])
        .join('');
      const hash = CryptoJS.SHA1(rowData).toString(CryptoJS.enc.Hex);
      return { participant_id: row[participantIdKey], hash };
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
      </div>
      <Box sx={{ width: '100%', marginBottom: '10px' }}>
        <Button variant="contained" onClick={computeHashes} style={{ marginRight: '10px' }}>Compute Hashes</Button>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="Data Tabs">
          <Tab label="Original Data" />
          <Tab label="Hashed Data" />
        </Tabs>
        {tabValue === 1 && <Button variant="contained" color="primary" onClick={downloadExcel} style={{ marginTop: '10px' }}>Download Excel</Button>}
      </Box>
      <TableContainer component={Paper}>
        <Table aria-label="simple table">
          <TableHead>
            <TableRow>
              {tabValue === 0 ? columns.map((column, index) => (
                <TableCell key={index}>{column.label}</TableCell>
              )) : ["participant_id", "Hash"].map((label, index) => (
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
