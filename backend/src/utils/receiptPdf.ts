import PDFDocument from "pdfkit";
import type { Response } from "express";

interface ReceiptData {
  bookingId: string;
  hotelName: string;
  roomType: string;
  guestName: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  totalPrice: string;
  status: string;
}

export function streamReceiptPdf(res: Response, data: ReceiptData) {
  const doc = new PDFDocument({ margin: 50 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=receipt-${data.bookingId}.pdf`);
  doc.pipe(res);

  doc.fontSize(20).text("NuzulJO — Booking Receipt", { align: "center" });
  doc.moveDown();
  doc.fontSize(11);
  doc.text(`Booking ID: ${data.bookingId}`);
  doc.text(`Status: ${data.status}`);
  doc.moveDown();
  doc.text(`Guest: ${data.guestName}`);
  doc.text(`Hotel: ${data.hotelName}`);
  doc.text(`Room type: ${data.roomType}`);
  doc.text(`Check-in: ${data.checkIn.toDateString()}`);
  doc.text(`Check-out: ${data.checkOut.toDateString()}`);
  doc.text(`Guests: ${data.guests}`);
  doc.moveDown();
  doc.fontSize(14).text(`Total: ${data.totalPrice} JOD`, { align: "right" });

  doc.end();
}
