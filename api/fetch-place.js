// Serverless function to fetch Google Maps place details
// This bypasses CORS restrictions

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL parameter required' });
  }

  try {
    // Fetch the Google Maps page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();

    // Extract rating
    let rating = null;
    const ratingPatterns = [
      /"ratingValue":"?([0-9.]+)"?/,
      /\["([0-9.]+)",null,null,\["[0-9,]+\s*reviews?"?\]\]/,
      /aria-label="([0-9.]+)\s*stars?"/i,
      /"aggregateRating"[^}]*"ratingValue":"?([0-9.]+)"?/,
    ];

    for (const pattern of ratingPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const r = parseFloat(match[1]);
        if (r >= 1.0 && r <= 5.0) {
          rating = match[1];
          break;
        }
      }
    }

    // Extract image URL
    let imageUrl = null;
    const imgPatterns = [
      /<meta property="og:image" content="([^"]+)"/,
      /<meta name="twitter:image" content="([^"]+)"/,
      /https:\/\/lh[0-9]+\.googleusercontent\.com\/[^\s"<>]+/,
      /https:\/\/maps\.gstatic\.com\/[^\s"<>]+/,
    ];

    for (const pattern of imgPatterns) {
      const match = html.match(pattern);
      if (match) {
        const img = match[1] || match[0];
        if (img && img.startsWith('http')) {
          imageUrl = img;
          break;
        }
      }
    }

    // Extract description
    let description = null;
    const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/);
    if (descMatch) {
      description = descMatch[1];
    }

    return res.status(200).json({
      success: true,
      rating,
      imageUrl,
      description,
    });

  } catch (error) {
    console.error('Fetch error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
