package com.annapurna.cafesystem.service;

import com.annapurna.cafesystem.entity.Bill;
import com.annapurna.cafesystem.entity.CafeOrder;
import com.annapurna.cafesystem.entity.OrderItem;
import com.annapurna.cafesystem.repository.BillRepository;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.FileOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class BillService {

    @Autowired
    private BillRepository billRepository;

    @Value("${upload.dir}")
    private String uploadDir;

    public Bill generatePdfBill(CafeOrder order) throws Exception {
        Path billsPath = Paths.get(uploadDir, "bills");
        if (!Files.exists(billsPath)) {
            Files.createDirectories(billsPath);
        }

        String fileName = "Bill_" + order.getOrderNumber() + ".pdf";
        Path filePath = billsPath.resolve(fileName);

        Document document = new Document(PageSize.A5, 36, 36, 50, 36); // Receipt size
        PdfWriter writer = PdfWriter.getInstance(document, new FileOutputStream(filePath.toFile()));

        document.open();

        // Fonts
        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, BaseColor.BLACK);
        Font subtitleFont = FontFactory.getFont(FontFactory.HELVETICA, 10, BaseColor.GRAY);
        Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, BaseColor.BLACK);
        Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10, BaseColor.BLACK);
        Font itemFont = FontFactory.getFont(FontFactory.HELVETICA, 11, BaseColor.DARK_GRAY);

        // Header
        Paragraph title = new Paragraph("ANNAPURNA CAFE", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        document.add(title);

        Paragraph subtitle = new Paragraph("123 Food Street, City Center\nPhone: +91 9876543210 | GSTIN: 22AAAAA0000A1Z5", subtitleFont);
        subtitle.setAlignment(Element.ALIGN_CENTER);
        document.add(subtitle);

        document.add(new Paragraph(" "));
        com.itextpdf.text.pdf.draw.LineSeparator ls = new com.itextpdf.text.pdf.draw.LineSeparator();
        ls.setLineColor(BaseColor.LIGHT_GRAY);
        document.add(new Chunk(ls));
        document.add(new Paragraph(" "));

        // Order Info
        PdfPTable infoTable = new PdfPTable(2);
        infoTable.setWidthPercentage(100);
        infoTable.getDefaultCell().setBorder(Rectangle.NO_BORDER);
        
        infoTable.addCell(new Phrase("Order No: " + order.getOrderNumber(), normalFont));
        PdfPCell dateCell = new PdfPCell(new Phrase("Date: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm")), normalFont));
        dateCell.setBorder(Rectangle.NO_BORDER);
        dateCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        infoTable.addCell(dateCell);

        infoTable.addCell(new Phrase("Customer: " + order.getCustomerName(), normalFont));
        PdfPCell tableCell = new PdfPCell(new Phrase("Table: " + order.getTable().getTableNumber(), normalFont));
        tableCell.setBorder(Rectangle.NO_BORDER);
        tableCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        infoTable.addCell(tableCell);

        document.add(infoTable);
        document.add(new Paragraph(" "));
        document.add(new Chunk(ls));
        document.add(new Paragraph(" "));

        // Items Table
        PdfPTable table = new PdfPTable(new float[]{4, 1, 2});
        table.setWidthPercentage(100);
        
        PdfPCell c1 = new PdfPCell(new Phrase("Item Description", boldFont));
        c1.setBorder(Rectangle.BOTTOM); c1.setPaddingBottom(8f);
        table.addCell(c1);

        PdfPCell c2 = new PdfPCell(new Phrase("Qty", boldFont));
        c2.setBorder(Rectangle.BOTTOM); c2.setHorizontalAlignment(Element.ALIGN_CENTER); c2.setPaddingBottom(8f);
        table.addCell(c2);

        PdfPCell c3 = new PdfPCell(new Phrase("Amount", boldFont));
        c3.setBorder(Rectangle.BOTTOM); c3.setHorizontalAlignment(Element.ALIGN_RIGHT); c3.setPaddingBottom(8f);
        table.addCell(c3);

        double subtotal = 0;
        for (OrderItem item : order.getOrderItems()) {
            double itemTotal = item.getPriceAtTime() * item.getQuantity();
            subtotal += itemTotal;

            PdfPCell pCell = new PdfPCell(new Phrase(item.getProduct().getName(), itemFont));
            pCell.setBorder(Rectangle.NO_BORDER); pCell.setPaddingTop(8f);
            table.addCell(pCell);

            PdfPCell qCell = new PdfPCell(new Phrase(String.valueOf(item.getQuantity()), itemFont));
            qCell.setBorder(Rectangle.NO_BORDER); qCell.setHorizontalAlignment(Element.ALIGN_CENTER); qCell.setPaddingTop(8f);
            table.addCell(qCell);

            PdfPCell aCell = new PdfPCell(new Phrase(String.format("Rs. %.2f", itemTotal), itemFont));
            aCell.setBorder(Rectangle.NO_BORDER); aCell.setHorizontalAlignment(Element.ALIGN_RIGHT); aCell.setPaddingTop(8f);
            table.addCell(aCell);
        }

        document.add(table);
        document.add(new Paragraph(" "));
        document.add(new Chunk(ls));
        document.add(new Paragraph(" "));

        // Calculations
        double tax = subtotal * 0.05; // 5% GST
        double grandTotal = subtotal + tax;

        PdfPTable totalTable = new PdfPTable(new float[]{5, 2});
        totalTable.setWidthPercentage(100);
        totalTable.getDefaultCell().setBorder(Rectangle.NO_BORDER);

        totalTable.addCell(new Phrase("Subtotal:", normalFont));
        PdfPCell stCell = new PdfPCell(new Phrase(String.format("Rs. %.2f", subtotal), normalFont));
        stCell.setBorder(Rectangle.NO_BORDER); stCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        totalTable.addCell(stCell);

        totalTable.addCell(new Phrase("GST (5%):", normalFont));
        PdfPCell txCell = new PdfPCell(new Phrase(String.format("Rs. %.2f", tax), normalFont));
        txCell.setBorder(Rectangle.NO_BORDER); txCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        totalTable.addCell(txCell);

        totalTable.addCell(new Phrase(" ", normalFont));
        totalTable.addCell(new Phrase(" ", normalFont));

        PdfPCell grandTotalLabel = new PdfPCell(new Phrase("GRAND TOTAL:", boldFont));
        grandTotalLabel.setBorder(Rectangle.TOP); grandTotalLabel.setPaddingTop(8f);
        totalTable.addCell(grandTotalLabel);

        PdfPCell grandTotalVal = new PdfPCell(new Phrase(String.format("Rs. %.2f", grandTotal), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, BaseColor.BLACK)));
        grandTotalVal.setBorder(Rectangle.TOP); grandTotalVal.setHorizontalAlignment(Element.ALIGN_RIGHT); grandTotalVal.setPaddingTop(8f);
        totalTable.addCell(grandTotalVal);

        document.add(totalTable);

        document.add(new Paragraph(" "));
        document.add(new Paragraph(" "));
        Paragraph footer = new Paragraph("Thank you for dining with us!\nPlease visit again.", subtitleFont);
        footer.setAlignment(Element.ALIGN_CENTER);
        document.add(footer);

        document.close();

        Bill bill = Bill.builder()
                .order(order)
                .pdfPath(fileName)
                .generatedAt(LocalDateTime.now())
                .build();

        return billRepository.save(bill);
    }
}
