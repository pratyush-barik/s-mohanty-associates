import { createClient } from '@supabase/supabase-js';
import { PDFReportRenderer } from './src/lib/pdf-report-renderer';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, project_code, status, draft_data')
    .not('draft_data', 'is', null)
    .limit(1);
    
  if (error || !projects || projects.length === 0) {
    console.error('No projects with draft data found.', error);
    return;
  }
  
  const project = projects[0];
  console.log(`Testing PDF generation for project: ${project.id} (${project.project_code})`);
  
  const fields = project.draft_data as any;
  
  try {
    const r = new PDFReportRenderer();
    await r.init(new Uint8Array(0));
    
    console.log('Renderer initialized');
    
    r.drawSectionHeader('GENERAL DETAILS');
    r.drawOptionRow('Type of property', ['Residential', 'Commercial', 'Residential cum Commercial', 'Industrial', 'Vacant Plot'], fields.propertyType);
    
    const ownerNameStr = `"${fields.ownerName || 'N/A'}"`;
    r.drawSimpleRow('Name of the Customer(s)', ownerNameStr);
    console.log('General rows rendered');
    
    const floorValuations = Array.isArray(fields.floors) ? fields.floors.map((f: any) => {
      const area = parseFloat(f.area) || 0;
      const rate = parseFloat(f.rate) || 0;
      const estimated = area * rate;
      const life = parseFloat(f.lifeYears) || 0;
      const age = parseFloat(f.ageYears) || 0;
      const depPct = f.depreciationPct ? (parseFloat(f.depreciationPct) || 0) : 10; 
      const depAmount = estimated * depPct / 100;
      const netValue = estimated - depAmount;
      return { ...f, area, rate, estimated, depPct, depAmount, netValue };
    }) : [];

    const totalBuildingValue = floorValuations.reduce((sum: number, f: any) => sum + f.netValue, 0);

    const floorHeaders = ['Floor', 'Area', 'Rate (₹)', 'Estimated (₴)', 'Life', 'Age', 'Dep%', 'Net Value (₴)'];
    
    r.drawFloorTable(
      floorHeaders,
      floorValuations.map((f: any) => ({
        name: f.name || '',
        area: String(f.area),
        rate: String(f.rate),
        estimated: String(f.estimated),
        life: String(f.lifeYears),
        age: String(f.ageYears),
        dep: `${f.depPct}'`,
        netValue: String(f.netValue),
      })),
      'im test',
      String(totalBuildingValue),
    );
    const ageOptions = ['1-10 years', '11-25 years', '26-50 years', '>50 years'];
    r.drawAgeOptionRow('Age of Property', ageOptions, fields.ageOfProperty, fields.ageOfPropertyActual);

    console.log('Floor table rendered');
    
    r.drawCertificateBox([
      {
        segments: [
          { text: 'This is to certify that ' },
          { text: fields.ownerName, bold: true },
          { text: ' situated at ' },
          { text: 'ADDRESS', bold: true },
          { text: ' on ' },
          { text: fields.dateOfInspection, bold: true },
        "],
      }
    ]);
    const options = ['Excellent', 'Very Good', 'Good', 'Difficult'];
    r.drawOptionRow('Marketability', options, fields.marketability);
    console.log('Certificate box rendered');

    await r.toBlob();
    console.log('PDF Blob generated successfully!');
    
  } catch (err) {
    console.error('Error during PDF rendering:');
    console.error(err);
  }
}

main();