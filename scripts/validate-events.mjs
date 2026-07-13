import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const eventsPath = path.join(rootDirectory, 'data', 'events.json');
const requiredStringFields = ['title', 'url', 'date', 'startDate', 'description', 'image', 'imageAlt'];
const monthNumbers = {
    Jan: '01',
    Feb: '02',
    Mar: '03',
    Apr: '04',
    May: '05',
    Jun: '06',
    Jul: '07',
    Aug: '08',
    Sep: '09',
    Oct: '10',
    Nov: '11',
    Dec: '12'
};

const errors = [];

const addError = (index, message) => {
    errors.push(`Event ${index + 1}: ${message}`);
};

const isValidIsoDate = (value) => {
    if (!/^20\d{2}-\d{2}-\d{2}$/.test(value)) return false;

    const parsedDate = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === value;
};

const getDisplayedStartDate = (dateText) => {
    const dateMatch = dateText.match(
        /\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})\b/
    );
    const yearMatch = dateText.match(/\b(20\d{2})\b/);

    if (!dateMatch || !yearMatch) return null;
    return `${yearMatch[1]}-${monthNumbers[dateMatch[1]]}-${dateMatch[2].padStart(2, '0')}`;
};

const localFileExists = async (filePath) => {
    try {
        await access(filePath);
        return true;
    } catch {
        return false;
    }
};

let events;
try {
    events = JSON.parse(await readFile(eventsPath, 'utf8'));
} catch (error) {
    console.error(`Unable to read ${eventsPath}: ${error.message}`);
    process.exit(1);
}

if (!Array.isArray(events)) {
    console.error('data/events.json must contain a JSON array.');
    process.exit(1);
}

const seenUrls = new Map();

for (const [index, event] of events.entries()) {
    if (!event || typeof event !== 'object' || Array.isArray(event)) {
        addError(index, 'must be an object.');
        continue;
    }

    for (const field of requiredStringFields) {
        if (typeof event[field] !== 'string') {
            addError(index, `"${field}" must be a string.`);
        }
    }

    for (const field of ['title', 'url', 'date', 'startDate', 'imageAlt']) {
        if (typeof event[field] === 'string' && !event[field].trim()) {
            addError(index, `"${field}" cannot be empty.`);
        }
    }

    if (typeof event.startDate === 'string') {
        if (!isValidIsoDate(event.startDate)) {
            addError(index, `"startDate" is not a valid YYYY-MM-DD date: ${event.startDate}`);
        } else if (typeof event.date === 'string') {
            const displayedStartDate = getDisplayedStartDate(event.date);
            if (!displayedStartDate) {
                addError(index, `could not derive a start date from "date": ${event.date}`);
            } else if (displayedStartDate !== event.startDate) {
                addError(index, `"startDate" ${event.startDate} does not match displayed date ${displayedStartDate}.`);
            }
        }
    }

    if (typeof event.url === 'string' && event.url) {
        if (seenUrls.has(event.url)) {
            addError(index, `duplicates the URL from event ${seenUrls.get(event.url) + 1}: ${event.url}`);
        } else {
            seenUrls.set(event.url, index);
        }

        const detailPagePath = path.resolve(rootDirectory, 'html', event.url);
        if (!(await localFileExists(detailPagePath))) {
            addError(index, `detail page does not exist: ${event.url}`);
        }
    }

    if (typeof event.image === 'string' && event.image) {
        const imagePath = path.resolve(rootDirectory, 'html', event.image);
        if (!(await localFileExists(imagePath))) {
            addError(index, `image does not exist: ${event.image}`);
        }
    }
}

if (errors.length) {
    console.error(`Event validation failed with ${errors.length} error${errors.length === 1 ? '' : 's'}:\n`);
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
}

console.log(`Validated ${events.length} events successfully.`);
