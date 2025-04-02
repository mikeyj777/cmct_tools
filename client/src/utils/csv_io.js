  export const parseCSV = async (url) => {
    try {
        const response = await fetch(url);
        const text = await response.text();

        const lines = text.split('\n');
        const headers = lines[0].split(',').map(header => header.trim());
        return lines.slice(1).map(line => {
            const values = line.split(',');
            return headers.reduce((obj, header, index) => {
                obj[header] = isNaN(values[index]) ? values[index] : parseFloat(values[index]);
                return obj;
            }, {});
        });
    } catch (error) {
        console.error('Error loading CSV data:', error);
        return [];
    }
};