import { Box, Card, CardContent, Typography, Grid, useTheme, useMediaQuery } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

import { useWebSocket } from '../context/WebSocketContext';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Filler, Title, Tooltip, Legend);

ChartJS.defaults.font.family = '"Roboto", "Helvetica", "Arial", sans-serif';
ChartJS.defaults.color = '#5f6368';

export default function ChartsPage() {
  const { history, analytics } = useWebSocket();
  const theme = useTheme();

  // Detect mobile screen size (down from small breakpoint)
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  // Detect medium screen size (between sm and md) for intermediate tweaking
  const isMedium = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const chartPoints = history.slice(0, 15).reverse();
  const labels = chartPoints.map((point) => point.timestamp);

  const magnitudes = chartPoints.map((p) => Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z));
  const jerks = magnitudes.map((mag, i) => i === 0 ? 0 : Math.abs(mag - magnitudes[i - 1]));

  // --- RESPONSIVE CHART CONFIGURATIONS ---

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false, // Essential for responsive container heights
    animation: { duration: 0 },
    plugins: {
      legend: { labels: { usePointStyle: true, boxWidth: 8, padding: 10 } },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { maxTicksLimit: 8 },
        border: { display: false }
      },
      y: {
        grid: { color: '#f1f3f4', drawBorder: false },
        border: { display: false, dash: [4, 4] },
        title: { display: !isSmall, color: '#9aa0a6' } // Hide Y-Axis titles on very small screens to save space
      }
    }
  };

  // 1. LIVE ACCELEROMETER CHART
  const lineChartData = {
    labels,
    datasets: [
      { label: 'X Axis', data: chartPoints.map((p) => p.x), borderColor: '#ea4335', backgroundColor: '#ea4335', tension: 0.4, pointRadius: 2 }, 
      { label: 'Y Axis', data: chartPoints.map((p) => p.y), borderColor: '#4285f4', backgroundColor: '#4285f4', tension: 0.4, pointRadius: 2 }, 
      { label: 'Z Axis', data: chartPoints.map((p) => p.z), borderColor: '#34a853', backgroundColor: '#34a853', tension: 0.4, pointRadius: 2 }, 
    ],
  };
  const lineOptions = {
    ...commonOptions,
    scales: { ...commonOptions.scales, y: { ...commonOptions.scales.y, min: -3.0, max: 3.0, title: { display: !isSmall, text: 'Acceleration (g)', color: '#9aa0a6' } } },
    plugins: { ...commonOptions.plugins, legend: { position: 'top' }, title: { display: false } },
  };

  // 2. LIVE SPEED AREA CHART
  const speedChartData = {
    labels,
    datasets: [{
      label: 'Speed (km/h)', data: chartPoints.map((p) => p.speed),
      borderColor: '#fbbc05', backgroundColor: 'rgba(251, 188, 5, 0.15)', fill: true, tension: 0.4, pointRadius: 2 
    }],
  };
  const speedOptions = {
    ...commonOptions,
    scales: { ...commonOptions.scales, y: { ...commonOptions.scales.y, beginAtZero: true, title: { display: !isSmall, text: 'Speed (km/h)', color: '#9aa0a6' } } },
    plugins: { ...commonOptions.plugins, legend: { display: false }, title: { display: false } },
  };

  // 3. MAGNITUDE AREA CHART
  const magChartData = {
    labels,
    datasets: [{
      label: 'Magnitude (g)', data: magnitudes,
      borderColor: '#a142f4', backgroundColor: 'rgba(161, 66, 244, 0.15)', fill: true, tension: 0.4, pointRadius: 2 
    }],
  };
  const magOptions = {
    ...commonOptions,
    scales: { ...commonOptions.scales, y: { ...commonOptions.scales.y, min: 0, max: 4.0, title: { display: !isSmall, text: 'Total Force (g)', color: '#9aa0a6' } } },
    plugins: { ...commonOptions.plugins, legend: { display: false }, title: { display: false } },
  };

  // 4. JERK BAR CHART
  const jerkChartData = {
    labels,
    datasets: [{
      label: 'Jerk (Δg)', data: jerks,
      backgroundColor: '#ea4335', borderRadius: 4, 
    }],
  };
  const jerkOptions = {
    ...commonOptions,
    scales: { 
      x: { grid: { display: false }, border: { display: false } },
      y: { ...commonOptions.scales.y, beginAtZero: true, max: 3.0, title: { display: !isSmall, text: 'Shock Force (Δg)', color: '#9aa0a6' } } 
    },
    plugins: { ...commonOptions.plugins, legend: { display: false }, title: { display: false } },
  };

  // 5. ANALYTICS: BAR & DOUGHNUT
  const filteredEvents = Object.entries(analytics.events || {}).filter(([key]) => key !== "normal");
  const eventLabels = filteredEvents.map(([key]) => key);
  const eventData = filteredEvents.map(([, value]) => value);
  const chartColors = ['#4285f4', '#ea4335', '#fbbc05', '#34a853', '#a142f4']; 

  const barChartData = {
    labels: eventLabels.map(label => label.toUpperCase()),
    datasets: [{ label: 'Event Count', data: eventData, backgroundColor: chartColors, borderRadius: 4 }],
  };
  const doughnutChartData = {
    labels: eventLabels.map(label => label.toUpperCase()),
    datasets: [{ data: eventData, backgroundColor: chartColors, borderWidth: 0, hoverOffset: 4 }],
  };
  
  const analyticsBarOptions = { 
    ...commonOptions, 
    plugins: { legend: { display: false } },
    scales: { x: { grid: { display: false }, border: { display: false } }, y: { grid: { color: '#f1f3f4' }, border: { display: false } } }
  };
  const analyticsDoughnutOptions = { 
    responsive: true, maintainAspectRatio: false, 
    plugins: { 
      legend: { 
        position: isSmall ? 'bottom' : 'right', // Dynamically reposition legend
        labels: { usePointStyle: true, padding: 15 } 
      } 
    },
    cutout: isSmall ? '60%' : '70%' // Thinner cutout on mobile for better chart visibility
  };

  // Responsive styling for card titles
  const titleTypographyStyle = {
    variant: 'subtitle2',
    sx: { color: '#5f6368', fontWeight: 600, fontSize: isSmall ? '0.8rem' : '0.875rem' }
  };

  const cardStyle = { 
    boxShadow: 'none', 
    border: '1px solid #dadce0', 
    borderRadius: 3, 
    bgcolor: '#ffffff',
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
  };

  // Robust centering helper component for "Waiting for data..." messages
  const CenteredLoadingMessage = ({ message }) => (
    <Box sx={{ display: 'flex', flexGrow: 1, justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: 150, p: 2 }}>
      <Typography color="textSecondary" align="center">{message}</Typography>
    </Box>
  );

  // Define responsive heights for the chart containers
  const chartHeightSmMd = { xs: 200, sm: 250, md: 300 }; // Short height on mobile, medium on tablet, full on desktop
  const analyticsChartHeight = { xs: 200, sm: 250 }; // Slightly shorter for analytics

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 }, pb: 2, pt: { xs: 1, md: 0 } }}>
      <Grid container spacing={3}>

        {/* --- ROW 1: Raw Sensor Data (XYZ) & Speed (JSX Reordered for logical grouping) --- */}
        <Grid item xs={12} lg={8}>
          <Card sx={cardStyle}>
            <Box sx={{ px: 2, pt: 2, pb: 0 }}>
              <Typography {...titleTypographyStyle}>Real-Time Accelerometer</Typography>
            </Box>
            <CardContent sx={{ flexGrow: 1, height: chartHeightSmMd, pt: 1, display: 'flex', flexDirection: 'column' }}>
              {history.length === 0 ? <CenteredLoadingMessage message="Waiting for data..." /> : <Line options={lineOptions} data={lineChartData} />}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} lg={4}> {/* Spans full mobile, half tablet, 4/12 desktop */}
          <Card sx={cardStyle}>
            <Box sx={{ px: 2, pt: 2, pb: 0 }}>
              <Typography {...titleTypographyStyle}>Real-Time Speed</Typography>
            </Box>
            <CardContent sx={{ flexGrow: 1, height: chartHeightSmMd, pt: 1, display: 'flex', flexDirection: 'column' }}>
              {history.length === 0 ? <CenteredLoadingMessage message="Waiting for data..." /> : <Line options={speedOptions} data={speedChartData} />}
            </CardContent>
          </Card>
        </Grid>

        {/* --- ROW 2: Derived Physics Data (Magnitude & Jerk) --- */}
        <Grid item xs={12} sm={6}>
          <Card sx={cardStyle}>
            <Box sx={{ px: 2, pt: 2, pb: 0 }}>
              <Typography {...titleTypographyStyle}>Real-Time Magnitude</Typography>
            </Box>
            <CardContent sx={{ flexGrow: 1, height: chartHeightSmMd, pt: 1, display: 'flex', flexDirection: 'column' }}>
              {history.length === 0 ? <CenteredLoadingMessage message="Waiting for data..." /> : <Line options={magOptions} data={magChartData} />}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Card sx={cardStyle}>
            <Box sx={{ px: 2, pt: 2, pb: 0 }}>
              <Typography {...titleTypographyStyle}>Real-Time Jerk (Shock Spikes)</Typography>
            </Box>
            <CardContent sx={{ flexGrow: 1, height: chartHeightSmMd, pt: 1, display: 'flex', flexDirection: 'column' }}>
              {history.length === 0 ? <CenteredLoadingMessage message="Waiting for data..." /> : <Bar options={jerkOptions} data={jerkChartData} />}
            </CardContent>
          </Card>
        </Grid>

        {/* --- ROW 3: Database Analytics --- */}
        <Grid item xs={12} md={5}>
          <Card sx={cardStyle}>
            <Box sx={{ px: 2, pt: 2, pb: 0 }}>
              <Typography {...titleTypographyStyle}>Event Distribution</Typography>
            </Box>
            <CardContent sx={{ flexGrow: 1, height: analyticsChartHeight, pt: 1, display: 'flex', flexDirection: 'column' }}>
              {eventLabels.length === 0 ? <CenteredLoadingMessage message="No events logged yet." /> : <Bar options={analyticsBarOptions} data={barChartData} />}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            boxShadow: 'none', 
            borderRadius: 3, 
            height: '100%', 
            minHeight: { xs: '150px', md: '250px' }, // Shorter height on mobile
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            alignItems: 'center', 
            bgcolor: '#e8f0fe', 
            color: '#1a73e8', 
            border: '1px solid #d2e3fc',
            p: isSmall ? 1 : 2
          }}>
            <CardContent sx={{ textAlign: 'center', px: { xs: 1, sm: 2 } }}>
              <Typography variant={isSmall ? "subtitle2" : "subtitle1"} sx={{ fontWeight: 600, mb: isSmall ? 0.5 : 1, color: '#1967d2' }}>
                Average Route Speed
              </Typography>
              {/* Responsive Text Sizing: h3 on mobile, h2 on tablet+ */}
              <Typography variant={isSmall ? "h3" : "h2"} sx={{ fontWeight: 700, letterSpacing: '-1px', display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 1 }}>
                {analytics.avgSpeed} <Typography component="span" variant={isSmall ? "h6" : "h6"} sx={{ fontWeight: 600 }}>km/h</Typography>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={cardStyle}>
            <Box sx={{ px: 2, pt: 2, pb: 0 }}>
              <Typography {...titleTypographyStyle}>Event Ratio</Typography>
            </Box>
            <CardContent sx={{ flexGrow: 1, height: analyticsChartHeight, pt: 1, display: 'flex', justifyContent: 'center', flexDirection: 'column' }}>
              {eventLabels.length === 0 ? <CenteredLoadingMessage message="No events logged yet." /> : <Doughnut options={analyticsDoughnutOptions} data={doughnutChartData} />}
            </CardContent>
          </Card>
        </Grid>
        
      </Grid>
    </Box>
  );
}