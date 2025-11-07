const request = require("supertest");
const express = require("express");
const apiRoutes = require("../src/routes/api");
const db = require("../src/models");

// Mock the database models
jest.mock("../src/models", () => ({
  ScoringSettings: {
    getDefault: jest.fn(),
  },
  Supplier: {
    find: jest.fn(),
  },
}));

const app = express();
app.use(express.json());
app.use("/api", apiRoutes);

describe("CSV Export Endpoints", () => {
  const mockSettings = {
    useIndustryBands: true,
    environmentalWeight: 0.4,
    socialWeight: 0.3,
    governanceWeight: 0.3,
    riskPenaltyEnabled: true,
    riskThreshold: 0.3,
    riskLambda: 1.0,
    toObject: function() { return this; },
  };

  const mockSuppliers = [
    {
      _id: "123",
      name: "Test Supplier 1",
      country: "USA",
      industry: "Electronics",
      ethical_score: 85,
      toObject: function() { return this; },
    },
    {
      _id: "456",
      name: "Test Supplier 2",
      country: "Canada",
      industry: "Manufacturing",
      ethical_score: 72,
      toObject: function() { return this; },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    db.ScoringSettings.getDefault.mockResolvedValue(mockSettings);
    db.Supplier.find.mockResolvedValue(mockSuppliers);
  });

  describe("GET /api/exports/rankings", () => {
    it("should export baseline rankings as CSV", async () => {
      const response = await request(app)
        .get("/api/exports/rankings?scenario=baseline")
        .expect(200)
        .expect("Content-Type", /csv/);

      expect(response.text).toContain("SupplierID,Rank");
      expect(response.headers["content-disposition"]).toMatch(/rankings_baseline/);
    });

    it("should export S1 scenario rankings", async () => {
      const response = await request(app)
        .get("/api/exports/rankings?scenario=s1")
        .expect(200)
        .expect("Content-Type", /csv/);

      expect(response.text).toContain("SupplierID,Rank");
      expect(response.headers["content-disposition"]).toMatch(/rankings_s1/);
    });

    it("should export S2 scenario rankings", async () => {
      const response = await request(app)
        .get("/api/exports/rankings?scenario=s2")
        .expect(200);
    });

    it("should export S3 scenario rankings", async () => {
      const response = await request(app)
        .get("/api/exports/rankings?scenario=s3")
        .expect(200);
    });

    it("should export S4 scenario rankings", async () => {
      const response = await request(app)
        .get("/api/exports/rankings?scenario=s4")
        .expect(200);
    });

    it("should rank suppliers by ethical score", async () => {
      const response = await request(app)
        .get("/api/exports/rankings?scenario=baseline")
        .expect(200);

      const rows = response.text.split("\n");
      expect(rows.length).toBeGreaterThan(1); // Header + at least 1 data row
    });
  });

  describe("GET /api/exports/industry-map", () => {
    beforeEach(() => {
      db.Supplier.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([
          { _id: "123", name: "Test Supplier 1", industry: "Electronics" },
          { _id: "456", name: "Test Supplier 2", industry: "Manufacturing" },
        ]),
      });
    });

    it("should export industry map as CSV", async () => {
      const response = await request(app)
        .get("/api/exports/industry-map")
        .expect(200)
        .expect("Content-Type", /csv/);

      expect(response.text).toContain("SupplierID,Name,Industry");
      expect(response.text).toContain("Electronics");
      expect(response.text).toContain("Manufacturing");
    });

    it("should have correct filename", async () => {
      const response = await request(app)
        .get("/api/exports/industry-map")
        .expect(200);

      expect(response.headers["content-disposition"]).toMatch(/industry_map/);
      expect(response.headers["content-disposition"]).toMatch(/\.csv/);
    });
  });

  describe("GET /api/suppliers/export/csv", () => {
    it("should export full supplier data as CSV", async () => {
      const response = await request(app)
        .get("/api/suppliers/export/csv")
        .expect(200)
        .expect("Content-Type", /csv/);

      expect(response.text).toContain("Rank");
      expect(response.text).toContain("Environmental Score");
      expect(response.text).toContain("Social Score");
      expect(response.text).toContain("Governance Score");
    });
  });

  describe("Rate Limiting", () => {
    it("should include rate limit headers", async () => {
      const response = await request(app)
        .get("/api/exports/rankings?scenario=baseline")
        .expect(200);

      expect(response.headers["x-ratelimit-limit"]).toBeDefined();
      expect(response.headers["x-ratelimit-remaining"]).toBeDefined();
      expect(response.headers["x-ratelimit-reset"]).toBeDefined();
    });

    it("should enforce rate limits after multiple requests", async () => {
      // Make 11 requests (limit is 10)
      const promises = [];
      for (let i = 0; i < 11; i++) {
        promises.push(
          request(app)
            .get("/api/exports/rankings?scenario=baseline")
        );
      }

      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe("CSV Format", () => {
    it("should properly escape quotes in CSV", async () => {
      db.Supplier.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([
          { _id: "123", name: 'Test "Quoted" Supplier', industry: "Electronics" },
        ]),
      });

      const response = await request(app)
        .get("/api/exports/industry-map")
        .expect(200);

      expect(response.text).toContain('""Quoted""');
    });

    it("should handle special characters in supplier names", async () => {
      db.Supplier.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([
          { _id: "123", name: "Test, Supplier & Co.", industry: "Electronics" },
        ]),
      });

      const response = await request(app)
        .get("/api/exports/industry-map")
        .expect(200);

      // Should be quoted due to comma
      expect(response.text).toContain('"Test, Supplier & Co."');
    });
  });
});

