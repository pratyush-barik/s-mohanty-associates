# Core Architectural Standard: Bucket Creation & Utilization
*SMA Valuation Portal — System Architecture Specification & Standard Operating Procedure*

---

## 1. Executive Summary & Core Philosophy

In the SMA Valuation Portal, visual evidence and spatial assets are categorized into two strictly separated subsystems:
1. **The Field Cloud Inspection Bucket (`bucketImages`)**: A single, shared, project-level repository of real-time site photos captured on-site by field engineers during physical inspections.
2. **Report Upload Slots**: Builder-specific input targets where images, spatial drawings, statutory circulars, and financial spreadsheets are embedded into a formal valuation report draft.

### The Exclusivity Invariant (Golden Rule)
> **The Cloud Inspection Bucket is EXCLUSIVELY accessible by Property Photographs / Site Photographs.**
> All maps (Satellite, Mouza, Boundary Sketches, Cadastral/Bhulekh maps), statutory documents (Benchmark circulars, CII tables, BDA Master Plan extracts), and financial annexures (Excel spreadsheets) must be handled **STRICTLY via Local Device Upload (`+ Add ...`)** from the report writer's workstation.

---

## 2. Modality & Permission Matrix

| Asset Category | Target Builder Section | Allowed Modalities | Cloud Bucket (`📁 Pick from Bucket`) | Local Device (`📷 Add / + Upload`) | Component Contract |
|---|---|:---:|:---:|:---:|---|
| **Property / Site Photographs** | Photographs Section | **Dual Modality** | ✅ **ALLOWED** (Pick from field engineer inspection pool) | ✅ **ALLOWED** (Upload additional photos from PC) | `<BasePhotographsSection>` |
| **Google Satellite Screenshots** | Maps & Documents Section | **Device Only** | ❌ **FORBIDDEN** | ✅ **ALLOWED** (`+ Add Satellite Image`) | `<BaseMapsSection>` |
| **Mouza Survey Maps** | Maps & Documents Section | **Device Only** | ❌ **FORBIDDEN** | ✅ **ALLOWED** (`+ Add Mouza Map`) | `<BaseMapsSection>` |
| **Boundary / Layout Sketches** | Maps & Documents Section | **Device Only** | ❌ **FORBIDDEN** | ✅ **ALLOWED** (`+ Add Sketch Map`) | `<BaseMapsSection>` |
| **Cadastral / Bhulekh Maps** | Maps & Documents Section | **Device Only** | ❌ **FORBIDDEN** | ✅ **ALLOWED** (`+ Add Cadastral Map`) | `<BaseMapsSection>` |
| **Statutory Docs (Benchmark, CII, Master Plan)** | Statutory / Value Estimation | **Device Only** | ❌ **FORBIDDEN** | ✅ **ALLOWED** (`+ Upload Document / Circular`) | Dedicated document inputs |
| **Supporting Excel Annexures** | Annexures Section | **Device Only** | ❌ **FORBIDDEN** | ✅ **ALLOWED** (`+ Upload Excel / Spreadsheet`) | `<BaseAnnexureSection>` |

---

## 3. Bucket Creation & Lifecycle (Backend / Storage / DB)

### 3.1 Scoping & Identity
- **Scope**: Exactly **ONE** bucket exists per project, scoped to `projectId`.
- **Creation Lifecycle**: The bucket is not an empty folder that needs pre-provisioning. It is materialized as records in PostgreSQL when photos are uploaded during site inspection.
- **Physical Storage Layer**:
  - **Bucket**: Supabase Storage (`STORAGE_BUCKETS.VALUATION_DOCUMENTS`).
  - **Path Pattern**: `projects/${projectId}/inspections/${timestamp}_${cleanFileName}` (generated via `STORAGE_PATHS.inspectionPhoto(projectId, fileName)`).
- **Relational Data Model (`prisma/schema.prisma`)**:
  ```prisma
  model BucketImage {
    id          String   @id @default(uuid())
    projectId   String
    employeeId  String
    url         String
    storagePath String
    fileName    String
    size        Int
    mimeType    String
    createdAt   DateTime @default(now())
    project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
    employee    Employee @relation(fields: [employeeId], references: [id])

    @@index([projectId])
  }
  ```

### 3.2 Ingestion Constraints & Security Rules
- **Quota Limit**: Maximum **30 photos** per project bucket.
- **File Size Limit**: Maximum **10MB** per photo.
- **Supported MIME Types**: `image/jpeg`, `image/png`, `image/webp`.
- **Role-Based Upload Access (`saveBucketImage`)**:
  - Only assigned **Field Engineers**, the assigned **Project Manager**, or the **Firm Owner** may upload photos to the bucket.
- **State-Based Bucket Locking**:
  - Once a project reaches `MANAGER_REVIEW` or `COMPLETED`, field agent upload and deletion permissions are automatically **LOCKED** to preserve evidentiary chain of custody.
- **Inspection Milestone Gate**:
  - An inspection milestone cannot be marked `COMPLETED` unless at least **1 photo** has been uploaded to the bucket.

---

## 4. Bucket Hydration & Health Pipeline (Server Layer)

When any report builder is loaded via `/portal/reports/[projectId]/page.tsx`:
1. **Database Query**: `prisma.bucketImage.findMany({ where: { projectId }, orderBy: { createdAt: 'desc' } })`.
2. **Automated URL Verification**: The server performs concurrent `HEAD` requests to verify image reachability in Supabase.
3. **Dead Link Auto-Purge**: Corrupted or missing storage objects are automatically removed from `BucketImage` in the database to prevent broken thumbnails in report builders.
4. **Prop Injection**: Clean, verified bucket images are injected into `BuilderSelector` and passed down to the active report builder.

---

## 5. Bucket Utilization in Report Builders (Client Layer)

### 5.1 Property Photographs — `<BasePhotographsSection>`
The Property Photographs section in every report builder MUST adhere to the following contract:
- **Dual Ingestion**:
  1. `[📷 Add Property Images]`: Native file input for local uploads from the desktop (`multiple`, `accept="image/*"`).
  2. `[📁 Pick from Bucket]`: Opens the `BasePhotoBucketModal`, displaying the count of field photos available: `📁 Pick from Bucket (${bucketCount})`.
- **Inline Editing & Drag-and-Drop**:
  - Photo labels default to `"Site Picture"` and are editable inline.
  - Drag handle (`⠿`) allows arbitrary reordering of photos for the final PDF.
- **Safe Removal Semantics (Zero Accidental Deletion)**:
  - Clicking the red `✕` button on a photo card removes the image URL from `fields.propertyImages`.
  - It **NEVER** calls `deleteBucketImage()` or removes files from Supabase. The image remains safe in the project cloud bucket.
- **Submission Gate**:
  - Requires at least **2 photos** uploaded/picked before report verification can be submitted to the manager.

### 5.2 The Cloud Bucket Picker Modal — `<BasePhotoBucketModal>`
- **Selection-Only Role**: The modal serves strictly as an ingestion bridge for report writers.
- **Multi-Select & Bulk Import**: Checkbox selection with "Select All" and counter badges.
- **Field Agent Filtering**: When multiple engineers inspected the site, tabs allow filtering photos by inspector.
- **Direct Appending**: Selected photos are appended directly to `fields.propertyImages`.

### 5.3 Maps Section — `<BaseMapsSection>`
The Maps & Spatial Drawings section MUST adhere to the following boundaries:
- **Zero Bucket Callbacks**: Props `onOpenBucketPicker` and `bucketCount` are **strictly forbidden**.
- **Local Device Upload Only**: Dedicated cards for:
  - `+ Add Satellite Image` (Google Satellite screenshot)
  - `+ Add Mouza Map` (Revenue/Mouza survey map)
  - `+ Add Sketch Map` (Site sketch / Boundary layout)
  - `+ Add Cadastral Map` (Bhulekh land cadastral map)
- **Live Interactive Satellite Embed**:
  - Embedded Google Satellite iframe pinpointing the property via coordinates (`loc:lat,lng`) or property address.
  - Coordinates sync automatically with the report's Technical Coordinates section.
  - Multi-photo upload and drag-and-drop reordering per map card.

---

## 6. Implementation Across Report Builders

| Builder File | Property Photos (Dual Modality) | Maps & Sketches (Device Only) | Statutory Docs (Device Only) | Annexures (Device Only) |
|---|:---:|:---:|:---:|:---:|
| `GeneralReportBuilder.tsx` | Sec 12 (`BasePhotographsSection`) | Sec 13 & 14 | N/A | Sec 16 (`BaseAnnexureSection`) |
| `IncomeTaxReportBuilder.tsx` | Sec 12 (`BasePhotographsSection`) | Sec 13 & 14 | Sec 15 (Benchmark/CII/BDA) | Sec 5 (`BaseAnnexureSection`) |
| `IBBIReportBuilder.tsx` | Sec 14 (`BasePhotographsSection`) | Sec 1 & 14 | Sec 15 (Assumptions) | Annexure I & II |
| `BankReportBuilder.tsx` | Sec 11 (`BasePhotographsSection`) | Sec 12 (`BaseMapsSection`) | Custom bank fields | Sec 13 (`BaseAnnexureSection`) |
| `ArthanFinance.tsx` | Sec 12 (`BasePhotographsSection`) | Sec 13 (`BaseMapsSection`) | Locked Sec 11 | N/A |
| `AnnapurnaMicroFinance.tsx` | Sec 9 (`BasePhotographsSection`) | Sec 10 (`BaseMapsSection`) | N/A | N/A |
| `AdityaBirlaCapitalMLAP.tsx` | Photographs Section | Maps Section | N/A | N/A |
| `AdityaBirlaCapitalSTSL.tsx` | Photographs Section | Maps Section | N/A | N/A |
| `AxisAGRI.tsx` | Sec 13 (`BasePhotographsSection`) | Sec 12 (Diagram & Cadastral) | N/A | N/A |

---

## 7. Developer Implementation Guide (Creating New Bank Builders)

When creating or modifying a bank report builder:

### 1. In Property Photographs (Always use `BasePhotographsSection`):
```tsx
import { BasePhotographsSection, BasePhotoBucketModal } from '../BaseBankReportComponents';

// Inside component:
const [bucketPickerOpen, setBucketPickerOpen] = useState(false);

const handleBucketConfirm = (selectedUrls: string[]) => {
  if (selectedUrls.length === 0) return;
  const newUrls = [...(fields.propertyImages || []), ...selectedUrls];
  handleChange('propertyImages', newUrls);
};

// In JSX:
<BasePhotographsSection
  title="Property Photographs"
  propertyImages={fields.propertyImages || []}
  propertyImageNames={fields.propertyImageNames || []}
  isReadOnly={isReadOnly}
  uploading={uploading}
  bucketCount={bucketImages?.length || 0}
  onImageNameChange={(idx, name) => {
    const next = [...(fields.propertyImageNames || [])];
    next[idx] = name;
    handleChange('propertyImageNames', next);
  }}
  onRemoveImage={(idx) => {
    // Safe detach: removes from report draft ONLY
    const newPhotos = (fields.propertyImages || []).filter((_, i) => i !== idx);
    const newNames = (fields.propertyImageNames || []).filter((_, i) => i !== idx);
    handleChange('propertyImages', newPhotos);
    handleChange('propertyImageNames', newNames);
  }}
  onReorderImages={(newPhotos, newNames) => {
    handleChange('propertyImages', newPhotos);
    handleChange('propertyImageNames', newNames);
  }}
  onUploadImages={(e) => handleFileUpload(e, 'propertyImages')}
  onOpenBucketPicker={() => setBucketPickerOpen(true)}
  sectionNumber={12}
  sectionId="section-12"
/>

<BasePhotoBucketModal
  isOpen={bucketPickerOpen}
  bucketImages={bucketImages}
  onClose={() => setBucketPickerOpen(false)}
  onConfirm={handleBucketConfirm}
/>
```

### 2. In Maps & Spatial Drawings (Always use `BaseMapsSection`):
```tsx
import { BaseMapsSection } from '../BaseBankReportComponents';

<BaseMapsSection
  title="Maps & Documents"
  sectionNumber={13}
  sectionId="section-13"
  isReadOnly={isReadOnly}
  uploading={uploading}
  propertyAddress={fields.propertyAddress}
  latitude={fields.latitude}
  longitude={fields.longitude}
  locationMapImages={fields.locationMapImages}
  cadastralMapImages={fields.cadastralMapImages}
  mapOrder={['location', 'cadastral']}
  onLocationMapUpload={(e) => handleMultiMapUpload(e, 'locationMapImages')}
  onLocationMapRemove={(idx) => handleMapRemove('locationMapImages', idx)}
  onCadastralMapUpload={(e) => handleMultiMapUpload(e, 'cadastralMapImages')}
  onCadastralMapRemove={(idx) => handleMapRemove('cadastralMapImages', idx)}
  onReorderLocationMap={(imgs) => handleChange('locationMapImages', imgs)}
  onReorderCadastralMap={(imgs) => handleChange('cadastralMapImages', imgs)}
/>
```
*(Notice: `BaseMapsSection` does not accept `bucketCount` or `onOpenBucketPicker`)*

---

## 8. Forbidden Anti-Patterns (Strictly Prohibited)

1. ❌ **Do NOT add bucket picker buttons to Maps, Sketches, Cadastral, or Document sections.**
2. ❌ **Do NOT call `deleteBucketImage` when a user clicks the red `✕` remove button on an image card inside a report builder.**
3. ❌ **Do NOT split the field inspection bucket into multiple sub-buckets.** Field engineers upload all photos to one project bucket.
4. ❌ **Do NOT allow field engineers to modify bucket photos once the project enters `MANAGER_REVIEW` or `COMPLETED`.**
