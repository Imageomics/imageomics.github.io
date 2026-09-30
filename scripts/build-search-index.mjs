import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(projectRoot, 'data', 'search-index.json');
const structuredContentPaths = [
    path.join(projectRoot, 'data', 'events.json'),
    path.join(projectRoot, 'data', 'news.json')
];
const excludedPaths = new Set([
    'html/components/footer.html',
    'html/components/header.html'
]);

const namedEntities = new Map([
    ['amp', '&'],
    ['apos', "'"],
    ['copy', '©'],
    ['gt', '>'],
    ['hellip', '…'],
    ['ldquo', '“'],
    ['lsquo', '‘'],
    ['lt', '<'],
    ['mdash', '—'],
    ['nbsp', ' '],
    ['ndash', '–'],
    ['quot', '"'],
    ['rdquo', '”'],
    ['rsquo', '’']
]);

async function findHtmlFiles(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = await Promise.all(entries.map(async (entry) => {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) return findHtmlFiles(fullPath);
        return entry.isFile() && entry.name.endsWith('.html') ? [fullPath] : [];
    }));

    return files.flat();
}

function decodeEntities(value) {
    return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code) => {
        if (code[0] === '#') {
            const radix = code[1]?.toLowerCase() === 'x' ? 16 : 10;
            const digits = radix === 16 ? code.slice(2) : code.slice(1);
            const point = Number.parseInt(digits, radix);
            return Number.isFinite(point) ? String.fromCodePoint(point) : entity;
        }

        return namedEntities.get(code.toLowerCase()) ?? entity;
    });
}

function plainText(value) {
    return decodeEntities(value)
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function attributeText(html, attribute) {
    const values = [];
    const expression = new RegExp(`\\s${attribute}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'gi');
    for (const match of html.matchAll(expression)) {
        const value = plainText(match[1] ?? match[2] ?? '');
        if (value) values.push(value);
    }
    return values.join(' ');
}

function extractDocument(html, relativePath) {
    const titleMarkup = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '';
    const headingMarkup = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? '';
    const title = plainText(titleMarkup || headingMarkup).replace(/\s*\|\s*Imageomics Institute\s*$/i, '');
    const mainMarkup = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? '';
    const searchableMarkup = mainMarkup
        .replace(/<(script|style|template|svg)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
        .replace(/<!--([\s\S]*?)-->/g, ' ');
    const visibleText = plainText(searchableMarkup);
    const descriptionMarkup = html.match(/<meta\b[^>]*name\s*=\s*["']description["'][^>]*content\s*=\s*(?:"([^"]*)"|'([^']*)')[^>]*>/i);
    const description = plainText(descriptionMarkup?.[1] ?? descriptionMarkup?.[2] ?? '');
    const supplementalText = [
        attributeText(searchableMarkup, 'alt'),
        attributeText(searchableMarkup, 'title'),
        description
    ].filter(Boolean).join(' ');
    const text = `${visibleText} ${supplementalText}`.replace(/\s+/g, ' ').trim();

    return {
        title: title || relativePath,
        url: relativePath,
        text
    };
}

const htmlFiles = [
    path.join(projectRoot, 'index.html'),
    ...await findHtmlFiles(path.join(projectRoot, 'html'))
];

const documents = [];
for (const filePath of htmlFiles.sort()) {
    const relativePath = path.relative(projectRoot, filePath).split(path.sep).join('/');
    if (excludedPaths.has(relativePath)) continue;

    const html = await readFile(filePath, 'utf8');
    documents.push(extractDocument(html, relativePath));
}

const documentsByUrl = new Map(documents.map((document) => [document.url, document]));
for (const contentPath of structuredContentPaths) {
    const records = JSON.parse(await readFile(contentPath, 'utf8'));
    for (const record of records) {
        if (!record.url) continue;
        const documentUrl = `html/${String(record.url).replace(/^(\.\.\/)+/, '').replace(/^\/+/, '')}`;
        const document = documentsByUrl.get(documentUrl);
        if (!document) continue;

        const structuredText = [
            record.title,
            record.date,
            record.startDate,
            record.endDate,
            record.time,
            record.location,
            record.description,
            record.imageAlt
        ].filter((value) => typeof value === 'string' && value.trim()).join(' ');

        document.text = `${document.text} ${structuredText}`.replace(/\s+/g, ' ').trim();
    }
}

await writeFile(outputPath, `${JSON.stringify(documents)}\n`, 'utf8');
console.log(`Indexed ${documents.length} HTML pages in ${path.relative(projectRoot, outputPath)}.`);
