import pkg from 'pdfjs-dist/legacy/build/pdf.js';
const { getDocument } = pkg;

export async function extractPdfText(buffer) {
    const pdf = await getDocument({ data: buffer }).promise
    const maxPages = pdf.numPages
    let text = ''

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const content = await page.getTextContent()
        const strings = content.items.map((item) => item.str)
        text += strings.join(' ') + '\\n'
    }

    return text
}
