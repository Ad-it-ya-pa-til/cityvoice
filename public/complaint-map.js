// Map functionality for complaint form
let map;
let marker;
const defaultLat = 28.6139; // Delhi, India
const defaultLng = 77.2090;

// Initialize map
function initComplaintMap() {
  const mapContainer = document.getElementById('map-preview');
  
  if (!mapContainer) {
    console.error('Map container not found');
    return;
  }

  // Check if Leaflet is loaded
  if (typeof L === 'undefined') {
    console.error('Leaflet library not loaded');
    setTimeout(initComplaintMap, 200); // Retry after delay
    return;
  }

  try {
    // Clear any existing content
    mapContainer.innerHTML = '';
    mapContainer.classList.remove('loading');
    
    // Force container to have explicit dimensions
    mapContainer.style.height = '350px';
    mapContainer.style.width = '100%';
    mapContainer.style.position = 'relative';
    
    console.log('Creating map with container:', {
      height: mapContainer.offsetHeight,
      width: mapContainer.offsetWidth
    });
    
    // Create map instance with specific options
    map = L.map(mapContainer, {
      center: [defaultLat, defaultLng],
      zoom: 6,
      zoomControl: true,
      scrollWheelZoom: true,
      tap: false,  // Disable tap handler which can cause issues
      preferCanvas: false,
      attributionControl: true
    });

    // Add tile layer
    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    });
    
    tileLayer.addTo(map);

    // Remove loading state when first tile loads
    tileLayer.on('load', function() {
      mapContainer.classList.remove('loading');
    });

    // Remove loading state and fix map size
    setTimeout(() => {
      mapContainer.classList.remove('loading');
      // Force recalculation of map size multiple times to ensure proper rendering
      setTimeout(() => map.invalidateSize(), 100);
      setTimeout(() => map.invalidateSize(), 300);
      setTimeout(() => map.invalidateSize(), 500);
    }, 500);

    // Click on map to set location
    map.on('click', function(e) {
      const { lat, lng } = e.latlng;
      setLocation(lat, lng);
      reverseGeocode(lat, lng);
    });

    console.log('✓ Map initialized successfully');
    
    // Show fix map button after initialization
    setTimeout(() => {
      const fixBtn = document.getElementById('btn-fix-map');
      if (fixBtn) {
        fixBtn.style.display = 'inline-block';
      }
    }, 1500);
    
    // Handle window resize
    window.addEventListener('resize', function() {
      if (map) {
        map.invalidateSize();
      }
    });
  } catch (error) {
    console.error('Map initialization error:', error);
    console.error('Error details:', error.message, error.stack);
    mapContainer.classList.remove('loading');
    mapContainer.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#e74c3c;font-size:14px;padding:20px;text-align:center">
        <p style="margin:0 0 10px">⚠️ Unable to load map</p>
        <p style="margin:0;font-size:12px;color:#666">Error: ${error.message}</p>
        <p style="margin:10px 0 0;font-size:12px;color:#666">Please refresh the page or use the address field below</p>
      </div>
    `;
  }
}

// Set location with marker
function setLocation(lat, lng, zoom = 15) {
  if (!map) return;
  
  // Remove existing marker
  if (marker) {
    map.removeLayer(marker);
  }

  // Add new marker
  marker = L.marker([lat, lng], {
    draggable: true,
    autoPan: true
  }).addTo(map);

  // Add popup to marker
  marker.bindPopup(`<b>Selected Location</b><br>Lat: ${lat.toFixed(6)}<br>Lng: ${lng.toFixed(6)}`);

  // Update on drag
  marker.on('dragend', function() {
    const pos = marker.getLatLng();
    updateCoordinates(pos.lat, pos.lng);
    reverseGeocode(pos.lat, pos.lng);
    marker.setPopupContent(`<b>Selected Location</b><br>Lat: ${pos.lat.toFixed(6)}<br>Lng: ${pos.lng.toFixed(6)}`);
  });

  // Center map
  map.setView([lat, lng], zoom);
  updateCoordinates(lat, lng);
}

// Update coordinate displays
function updateCoordinates(lat, lng) {
  const latField = document.getElementById('lat');
  const lngField = document.getElementById('lng');
  const latDisplay = document.getElementById('lat-display');
  const lngDisplay = document.getElementById('lng-display');

  if (latField) latField.value = lat.toFixed(6);
  if (lngField) lngField.value = lng.toFixed(6);
  if (latDisplay) latDisplay.textContent = lat.toFixed(6);
  if (lngDisplay) lngDisplay.textContent = lng.toFixed(6);
}

// Reverse geocode (coordinates to address)
function reverseGeocode(lat, lng) {
  fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`)
    .then(res => res.json())
    .then(data => {
      if (data.display_name) {
        const locationField = document.getElementById('location');
        if (locationField) {
          locationField.value = data.display_name;
        }
      }
    })
    .catch(err => console.error('Reverse geocoding error:', err));
}

// Forward geocode (address to coordinates)
function geocodeAddress(address) {
  if (!address || address.length < 3) return;

  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`)
    .then(res => res.json())
    .then(data => {
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        setLocation(parseFloat(lat), parseFloat(lon), 15);
        const locationField = document.getElementById('location');
        if (locationField) {
          locationField.value = display_name;
        }
      }
    })
    .catch(err => console.error('Geocoding error:', err));
}

// Use current location
function useCurrentLocation() {
  if (!navigator.geolocation) {
    alert('❌ Geolocation is not supported by your browser');
    return;
  }

  // Check for HTTPS
  if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    alert('⚠️ Geolocation requires HTTPS\n\nFor security reasons, modern browsers only allow geolocation on:\n' +
          '• HTTPS websites (https://...)\n' +
          '• Localhost (for development)\n\n' +
          'Please use HTTPS or click on the map to set location manually.');
    return;
  }

  const btn = document.getElementById('btn-geoloc');
  if (btn) {
    btn.textContent = '📍 Getting location...';
    btn.disabled = true;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      setLocation(latitude, longitude, 17);
      reverseGeocode(latitude, longitude);
      
      if (btn) {
        btn.textContent = '✓ Location Set!';
        setTimeout(() => {
          btn.textContent = '📍 Use My Current Location';
          btn.disabled = false;
        }, 2000);
      }
    },
    (error) => {
      let errorMsg = '';
      switch(error.code) {
        case error.PERMISSION_DENIED:
          errorMsg = '❌ Location permission denied.\n\n' +
                    'Please enable location access in your browser settings:\n' +
                    '1. Click the lock/info icon in the address bar\n' +
                    '2. Allow location permissions for this site\n' +
                    '3. Refresh and try again\n\n' +
                    'Or click on the map to set location manually.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMsg = '❌ Location unavailable.\n\n' +
                    'Please check your device location settings.\n' +
                    'Or click on the map to set location manually.';
          break;
        case error.TIMEOUT:
          errorMsg = '⏱️ Location request timed out.\n\n' +
                    'Please try again or click on the map.';
          break;
        default:
          errorMsg = '❌ Unable to get location.\n\n' +
                    'You can click on the map or enter an address manually.';
      }
      alert(errorMsg);
      
      if (btn) {
        btn.textContent = '📍 Use My Current Location';
        btn.disabled = false;
      }
    },
    {
      enableHighAccuracy: false,
      timeout: 5000,
      maximumAge: 300000
    }
  );
}

// Initialize when everything is fully loaded
window.addEventListener('load', function() {
  console.log('Window loaded, initializing map...');
  
  // Wait for Leaflet to be available and give extra time for rendering
  const waitForLeaflet = () => {
    const container = document.getElementById('map-preview');
    if (typeof L !== 'undefined' && container) {
      console.log('Leaflet loaded, container found');
      console.log('Container dimensions:', {
        offsetHeight: container.offsetHeight,
        offsetWidth: container.offsetWidth,
        clientHeight: container.clientHeight,
        clientWidth: container.clientWidth
      });
      
      // Extra delay to ensure all CSS is applied
      setTimeout(() => {
        initComplaintMap();
      }, 500);
    } else {
      console.log('Waiting for Leaflet and container...', {
        leafletLoaded: typeof L !== 'undefined',
        containerExists: !!container
      });
      setTimeout(waitForLeaflet, 100);
    }
  };
  
  waitForLeaflet();

  // Geolocation button
  const geolocBtn = document.getElementById('btn-geoloc');
  if (geolocBtn) {
    geolocBtn.addEventListener('click', useCurrentLocation);
  }

  // Fix map button
  const fixMapBtn = document.getElementById('btn-fix-map');
  if (fixMapBtn) {
    fixMapBtn.addEventListener('click', function() {
      if (map) {
        map.invalidateSize();
        setTimeout(() => map.invalidateSize(), 100);
        setTimeout(() => map.invalidateSize(), 300);
        this.textContent = '✓ Map Fixed!';
        setTimeout(() => {
          this.textContent = '🔄 Fix Map Display';
        }, 2000);
      }
    });
  }

  // Address search with debounce
  let geocodeTimer;
  const locationInput = document.getElementById('location');
  if (locationInput) {
    locationInput.addEventListener('input', function() {
      clearTimeout(geocodeTimer);
      geocodeTimer = setTimeout(() => {
        geocodeAddress(this.value);
      }, 1000);
    });

    // Handle Enter key
    locationInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        geocodeAddress(this.value);
      }
    });
  }
});
