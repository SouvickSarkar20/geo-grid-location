const express = require('express');
const bodyParser = require('body-parser');
const Tile38 = require('tile38');

const app = express();
app.use(bodyParser.json());
app.set('view engine','ejs');

// Initialize Tile38 client
const tile38 = new Tile38({
    host: 'localhost',
    port: 9851
});

// Fixed geofence center (latitude and longitude)
const geofenceCenter = {
    lat: 37.7749, // Example: San Francisco latitude
    lon: -122.4194 // Example: San Francisco longitude
};

// Fixed radius for the geofence (in meters)
const radius = 100; // Example: 100 meters

app.get('/',(req,res)=>{
    res.render('index');
})

// Endpoint to check geofence
app.post('/check-geofence', async (req, res) => {
    const { lat, lon } = req.body;

    try {
        // First, set the user's location in Tile38
        await tile38.set('fleet')
            .key('user')
            .point(lon, lat);

        // Then check if the user is within the geofence
        const cmd = `NEARBY fleet POINT ${geofenceCenter.lon} ${geofenceCenter.lat} ${radius}`;
        const result = await tile38.rawCommand(cmd);
        
        // Parse the result to check if the user is within the geofence
        const isWithinGeofence = result.length > 0;

        res.json({
            inGeofence: isWithinGeofence,
            distance: isWithinGeofence ? 'Within geofence' : 'Outside geofence'
        });
    } catch (error) {
        console.error('Geofence check error:', error);
        res.status(500).json({ 
            error: 'Error checking geofence',
            details: error.message 
        });
    }
});

// Periodic cleanup of old locations
setInterval(async () => {
    try {
        await tile38.del('fleet').key('user');
    } catch (error) {
        console.error('Cleanup error:', error);
    }
}, 24 * 60 * 60 * 1000); // Daily cleanup

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Required dependencies (package.json snippet)
/*
{
  "dependencies": {
    "express": "^4.17.1",
    "body-parser": "^1.19.0",
    "tile38": "^1.0.0"
  }
}
*/