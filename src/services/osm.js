import axios from 'axios';

export async function fetchDistrictBoundaries() {
  const overpassUrl = 'https://overpass-api.de/api/interpreter';
  
  const query = `
    [out:json];
    area["name"="Port Louis"]["admin_level"="6"]->.portlouis;
    rel(area.portlouis)[admin_level=8];
    out geom;
  `;
  
  try {
    const response = await axios.post(overpassUrl, `data=${query}`, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    const districts = [];
    const elements = response.data.elements || [];
    
    for (const element of elements) {
      if (element.type === 'relation' && element.tags) {
        let coordinates = [];
        if (element.members) {
          for (const member of element.members) {
            if (member.type === 'way' && member.geometry) {
              coordinates = member.geometry.map(p => [p.lat, p.lon]);
              break;
            }
          }
        }
        
        if (coordinates.length > 0) {
          districts.push({
            name: element.tags.name || 'Unknown',
            risk: getRiskScoreForDistrict(element.tags.name),
            coordinates: coordinates
          });
        }
      }
    }
    
    if (districts.length === 0) {
      return getFallbackDistricts();
    }
    
    return districts;
  } catch (error) {
    console.error('Failed to fetch boundaries:', error);
    return getFallbackDistricts();
  }
}

function getRiskScoreForDistrict(name) {
  const riskMap = {
    'Vallée des Prêtres': 4.27,
    'Vallée des Pretres': 4.27,
    'La Cure': 4.05,
    'Bell Village': 4.08,
    'Plaine Verte': 3.96,
    'Roche Bois': 3.97,
    'Port Louis CBD': 3.87,
    'Vallée Pitot': 3.85,
    'Champ de Mars': 3.58,
    'Canal Dayot': 3.07
  };
  return riskMap[name] || 3.5;
}

function getFallbackDistricts() {
  return [
    { name: 'Vallée des Prêtres', risk: 4.27, coordinates: [[-20.173, 57.505], [-20.177, 57.509], [-20.175, 57.507], [-20.171, 57.503], [-20.173, 57.505]] },
    { name: 'La Cure', risk: 4.05, coordinates: [[-20.180, 57.508], [-20.184, 57.512], [-20.186, 57.509], [-20.182, 57.505], [-20.180, 57.508]] },
    { name: 'Bell Village', risk: 4.08, coordinates: [[-20.168, 57.500], [-20.172, 57.504], [-20.174, 57.501], [-20.170, 57.497], [-20.168, 57.500]] },
    { name: 'Plaine Verte', risk: 3.96, coordinates: [[-20.159, 57.498], [-20.163, 57.502], [-20.165, 57.499], [-20.161, 57.495], [-20.159, 57.498]] },
    { name: 'Roche Bois', risk: 3.97, coordinates: [[-20.146, 57.507], [-20.150, 57.511], [-20.152, 57.508], [-20.148, 57.504], [-20.146, 57.507]] },
    { name: 'Port Louis CBD', risk: 3.87, coordinates: [[-20.160, 57.497], [-20.164, 57.501], [-20.166, 57.498], [-20.162, 57.494], [-20.160, 57.497]] },
    { name: 'Vallée Pitot', risk: 3.85, coordinates: [[-20.163, 57.495], [-20.167, 57.499], [-20.169, 57.496], [-20.165, 57.492], [-20.163, 57.495]] },
    { name: 'Champ de Mars', risk: 3.58, coordinates: [[-20.153, 57.502], [-20.157, 57.506], [-20.159, 57.503], [-20.155, 57.499], [-20.153, 57.502]] },
    { name: 'Canal Dayot', risk: 3.07, coordinates: [[-20.156, 57.494], [-20.160, 57.498], [-20.162, 57.495], [-20.158, 57.491], [-20.156, 57.494]] }
  ];
}