// Define colors for consistency
const COLORS = {
  primaryDark: '#103138',
  accentGreen: '#20E28F',
  white: '#FFFFFF',
  lightBg: '#F7F9FC',
  textDark: '#103138',
  textLight: '#6D7278',
  borderColor: '#DDE2E5',
  cardShadow: 'rgba(0,0,0,0.12)',
};

// In a client component, we can't use fs.readFileSync
// For production, we'll just use empty strings since the font loading is handled server-side
const regularFontBase64 = '';
const boldFontBase64 = '';

export const pdfStyles = {
  // Default styles
  defaultStyle: {
    font: 'PlusJakarta',
    fontSize: 12,
    lineHeight: 1.5,
    color: '#333333',
  },
  
  // Heading styles
  header: {
    fontSize: 22,
    bold: true,
    color: '#202124',
    margin: [0, 0, 0, 10],
  },
  
  subheader: {
    fontSize: 18,
    bold: true,
    color: '#202124',
    margin: [0, 15, 0, 10],
  },
  
  sectionTitle: {
    fontSize: 16,
    bold: true,
    color: '#202124',
    margin: [0, 10, 0, 8],
  },
  
  // Text styles
  bold: {
    bold: true,
  },
  
  italic: {
    italics: true,
  },
  
  highlight: {
    background: '#F8F9FA',
    color: '#1A73E8',
  },
  
  // Table styles
  table: {
    margin: [0, 5, 0, 15],
  },
  
  tableHeader: {
    bold: true,
    fontSize: 13,
    color: '#202124',
    fillColor: '#F1F3F4',
  },
  
  // Link style
  link: {
    color: '#1A73E8',
    decoration: 'underline',
  },
  
  // Quote style
  quote: {
    italics: true,
    margin: [20, 10, 20, 10],
    color: '#5F6368',
  },
  
  // List styles
  listItem: {
    margin: [0, 2, 0, 2],
  },
  
  // Custom branding elements
  brandHeader: {
    fontSize: 14,
    color: '#1A73E8',
    bold: true,
  },
  
  brandFooter: {
    fontSize: 10,
    color: '#5F6368',
    alignment: 'center',
  },
};

// Export default to be compatible with different import methods
export default pdfStyles; 