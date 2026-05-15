// In-memory cache to avoid redundant API calls
// Structure: { 'IN_2024': [ { date: '2024-01-26', name: 'Republic Day' }, ... ] }
const holidayCache = {};

const getCountryCode = (countryName) => {
    const codes = {
        "India": "IN",
        "United States": "US",
        "United Kingdom": "GB",
        "Canada": "CA",
        "Australia": "AU",
        "Germany": "DE",
        "France": "FR",
        "Japan": "JP",
        "China": "CN",
        "Brazil": "BR"
    };
    return codes[countryName] || "IN";
};

exports.getHolidays = async (country, year) => {
    const isoCountry = getCountryCode(country);
    const cacheKey = `${isoCountry}_${year}`;
    
    if (holidayCache[cacheKey]) {
        return holidayCache[cacheKey];
    }

    const apiKey = process.env.CALENDARIFIC_KEY;
    if (!apiKey) {
        console.warn('CALENDARIFIC_KEY is not set. Holiday generation skipped.');
        return [];
    }

    try {
        const url = new URL('https://calendarific.com/api/v2/holidays');
        url.searchParams.append('api_key', apiKey);
        url.searchParams.append('country', isoCountry);
        url.searchParams.append('year', year.toString());

        const response = await fetch(url.toString());
        if (!response.ok) {
             throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        const holidays = data?.response?.holidays || [];
        
        // Map to simplified format
        const simplifiedHolidays = holidays.map(h => ({
            date: h.date.iso.split('T')[0], // Extract YYYY-MM-DD
            name: h.name
        }));

        // Cache the results
        holidayCache[cacheKey] = simplifiedHolidays;

        return simplifiedHolidays;
    } catch (error) {
        console.error('Error fetching holidays from Calendarific:', error.message);
        return [];
    }
};
