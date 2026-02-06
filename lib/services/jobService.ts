/**
 * Service layer for Job operations using Prisma
 */

import { prisma } from '../db';
import type { Job } from '@prisma/client';
import type { JobData, MovewareJob, transformJobForDatabase } from '../types/job';

class JobService {
  /**
   * Get a job by ID
   */
  async getJob(jobId: string): Promise<Job | null> {
    try {
      return await prisma.job.findUnique({
        where: { id: jobId },
      });
    } catch (error) {
      console.error('Error fetching job:', error);
      return null;
    }
  }

  /**
   * Get all jobs for a company
   */
  async getJobsByBrand(companyId: string): Promise<Job[]> {
    try {
      return await prisma.job.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Error fetching jobs by company:', error);
      return [];
    }
  }

  /**
   * Create or update a job from Moveware API data
   */
  async upsertJob(jobData: JobData): Promise<Job> {
    try {
      return await prisma.job.upsert({
        where: { id: jobData.id },
        create: jobData,
        update: jobData,
      });
    } catch (error) {
      console.error('Error upserting job:', error);
      throw error;
    }
  }

  /**
   * Delete a job
   */
  async deleteJob(jobId: string): Promise<void> {
    try {
      await prisma.job.delete({
        where: { id: jobId },
      });
    } catch (error) {
      console.error('Error deleting job:', error);
      throw error;
    }
  }

  /**
   * Search jobs by customer name
   */
  async searchJobs(searchTerm: string): Promise<Job[]> {
    try {
      return await prisma.job.findMany({
        where: {
          OR: [
            { customerName: { contains: searchTerm, mode: 'insensitive' } },
            { movewareJobId: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Error searching jobs:', error);
      return [];
    }
  }

  /**
   * Get jobs by date range (based on scheduled date)
   */
  async getJobsByDateRange(startDate: Date, endDate: Date): Promise<Job[]> {
    try {
      return await prisma.job.findMany({
        where: {
          scheduledDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { scheduledDate: 'desc' },
      });
    } catch (error) {
      console.error('Error fetching jobs by date range:', error);
      return [];
    }
  }
}

export const jobService = new JobService();
export default jobService;
