import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const MapQuerySchema = z.object({
  teamId: z.string(),
  timeRange: z.enum(['24h', '7d', '30d', '90d', '1y']).default('30d'),
  type: z.enum(['world', 'country', 'region']).default('world'),
  metric: z.string().optional(),
  aggregation: z.enum(['sum', 'avg', 'count', 'min', 'max']).default('count'),
  countryCode: z.string().optional(),
  region: z.string().optional()
});

interface MapData {
  location: string;
  locationCode: string;
  value: number;
  percentage?: number;
  coordinates?: [number, number];
}

/**
 * GET /api/analytics/map/data
 * 
 * Get geographic data for map widgets
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = MapQuerySchema.parse(Object.fromEntries(searchParams));

    // Verify team access
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId: query.teamId,
        userId: session.user.id
      }
    });

    if (!teamMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (query.timeRange) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    // Generate map data
    const mapData = await generateMapData(query, startDate, endDate);

    return NextResponse.json({
      success: true,
      data: mapData,
      timeRange: query.timeRange,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    });

  } catch (error) {
    console.error('Map data API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch map data' },
      { status: 500 }
    );
  }
}

async function generateMapData(
  query: z.infer<typeof MapQuerySchema>,
  startDate: Date,
  endDate: Date
): Promise<MapData[]> {
  
  try {
    // For now, we'll generate mock geographic data
    // In a real implementation, this would come from:
    // - Analytics events with IP geolocation
    // - User profile location data
    // - Website analysis data grouped by country
    
    return generateMockMapData(query.type);
    
  } catch (error) {
    console.error('Error generating map data:', error);
    return generateMockMapData(query.type);
  }
}

function generateMockMapData(type: string): MapData[] {
  switch (type) {
    case 'world':
      return generateWorldMapData();
    case 'country':
      return generateCountryMapData();
    case 'region':
      return generateRegionMapData();
    default:
      return generateWorldMapData();
  }
}

function generateWorldMapData(): MapData[] {
  const countries = [
    { name: 'United States', code: 'US', baseValue: 15000, coords: [-95.7129, 37.0902] as [number, number] },
    { name: 'United Kingdom', code: 'GB', baseValue: 8000, coords: [-3.4360, 55.3781] as [number, number] },
    { name: 'Germany', code: 'DE', baseValue: 6500, coords: [10.4515, 51.1657] as [number, number] },
    { name: 'Canada', code: 'CA', baseValue: 4200, coords: [-106.3468, 56.1304] as [number, number] },
    { name: 'France', code: 'FR', baseValue: 3800, coords: [2.2137, 46.2276] as [number, number] },
    { name: 'Australia', code: 'AU', baseValue: 2400, coords: [133.7751, -25.2744] as [number, number] },
    { name: 'Netherlands', code: 'NL', baseValue: 1600, coords: [5.2913, 52.1326] as [number, number] },
    { name: 'Brazil', code: 'BR', baseValue: 1200, coords: [-51.9253, -14.2351] as [number, number] },
    { name: 'Japan', code: 'JP', baseValue: 980, coords: [138.2529, 36.2048] as [number, number] },
    { name: 'India', code: 'IN', baseValue: 750, coords: [20.5937, 78.9629] as [number, number] },
    { name: 'Spain', code: 'ES', baseValue: 650, coords: [-3.7492, 40.4637] as [number, number] },
    { name: 'Italy', code: 'IT', baseValue: 580, coords: [12.5674, 41.8719] as [number, number] },
    { name: 'Sweden', code: 'SE', baseValue: 520, coords: [18.6435, 60.1282] as [number, number] },
    { name: 'Norway', code: 'NO', baseValue: 480, coords: [8.4689, 60.4720] as [number, number] },
    { name: 'Denmark', code: 'DK', baseValue: 420, coords: [9.5018, 56.2639] as [number, number] },
    { name: 'Switzerland', code: 'CH', baseValue: 380, coords: [8.2275, 46.8182] as [number, number] },
    { name: 'Belgium', code: 'BE', baseValue: 350, coords: [4.4699, 50.5039] as [number, number] },
    { name: 'Austria', code: 'AT', baseValue: 320, coords: [14.5501, 47.5162] as [number, number] },
    { name: 'Finland', code: 'FI', baseValue: 290, coords: [25.7482, 61.9241] as [number, number] },
    { name: 'Ireland', code: 'IE', baseValue: 260, coords: [-8.2439, 53.4129] as [number, number] }
  ];

  const totalValue = countries.reduce((sum, country) => sum + country.baseValue, 0);

  return countries.map(country => {
    // Add some randomness to the values
    const variation = (Math.random() - 0.5) * 0.4; // ±20% variation
    const value = Math.floor(country.baseValue * (1 + variation));
    const percentage = (value / totalValue) * 100;

    return {
      location: country.name,
      locationCode: country.code,
      value: value,
      percentage: percentage,
      coordinates: country.coords
    };
  });
}

function generateCountryMapData(): MapData[] {
  // US states data (example for country drill-down)
  const states = [
    { name: 'California', code: 'CA', baseValue: 3200 },
    { name: 'New York', code: 'NY', baseValue: 2100 },
    { name: 'Texas', code: 'TX', baseValue: 1800 },
    { name: 'Florida', code: 'FL', baseValue: 1400 },
    { name: 'Illinois', code: 'IL', baseValue: 980 },
    { name: 'Pennsylvania', code: 'PA', baseValue: 850 },
    { name: 'Ohio', code: 'OH', baseValue: 720 },
    { name: 'Georgia', code: 'GA', baseValue: 680 },
    { name: 'North Carolina', code: 'NC', baseValue: 620 },
    { name: 'Michigan', code: 'MI', baseValue: 580 },
    { name: 'New Jersey', code: 'NJ', baseValue: 540 },
    { name: 'Virginia', code: 'VA', baseValue: 500 },
    { name: 'Washington', code: 'WA', baseValue: 480 },
    { name: 'Arizona', code: 'AZ', baseValue: 450 },
    { name: 'Massachusetts', code: 'MA', baseValue: 420 },
    { name: 'Tennessee', code: 'TN', baseValue: 380 },
    { name: 'Indiana', code: 'IN', baseValue: 350 },
    { name: 'Missouri', code: 'MO', baseValue: 320 },
    { name: 'Maryland', code: 'MD', baseValue: 310 },
    { name: 'Wisconsin', code: 'WI', baseValue: 290 }
  ];

  const totalValue = states.reduce((sum, state) => sum + state.baseValue, 0);

  return states.map(state => {
    const variation = (Math.random() - 0.5) * 0.3;
    const value = Math.floor(state.baseValue * (1 + variation));
    const percentage = (value / totalValue) * 100;

    return {
      location: state.name,
      locationCode: state.code,
      value: value,
      percentage: percentage
    };
  });
}

function generateRegionMapData(): MapData[] {
  // Major cities data (example for regional drill-down)
  const cities = [
    { name: 'New York City', code: 'NYC', baseValue: 1200 },
    { name: 'Los Angeles', code: 'LAX', baseValue: 980 },
    { name: 'Chicago', code: 'CHI', baseValue: 750 },
    { name: 'Houston', code: 'HOU', baseValue: 650 },
    { name: 'Phoenix', code: 'PHX', baseValue: 480 },
    { name: 'Philadelphia', code: 'PHL', baseValue: 420 },
    { name: 'San Antonio', code: 'SAT', baseValue: 380 },
    { name: 'San Diego', code: 'SAN', baseValue: 350 },
    { name: 'Dallas', code: 'DAL', baseValue: 340 },
    { name: 'San Jose', code: 'SJC', baseValue: 320 },
    { name: 'Austin', code: 'AUS', baseValue: 290 },
    { name: 'Jacksonville', code: 'JAX', baseValue: 270 },
    { name: 'Fort Worth', code: 'FTW', baseValue: 250 },
    { name: 'Columbus', code: 'CMH', baseValue: 230 },
    { name: 'Charlotte', code: 'CLT', baseValue: 220 },
    { name: 'San Francisco', code: 'SFO', baseValue: 210 },
    { name: 'Indianapolis', code: 'IND', baseValue: 190 },
    { name: 'Seattle', code: 'SEA', baseValue: 180 },
    { name: 'Denver', code: 'DEN', baseValue: 170 },
    { name: 'Boston', code: 'BOS', baseValue: 160 }
  ];

  const totalValue = cities.reduce((sum, city) => sum + city.baseValue, 0);

  return cities.map(city => {
    const variation = (Math.random() - 0.5) * 0.25;
    const value = Math.floor(city.baseValue * (1 + variation));
    const percentage = (value / totalValue) * 100;

    return {
      location: city.name,
      locationCode: city.code,
      value: value,
      percentage: percentage
    };
  });
}