import React from 'react';
import MuiGrid from '@mui/material/Grid';

const BREAKPOINTS = ['xs', 'sm', 'md', 'lg', 'xl'];

const GridCompat = React.forwardRef(function GridCompat(props, ref) {
  const rest = { ...props };
  let legacyProps = null;

  for (const bp of BREAKPOINTS) {
    if (rest[bp] !== undefined) {
      if (!legacyProps) legacyProps = {};
      legacyProps[bp] = rest[bp];
      delete rest[bp];
    }
  }
  delete rest.item;

  if (legacyProps) {
    rest.size = legacyProps;
  }

  return <MuiGrid ref={ref} {...rest} />;
});

GridCompat.displayName = 'Grid';

export default GridCompat;
