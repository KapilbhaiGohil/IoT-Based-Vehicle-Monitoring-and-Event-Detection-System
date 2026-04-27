import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Typography, AppBar, Toolbar, Chip, Snackbar, Alert, Dialog, DialogTitle,
  DialogContent, DialogActions, Button, IconButton, useTheme, useMediaQuery
} from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import TimelineIcon from '@mui/icons-material/Timeline';
import ListAltIcon from '@mui/icons-material/ListAlt';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import MenuIcon from '@mui/icons-material/Menu'; // Added for Mobile Hamburger

import { useWebSocket } from '../context/WebSocketContext';

const drawerWidth = 260;

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  
  // Checks if the screen is mobile sized (down from 'md' breakpoint)
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { latestData, isConnected, isDeviceActive } = useWebSocket();
  
  const [rashAlertOpen, setRashAlertOpen] = useState(false);
  const [collisionAlertOpen, setCollisionAlertOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false); // Controls mobile drawer

  useEffect(() => {
    if (!latestData) return;

    if (latestData.event === 'rash_driving') {
      setRashAlertOpen(true);
    }

    if (latestData.event === 'collision') {
      setCollisionAlertOpen(true);
    }
  }, [latestData?.event]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'Live Map', path: '/', icon: <MapIcon /> },
    { text: 'Telemetry Charts', path: '/charts', icon: <TimelineIcon /> },
    { text: 'System Logs', path: '/logs', icon: <ListAltIcon /> },
  ];

  // Extracted Drawer content so we can use it in both Mobile & Desktop drawers
  const drawerContent = (
    <div>
      <Toolbar sx={{ mb: 1, mt: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#202124', letterSpacing: '-0.5px' }}>
          IoT Dashboard
        </Typography>
      </Toolbar>
      <List sx={{ px: 1.5 }}>
        {menuItems.map((item) => {
          const isSelected = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setMobileOpen(false); // Close drawer on mobile after clicking
                }}
                selected={isSelected}
                sx={{
                  borderRadius: '24px', 
                  '&.Mui-selected': { 
                    bgcolor: '#e8f0fe', 
                    color: '#1a73e8', 
                    '&:hover': { bgcolor: '#d2e3fc' }
                  },
                  '&:hover': { 
                    bgcolor: '#f1f3f4', 
                    color: '#202124'
                  }
                }}
              >
                <ListItemIcon 
                  sx={{ 
                    minWidth: 40,
                    color: isSelected ? '#1a73e8' : '#5f6368' 
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{ 
                    fontWeight: isSelected ? 600 : 500,
                    fontSize: '0.95rem'
                  }} 
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>

      {/* TOP HEADER */}
      <AppBar 
        position="fixed" 
        sx={{ 
          // Responsive width and margin
          width: { md: `calc(100% - ${drawerWidth}px)` }, 
          ml: { md: `${drawerWidth}px` }, 
          bgcolor: '#ffffff', 
          color: '#202124',
          boxShadow: 'none',
          borderBottom: '1px solid #dadce0'
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Mobile Hamburger Menu Icon */}
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>

            {/* LEFT: Title (Hides on very small screens to save space) */}
            <Typography 
              variant="h6" 
              noWrap 
              component="div" 
              sx={{ 
                fontWeight: 500, 
                letterSpacing: '-0.5px',
                display: { xs: 'none', sm: 'block' } 
              }}
            >
              ESP32 Vehicle Tracker
            </Typography>
          </Box>

          {/* MIDDLE: Critical Alerts (Scales down on mobile) */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            {latestData?.event === 'tow' && (
              <Chip
                label="⚠️ TOWING"
                size={isMobile ? "small" : "medium"}
                sx={{ fontWeight: 'bold', bgcolor: '#fce8e6', color: '#d93025', border: '1px solid #f28b82' }}
              />
            )}
            {latestData?.event === 'toppling' && (
              <Chip
                label="🚨 TOPPLING"
                size={isMobile ? "small" : "medium"}
                sx={{ fontWeight: 'bold', bgcolor: '#fce8e6', color: '#d93025', border: '1px solid #f28b82' }}
              />
            )}
          </Box>

          {/* RIGHT: Combined Status Area */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              bgcolor: '#f1f3f4', 
              borderRadius: 8,
              px: { xs: 1, sm: 2 },
              py: 0.75,
              gap: { xs: 1, sm: 2 },
              border: '1px solid #dadce0'
            }}
          >
            {/* 1. Server Connection */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              {isConnected ? (
                <WifiIcon sx={{ fontSize: { xs: 16, sm: 18 }, color: '#1e8e3e' }} /> 
              ) : (
                <WifiOffIcon sx={{ fontSize: { xs: 16, sm: 18 }, color: '#d93025' }} /> 
              )}
              {/* Hide Text on Mobile */}
              {!isMobile && (
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#5f6368', letterSpacing: 0.5 }}>
                  SERVER
                </Typography>
              )}
            </Box>

            <Box sx={{ width: '1px', height: '16px', bgcolor: '#bdc1c6' }} />

            {/* 2. ESP32 Device Status */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: { xs: 8, sm: 10 },
                  height: { xs: 8, sm: 10 },
                  borderRadius: '50%',
                  bgcolor: isDeviceActive ? '#1e8e3e' : '#d93025',
                  boxShadow: isDeviceActive ? '0 0 4px rgba(30,142,62,0.4)' : '0 0 4px rgba(217,48,37,0.4)',
                  transition: 'all 0.3s ease'
                }}
              />
              {/* Hide Text on Mobile */}
              {!isMobile && (
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, color: '#5f6368', letterSpacing: 0.5 }}
                >
                  {isDeviceActive ? 'DEVICE ONLINE' : 'DEVICE OFFLINE'}
                </Typography>
              )}
            </Box>
          </Box>

        </Toolbar>
      </AppBar>

      {/* LEFT SIDEBAR (Responsive) */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Mobile Drawer (Temporary) */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }} // Better open performance on mobile
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              bgcolor: '#ffffff', 
              color: '#3c4043',
            },
          }}
        >
          {drawerContent}
        </Drawer>
        
        {/* Desktop Drawer (Permanent) */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              bgcolor: '#ffffff', 
              color: '#3c4043',
              borderRight: '1px solid #dadce0'
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* MAIN CONTENT */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: '#f8f9fa',
          p: { xs: 1.5, sm: 3 }, // Less padding on mobile
          width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
          height: '100vh',
          display: 'flex',          
          flexDirection: 'column',
          boxSizing: 'border-box',
        }}
      >
        <Toolbar /> {/* Spacer for AppBar */}

        <Box sx={{ flexGrow: 1, minHeight: 0, overflow: 'auto', pr: 1 }}>
          <Outlet />
        </Box>
      </Box>

      {/* ALERTS */}
      <Snackbar
        open={rashAlertOpen}
        autoHideDuration={5000}
        onClose={() => setRashAlertOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setRashAlertOpen(false)} severity="warning" variant="filled" sx={{ width: '100%', fontWeight: 500 }}>
          Warning: Rash Driving Detected!
        </Alert>
      </Snackbar>

      <Dialog 
        open={collisionAlertOpen} 
        disableEscapeKeyDown
        PaperProps={{
          sx: { borderRadius: 3, p: 1, m: { xs: 2, sm: 4 } } 
        }}
      >
        <DialogTitle sx={{ color: '#d93025', fontWeight: 'bold', pb: 1 }}>
          CRITICAL ALERT
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: '#3c4043' }}>
            A vehicle collision has been detected! Please check the live map and take immediate action.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ pr: 2, pb: 2 }}>
          <Button 
            onClick={() => setCollisionAlertOpen(false)} 
            variant="contained" 
            sx={{ 
              bgcolor: '#d93025', 
              boxShadow: 'none',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { bgcolor: '#b3261e', boxShadow: 'none' }
            }}
          >
            Acknowledge & Dismiss
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}