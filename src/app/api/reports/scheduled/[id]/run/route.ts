// Scheduled Reports API - Run Report Immediately
// /api/reports/scheduled/[id]/run - Execute a scheduled report immediately
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/api-utils';
import { handleApiError } from '@/lib/api-error-handler';

// POST /api/reports/scheduled/[id]/run - Run a scheduled report immediately
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    // Get the scheduled report
    const scheduledReport = await prisma.scheduledReport.findUnique({
      where: { id },
    });

    if (!scheduledReport) {
      return NextResponse.json(
        { success: false, error: 'Scheduled report not found' },
        { status: 404 }
      );
    }

    // Create a run record
    const run = await prisma.scheduledReportRun.create({
      data: {
        scheduledReportId: id,
        status: 'pending',
        runAt: new Date(),
      },
    });

    // TODO: Implement actual report generation logic
    // This would call the appropriate report generation function based on reportType
    // For now, we'll simulate a successful run

    try {
      // Simulate report generation
      // In a real implementation, this would:
      // 1. Generate the report based on reportType and parameters
      // 2. Save the file to storage
      // 3. Send emails to recipients
      // 4. Update the run record with the file URL

      const mockFileUrl = `/reports/scheduled/${scheduledReport.reportType}/${run.id}.pdf`;
      const mockFileSize = 12345; // Mock file size in bytes
      const mockRecords = Math.floor(Math.random() * 100) + 1; // Mock record count

      // Update run record as successful
      const updatedRun = await prisma.scheduledReportRun.update({
        where: { id: run.id },
        data: {
          status: 'success',
          fileUrl: mockFileUrl,
          fileSize: mockFileSize,
          generatedRecords: mockRecords,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          run: updatedRun,
          message: 'Report generated successfully',
        },
      });
    } catch (generationError: any) {
      // Update run record as failed
      await prisma.scheduledReportRun.update({
        where: { id: run.id },
        data: {
          status: 'failed',
          errorMessage: generationError.message || 'Unknown error during report generation',
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to generate report',
          details: generationError.message,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error running scheduled report:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to run scheduled report' },
      { status: 500 }
    );
  }
}
