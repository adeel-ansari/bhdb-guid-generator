import React from 'react';
import { FormGroup, FormControlLabel, Radio, Typography, RadioGroup } from '@mui/material';
import { Tile } from './TileStyles';

const RadioSelection = ({ title, columns, participantIdColumn, handleChange }) => {
  return (
    <Tile>
      <Typography variant="h6">{title}</Typography>
      <RadioGroup value={participantIdColumn} onChange={handleChange}>
              {columns.map(column => (
                <FormControlLabel value={column.key} control={<Radio />} label={column.label} key={column.key} />
              ))}
      </RadioGroup>
    </Tile>
  );
};

export default RadioSelection;
