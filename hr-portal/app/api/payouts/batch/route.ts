// /pages/api/payouts/batch.ts
import { NextRequest, NextResponse } from "next/server";
import {connectDB} from "@/lib/mongodb";
import PayoutBatch from "@/models/PayoutBatch";
import Payout from "@/models/Payout";
import TreasuryTransaction from "@/models/TreasuryTransaction";
import { Resend } from 'resend';
import { EmailTemplate } from '@/emailTemplates/payoutNotification';
import Employee from "@/models/Employee";
import Settings from "@/models/Settings";

export const dynamic = 'force-dynamic';


const resend = new Resend(process.env.RESEND_API_KEY);


async function sendEmailToEmployee(employeeId: string, name: string, email: string, amountUSD: number, txHash: string , companyName: string , walletAddress: string ) {
  try {
    // Send email asynchronously
    // console.log(`Sending email to ${walletAddress} for payout of ${amountUSD} USD`);
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Payout Notification',
      react: EmailTemplate({ firstName: name, amountUSD, txHash ,walletAddress , companyName}), // Use the inline EmailTemplate component
    });
    console.log(`Email sent to ${email}`);
  } catch (err) {
    console.error(`Failed to send email to ${email}: `, err);
  }
}



export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { txHash, payouts } = await req.json();

    const totalAmount = payouts.reduce((sum: number, p: any) => sum + p.amountUSD, 0);

    // Create PayoutBatch
    const batch = await PayoutBatch.create({ txHash, totalAmount });

    // Fetch employee details from DB and create Payout documents
    const payoutDocs = [];
    const settings = await Settings.findOne();
const companyName = settings?.organizationName || "Your Company";
    for (const employee of payouts) {
      const { _id, salaryUSD } = employee;
      // Fetch employee details by employeeId (e.g., name and email)
      const employeeData = await Employee.findById(_id);

      if (employeeData) {
        // Create payout document
        const payoutDoc = {
          batchId: batch._id,
          employeeId: _id,
          amountUSD: Math.round(salaryUSD),
          status: "completed",
        };
        payoutDocs.push(payoutDoc);

        // Send email notification asynchronously
         sendEmailToEmployee(_id, employeeData.name, employeeData.email, payoutDoc.amountUSD, txHash , companyName, employeeData.walletAddress);
      }
    }

    // Insert Payouts into the database
    await Payout.insertMany(payoutDocs);

    // Create Treasury Transaction
    await TreasuryTransaction.create({
      type: 'withdrawal',
      amount: totalAmount,
      currency: 'USD',
      description: `Payout batch ${batch._id} - ${payouts.length} employee(s) paid out`,
      txHash: txHash,
      status: 'completed',
    });

    // Return the response with batch and payouts
    return NextResponse.json({ batch, payouts: payoutDocs }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create payout batch" }, { status: 500 });
  }
}

export async function GET() {
  await connectDB();
  const batches = await PayoutBatch.find().sort({ createdAt: -1 });
  return NextResponse.json(batches);
}