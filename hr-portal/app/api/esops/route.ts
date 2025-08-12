import { Resend } from "resend";
import { ESOPGrantEmailTemplate } from "@/emailTemplates/esopGrantNotification";
import Employee from "@/models/Employee";
import Settings from "@/models/Settings";
import { connectDB } from "@/lib/mongodb";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    await connectDB();

    const {
      employeeId,
      totalTokens,
      durationMonths,
      cliffMonths,
      startDate
    } = await req.json();

    // Get employee details
    const employee = await Employee.findById(employeeId);
    if (!employee) throw new Error("Employee not found");

    const settings = await Settings.findOne();
    const companyName = settings?.organizationName || "Your Company";

    // Parse start date safely
    const startDateFormatted = new Date(startDate).toLocaleDateString();

    // Send email
    await resend.emails.send({
      from: "esop-notifications@resend.dev",
      to: employee.email,
      subject: `You've been granted an ESOP by ${companyName}`,
      react: ESOPGrantEmailTemplate({
        firstName: employee.name,
        companyName,
        totalTokens,
        durationMonths,
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
