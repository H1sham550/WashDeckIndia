import { Buffer } from "buffer";

export interface PDFData {
  stationName: string;
  stationAddress?: string;
  stationPhone?: string;
  stationEmail?: string;
  vehicleNumber: string;
  vehicleType: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  customerName?: string;
  customerPhone?: string;
  services: { name: string; price: number }[];
  subtotal: number;
  discount: number;
  finalAmount: number;
  notes?: string;
  invoiceNumber?: string;
  createdAt: Date;
}

export function generateReportPDF(data: PDFData): Buffer {
  const escapeStr = (str: string) => {
    if (!str) return "";
    return str
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)");
  };

  const lines: string[] = [];

  // Colors: Teal (#0f766e) -> RGB(15, 118, 110) -> (0.059, 0.463, 0.431)
  // Dark gray (#1f2937) -> RGB(31, 41, 55) -> (0.122, 0.161, 0.216)
  // Light gray (#f3f4f6) -> RGB(243, 244, 246) -> (0.953, 0.957, 0.965)
  // Border gray (#e5e7eb) -> RGB(229, 231, 235) -> (0.898, 0.906, 0.922)

  // Header Title
  lines.push("BT");
  lines.push("/F2 20 Tf"); // Helvetica-Bold 20
  lines.push("0.059 0.463 0.431 rg"); // Teal
  lines.push("40 790 Td");
  lines.push(`(${escapeStr(data.stationName.toUpperCase())}) Tj`);
  lines.push("ET");

  // Station Info Subtitle
  lines.push("BT");
  lines.push("/F1 9 Tf"); // Helvetica 9
  lines.push("0.3 0.3 0.3 rg"); // Medium gray
  lines.push("14 TL"); // Line leading
  lines.push("40 770 Td");
  if (data.stationAddress) {
    lines.push(`(${escapeStr(data.stationAddress)}) Tj T*`);
  }
  let contactInfo = "";
  if (data.stationPhone) contactInfo += `Phone: ${data.stationPhone}`;
  if (data.stationEmail) contactInfo += (contactInfo ? " | " : "") + `Email: ${data.stationEmail}`;
  if (contactInfo) {
    lines.push(`(${escapeStr(contactInfo)}) Tj T*`);
  }
  lines.push("ET");

  // Verified Badge / Header right
  lines.push("BT");
  lines.push("/F2 11 Tf");
  lines.push("0.059 0.463 0.431 rg");
  lines.push("380 790 Td");
  lines.push("(VERIFIED SERVICE REPORT) Tj");
  lines.push("ET");
  
  if (data.invoiceNumber) {
    lines.push("BT");
    lines.push("/F1 10 Tf");
    lines.push("0.122 0.161 0.216 rg");
    lines.push("380 775 Td");
    lines.push(`(Invoice: ${escapeStr(data.invoiceNumber)}) Tj`);
    lines.push("ET");
  }

  // Divider Line
  lines.push("0.059 0.463 0.431 RG"); // Teal stroke
  lines.push("1 w");
  lines.push("40 725 m");
  lines.push("555 725 l");
  lines.push("S");

  // Draw two info boxes (Vehicle & Customer)
  // Vehicle Details Box
  lines.push("0.953 0.957 0.965 rg"); // Light gray fill
  lines.push("0.898 0.906 0.922 RG"); // Border gray
  lines.push("0.5 w");
  lines.push("40 610 245 95 re"); // Left box
  lines.push("B"); // Fill & Stroke

  // Customer Details Box
  lines.push("0.953 0.957 0.965 rg");
  lines.push("0.898 0.906 0.922 RG");
  lines.push("310 610 245 95 re"); // Right box
  lines.push("B");

  // Text inside Left Box (Vehicle)
  lines.push("BT");
  lines.push("0.122 0.161 0.216 rg");
  lines.push("/F2 9 Tf");
  lines.push("13 TL");
  lines.push("50 685 Td");
  lines.push("(VEHICLE DETAILS) Tj T*");
  lines.push("/F1 9 Tf");
  lines.push(`(Plate No: ${escapeStr(data.vehicleNumber)}) Tj T*`);
  lines.push(`(Type: ${escapeStr(data.vehicleType)}) Tj T*`);
  const brandModel = [data.vehicleBrand, data.vehicleModel].filter(Boolean).join(" ");
  lines.push(`(Brand/Model: ${escapeStr(brandModel || "N/A")}) Tj T*`);
  lines.push("ET");

  // Text inside Right Box (Customer)
  lines.push("BT");
  lines.push("0.122 0.161 0.216 rg");
  lines.push("/F2 9 Tf");
  lines.push("13 TL");
  lines.push("320 685 Td");
  lines.push("(CUSTOMER & ORDER INFO) Tj T*");
  lines.push("/F1 9 Tf");
  lines.push(`(Customer: ${escapeStr(data.customerName || "Walk-in")}) Tj T*`);
  lines.push(`(Phone: ${escapeStr(data.customerPhone || "N/A")}) Tj T*`);
  const dateStr = data.createdAt.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  lines.push(`(Date: ${escapeStr(dateStr)}) Tj T*`);
  lines.push("ET");

  // Services performed title
  lines.push("BT");
  lines.push("0.059 0.463 0.431 rg"); // Teal
  lines.push("/F2 11 Tf");
  lines.push("40 580 Td");
  lines.push("(SERVICES PERFORMED) Tj");
  lines.push("ET");

  // Services Table Header
  lines.push("0.059 0.463 0.431 RG"); // Teal stroke
  lines.push("1 w");
  lines.push("40 570 m");
  lines.push("555 570 l");
  lines.push("S");

  // Table header text
  lines.push("BT");
  lines.push("0.122 0.161 0.216 rg");
  lines.push("/F2 9 Tf");
  lines.push("40 558 Td");
  lines.push("(Service Description) Tj");
  lines.push("ET");

  lines.push("BT");
  lines.push("0.122 0.161 0.216 rg");
  lines.push("/F2 9 Tf");
  lines.push("480 558 Td");
  lines.push("(Amount) Tj");
  lines.push("ET");

  lines.push("0.898 0.906 0.922 RG"); // Light gray line under header
  lines.push("0.5 w");
  lines.push("40 550 m");
  lines.push("555 550 l");
  lines.push("S");

  // List services
  let currentY = 535;
  data.services.forEach((s) => {
    // Description
    lines.push("BT");
    lines.push("0.122 0.161 0.216 rg");
    lines.push("/F1 9 Tf");
    lines.push(`40 ${currentY} Td`);
    lines.push(`(${escapeStr(s.name)}) Tj`);
    lines.push("ET");

    // Price
    lines.push("BT");
    lines.push("0.122 0.161 0.216 rg");
    lines.push("/F1 9 Tf");
    lines.push(`480 ${currentY} Td`);
    lines.push(`(INR ${s.price.toFixed(2)}) Tj`);
    lines.push("ET");

    // Draw thin line below
    lines.push("0.95 0.95 0.95 RG");
    lines.push(`40 ${currentY - 6} m`);
    lines.push(`555 ${currentY - 6} l`);
    lines.push("S");

    currentY -= 20;
  });

  // Totals Section
  currentY -= 5;

  // Subtotal
  lines.push("BT");
  lines.push("/F1 9 Tf");
  lines.push(`380 ${currentY} Td`);
  lines.push("(Subtotal:) Tj");
  lines.push("ET");

  lines.push("BT");
  lines.push("/F1 9 Tf");
  lines.push(`480 ${currentY} Td`);
  lines.push(`(INR ${data.subtotal.toFixed(2)}) Tj`);
  lines.push("ET");

  currentY -= 15;

  // Discount (if any)
  if (data.discount > 0) {
    lines.push("BT");
    lines.push("/F1 9 Tf");
    lines.push(`380 ${currentY} Td`);
    lines.push("(Discount:) Tj");
    lines.push("ET");

    lines.push("BT");
    lines.push("/F1 9 Tf");
    lines.push(`480 ${currentY} Td`);
    lines.push(`(- INR ${data.discount.toFixed(2)}) Tj`);
    lines.push("ET");

    currentY -= 15;
  }

  // Final Total
  lines.push("BT");
  lines.push("0.059 0.463 0.431 rg"); // Teal
  lines.push("/F2 10 Tf");
  lines.push(`380 ${currentY} Td`);
  lines.push("(Total Amount Paid:) Tj");
  lines.push("ET");

  lines.push("BT");
  lines.push("0.059 0.463 0.431 rg"); // Teal
  lines.push("/F2 10 Tf");
  lines.push(`480 ${currentY} Td`);
  lines.push(`(INR ${data.finalAmount.toFixed(2)}) Tj`);
  lines.push("ET");

  currentY -= 25;

  // Notes / Intake observations section
  if (data.notes) {
    lines.push("BT");
    lines.push("0.059 0.463 0.431 rg"); // Teal
    lines.push("/F2 10 Tf");
    lines.push(`40 ${currentY} Td`);
    lines.push("(INTAKE OBSERVATIONS & NOTES) Tj");
    lines.push("ET");

    currentY -= 12;
    lines.push("0.059 0.463 0.431 RG"); // Teal stroke
    lines.push("0.5 w");
    lines.push(`40 ${currentY} m`);
    lines.push(`555 ${currentY} l`);
    lines.push("S");

    currentY -= 15;

    lines.push("BT");
    lines.push("0.3 0.3 0.3 rg");
    lines.push("/F1 9 Tf");
    lines.push("12 TL");
    lines.push(`40 ${currentY} Td`);
    
    const noteLines = data.notes.split("\n");
    noteLines.forEach((nl) => {
      lines.push(`(${escapeStr(nl)}) Tj T*`);
    });
    lines.push("ET");
  }

  // Footer
  lines.push("BT");
  lines.push("0.5 0.5 0.5 rg");
  lines.push("/F3 9 Tf"); // Italic
  lines.push("200 50 Td");
  lines.push("(Thank you for choosing WashDeck!) Tj");
  lines.push("ET");

  lines.push("BT");
  lines.push("0.5 0.5 0.5 rg");
  lines.push("/F1 8 Tf");
  lines.push("160 38 Td");
  lines.push("(This is a system-generated verified digital report and invoice.) Tj");
  lines.push("ET");

  const streamContent = lines.join("\n") + "\n";
  const streamLength = Buffer.byteLength(streamContent, "utf-8");

  // Assemble PDF Objects
  const pdfObjects: string[] = [];
  const offsets: number[] = [];

  let currentOffset = 0;

  const appendToPDF = (str: string): number => {
    const offset = currentOffset;
    pdfObjects.push(str);
    currentOffset += Buffer.byteLength(str, "utf-8");
    return offset;
  };

  // Header
  appendToPDF("%PDF-1.4\n");

  // Obj 1: Catalog
  const obj1Offset = appendToPDF(
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
  );
  offsets.push(obj1Offset);

  // Obj 2: Pages list
  const obj2Offset = appendToPDF(
    "2 0 obj\n<< /Type /Pages /Kids [ 3 0 R ] /Count 1 >>\nendobj\n"
  );
  offsets.push(obj2Offset);

  // Obj 3: Page definition
  const obj3Offset = appendToPDF(
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [ 0 0 595.275 841.89 ] /Contents 5 0 R >>\nendobj\n"
  );
  offsets.push(obj3Offset);

  // Obj 4: Resources (defining fonts)
  const obj4Offset = appendToPDF(
    "4 0 obj\n<< /Font << /F1 6 0 R /F2 7 0 R /F3 8 0 R >> >>\nendobj\n"
  );
  offsets.push(obj4Offset);

  // Obj 5: Page contents stream
  const obj5Header = `5 0 obj\n<< /Length ${streamLength} >>\nstream\n`;
  const obj5Footer = "endstream\nendobj\n";
  const obj5Offset = appendToPDF(obj5Header + streamContent + obj5Footer);
  offsets.push(obj5Offset);

  // Obj 6: Font Helvetica
  const obj6Offset = appendToPDF(
    "6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
  );
  offsets.push(obj6Offset);

  // Obj 7: Font Helvetica-Bold
  const obj7Offset = appendToPDF(
    "7 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n"
  );
  offsets.push(obj7Offset);

  // Obj 8: Font Helvetica-Oblique
  const obj8Offset = appendToPDF(
    "8 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>\nendobj\n"
  );
  offsets.push(obj8Offset);

  // Cross-reference Table (xref)
  const xrefOffset = currentOffset;
  let xref = `xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    xref += offset.toString().padStart(10, "0") + " 00000 n \n";
  }

  // Trailer
  const trailer = `trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  appendToPDF(xref + trailer);

  return Buffer.concat(pdfObjects.map((obj) => Buffer.from(obj, "utf-8")));
}
