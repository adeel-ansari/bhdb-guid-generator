import * as XLSX from 'xlsx';
import CryptoJS from 'crypto-js';

export const handleFileRead = (event, setWorkbook, setFileName) => {
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

export const handleSheetLoad = (workbook, sheetName, headerRow, setData, setColumns, setParticipantIdColumn) => {
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

export const computeHashes = (data, selectedColumns, participantIdColumn, setHashedData) => {
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
