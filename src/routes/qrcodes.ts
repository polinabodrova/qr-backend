import { Router, Request, Response } from "express";
import * as qrcodeService from "../services/qrcode.service";
import * as statsService from "../services/stats.service";

const router = Router();

// Create a new QR code
router.post("/", async (req: Request, res: Response) => {
  try {
    const qrCode = await qrcodeService.createQRCode(req.body);

    // Generate QR code image with redirect URL
    const redirectUrl = `${req.protocol}://${req.get("host")}/r/${qrCode.slug}`;
    const qrCodeImage = await qrcodeService.generateQRCodeImage(redirectUrl);

    res.status(201).json({
      ...qrCode,
      redirectUrl,
      qrCodeImage,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get all QR codes
router.get("/", async (req: Request, res: Response) => {
  try {
    const qrCodes = await qrcodeService.getAllQRCodes();

    // Add scan counts
    const qrCodesWithStats = await Promise.all(
      qrCodes.map(async (qr) => {
        try {
          const stats = await statsService.getQRCodeStats(qr.id);
          return {
            ...qr,
            totalScans: stats.totalScans,
            redirectUrl: `${req.protocol}://${req.get("host")}/r/${qr.slug}`,
          };
        } catch (statsError: any) {
          console.error(
            `Error getting stats for QR code ${qr.id}:`,
            statsError.message
          );
          return {
            ...qr,
            totalScans: 0,
            redirectUrl: `${req.protocol}://${req.get("host")}/r/${qr.slug}`,
          };
        }
      })
    );

    res.json(qrCodesWithStats);
  } catch (error: any) {
    console.error("Error getting QR codes:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get a single QR code
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const qrCode = await qrcodeService.getQRCodeById(id);

    if (!qrCode) {
      return res.status(404).json({ error: "QR code not found" });
    }

    const redirectUrl = `${req.protocol}://${req.get("host")}/r/${qrCode.slug}`;
    const qrCodeImage = await qrcodeService.generateQRCodeImage(redirectUrl);

    res.json({
      ...qrCode,
      redirectUrl,
      qrCodeImage,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update a QR code
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const qrCode = await qrcodeService.updateQRCode(id, req.body);

    if (!qrCode) {
      return res.status(404).json({ error: "QR code not found" });
    }

    res.json(qrCode);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Delete (archive) a QR code
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await qrcodeService.deleteQRCode(id);

    if (!deleted) {
      return res.status(404).json({ error: "QR code not found" });
    }

    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get stats for a QR code
router.get("/:id/stats", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const qrCode = await qrcodeService.getQRCodeById(id);

    if (!qrCode) {
      return res.status(404).json({ error: "QR code not found" });
    }

    const { startDate, endDate } = req.query;
    const stats = await statsService.getQRCodeStats(
      id,
      startDate as string,
      endDate as string
    );

    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
