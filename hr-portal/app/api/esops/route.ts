import { Resend } from "resend";
import { ESOPGrantEmailTemplate } from "@/emailTemplates/esopGrantNotification";
import Employee from "@/models/Employee";
import Settings from "@/models/Settings";
import { connectDB } from "@/lib/mongodb";
import Esop from "@/models/Esop";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    await connectDB();

    const {
      employeeId,
      tokenAmount,
      vestingMonths,
      cliffMonths,
      vestingStart,
      txHash
    } = await req.json();
    
    console.log(employeeId, tokenAmount, vestingMonths, cliffMonths, vestingStart, txHash);
    // Get employee details
    const employee = await Employee.findById(employeeId);
    if (!employee) throw new Error("Employee not found");

    const settings = await Settings.findOne();
    const companyName = settings?.organizationName || "Your Company";

    await Esop.create({
      employeeId,
      tokenAmount,
      vestingMonths,
      cliffMonths,
      txHash,
      vestingStart: new Date(vestingStart),
    });

    // Parse start date safely
    const startDateFormatted = new Date(vestingStart).toLocaleDateString();

    // Send email
    await resend.emails.send({
      from: "esop-notifications@resend.dev",
      to: employee.email,
      subject: `You've been granted an ESOP by ${companyName}`,
      react: ESOPGrantEmailTemplate({
        firstName: employee.name,
        companyName,
        tokenAmount,
        vestingMonths,
        cliffMonths,
        startDate: startDateFormatted,
        employeePortalUrl: `${process.env.BASE_URL}`,
      }),
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    console.error("ESOP Grant Error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");

    let grants;
    if (employeeId) {
      // Fetch grants for a specific employee
      grants = await Esop.find({ employeeId }).populate("employeeId");
    } else {
      // Fetch all grants
      grants = await Esop.find().populate("employeeId");
    }

    return new Response(JSON.stringify({ success: true, data: grants }), { status: 200 });
  } catch (error: any) {
    console.error("ESOP Grant Fetch Error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
}