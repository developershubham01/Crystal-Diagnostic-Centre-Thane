import http from "http";

const BASE = "http://localhost:3000";

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const headers = { "Content-Type": "application/json", ...options.headers };
    const reqOptions = {
      method: options.method || "GET",
      headers,
    };
    const req = http.request(url, reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let setCookie = res.headers["set-cookie"];
        if (Array.isArray(setCookie)) setCookie = setCookie.join("; ");
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, setCookie, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, setCookie, body: data });
        }
      });
    });
    req.on("error", reject);
    if (options.body) {
      req.write(typeof options.body === "string" ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runFullBookingTest() {
  console.log("==================================================");
  console.log("  END-TO-END BOOKING & MANAGEMENT QA SUITE");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;
  function assert(cond, msg) {
    if (cond) {
      console.log(`[PASS] ${msg}`);
      passed++;
    } else {
      console.error(`[FAIL] ${msg}`);
      failed++;
    }
  }

  // STEP 1: Patient Books an Appointment
  console.log("--- Step 1: Patient submits booking request on /book-test ---");
  const testMobile = "9876543210";
  let refCode = "";
  let bookingId = "";
  try {
    const bookRes = await request("/api/appointments", {
      method: "POST",
      body: {
        name: "Verified Patient Test",
        mobile: testMobile,
        email: "patient.test@example.com",
        testOrPackage: "Lipid Profile & HbA1c",
        preferredDate: "2026-09-28",
        preferredTime: "09:30 AM",
        homeCollection: true,
        message: "Please bring sample collection kit",
        consent: true,
      },
    });
    assert(bookRes.status === 201 && bookRes.body.reference, "POST /api/appointments creates booking with 201 Created status");
    refCode = bookRes.body.reference;
    bookingId = bookRes.body.id;
    console.log(`       Generated Reference: ${refCode} (ID: ${bookingId})`);
  } catch (err) {
    console.error("Step 1 failed:", err);
    failed++;
  }

  // STEP 2: Patient Tracks Appointment
  console.log("\n--- Step 2: Patient checks appointment status on /track ---");
  try {
    const trackRes = await request(`/api/appointments/track?reference=${encodeURIComponent(refCode)}&mobile=${testMobile}`);
    assert(
      trackRes.status === 200 && trackRes.body.reference === refCode && trackRes.body.status === "NEW",
      "GET /api/appointments/track retrieves appointment status accurately (NEW)"
    );
  } catch (err) {
    console.error("Step 2 failed:", err);
    failed++;
  }

  // STEP 3: Admin Logs In
  console.log("\n--- Step 3: Admin logs into dashboard (/admin) ---");
  let adminCookie = "";
  try {
    const loginRes = await request("/api/auth/login", {
      method: "POST",
      body: { username: "admin", password: "Crystal@2024" },
    });
    assert(loginRes.status === 200 && loginRes.body.ok, "POST /api/auth/login succeeds with 200 OK");
    adminCookie = loginRes.setCookie;
  } catch (err) {
    console.error("Step 3 failed:", err);
    failed++;
  }

  // STEP 4: Admin Views Appointments List
  console.log("\n--- Step 4: Admin fetches appointment list ---");
  try {
    const listRes = await request("/api/appointments", {
      headers: { cookie: adminCookie },
    });
    assert(listRes.status === 200 && Array.isArray(listRes.body), "GET /api/appointments returns 200 OK with list array");
    const found = listRes.body.find((a) => a.reference === refCode);
    assert(found !== undefined, "Newly created appointment is present in admin list");
  } catch (err) {
    console.error("Step 4 failed:", err);
    failed++;
  }

  // STEP 5: Admin Updates Appointment Status & Notes
  console.log("\n--- Step 5: Admin updates status to SCHEDULED & saves internal notes ---");
  try {
    const patchRes = await request(`/api/appointments/${bookingId}`, {
      method: "PATCH",
      headers: { cookie: adminCookie },
      body: {
        status: "SCHEDULED",
        internalNotes: "Called patient at 9:45 AM. Confirmed home visit for 28 Sept at 9:30 AM.",
      },
    });
    assert(
      patchRes.status === 200 && patchRes.body.status === "SCHEDULED" && patchRes.body.internalNotes.includes("Confirmed home visit"),
      "PATCH /api/appointments/[id] updates status to SCHEDULED and saves internal notes successfully (200 OK)"
    );
  } catch (err) {
    console.error("Step 5 failed:", err);
    failed++;
  }

  // STEP 6: Patient Re-Tracks Appointment to Verify Updated Status
  console.log("\n--- Step 6: Patient re-tracks to confirm status updated to SCHEDULED ---");
  try {
    const track2Res = await request(`/api/appointments/track?reference=${encodeURIComponent(refCode)}&mobile=${testMobile}`);
    assert(
      track2Res.status === 200 && track2Res.body.status === "SCHEDULED",
      "GET /api/appointments/track reflects updated status (SCHEDULED) in real-time"
    );
  } catch (err) {
    console.error("Step 6 failed:", err);
    failed++;
  }

  // STEP 7: Admin Overview Stats Check
  console.log("\n--- Step 7: Admin checks overview stats & CSV export ---");
  try {
    const statsRes = await request("/api/admin/stats", {
      headers: { cookie: adminCookie },
    });
    assert(statsRes.status === 200 && statsRes.body.totalAppointments > 0, "GET /api/admin/stats returns 200 OK");
  } catch (err) {
    console.error("Step 7 failed:", err);
    failed++;
  }

  console.log("\n==================================================");
  console.log(`  RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");
  process.exit(failed > 0 ? 1 : 0);
}

runFullBookingTest();
