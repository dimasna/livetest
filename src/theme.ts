'use client';

import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2E7D32',
    },
    secondary: {
      main: '#F57C00',
    },
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
});

export default theme;
