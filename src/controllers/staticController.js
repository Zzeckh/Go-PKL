import prisma from '../config/db.js';

export const getCompanies = async (req, res, next) => {
  try {
    const companies = await prisma.company.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(companies);
  } catch (error) {
    next(error);
  }
};

export const getPerizinan = async (req, res, next) => {
  try {
    const perizinan = await prisma.perizinan.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(perizinan);
  } catch (error) {
    next(error);
  }
};

export const getMapLocations = async (req, res, next) => {
  try {
    const locations = await prisma.mapLocation.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(locations);
  } catch (error) {
    next(error);
  }
};
