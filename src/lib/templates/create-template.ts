import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
} from 'docx'
import { writeFileSync } from 'fs'
import path from 'path'

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    text: text.toUpperCase(),
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
    border: {
      bottom: {
        color: '000000',
        space: 1,
        style: BorderStyle.SINGLE,
        size: 6,
      },
    },
    style: 'Heading2',
  })
}

function bodyText(text: string, bold = false): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold,
        font: 'Calibri',
        size: 22, // 11pt
      }),
    ],
    spacing: { after: 120 },
  })
}

function bulletPoint(text: string): Paragraph {
  return new Paragraph({
    text,
    bullet: {
      level: 0,
    },
    spacing: { after: 80 },
    style: 'ListParagraph',
  })
}

const doc = new Document({
  styles: {
    default: {
      document: {
        run: {
          font: 'Calibri',
          size: 22, // 11pt
        },
        paragraph: {
          spacing: {
            line: 276, // 1.15 line spacing
          },
        },
      },
    },
    paragraphStyles: [
      {
        id: 'Heading2',
        name: 'Heading 2',
        basedOn: 'Normal',
        next: 'Normal',
        run: {
          font: 'Calibri',
          size: 24, // 12pt
          bold: true,
        },
        paragraph: {
          spacing: {
            before: 240,
            after: 120,
          },
        },
      },
      {
        id: 'ListParagraph',
        name: 'List Paragraph',
        basedOn: 'Normal',
        run: {
          font: 'Calibri',
          size: 22, // 11pt
        },
        paragraph: {
          spacing: {
            after: 80,
          },
        },
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: 851, // 1.5cm
            right: 851,
            bottom: 851,
            left: 851,
          },
        },
      },
      children: [
        // Header - Full Name
        new Paragraph({
          children: [
            new TextRun({
              text: '{full_name}',
              font: 'Calibri',
              size: 28, // 14pt
              bold: true,
            }),
          ],
          spacing: { after: 120 },
        }),

        // Contact line
        new Paragraph({
          children: [
            new TextRun({
              text: '{email}  |  {phone}  |  {linkedin}  |  {location}',
              font: 'Calibri',
              size: 22, // 11pt
            }),
          ],
          spacing: { after: 240 },
        }),

        // Summary section
        sectionHeading('Resumo Profissional'),
        bodyText('{summary}'),

        // Experience section
        sectionHeading('Experiência Profissional'),

        // Experience loop placeholder
        new Paragraph({
          text: '{#experience}',
          spacing: { after: 0 },
        }),

        // Experience entry - title and company
        new Paragraph({
          children: [
            new TextRun({
              text: '{title} — {company}  |  {startDate} – {endDate}',
              font: 'Calibri',
              size: 22,
              bold: true,
            }),
          ],
          spacing: { after: 120 },
        }),

        // Bullets as plain text (will be replaced by Docxtemplater)
        bodyText('{bullets_text}'),

        // End experience loop
        new Paragraph({
          text: '{/experience}',
          spacing: { after: 0 },
        }),

        // Skills section
        sectionHeading('Habilidades'),
        bodyText('{skills}'),

        // Education section
        sectionHeading('Formação Acadêmica'),

        // Education loop
        new Paragraph({
          text: '{#education}',
          spacing: { after: 0 },
        }),

        bodyText('{degree} — {institution} — {year}'),

        new Paragraph({
          text: '{/education}',
          spacing: { after: 0 },
        }),

        // Certifications section
        sectionHeading('Certificações'),

        // Certifications loop
        new Paragraph({
          text: '{#certifications}',
          spacing: { after: 0 },
        }),

        bodyText('{name} — {issuer}  {year}'),

        new Paragraph({
          text: '{/certifications}',
          spacing: { after: 0 },
        }),
      ],
    },
  ],
})

async function main() {
  const buffer = await Packer.toBuffer(doc)
  const outputPath = path.join(process.cwd(), 'src/lib/templates/ats-standard.docx')
  writeFileSync(outputPath, buffer)
  console.log('✓ Template created successfully at:', outputPath)
}

main().catch(console.error)
