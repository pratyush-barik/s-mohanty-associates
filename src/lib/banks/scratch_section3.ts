  private drawSbbSection3() {
    const fields = this.fields;
    
    this.drawSectionSubtitle('DETAILS OF THE PROPERTY BEING VALUED');
    
    const drawCheckbox = (x: number, y: number, checked: boolean, text: string) => {
      const boxSize = 8;
      this.page.drawRectangle({
        x: x,
        y: this.pdfY(y) - boxSize + 1,
        width: boxSize,
        height: boxSize,
        borderColor: rgb(0,0,0),
        borderWidth: 1
      });
      const font = checked ? this.fontBold : this.fontRegular;
      this.page.drawText(text, {
        x: x + boxSize + 4,
        y: this.pdfY(y),
        size: FONT_SIZE,
        font: font,
        color: rgb(0,0,0)
      });
    };

    const drawRow = (leftText: string, drawRight: (x: number, y: number, w: number) => number) => {
      const startY = this.cursorY;
      const leftW = 160;
      const rightW = CONTENT_W - leftW;
      
      // We assume height is at most 200, check page space
      this.checkPageSpace(150);
      
      // Draw right content first to determine height
      const rightX = MARGIN_L + leftW + 5;
      const finalY = drawRight(rightX, this.cursorY + 5, rightW - 10);
      
      const rowHeight = (finalY - this.cursorY) + 5;
      
      // Draw borders
      this.page.drawRectangle({
        x: MARGIN_L,
        y: this.pdfY(this.cursorY + rowHeight),
        width: CONTENT_W,
        height: rowHeight,
        borderColor: rgb(0,0,0),
        borderWidth: 1
      });
      // Vertical line
      this.page.drawLine({
        start: { x: MARGIN_L + leftW, y: this.pdfY(this.cursorY) },
        end: { x: MARGIN_L + leftW, y: this.pdfY(this.cursorY + rowHeight) },
        thickness: 1,
        color: rgb(0,0,0)
      });
      
      // Draw left text vertically centered
      const leftLines = this.wrapText(leftText, leftW - 10, FONT_SIZE, false);
      const textH = leftLines.length * (FONT_SIZE + 4);
      let ty = this.cursorY + (rowHeight - textH) / 2 + FONT_SIZE;
      for (const line of leftLines) {
        this.page.drawText(line, { x: MARGIN_L + 5, y: this.pdfY(ty), size: FONT_SIZE, font: this.fontRegular, color: rgb(0,0,0) });
        ty += FONT_SIZE + 4;
      }
      
      this.cursorY += rowHeight;
    };

    drawRow('LOCATION OF PROPERTY', (x, y, w) => {
      let cy = y;
      const loc = fields.axisSbbPropertyLocation || '';
      drawCheckbox(x, cy, loc === 'Urban', 'URBAN');
      drawCheckbox(x + 70, cy, loc === 'Semi-Urban', 'SEMI-URBAN');
      drawCheckbox(x + 165, cy, loc === 'Rural/Gram Panchayat', 'RURAL/GRAM PANCHAYAT');
      
      cy += 16;
      const gov = fields.axisSbbGoverningBody || '';
      drawCheckbox(x, cy, gov === 'Corporation', 'CORPORATION');
      drawCheckbox(x + 100, cy, gov === 'Municipality', 'MUNICIPALITY');
      drawCheckbox(x + 200, cy, gov === 'Town or Gram Panchayat or Rural', 'TOWN OR GRAM PANCHAYAT OR RURAL');
      
      cy += 24;
      this.page.drawText('IF TOWN OR GRAM PANCHAYAT, PLEASE CHOOSE THE APPROPRIATE ONE IN BELOW: -', {
        x: x, y: this.pdfY(cy), size: FONT_SIZE, font: this.fontRegular, color: rgb(0,0,0)
      });
      
      cy += 20;
      const t = fields.axisSbbTownPlanningSubType || '';
      
      const drawType = (label: string, text: string, isChecked: boolean) => {
        const fullText = `${label}:- ${text}`;
        const lines = this.wrapText(fullText, w, FONT_SIZE, false);
        const font = isChecked ? this.fontBold : this.fontRegular;
        // underline the label part if needed? Image shows underlines on TYPE 1, TYPE 2A etc.
        // It's easier just to print it bold or regular. Image shows label underlined, text regular. 
        // We will just draw it as regular/bold based on selection.
        for (const line of lines) {
          this.page.drawText(line, { x: x, y: this.pdfY(cy), size: FONT_SIZE, font: font, color: rgb(0,0,0) });
          // Underline if it contains TYPE
          if (line.startsWith('TYPE')) {
            const splitMatch = line.match(/^(TYPE [A-Z0-9]+:-)/);
            if (splitMatch) {
               const uw = font.widthOfTextAtSize(splitMatch[1], FONT_SIZE);
               this.page.drawLine({
                 start: { x: x, y: this.pdfY(cy) - 2 },
                 end: { x: x + uw, y: this.pdfY(cy) - 2 },
                 thickness: 1,
                 color: rgb(0,0,0)
               });
            }
          }
          cy += 14;
        }
        cy += 6;
      };
      
      drawType('TYPE 1', 'LAYOUT PLAN & INDIVIDUAL CONSTRUCTION BOTH ARE APPROVED BY TOWN PLANNING AUTHORITY.', t === 'TYPE 1');
      drawType('TYPE 2A', 'LAYOUT PLAN APPROVED BY TOWN PLANNING AUTHORITY AND CONSTRUCTION APPROVED BY GRAMPANCHAYAT.', t === 'TYPE 2A');
      drawType('TYPE 2B', 'LAYOUT PLAN & INDIVIDUAL CONSTRUCTION BOTH ARE APPROVED BY GRAMPANCHAYAT BUT PROPERTY NOW FALLS IN MUNICIPALITY.', t === 'TYPE 2B');
      drawType('TYPE 3', 'LAYOUT PLAN & INDIVIDUAL CONSTRUCTION BOTH ARE APPROVED BY GRAMPANCHAYAT BUT PROPERTY NOW FALLS INSIDE GRAM PANCHAYAT.', t === 'TYPE 3');
      
      return cy;
    });

    drawRow('DOCUMENTS PROVIDED', (x, y, w) => {
      let cy = y;
      
      drawCheckbox(x, cy, !!fields.axisSbbDocPrevValuation, 'COPY OF PREVIOUS VALUATION REPORT');
      drawCheckbox(x + 220, cy, !!fields.axisSbbDocApprovedLayout, 'APPROVED LAYOUT');
      drawCheckbox(x + 340, cy, !!fields.axisSbbDocCommencement, 'COMMENCEMENT');
      
      cy += 16;
      drawCheckbox(x, cy, !!fields.axisSbbDocApprovedBuildingPlan, 'APPROVED BUILDING PLAN');
      drawCheckbox(x + 160, cy, !!fields.axisSbbDocSaleDeed, 'COPY OF SALE DEED/ PATTA');
      drawCheckbox(x + 340, cy, !!fields.axisSbbDocOccupancy, 'CERTIFICATE'); // wait, the image says "COMMENCEMENT CERTIFICATE"?
      
      // Let's re-read the image carefully.
      // Line 1: [x] COPY OF PREVIOUS VALUATION REPORT  [x] APPROVED LAYOUT  [x] COMMENCEMENT
      // Line 2: [x] APPROVED BUILDING PLAN  [x] COPY OF SALE. DEED/ PATTA  [x] CERTIFICATE
      // Line 3: [x] OCCUPANCY CERTIFICATE   [x] COPY PARTITION DEED        [x] SKETCH MAP
      
      cy += 16;
      drawCheckbox(x, cy, !!fields.axisSbbDocOccupancy, 'OCCUPANCY CERTIFICATE');
      drawCheckbox(x + 160, cy, !!fields.axisSbbDocPartitionDeed, 'COPY PARTITION DEED');
      drawCheckbox(x + 320, cy, !!fields.axisSbbDocSketchMap, 'SKETCH MAP');
      
      cy += 16;
      return cy;
    });
  }
