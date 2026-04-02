// Serverless function to fetch Google Place Details
// This bypasses CORS restrictions for the Place Details API

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { place_id } = req.query;

  if (!place_id) {
    return res.status(400).json({ error: 'place_id parameter required' });
  }

  // Get API key from environment
  const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Google Maps API key not configured' });
  }

  try {
    // Call Google Place Details API
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=name,rating,photos,formatted_address,vicinity,user_ratings_total&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Place Details API error:', data.status, data.error_message);
      return res.status(400).json({
        success: false,
        error: data.status,
        message: data.error_message || 'Place Details API request failed'
      });
    }

    return res.status(200).json({
      success: true,
      result: data.result
    });

  } catch (error) {
    console.error('Fetch error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
