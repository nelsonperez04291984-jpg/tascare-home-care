import pool from '../db.js';

const SERVICE_RATES = {
  'Personal Care': 65,
  'Nursing Care': 110,
  'Cleaning/Home Help': 55,
  'Meal Preparation': 60,
  'Transport': 50,
  'Social Support': 55,
  'Gardening': 70
};

// Helper: SLK Algorithm (Statistical Linkage Key)
const calculateSLK = (name, dob, gender) => {
  if (!name || !dob) return '00000000000000';
  
  const parts = name.trim().split(' ');
  const firstName = parts[0] || '';
  const lastName = parts[parts.length - 1] || '';
  
  const pad = (str, len) => (str + '222').substring(0, len).toUpperCase();
  
  // SLK Rules:
  // Surname: 2nd, 3rd, 5th letters
  let l2 = lastName[1] || '2';
  let l3 = lastName[2] || '2';
  let l5 = lastName[4] || '2';
  
  // First Name: 2nd, 3rd letters
  let f2 = firstName[1] || '2';
  let f3 = firstName[2] || '2';
  
  const alpha = (l2 + l3 + l5 + f2 + f3).toUpperCase();
  const dateStr = new Date(dob).toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD? Wait, usually DDMMYYYY
  const d = new Date(dob);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear().toString();
  const ddmmyyyy = day + month + year;
  
  let gCode = '9';
  if (gender?.toLowerCase() === 'male' || gender?.toLowerCase() === 'man') gCode = '1';
  if (gender?.toLowerCase() === 'female' || gender?.toLowerCase() === 'woman') gCode = '2';
  
  return alpha + ddmmyyyy + gCode;
};

export const getBillingSummary = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    
    // 1. Fetch all referrals with their care plans and schedules
    const query = `
      SELECT 
        r.id, r.client_name, r.funding_type, r.hcp_level, r.dob, r.gender,
        cp.monthly_budget,
        (SELECT JSON_AGG(s.*) FROM schedules s WHERE s.client_id = r.id AND s.status != 'cancelled') as visits
      FROM referrals r
      LEFT JOIN care_plans cp ON cp.client_id = r.id AND cp.status = 'active'
      WHERE r.tenant_id = $1 AND r.status = 'accepted'
    `;
    
    const result = await pool.query(query, [tenant_id]);
    
    const summary = result.rows.map(row => {
      const visits = row.visits || [];
      const actualSpend = visits.reduce((acc, v) => {
        const rate = SERVICE_RATES[v.service_type] || 65;
        return acc + (parseFloat(v.duration_hours) * rate);
      }, 0);
      
      return {
        id: row.id,
        name: row.client_name,
        funding: row.funding_type,
        hcpLevel: row.hcp_level,
        budget: parseFloat(row.monthly_budget || 0),
        actual: actualSpend,
        utilization: row.monthly_budget > 0 ? (actualSpend / row.monthly_budget) * 100 : 0,
        slk: calculateSLK(row.client_name, row.dob, row.gender),
        isDexReady: !!(row.dob && row.gender && row.postcode && row.aboriginal_status) // simplified check
      };
    });
    
    res.json(summary);
  } catch (error) {
    console.error('Error fetching billing summary:', error);
    res.status(500).json({ error: 'Failed to fetch billing data' });
  }
};

export const getDexExport = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    
    const query = `
      SELECT r.*, cp.services as plan_services
      FROM referrals r
      LEFT JOIN care_plans cp ON cp.client_id = r.id
      WHERE r.tenant_id = $1 AND r.status = 'accepted'
    `;
    
    const result = await pool.query(query, [tenant_id]);
    
    // Mock XML Generation for DEX
    let xml = `<?xml version="1.0" encoding="utf-8"?>\n<DEXData xmlns="http://dex.dss.gov.au/schema">\n`;
    xml += `  <Header>\n    <OrganisationId>${tenant_id}</OrganisationId>\n    <ReportingPeriodStart>2026-01-01</ReportingPeriodStart>\n    <ReportingPeriodEnd>2026-06-30</ReportingPeriodEnd>\n  </Header>\n`;
    
    result.rows.forEach(client => {
      const slk = calculateSLK(client.client_name, client.dob, client.gender);
      xml += `  <Client>\n`;
      xml += `    <ClientId>${client.id}</ClientId>\n`;
      xml += `    <SLK>${slk}</SLK>\n`;
      xml += `    <GenderCode>${client.gender === 'Male' ? '1' : '2'}</GenderCode>\n`;
      xml += `    <BirthDate>${client.dob ? new Date(client.dob).toISOString().split('T')[0] : ''}</BirthDate>\n`;
      xml += `    <AboriginalStatus>${client.aboriginal_status || '9'}</AboriginalStatus>\n`;
      xml += `  </Client>\n`;
    });
    
    xml += `</DEXData>`;
    
    res.setHeader('Content-Type', 'text/xml');
    res.setHeader('Content-Disposition', 'attachment; filename=DEX_Export.xml');
    res.send(xml);
    
  } catch (error) {
    console.error('Error generating DEX export:', error);
    res.status(500).json({ error: 'Failed to generate DEX export' });
  }
};
