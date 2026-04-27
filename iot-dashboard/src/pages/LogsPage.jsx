import { useState, useEffect } from 'react';
import { 
  Box, Typography, Card, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, Tabs, Tab, 
  CircularProgress, Pagination, useTheme, useMediaQuery 
} from '@mui/material';

import { useWebSocket } from '../context/WebSocketContext';

const getEventStyle = (event) => {
  switch (event) {
    case 'normal': 
      return { bgcolor: '#e6f4ea', color: '#1e8e3e', border: '1px solid #ceead6' }; 
    case 'tow': 
      return { bgcolor: '#fef7e0', color: '#b06000', border: '1px solid #fce8b2' }; 
    case 'rash_driving': 
    case 'collision': 
    case 'toppling': 
      return { bgcolor: '#fce8e6', color: '#d93025', border: '1px solid #f28b82' }; 
    default: 
      return { bgcolor: '#f1f3f4', color: '#5f6368', border: '1px solid #dadce0' }; 
  }
};

const LogTable = ({ logs, isLoading }) => (
  <TableContainer sx={{ flexGrow: 1, overflowY: 'auto', overflowX: 'auto' }}>
    <Table stickyHeader size="medium" sx={{ minWidth: { xs: 600, md: '100%' } }}>
      <TableHead>
        <TableRow>
          {['Timestamp', 'Event', 'Speed (km/h)', 'Coordinates (Lat, Lon)', 'Accel (X, Y, Z)'].map((headCell) => (
            <TableCell 
              key={headCell}
              sx={{ 
                fontWeight: 600, 
                color: '#5f6368', 
                bgcolor: '#f8f9fa',
                borderBottom: '1px solid #dadce0',
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                letterSpacing: '0.5px',
                whiteSpace: 'nowrap' // Prevents headers from wrapping on mobile
              }}
            >
              {headCell}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={5} align="center" sx={{ py: 8, borderBottom: 'none' }}>
              <CircularProgress size={32} sx={{ color: '#1a73e8' }} />
            </TableCell>
          </TableRow>
        ) : logs.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} align="center" sx={{ py: 8, color: '#5f6368', borderBottom: 'none' }}>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>No data available...</Typography>
            </TableCell>
          </TableRow>
        ) : (
          logs.map((row) => {
            const rowStyle = getEventStyle(row.event);
            return (
              <TableRow 
                key={row.id || row._id} 
                hover
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell sx={{ color: '#3c4043', fontWeight: 500, whiteSpace: 'nowrap' }}>
                  {row.timestamp || new Date(row.time).toLocaleTimeString()}
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  <Chip 
                    label={row.event?.toUpperCase() || 'UNKNOWN'} 
                    size="small" 
                    sx={{ 
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      letterSpacing: '0.5px',
                      bgcolor: rowStyle.bgcolor,
                      color: rowStyle.color,
                      border: rowStyle.border,
                      borderRadius: '6px'
                    }}
                  />
                </TableCell>
                <TableCell sx={{ color: '#3c4043', whiteSpace: 'nowrap' }}>{row.speed ?? 'N/A'}</TableCell>
                <TableCell sx={{ color: '#5f6368', fontFamily: 'monospace', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                  {row.lat !== undefined && row.lon !== undefined 
                    ? `${row.lat.toFixed(4)}, ${row.lon.toFixed(4)}` 
                    : 'N/A'}
                </TableCell>
                <TableCell sx={{ color: '#5f6368', fontFamily: 'monospace', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                  {row.x !== undefined 
                    ? `${row.x}, ${row.y}, ${row.z}` 
                    : 'N/A'}
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  </TableContainer>
);

export default function LogsPage() {
  const { sessionLogs: liveLogs } = useWebSocket();
  const theme = useTheme();
  
  // Detect screen size
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [tabIndex, setTabIndex] = useState(0);
  const [storedLogs, setStoredLogs] = useState([]);
  const [isLoadingStored, setIsLoadingStored] = useState(false);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (tabIndex === 1 || tabIndex === 2) {
      const fetchStoredLogs = async () => {
        setIsLoadingStored(true);
        try {
          const filterParam = tabIndex === 2 ? '&filter=anomalies' : '';
          const response = await fetch(`https://iot-backend-gfgwbpc8fnb7d0am.centralindia-01.azurewebsites.net/api/logs?page=${page}&limit=15${filterParam}`);
          const data = await response.json();
          
          setStoredLogs(data.logs);
          setTotalPages(data.totalPages);
        } catch (error) {
          console.error("❌ Error fetching stored logs:", error);
        } finally {
          setIsLoadingStored(false);
        }
      };

      fetchStoredLogs();
    }
  }, [tabIndex, page]);

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
    if (newValue !== tabIndex) setPage(1);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const tabStyle = (index) => ({
    textTransform: 'none', 
    fontWeight: 600, 
    fontSize: isMobile ? '0.85rem' : '0.95rem',
    color: tabIndex === index ? '#1a73e8' : '#5f6368',
    minWidth: isMobile ? 'auto' : 120, // Allows tabs to shrink on mobile
    '&.Mui-selected': { color: '#1a73e8' }
  });

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2, pb: 2, pt: { xs: 1, md: 0 } }}>
      <Typography variant="h5" sx={{ fontWeight: 500, color: '#202124', letterSpacing: '-0.5px' }}>
        System Logs
      </Typography>
      
      <Card 
        sx={{ 
          flexGrow: 1, 
          boxShadow: 'none', 
          border: '1px solid #dadce0', 
          borderRadius: 3, 
          overflow: 'hidden', 
          display: 'flex', 
          flexDirection: 'column',
          bgcolor: '#ffffff'
        }}
      >
        <Box sx={{ borderBottom: '1px solid #dadce0', bgcolor: '#ffffff', flexShrink: 0 }}>
          <Tabs 
            value={tabIndex} 
            onChange={handleTabChange} 
            variant={isMobile ? "scrollable" : "fullWidth"}
            scrollButtons={isMobile ? "auto" : false}
            allowScrollButtonsMobile
            sx={{
              '& .MuiTabs-indicator': {
                backgroundColor: '#1a73e8',
                height: 3,
                borderTopLeftRadius: 3,
                borderTopRightRadius: 3
              }
            }}
          >
            {/* Shorter names for mobile to fit better */}
            <Tab label={isMobile ? "Live" : "Live Log (Session)"} sx={tabStyle(0)} />
            <Tab label={isMobile ? "All Stored" : "Stored Log (All)"} sx={tabStyle(1)} />
            <Tab label={isMobile ? "Anomalies" : "Event Log (Anomalies)"} sx={tabStyle(2)} />
          </Tabs>
        </Box>

        {tabIndex === 0 ? (
          <LogTable logs={liveLogs} isLoading={false} />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
            <LogTable logs={storedLogs} isLoading={isLoadingStored} />
            
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                p: { xs: 1.5, sm: 2 }, 
                borderTop: '1px solid #dadce0', 
                bgcolor: '#ffffff', 
                flexShrink: 0 
              }}
            >
              <Pagination 
                count={totalPages} 
                page={page} 
                onChange={handlePageChange} 
                color="primary" 
                showFirstButton={!isMobile} // Hide extreme buttons on mobile to save space
                showLastButton={!isMobile}
                size={isMobile ? "small" : "medium"} // Smaller buttons on mobile
                siblingCount={isMobile ? 0 : 1} // Shows fewer page numbers on mobile
                shape="rounded"
                sx={{
                  '& .MuiPaginationItem-root': {
                    fontWeight: 500,
                  },
                  '& .Mui-selected': {
                    bgcolor: '#e8f0fe !important',
                    color: '#1a73e8',
                    fontWeight: 'bold'
                  }
                }}
              />
            </Box>
          </Box>
        )}
      </Card>
    </Box>
  );
}