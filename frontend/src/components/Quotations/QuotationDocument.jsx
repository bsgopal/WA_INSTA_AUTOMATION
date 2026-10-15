import React, { forwardRef } from 'react';
import { Box, Typography, Stack, Divider } from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LanguageIcon from '@mui/icons-material/Language';
import BusinessIcon from '@mui/icons-material/Business';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';
import defaultLogo from '../../assets/logo.jpeg';

// Helper to calculate dynamic opacity tints from hex color
const getAlphaColor = (hex, opacityHex = '15') => {
  if (hex && hex.startsWith('#') && (hex.length === 7 || hex.length === 9)) {
    return `${hex.slice(0, 7)}${opacityHex}`;
  }
  return 'rgba(132, 204, 22, 0.12)';
};

/**
 * High-Fidelity Quotation Document Component
 * Dynamic Terms & Conditions from Settings + Dual Signature (Customer Acceptance & Service Provider)
 */
const QuotationDocument = forwardRef(function QuotationDocument(
  { quotation = {}, isPreview = false },
  ref
) {
  const {
    quotationNumber = 'RT/2026/091',
    title = 'Custom Software Development',
    subtitle = 'A tailored solution to streamline your operations and support your business growth.',
    date = new Date(),
    validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    customerName = 'ABC Enterprises',
    address = '123, Main Road, Gobichettipalayam, Erode – 638452, Tamil Nadu, India',
    items = [
      { sNo: 1, item: 'Requirements Analysis & Planning', amount: 15000 },
      { sNo: 2, item: 'Custom Software Development', amount: 85000 },
      { sNo: 3, item: 'Testing & Quality Assurance', amount: 10000 },
      { sNo: 4, item: 'Deployment & Training', amount: 10000 },
      { sNo: 5, item: '1 Year Support & Maintenance', amount: 15000 }
    ],
    currencySymbol = '₹',
    totalAmount = 135000,
    companyDetails = {},
    terms = [
      '50% advance payment to start the project.',
      'Balance payment after final delivery.',
      'Timeline: 4 – 6 weeks (depends on features).',
      '1 year free support for the delivered project.',
      'Quotation is valid for 30 days.'
    ],
    signatoryName = 'Renic Team',
    signatoryCompany = 'RENIC TECH',
    themeColor = '#84CC16' // Exact Renic Tech Logo Lime Green
  } = quotation;

  // Split Title into primary and accent words
  const titleParts = (title || 'Custom Software Development').split(' ');
  const firstWord = titleParts.slice(0, Math.ceil(titleParts.length / 2)).join(' ');
  const accentWord = titleParts.slice(Math.ceil(titleParts.length / 2)).join(' ');

  // Format Dates
  const formatDateStr = (d) => {
    if (!d) return '';
    try {
      const parsed = new Date(d);
      return parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return String(d);
    }
  };

  const cDetails = {
    companyName: companyDetails.companyName || 'RENIC TECH',
    tagline: companyDetails.tagline || 'AUTOMATION & CRM SOLUTIONS',
    phone: companyDetails.phone || '+91 88070 25752',
    email: companyDetails.email || 'info@renictechnology.com',
    website: companyDetails.website || 'www.renictechnology.com',
    logoUrl: companyDetails.logoUrl || defaultLogo
  };

  const brandColor = themeColor || '#84CC16';
  const bgSoft = getAlphaColor(brandColor, '12');
  const borderSoft = getAlphaColor(brandColor, '30');
  const ribbonGradient = `linear-gradient(135deg, ${getAlphaColor(brandColor, '12')} 0%, ${getAlphaColor(brandColor, '25')} 50%, ${getAlphaColor(brandColor, '40')} 100%)`;

  return (
    <Box
      ref={ref}
      className="quotation-print-container"
      sx={{
        width: '100%',
        maxWidth: isPreview ? '820px' : '100%',
        margin: '0 auto',
        bgcolor: '#FFFFFF',
        color: '#0F172A',
        fontFamily: "'Inter', 'Segoe UI', -apple-system, sans-serif",
        p: { xs: 2.5, sm: 4, md: 5 },
        position: 'relative',
        boxShadow: isPreview ? '0 10px 30px rgba(0,0,0,0.08)' : 'none',
        borderRadius: isPreview ? '12px' : 0,
        overflow: 'hidden',
        '@media print': {
          boxShadow: 'none',
          p: 3,
          m: 0,
          width: '100%',
          maxWidth: '100%'
        }
      }}
    >
      {/* ========================================================
          1. HEADER (EXACT RENIC TECH LOGO ON LEFT, CONTACT ON RIGHT)
          ======================================================== */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5 }}>
        {/* Company Logo & Tagline */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <img
            src={cDetails.logoUrl}
            alt="Renic Tech Logo"
            style={{ height: 68, maxWidth: 280, objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.06))' }}
          />
        </Box>

        {/* Company Contact Column */}
        <Box sx={{ borderLeft: `2.5px solid ${brandColor}`, pl: 2 }}>
          <Stack spacing={0.5}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PhoneIcon sx={{ fontSize: 14, color: brandColor }} />
              <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>
                {cDetails.phone}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmailIcon sx={{ fontSize: 14, color: brandColor }} />
              <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>
                {cDetails.email}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LanguageIcon sx={{ fontSize: 14, color: brandColor }} />
              <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>
                {cDetails.website}
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Box>

      {/* ========================================================
          2. TITLE + METADATA CARD
          ======================================================== */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3.5, flexWrap: { xs: 'wrap', sm: 'nowrap' }, gap: 2 }}>
        {/* Title & Subtitle */}
        <Box sx={{ flex: 1, pr: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: 2, color: '#475569', textTransform: 'uppercase' }}>
              QUOTATION
            </Typography>
            <Box sx={{ width: 45, height: 2.5, bgcolor: brandColor, borderRadius: 1 }} />
          </Box>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 900,
              fontSize: { xs: '1.6rem', sm: '2.1rem' },
              lineHeight: 1.15,
              color: '#0F172A',
              mb: 1
            }}
          >
            {firstWord}{' '}
            <span style={{ color: brandColor }}>{accentWord}</span>
          </Typography>

          <Typography sx={{ fontSize: '0.85rem', color: '#475569', maxWidth: 460, lineHeight: 1.4 }}>
            {subtitle}
          </Typography>
        </Box>

        {/* Quotation No / Date / Valid Till Box */}
        <Box
          sx={{
            bgcolor: bgSoft,
            border: `1px solid ${borderSoft}`,
            borderRadius: '12px',
            p: 2,
            minWidth: { xs: '100%', sm: 230 },
            flexShrink: 0
          }}
        >
          <Stack spacing={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
              <Typography sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.78rem' }}>Quotation No</Typography>
              <Typography sx={{ fontWeight: 800, color: '#0F172A', fontSize: '0.78rem' }}>: {quotationNumber}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
              <Typography sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.78rem' }}>Date</Typography>
              <Typography sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.78rem' }}>: {formatDateStr(date)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
              <Typography sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.78rem' }}>Valid Till</Typography>
              <Typography sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.78rem' }}>: {formatDateStr(validUntil)}</Typography>
            </Box>
          </Stack>
        </Box>
      </Box>

      {/* ========================================================
          3. "TO" CUSTOMER DETAILS
          ======================================================== */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.8, mb: 3.5 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: '10px',
            bgcolor: bgSoft,
            border: `1px solid ${borderSoft}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            mt: 0.3
          }}
        >
          <BusinessIcon sx={{ color: brandColor, fontSize: 24 }} />
        </Box>

        <Box>
          <Typography sx={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
            To
          </Typography>
          <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
            {customerName}
          </Typography>
          <Typography sx={{ fontSize: '0.8rem', color: '#475569', mt: 0.4, maxWidth: 520, lineHeight: 1.4 }}>
            {address}
          </Typography>
        </Box>
      </Box>

      {/* ========================================================
          4. ITEMIZED TABLE (RENIC LIME ACCENT HEADER & TOTAL BAR)
          ======================================================== */}
      <Box sx={{ mb: 3.5, borderRadius: '12px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: brandColor, color: '#0F172A' }}>
              <th style={{ padding: '12px 16px', width: '70px', textAlign: 'center', fontWeight: 900, fontSize: '0.85rem' }}>
                S.No
              </th>
              <th style={{ padding: '12px 16px', fontWeight: 900, fontSize: '0.85rem' }}>
                Project / Service
              </th>
              <th style={{ padding: '12px 20px', width: '180px', textAlign: 'right', fontWeight: 900, fontSize: '0.85rem' }}>
                Amount (INR)
              </th>
            </tr>
          </thead>
          <tbody>
            {(items || []).map((row, idx) => (
              <tr
                key={idx}
                style={{
                  backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                  borderBottom: '1px solid #F1F5F9'
                }}
              >
                <td style={{ padding: '12px 16px', textAlign: 'center', color: '#334155', fontWeight: 700, fontSize: '0.85rem' }}>
                  {row.sNo || idx + 1}
                </td>
                <td style={{ padding: '12px 16px', color: '#0F172A', fontWeight: 700, fontSize: '0.85rem' }}>
                  {row.item || row.name}
                  {(row.description) && (
                    <span style={{ display: 'block', fontWeight: 400, color: '#64748B', fontSize: '0.75rem', marginTop: 2 }}>
                      {row.description}
                    </span>
                  )}
                </td>
                <td style={{ padding: '12px 20px', textAlign: 'right', color: '#0F172A', fontWeight: 800, fontSize: '0.85rem' }}>
                  {currencySymbol} {(row.amount || (Number(row.qty || 1) * Number(row.rate || 0)) || 0).toLocaleString('en-IN')}
                </td>
              </tr>
            ))}

            {/* Total Row */}
            <tr style={{ backgroundColor: bgSoft }}>
              <td colSpan={2} style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 900, fontSize: '0.95rem', color: '#0F172A' }}>
                Total Amount (INR)
              </td>
              <td
                style={{
                  backgroundColor: brandColor,
                  color: '#0F172A',
                  padding: '14px 20px',
                  textAlign: 'right',
                  fontWeight: 900,
                  fontSize: '1.25rem',
                  letterSpacing: 0.5
                }}
              >
                {currencySymbol} {(totalAmount || 0).toLocaleString('en-IN')}
              </td>
            </tr>
          </tbody>
        </table>
      </Box>

      {/* ========================================================
          5. DYNAMIC TERMS & CONDITIONS SECTION
          ======================================================== */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <DescriptionIcon sx={{ color: brandColor, fontSize: 18 }} />
          <Typography sx={{ fontWeight: 900, fontSize: '0.9rem', color: '#0F172A' }}>
            Terms &amp; Conditions
          </Typography>
        </Box>
        <ul style={{ margin: 0, paddingLeft: 20, color: '#475569', fontSize: '0.78rem', lineHeight: 1.6 }}>
          {(terms || []).map((term, i) => (
            <li key={i} style={{ marginBottom: 3 }}>
              {term}
            </li>
          ))}
        </ul>
      </Box>

      {/* ========================================================
          6. DUAL SIGNATURE (CUSTOMER ACCEPTANCE & AUTHORIZED SIGNATURE)
          ======================================================== */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 4, flexWrap: { xs: 'wrap', sm: 'nowrap' }, gap: 3 }}>
        {/* Customer Acceptance & Signature Box */}
        <Box
          sx={{
            flex: 1,
            minWidth: { xs: '100%', sm: 280 },
            p: 2,
            bgcolor: bgSoft,
            border: `1px dashed ${borderSoft}`,
            borderRadius: '12px'
          }}
        >
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: 0.5, mb: 3.5 }}>
            Customer Acceptance &amp; Signature
          </Typography>
          <Box sx={{ width: '100%', height: 1.5, bgcolor: '#94A3B8', mb: 0.8 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Typography sx={{ fontSize: '0.72rem', color: '#334155', fontWeight: 700 }}>
              {customerName || 'Authorized Signatory'}
            </Typography>
            <Typography sx={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>
              Date: ____________________
            </Typography>
          </Box>
        </Box>

        {/* Service Provider Authorized Signature Box */}
        <Box sx={{ textAlign: 'center', minWidth: 200, alignSelf: 'flex-end' }}>
          <Typography
            sx={{
              fontFamily: "'Brush Script MT', 'Dancing Script', 'Caveat', cursive, sans-serif",
              fontSize: '1.8rem',
              color: '#0F172A',
              lineHeight: 1,
              mb: 0.5
            }}
          >
            {signatoryName}
          </Typography>
          <Box sx={{ width: 160, height: 2, bgcolor: brandColor, mx: 'auto', mb: 0.8 }} />
          <Typography sx={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
            Authorized Signature
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 900, color: '#0F172A', letterSpacing: 0.5 }}>
            {signatoryCompany}
          </Typography>
        </Box>
      </Box>

      {/* ========================================================
          7. BOTTOM VALUE PROPOSITIONS & WAVE FOOTER
          ======================================================== */}
      <Box
        sx={{
          borderRadius: '16px',
          p: { xs: 2, sm: 2.5 },
          background: ribbonGradient,
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          position: 'relative',
          overflow: 'hidden',
          border: `1px solid ${borderSoft}`
        }}
      >
        {/* Value Prop 1 */}
        <Stack direction="row" spacing={1.2} alignItems="center">
          <Box sx={{ width: 34, height: 34, borderRadius: '8px', bgcolor: brandColor, color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircleIcon sx={{ fontSize: 18 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '0.8rem', color: '#0F172A', lineHeight: 1.1 }}>
              Reliable
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
              Technology
            </Typography>
          </Box>
        </Stack>

        <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(0,0,0,0.08)', display: { xs: 'none', sm: 'block' } }} />

        {/* Value Prop 2 */}
        <Stack direction="row" spacing={1.2} alignItems="center">
          <Box sx={{ width: 34, height: 34, borderRadius: '8px', bgcolor: brandColor, color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUpIcon sx={{ fontSize: 18 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '0.8rem', color: '#0F172A', lineHeight: 1.1 }}>
              Scalable
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
              Solutions
            </Typography>
          </Box>
        </Stack>

        <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(0,0,0,0.08)', display: { xs: 'none', sm: 'block' } }} />

        {/* Value Prop 3 */}
        <Stack direction="row" spacing={1.2} alignItems="center">
          <Box sx={{ width: 34, height: 34, borderRadius: '8px', bgcolor: brandColor, color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PeopleIcon sx={{ fontSize: 18 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '0.8rem', color: '#0F172A', lineHeight: 1.1 }}>
              Long-Term
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
              Partnership
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
});

export default QuotationDocument;
