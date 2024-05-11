import React from 'react';
import { FormGroup, FormControlLabel, Checkbox, Typography } from '@mui/material';
import { Tile } from './TileStyles';

const ColumnSelection = ({ title, columns, selectedColumns, handleChange }) => {
  return (
    <Tile>
      <Typography variant="h6">{title}</Typography>
      <FormGroup>
        {columns.map(column => (
        <FormControlLabel
            control={<Checkbox checked={selectedColumns.has(column.key)} onChange={handleChange} name={column.key} />}
            label={column.label}
            key={column.key}
        />
        ))}
      </FormGroup>
    </Tile>
  );
};

export default ColumnSelection;
