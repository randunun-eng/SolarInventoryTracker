import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatDateTime } from './utils';

// Add typings for jsPDF with autoTable plugin
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// Common header for all reports
const createReportHeader = (
  doc: jsPDF, 
  title: string, 
  subtitle?: string
) => {
  // Add report title
  doc.setFontSize(20);
  doc.setTextColor(44, 62, 80);
  doc.text(title, 14, 22);
  
  // Add subtitle if provided
  if (subtitle) {
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(subtitle, 14, 30);
  }
  
  // Add company info
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Solar Inverter Repair Management System', 14, 40);
  doc.text(`Generated on: ${formatDateTime(new Date())}`, 14, 45);
  
  // Add line separator
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 50, 196, 50);
};

// Page footer with page numbers
const addFooter = (doc: jsPDF) => {
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Page ${i} of ${pageCount}`, 196, 285, { align: 'right' });
  }
};

// Generate inventory report
export const generateInventoryReport = (
  components: any[],
  categories: any[]
) => {
  const doc = new jsPDF();
  
  // Add header
  createReportHeader(doc, 'Inventory Report', 'Complete component inventory listing');
  
  // Summary section
  doc.setFontSize(12);
  doc.setTextColor(44, 62, 80);
  doc.text('Inventory Summary', 14, 60);
  
  doc.setFontSize(10);
  doc.text(`Total Components: ${components.length}`, 14, 70);
  
  // Count items by category
  const categoryCounts: {[key: string]: number} = {};
  components.forEach(comp => {
    const categoryId = comp.categoryId;
    if (categoryId) {
      categoryCounts[categoryId] = (categoryCounts[categoryId] || 0) + 1;
    }
  });
  
  // Get category names and display counts
  let yPos = 75;
  Object.entries(categoryCounts).forEach(([categoryId, count]) => {
    const category = categories.find(c => c.id === parseInt(categoryId));
    const categoryName = category ? category.name : 'Uncategorized';
    doc.text(`${categoryName}: ${count} components`, 14, yPos);
    yPos += 5;
  });
  
  // Count low stock items
  const lowStockCount = components.filter(c => 
    (c.currentStock <= c.minimumStock) || 
    (c.minimumStock === null && c.currentStock <= 10)
  ).length;
  
  doc.text(`Low Stock Items: ${lowStockCount}`, 14, yPos + 5);
  
  // Calculate total inventory value
  const totalValue = components.reduce((sum, comp) => {
    return sum + ((comp.currentStock || 0) * (comp.supplierPrice || 0));
  }, 0);
  
  doc.text(`Total Inventory Value: $${totalValue.toFixed(2)}`, 14, yPos + 10);
  
  // Components list table
  doc.autoTable({
    startY: yPos + 20,
    head: [['Component Name', 'Part #', 'Category', 'Current Stock', 'Min Stock', 'Supplier Price']],
    body: components.map(comp => {
      const category = categories.find(c => c.id === comp.categoryId);
      return [
        comp.name,
        comp.partNumber || '-',
        category ? category.name : '-',
        comp.currentStock || '0',
        comp.minimumStock || '10',
        comp.supplierPrice ? `$${comp.supplierPrice.toFixed(2)}` : '-'
      ];
    }),
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    alternateRowStyles: { fillColor: [240, 240, 240] }
  });
  
  // Low stock items section
  const lowStockItems = components.filter(c => 
    (c.currentStock <= c.minimumStock) || 
    (c.minimumStock === null && c.currentStock <= 10)
  );
  
  if (lowStockItems.length > 0) {
    doc.addPage();
    doc.text('Low Stock Items', 14, 20);
    
    doc.autoTable({
      startY: 30,
      head: [['Component Name', 'Current Stock', 'Min Stock', 'Status']],
      body: lowStockItems.map(comp => {
        let status = 'Below Minimum';
        if (comp.currentStock <= 0) {
          status = 'Out of Stock';
        } else if (comp.currentStock <= (comp.minimumStock / 2)) {
          status = 'Critically Low';
        }
        
        return [
          comp.name,
          comp.currentStock || '0',
          comp.minimumStock || '10',
          status
        ];
      }),
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [231, 76, 60], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 240, 240] }
    });
  }
  
  // Add footer with page numbers
  addFooter(doc);
  
  return doc;
};

// Generate repair report for a specific repair
export const generateRepairReport = async (
  repair: any,
  client: any,
  inverter: any,
  usedComponents: any[],
  components: any[]
) => {
  const doc = new jsPDF();
  
  // Add header
  createReportHeader(doc, 'Repair Report', `Repair #${repair.id}`);
  
  // Client and Inverter Information
  doc.setFontSize(12);
  doc.setTextColor(44, 62, 80);
  doc.text('Client Information', 14, 60);
  
  doc.setFontSize(10);
  if (client) {
    doc.text(`Client: ${client.name}`, 14, 70);
    doc.text(`Email: ${client.email || 'N/A'}`, 14, 75);
    doc.text(`Phone: ${client.phone || 'N/A'}`, 14, 80);
    doc.text(`Address: ${client.address || 'N/A'}`, 14, 85);
  } else {
    doc.text(`Client ID: ${repair.clientId}`, 14, 70);
  }
  
  doc.setFontSize(12);
  doc.text('Inverter Information', 14, 95);
  
  doc.setFontSize(10);
  if (inverter) {
    doc.text(`Model: ${inverter.model}`, 14, 105);
    doc.text(`Serial Number: ${inverter.serialNumber}`, 14, 110);
    doc.text(`Warranty Status: ${inverter.warrantyStatus || 'N/A'}`, 14, 115);
    doc.text(`Installation Date: ${inverter.installationDate ? formatDateTime(new Date(inverter.installationDate)) : 'N/A'}`, 14, 120);
  } else {
    doc.text(`Inverter ID: ${repair.inverterId}`, 14, 105);
  }
  
  // Repair Details
  doc.setFontSize(12);
  doc.text('Repair Details', 14, 130);
  
  doc.setFontSize(10);
  doc.text(`Status: ${repair.status || 'N/A'}`, 14, 140);
  doc.text(`Received Date: ${formatDateTime(new Date(repair.receivedDate))}`, 14, 145);
  
  if (repair.estimatedCompletionDate) {
    doc.text(`Estimated Completion: ${formatDateTime(new Date(repair.estimatedCompletionDate))}`, 14, 150);
  }
  
  if (repair.completionDate) {
    doc.text(`Completed On: ${formatDateTime(new Date(repair.completionDate))}`, 14, 155);
  }
  
  let yPos = repair.completionDate ? 160 : 150;
  
  doc.text(`Fault Description: ${repair.faultDescription || 'N/A'}`, 14, yPos + 5);
  doc.text(`Technician: ${repair.technicianName || 'N/A'}`, 14, yPos + 10);
  doc.text(`Labor Hours: ${repair.laborHours || '0'}`, 14, yPos + 15);
  doc.text(`Labor Rate: $${repair.laborRate || '0'}/hour`, 14, yPos + 20);
  
  yPos += 25;
  
  // Progress Updates Section
  if (repair.statusHistory && repair.statusHistory.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(44, 62, 80);
    doc.text('Progress Updates', 14, yPos + 10);
    yPos += 20;
    
    for (const update of repair.statusHistory) {
      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      // Status update header
      doc.text(`Status: ${update.status}`, 14, yPos);
      doc.text(`Date: ${formatDateTime(new Date(update.timestamp))}`, 14, yPos + 5);
      
      if (update.note) {
        // Split long notes into multiple lines
        const noteLines = doc.splitTextToSize(`Notes: ${update.note}`, 180);
        doc.text(noteLines, 14, yPos + 10);
        yPos += 5 + (noteLines.length * 5);
      }
      
      yPos += 15;
      
      // Add photos if present
      if (update.photos && update.photos.length > 0) {
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text('Photos:', 14, yPos);
        yPos += 10;
        
        let photoX = 14;
        let photosInRow = 0;
        
        for (const photo of update.photos) {
          try {
            // Check if we need a new page for photos
            if (yPos > 220) {
              doc.addPage();
              yPos = 20;
              photoX = 14;
              photosInRow = 0;
            }
            
            // Try to load and add the image
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            await new Promise((resolve, reject) => {
              img.onload = () => {
                try {
                  // Calculate dimensions to fit in PDF
                  const maxWidth = 45;
                  const maxHeight = 35;
                  let width = maxWidth;
                  let height = (img.height * maxWidth) / img.width;
                  
                  if (height > maxHeight) {
                    height = maxHeight;
                    width = (img.width * maxHeight) / img.height;
                  }
                  
                  // Add image to PDF
                  doc.addImage(img, 'JPEG', photoX, yPos, width, height);
                  
                  // Move to next position
                  photoX += width + 5;
                  photosInRow++;
                  
                  // Move to next row if needed
                  if (photosInRow >= 3) {
                    yPos += height + 10;
                    photoX = 14;
                    photosInRow = 0;
                  }
                  
                  resolve(null);
                } catch (error) {
                  console.error('Error adding image to PDF:', error);
                  resolve(null);
                }
              };
              img.onerror = () => resolve(null);
              img.src = photo;
            });
          } catch (error) {
            console.error('Error loading photo:', error);
          }
        }
        
        // Adjust yPos after photos
        if (photosInRow > 0) {
          yPos += 40;
        }
      }
      
      yPos += 10;
      
      // Add separator line
      doc.setDrawColor(200, 200, 200);
      doc.line(14, yPos, 196, yPos);
      yPos += 10;
    }
  }
  
  // Used Components Table
  if (usedComponents && usedComponents.length > 0) {
    // Check if we need a new page
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(12);
    doc.setTextColor(44, 62, 80);
    doc.text('Components Used', 14, yPos);
    
    doc.autoTable({
      startY: yPos + 10,
      head: [['Component', 'Quantity', 'Unit Price', 'Total']],
      body: usedComponents.map(uc => {
        const component = components.find(c => c.id === uc.componentId);
        return [
          component ? component.name : `Component #${uc.componentId}`,
          uc.quantity,
          `$${uc.unitPrice.toFixed(2)}`,
          `$${(uc.quantity * uc.unitPrice).toFixed(2)}`
        ];
      }),
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 240, 240] }
    });
    
    // Cost Summary
    const lastY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.setFontSize(10);
    doc.text(`Parts Cost: $${repair.totalPartsCost?.toFixed(2) || '0.00'}`, 140, lastY);
    doc.text(`Labor Cost: $${(repair.laborHours * repair.laborRate).toFixed(2) || '0.00'}`, 140, lastY + 5);
    doc.setFontSize(12);
    doc.text(`Total Cost: $${repair.totalCost?.toFixed(2) || '0.00'}`, 140, lastY + 15);
    
    // Technician Notes
    if (repair.technicianNotes) {
      doc.setFontSize(12);
      doc.text('Technician Notes', 14, lastY + 30);
      
      doc.setFontSize(10);
      const splitText = doc.splitTextToSize(repair.technicianNotes, 180);
      doc.text(splitText, 14, lastY + 40);
    }
  }
  
  // Add footer with page numbers
  addFooter(doc);
  
  return doc;
};

// Generate monthly business report
export const generateBusinessReport = (
  repairs: any[],
  components: any[],
  mostUsedComponents: any[],
  commonFaultTypes: any[]
) => {
  const doc = new jsPDF();
  
  // Get the current month and year
  const today = new Date();
  const monthName = today.toLocaleString('default', { month: 'long' });
  const year = today.getFullYear();
  
  // Add header
  createReportHeader(doc, 'Business Performance Report', `${monthName} ${year}`);
  
  // Filter repairs for the current month
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthRepairs = repairs.filter(repair => 
    new Date(repair.receivedDate) >= monthStart
  );
  
  // Business metrics
  doc.setFontSize(12);
  doc.setTextColor(44, 62, 80);
  doc.text('Monthly Business Metrics', 14, 60);
  
  doc.setFontSize(10);
  doc.text(`Total Repairs: ${monthRepairs.length}`, 14, 70);
  
  // Calculate completed repairs and completion rate
  const completedRepairs = monthRepairs.filter(r => r.status === 'Completed');
  const completionRate = monthRepairs.length > 0 
    ? ((completedRepairs.length / monthRepairs.length) * 100).toFixed(1) 
    : '0.0';
  
  doc.text(`Completed Repairs: ${completedRepairs.length} (${completionRate}%)`, 14, 75);
  
  // Calculate average repair time
  let avgRepairTime = 0;
  if (completedRepairs.length > 0) {
    const totalDays = completedRepairs.reduce((sum, repair) => {
      const receivedDate = new Date(repair.receivedDate);
      const completionDate = new Date(repair.completionDate);
      const days = (completionDate.getTime() - receivedDate.getTime()) / (1000 * 3600 * 24);
      return sum + days;
    }, 0);
    avgRepairTime = totalDays / completedRepairs.length;
  }
  
  doc.text(`Average Repair Time: ${avgRepairTime.toFixed(1)} days`, 14, 80);
  
  // Calculate total revenue
  const totalRevenue = monthRepairs.reduce((sum, repair) => sum + (repair.totalCost || 0), 0);
  const avgRepairCost = monthRepairs.length > 0 ? totalRevenue / monthRepairs.length : 0;
  
  doc.text(`Total Revenue: $${totalRevenue.toFixed(2)}`, 14, 85);
  doc.text(`Average Repair Cost: $${avgRepairCost.toFixed(2)}`, 14, 90);
  
  // Revenue Breakdown
  const partsCost = monthRepairs.reduce((sum, repair) => sum + (repair.totalPartsCost || 0), 0);
  const laborCost = totalRevenue - partsCost;
  
  doc.text(`Revenue from Parts: $${partsCost.toFixed(2)} (${((partsCost / totalRevenue) * 100).toFixed(1)}%)`, 14, 95);
  doc.text(`Revenue from Labor: $${laborCost.toFixed(2)} (${((laborCost / totalRevenue) * 100).toFixed(1)}%)`, 14, 100);
  
  // Most Used Components
  if (mostUsedComponents && mostUsedComponents.length > 0) {
    doc.setFontSize(12);
    doc.text('Most Used Components', 14, 115);
    
    doc.autoTable({
      startY: 125,
      head: [['Component', 'Usage Count']],
      body: mostUsedComponents.map(comp => [
        comp.componentName,
        comp.totalUsed
      ]),
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 240, 240] }
    });
  }
  
  // Common Fault Types
  if (commonFaultTypes && commonFaultTypes.length > 0) {
    const lastY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 15 : 160;
    
    doc.setFontSize(12);
    doc.text('Common Repair Issues', 14, lastY);
    
    doc.autoTable({
      startY: lastY + 10,
      head: [['Fault Type', 'Percentage']],
      body: commonFaultTypes.map(ft => [
        ft.faultTypeName,
        `${ft.percentage}%`
      ]),
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [231, 76, 60], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 240, 240] }
    });
  }
  
  // Monthly Repairs Table
  doc.addPage();
  doc.setFontSize(12);
  doc.text('Monthly Repairs', 14, 20);
  
  doc.autoTable({
    startY: 30,
    head: [['Repair ID', 'Client ID', 'Status', 'Received', 'Completed', 'Total Cost']],
    body: monthRepairs.map(repair => [
      repair.id,
      repair.clientId,
      repair.status || 'N/A',
      formatDateTime(new Date(repair.receivedDate)),
      repair.completionDate ? formatDateTime(new Date(repair.completionDate)) : 'N/A',
      repair.totalCost ? `$${repair.totalCost.toFixed(2)}` : 'N/A'
    ]),
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    alternateRowStyles: { fillColor: [240, 240, 240] }
  });
  
  // Add footer with page numbers
  addFooter(doc);
  
  return doc;
};

// Generic function to save PDF
export const savePdf = (doc: jsPDF, filename: string) => {
  doc.save(filename);
};