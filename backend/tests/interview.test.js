const request = require("supertest");

const app = require("../server");

jest.setTimeout(30000);

describe("Interview Management System API Tests", () => {
  const studentId = "507f1f77bcf86cd799439012";
  const companyId = "507f1f77bcf86cd799439013";
  const officerId = "507f1f77bcf86cd799439014";

  test("Should reject invalid interview mode", async () => {
    const response = await request(app)
      .post("/api/interviews")
      .send({
        studentId,
        companyId,
        officerId,
        interviewDate: "2026-11-02",
        interviewTime: "11:00 AM",
        round: "HR",
        mode: "Invalid",
        venue: "Office",
      });

    expect(response.statusCode).toBe(400);

    expect(response.body.message).toBe(
      "Mode must be Online or Offline"
    );
  });

  test("Should reject negative placement package", async () => {
    const response = await request(app)
      .post("/api/placements")
      .send({
        studentId,
        companyId,
        interviewId: "507f1f77bcf86cd799439011",
        jobRole: "Software Developer",
        package: -5,
        status: "Selected",
      });

    expect(response.statusCode).toBe(400);

    expect(response.body.message).toBe(
      "Package must be a valid positive number"
    );
  });

  test("Should reject missing interview fields", async () => {
    const response = await request(app)
      .post("/api/interviews")
      .send({
        studentId,
        round: "Technical",
        mode: "Online",
      });

    expect(response.statusCode).toBe(400);

    expect(response.body.message).toBe(
      "Required interview scheduling fields are missing"
    );
  });

  test("Should reject invalid interview status", async () => {
    const response = await request(app)
      .put("/api/interviews/507f1f77bcf86cd799439011/status")
      .send({
        status: "Invalid Status",
      });

    expect(response.statusCode).toBe(400);

    expect(response.body.message).toBe(
      "Invalid interview status"
    );
  });
});